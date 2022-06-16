// In-house dependencies
const BraveAlerter = require('../lib/braveAlerter')

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

function dummyGetReturnMessage(fromAlertState, toAlertState) {
  return `${fromAlertState} --> ${toAlertState}`
}

function braveAlerterFactory(overrides = {}) {
  return new BraveAlerter(
    overrides.getAlertSession || dummyGetAlertSession,
    overrides.getAlertSessionByPhoneNumber || dummyGetAlertSessionByPhoneNumber,
    overrides.getAlertSessionBySessionIdAndAlertApiKey || dummyGetAlertSessionBySessionIdAndAlertApiKey,
    overrides.alertSessionChangedCallback || dummyAlertSessionChangedCallback,
    overrides.getLocationByAlertApiKey || dummyGetLocationByAlertApiKey,
    overrides.getActiveAlertsByAlertApiKey || dummyGetActiveAlertsByAlertApiKey,
    overrides.getHistoricAlertsByAlertApiKey || dummyGetHistoricAlertsByAlertApiKey,
    overrides.getNewNotificationsCountByAlertApiKey || dummyGetNewNotificationsCountByAlertApiKey,
    overrides.getReturnMessage || dummyGetReturnMessage,
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
  braveAlerterFactory,
  mockResponse,
}
