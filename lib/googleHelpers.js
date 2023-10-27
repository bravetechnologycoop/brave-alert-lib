const { OAuth2Client } = require('google-auth-library')
const helpers = require('./helpers')

// constants
const PA_CLIENT_ID = helpers.getEnvVar('PA_CLIENT_ID')
const PA_CLIENT_SECRET = helpers.getEnvVar('PA_CLIENT_SECRET')
const PA_GSUITE_DOMAIN = 'brave.coop'

const paOAuth2Client = new OAuth2Client(PA_CLIENT_ID, PA_CLIENT_SECRET, 'postmessage')

async function paGetPayload(idToken) {
  const ticket = await paOAuth2Client.verifyIdToken({ idToken, audience: PA_CLIENT_ID })
  return ticket.getPayload()
}

async function paGetTokens(authCode) {
  const { tokens } = await paOAuth2Client.getToken(authCode)
  return tokens
}

async function paValidateIDToken(idToken) {
  const payload = await paGetPayload(idToken)

  // return true if:
  // - the ID token originated from PA
  // - the account is from the Brave organization (brave.coop)
  // - the ID token was authenticated by Google
  // - the experation date hasn't passed
  return
    payload.aud === PA_CLIENT_ID &&
    payload.hd === PA_GSUITE_DOMAIN &&
    (payload.iss === 'https://accounts.google.com' || payload.iss === 'accounts.google.com') &&
    payload.exp > Date.now()
}

async function paAuthorize(req, res, next) {
  try {
    if (!req.body.idToken) {
      // bad request: no ID token submitted in body of request
      res.status(400)
    } else if (!paValidateIDToken(req.body.idToken)) {
      helpers.log(`PA: Unauthorized request to: ${req.path}`)
      res.status(401)
    } else {
      // authorize request
      next()
    }
  } catch (error) {
    helpers.log(`PA: Internal server error: ${req.path}:`, error)
    res.status(500)
  }
}

module.exports = {
  paGetPayload,
  paGetTokens,
  paValidateIDToken,
  paAuthorize
}
