const { OAuth2Client } = require('google-auth-library')
const helpers = require('./helpers')

// constants
const PA_CLIENT_ID = helpers.getEnvVar('PA_CLIENT_ID')
const PA_CLIENT_SECRET = helpers.getEnvVar('PA_CLIENT_SECRET')
const PA_GSUITE_DOMAIN = 'brave.coop'

const paOAuth2Client = new OAuth2Client(PA_CLIENT_ID, PA_CLIENT_SECRET, 'postmessage')

async function paGetPayload(idToken) {
  const ticket = await paOAuth2Client.verifyIdToken({ idToken })
  const payload = ticket.getPayload()

  if (
    Date.now() > payload.exp ||
    payload.aud !== PA_CLIENT_ID ||
    (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') ||
    payload.hd !== PA_GSUITE_DOMAIN ||
    !payload.email ||
    !payload.name
  ) {
    throw new Error('Token is not valid')
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
      // paGetPayload also validates an ID token; it will throw an Error if an invalid ID token is given */
      paGetPayload(req.body.idToken)
      next() // perform next action
    }
  } catch (error) {
    helpers.log(`PA: Not authorized: ${req.path}`)
    res.status(401) // Unauthorized
  }
}

module.exports = {
  paGetPayload,
  paGetTokens,
  paAuthorize,
}
