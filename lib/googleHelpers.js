const { OAuth2Client } = require('google-auth-library')
const helpers = require('./helpers')

// constants
const PA_CLIENT_ID = helpers.getEnvVar('PA_CLIENT_ID')
const PA_CLIENT_SECRET = helpers.getEnvVar('PA_CLIENT_SECRET')
const PA_GSUITE_DOMAIN = 'brave.coop'

const paOAuth2Client = new OAuth2Client(PA_CLIENT_ID, PA_CLIENT_SECRET, 'postmessage')

/**
 * Gets payload contained in a given ID token.
 * If the ID token is invalid, this will throw an Error.
 * @param idToken ID token as given from Google.
 * @return Payload information contained in provided ID token.
 */
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

/**
 * Gets tokens (access token and ID token) from Google using an authorization code.
 * If the authorization code is invalid, then the getToken method will throw a GaxiosError.
 * @param authCode Authorization code from Google retrieved in the frontend application (PA).
 * @return Object containing access token (accessToken) and ID token (idToken).
 */
async function paGetTokens(authCode) {
  const { tokens } = await paOAuth2Client.getToken(authCode)

  // return only access token (for Google API calls) and ID token (for PA API calls)
  return { accessToken: tokens.access_token, idToken: tokens.id_token }
}

/**
 * Express middleware function to authorize a request to a PA API call.
 * Attempts to authorize the request using a submitted ID token in the body of the request.
 * @param req The Express Request object. Should contain idToken in the body of the request.
 * @param res The Express Response object.
 * @param next The next function to run if this request is authorized.
 */
async function paAuthorize(req, res, next) {
  try {
    if (!req.body.idToken) {
      helpers.log(`PA: Not authorized: ${req.path}`)
      res.status(400) // Bad Request
    } else {
      // paGetPayload also validates an ID token; it will throw an Error if an invalid ID token is given */
      await paGetPayload(req.body.idToken)
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
