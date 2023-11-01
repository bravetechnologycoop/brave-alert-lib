const { OAuth2Client } = require('google-auth-library')
const helpers = require('./helpers')

// constants
const PA_CLIENT_ID = helpers.getEnvVar('PA_CLIENT_ID')
const PA_CLIENT_SECRET = helpers.getEnvVar('PA_CLIENT_SECRET')
const PA_GSUITE_DOMAIN = 'brave.coop'

const paOAuth2Client = new OAuth2Client(PA_CLIENT_ID, PA_CLIENT_SECRET, 'postmessage')

/* PayloadError:
 * Error object containing information about what made an ID token invalid. */
class PayloadError extends Error {
  constructor(message, reason) {
    super()
    this.name = 'PayloadError'
    this.message = message
    this.reason = reason
  }
}

async function paGetPayload(idToken) {
  const ticket = await paOAuth2Client.verifyIdToken({ idToken })
  const payload = ticket.getPayload()

  const errorReason = {
    // ID token must not be expired
    expired: Date.now() > payload.exp,
    // ID token must be for PA
    audience: payload.aud !== PA_CLIENT_ID,
    // ID token must be signed by Google
    signature: payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com',
    // ID token must contain necessary profile information (and be a Brave account)
    profile: payload.hd !== PA_GSUITE_DOMAIN || !payload.email || !payload.name,
  }

  // check for any of the above payload error reasons
  for (let reason in errorReason) {
    if (errorReason[reason]) throw new PayloadError('ID token is not valid', errorReason)
  }

  return payload
}

async function paGetTokens(authCode) {
  const { tokens } = await paOAuth2Client.getToken(authCode)

  // return only access token (for Google API calls) and ID token (for PA API calls)
  return { accessToken: tokens.access_token, idToken: tokens.id_token }
}

async function paAuthorize(req, res, next) {
  try {
    if (!req.body.idToken) {
      res.status(400) // Bad Request
    } else {
      // paGetPayload also validates an ID token: it will throw a PayloadError if an invalid ID token is given */
      paGetPayload(req.body.idToken)
      next() // perform next action
    }
  } catch (error) {
    helpers.log(`PA: Not authorized: ${req.path}: ${error.message}; Reason: ${JSON.stringify(error.reason)}`)
    res.status(401) // Unauthorized
  }
}

module.exports = {
  paGetPayload,
  paGetTokens,
  paAuthorize,
}
