// In-house dependencies
const AlertSession = require('../lib/alertSession')
const BraveAlerter = require('../lib/braveAlerter')
const CHATBOT_STATE = require('../lib/chatbotStateEnum')

function dummyGetAlertSession() {
  return 'getAlertSession'
}

function dummyGetAlertSessionByPhoneNumber() {
  return 'getAlertSessionByPhoneNumber'
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
    overrides.getAlertSessionByPhoneNumber !== undefined ? overrides.getAlertSessionByPhoneNumber : dummyGetAlertSessionByPhoneNumber,
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

module.exports = {
  alertSessionFactory,
  braveAlerterFactory,
  mockResponse,
}
