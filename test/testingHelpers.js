// Third-party dependencies
const rewire = require('rewire')

// In-house dependencies
const AlertSession = require('../lib/alertSession')
const BraveAlerter = require('../lib/braveAlerter')
const CHATBOT_STATE = require('../lib/chatbotStateEnum')

const googleHelpers = rewire('../lib/googleHelpers')

function dummyGetAlertSession() {
  return 'getAlertSession'
}

function dummyGetAlertSessionByPhoneNumbers() {
  return 'getAlertSessionByPhoneNumbers'
}

function dummyAlertSessionChangedCallback() {
  return 'alertSessionChangedCallback'
}

function dummyGetReturnMessageToRespondedByPhoneNumber(language, fromAlertState, toAlertState) {
  return `To RespondedByPhoneNumber (${language}): ${fromAlertState} --> ${toAlertState}`
}

function dummyGetReturnMessageToOtherResponderPhoneNumbers(language, fromAlertState, toAlertState) {
  return `To OtherResponderPhoneNumbers (${language}): ${fromAlertState} --> ${toAlertState}`
}

function dummyGetClientMessageForRequestToReset(language) {
  return `Reset (${language})`
}

function braveAlerterFactory(overrides = {}) {
  // prettier-ignore
  return new BraveAlerter(
    overrides.getAlertSession !== undefined ? overrides.getAlertSession : dummyGetAlertSession,
    overrides.getAlertSessionByPhoneNumbers !== undefined ? overrides.getAlertSessionByPhoneNumbers : dummyGetAlertSessionByPhoneNumbers,
    overrides.alertSessionChangedCallback !== undefined ? overrides.alertSessionChangedCallback : dummyAlertSessionChangedCallback,
    overrides.getReturnMessageToRespondedByPhoneNumber !== undefined ? overrides.getReturnMessageToRespondedByPhoneNumber : dummyGetReturnMessageToRespondedByPhoneNumber,
    overrides.getReturnMessageToOtherResponderPhoneNumbers !== undefined ? overrides.getReturnMessageToOtherResponderPhoneNumbers : dummyGetReturnMessageToOtherResponderPhoneNumbers,
    overrides.getClientMessageForRequestToReset !== undefined ? overrides.getClientMessageForRequestToReset : dummyGetClientMessageForRequestToReset,
  )
}

function alertSessionFactory(overrides = {}) {
  // prettier-ignore
  return new AlertSession(
    overrides.sessionId !== undefined ? overrides.sessionId : '2e4f7e78-1259-4e4c-a26f-91d79929f41a',
    overrides.alertState !== undefined ? overrides.alertState : CHATBOT_STATE.STARTED,
    overrides.respondedByPhoneNumber !== undefined ? overrides.respondedByPhoneNumber : undefined,
    overrides.incidentCategoryKey !== undefined ? overrides.incidentCategoryKey : undefined,
    overrides.responderPhoneNumbers !== undefined ? overrides.responderPhoneNumbers : undefined,
    overrides.validIncidentCategoryKeys !== undefined ? overrides.validIncidentCategoryKeys : undefined,
    overrides.validIncidentCategories !== undefined ? overrides.validIncidentCategories : undefined,
    overrides.language !== undefined ? overrides.language : undefined,
  )
}

function mockResponse(sandbox) {
  // From https://codewithhugo.com/express-request-response-mocking/
  const res = {}
  res.writeHead = sandbox.stub().returns(res)
  res.json = sandbox.stub().returns(res)
  res.status = sandbox.stub().returns(res)
  res.send = sandbox.stub().returns(res)

  return res
}

/**
 * mockGoogleIdTokenFactory
 * Generates a fake Google ID token given a set of options
 * @param options Object containing or not containing the following values as true or false:
 *   validAudience Whether the audience (client ID) is valid (from PA)
 *   validSignature Whether the signature is valid (from Google)
 *   validExpiry Whether the expiration date is valid (not expired)
 *   validProfile Whether the profile scope is fulfilled and valid
 *     (payload contains hd, email, name; email === 'brave.coop')
 */
function mockGoogleIdTokenFactory(options) {
  return JSON.stringify({
    // eslint-disable-next-line no-underscore-dangle
    aud: options.validAudience ? googleHelpers.__get__('PA_CLIENT_ID') : 'not-pa',
    iss: options.validSignature ? 'https://accounts.google.com' : 'hacker.com',
    // either expires in 1 hour, or expired 1 hour ago
    exp: options.validExpiry ? Date.now() / 1000 + 3600 : Date.now() / 1000 - 3600,
    // eslint-disable-next-line no-underscore-dangle
    hd: options.validProfile ? googleHelpers.__get__('PA_GSUITE_DOMAIN') : undefined,
    // eslint-disable-next-line no-underscore-dangle
    email: options.validProfile ? `john@${googleHelpers.__get__('PA_GSUITE_DOMAIN')}` : undefined,
    name: options.validProfile ? 'John Doe' : undefined,
  })
}

const mockOAuth2Client = {
  verifyIdToken: options => {
    const { idToken } = options
    let payload

    try {
      // Google ID tokens generated from mockGoogleIdTokenFactory are JSON encoded payloads
      payload = JSON.parse(idToken)

      /* these three fields must be defined as per ID token specification
       * see: https://cloud.google.com/docs/authentication/token-types#id */
      if (payload.aud === undefined || payload.iss === undefined || payload.exp === undefined) {
        throw new Error('Missing fields')
      }
    } catch (error) {
      throw new Error("Couldn't parse token")
    }

    // replicates error thrown by Google's OAuth2Client for an expired token
    if (Date.now() / 1000 > payload.exp) {
      throw new Error(`Token used too late, ${Date.now()} > ${payload.exp}: ${JSON.stringify(payload)}`)
    }

    // return an Object implementing the getPayload method similar to Google's Ticket class
    return {
      getPayload: () => {
        return payload
      },
    }
  },
  getToken: authCode => {
    if (authCode === 'valid-authorization-code') {
      return { tokens: { access_token: 'access_token', id_token: 'id_token' } }
    }

    throw new Error('Invalid authorization code')
  },
}

module.exports = {
  alertSessionFactory,
  braveAlerterFactory,
  mockResponse,
  mockGoogleIdTokenFactory,
  mockOAuth2Client,
}
