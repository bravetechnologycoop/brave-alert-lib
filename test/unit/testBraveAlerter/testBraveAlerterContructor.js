const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')

const BraveAlerter = require('../../../lib/braveAlerter')
const helpers = require('../../../lib/helpers')

function dummyGetAlertSession() {
  return 'getAlertSession'
}

function dummyGetAlertSessionByPhoneNumber() {
  return 'getAlertSessionByPhoneNumber'
}

function dummyAlertSessionChangedCallback() {
  return 'alertSessionChangedCallback'
}

function dummyGetLocationByAlertApiKey() {
  return 'getLocationByAlertApiKey'
}

function dummyGetHistoricAlertsByAlertApiKey() {
  return 'getHistoricAlertsByAlertApiKey'
}

function dummyGetNewNotificationsCountByAlertApiKey() {
  return 'getNewNotificationsCountByAlertApiKey'
}

function dummyGetReturnMessage() {
  return 'getReturnMessage'
}

describe('braveAlerter.js unit tests: constructor', () => {
  beforeEach(() => {
    // Don't actually log
    sinon.stub(helpers, 'log')

    this.braveAlerter = new BraveAlerter(
      dummyGetAlertSession,
      dummyGetAlertSessionByPhoneNumber,
      dummyAlertSessionChangedCallback,
      dummyGetLocationByAlertApiKey,
      dummyGetHistoricAlertsByAlertApiKey,
      dummyGetNewNotificationsCountByAlertApiKey,
      true,
      dummyGetReturnMessage,
    )
  })

  afterEach(() => {
    helpers.log.restore()
  })

  it('should be able to call the functions set by in the constructor', () => {
    const result = `${this.braveAlerter.getAlertSession()} ${this.braveAlerter.getAlertSessionByPhoneNumber()} ${this.braveAlerter.alertSessionChangedCallback()}`

    expect(result).to.equal('getAlertSession getAlertSessionByPhoneNumber alertSessionChangedCallback')
  })

  it('should initialize the router', () => {
    expect(this.braveAlerter.router).to.not.be.undefined
  })

  it('should initialize the state machine with whether to ask for incident details', () => {
    expect(this.braveAlerter.alertStateMachine.asksIncidentDetails).to.be.true
  })

  it('should initialize the state machine with the function to get the return messages', () => {
    expect(this.braveAlerter.alertStateMachine.getReturnMessage()).to.equal('getReturnMessage')
  })
})
