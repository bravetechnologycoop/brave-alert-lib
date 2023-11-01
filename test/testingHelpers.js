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

function dummyGetAlertSessionBySessionIdAndAlertApiKey() {
  return 'getAlertSessionBySessionIdAndAlertApiKey'
}

function dummyAlertSessionChangedCallback() {
  return 'alertSessionChangedCallback'
}

function dummyGetLocationByAlertApiKey() {
  return 'getLocationByAlertApiKey'
}

function dummyGetActiveAlertsByAlertApiKey() {
  return 'getActiveAlertsByAlertApiKey'
}

function dummyGetHistoricAlertsByAlertApiKey() {
  return 'getHistoricAlertsByAlertApiKey'
}

function dummyGetNewNotificationsCountByAlertApiKey() {
  return 'getNewNotificationsCountByAlertApiKey'
}

function dummyGetReturnMessageToRespondedByPhoneNumber(language, fromAlertState, toAlertState) {
  return `To RespondedByPhoneNumber (${language}): ${fromAlertState} --> ${toAlertState}`
}

function dummyGetReturnMessageToOtherResponderPhoneNumbers(language, fromAlertState, toAlertState) {
  return `To OtherResponderPhoneNumbers (${language}): ${fromAlertState} --> ${toAlertState}`
}

function braveAlerterFactory(overrides = {}) {
  // prettier-ignore
  return new BraveAlerter(
    overrides.getAlertSession !== undefined ? overrides.getAlertSession : dummyGetAlertSession,
    overrides.getAlertSessionByPhoneNumbers !== undefined ? overrides.getAlertSessionByPhoneNumbers : dummyGetAlertSessionByPhoneNumbers,
    overrides.getAlertSessionBySessionIdAndAlertApiKey !== undefined ? overrides.getAlertSessionBySessionIdAndAlertApiKey : dummyGetAlertSessionBySessionIdAndAlertApiKey,
    overrides.alertSessionChangedCallback !== undefined ? overrides.alertSessionChangedCallback : dummyAlertSessionChangedCallback,
    overrides.getLocationByAlertApiKey !== undefined ? overrides.getLocationByAlertApiKey : dummyGetLocationByAlertApiKey,
    overrides.getActiveAlertsByAlertApiKey !== undefined ? overrides.getActiveAlertsByAlertApiKey : dummyGetActiveAlertsByAlertApiKey,
    overrides.getHistoricAlertsByAlertApiKey !== undefined ? overrides.getHistoricAlertsByAlertApiKey : dummyGetHistoricAlertsByAlertApiKey,
    overrides.getNewNotificationsCountByAlertApiKey !== undefined ? overrides.getNewNotificationsCountByAlertApiKey : dummyGetNewNotificationsCountByAlertApiKey,
    overrides.getReturnMessageToRespondedByPhoneNumber !== undefined ? overrides.getReturnMessageToRespondedByPhoneNumber : dummyGetReturnMessageToRespondedByPhoneNumber,
    overrides.getReturnMessageToOtherResponderPhoneNumbers !== undefined ? overrides.getReturnMessageToOtherResponderPhoneNumbers : dummyGetReturnMessageToOtherResponderPhoneNumbers,
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

function mockIDTokenFactory(reason) {
  return JSON.stringify({
    aud: reason.audience === true ? "not-pa" : googleHelpers.__get__('PA_CLIENT_ID'),
    iss: reason.signature === true ? "hacker.com" : "https://accounts.google.com",
    // either expired 1 hour ago, or expires in 1 hour
    exp: reason.expired === true ? Date.now() - 3600 : Date.now() + 3600,
    hd: reason.profile === true ? undefined : googleHelpers.__get__('PA_GSUITE_DOMAIN'),
    email: reason.profile === true ? undefined : `john@${googleHelpers.__get__('PA_GSUITE_DOMAIN')}`,
    name: reason.profile === true ? undefined : 'John Doe',
  })
}

class mockTicket {
  constructor(payload) {
    this.payload = payload
  }

  getPayload() {
    return this.payload
  }
}

class mockOAuth2Client {
  async verifyIdToken(options) {
    const { idToken } = options
    let payload

    try {
      // ID tokens generated from mockIDTokenFactory are JSON encoded payloads
      payload = JSON.parse(idToken)

      /* these three fields must be defined as per ID token specification
       * see: https://cloud.google.com/docs/authentication/token-types#id */
      if (payload.aud === undefined || payload.iss === undefined || payload.exp === undefined) {
        throw undefined // the catch statement below doesn't parse the caught error
      }
    } catch (error) {
      throw new Error("Couldn't parse token")
    }

    // replicates error thrown for expired token
    if (Date.now() > payload.exp) {
      throw new Error(`Token used too late, ${Date.now()} > ${payload.exp}: ${JSON.stringify(payload)}`)
    }

    return new mockTicket(payload)
  }
}

module.exports = {
  alertSessionFactory,
  braveAlerterFactory,
  mockResponse,
  mockIDTokenFactory,
  mockOAuth2Client,
}
