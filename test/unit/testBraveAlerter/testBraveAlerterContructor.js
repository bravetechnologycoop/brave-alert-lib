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

function dummyGetReturnMessageToRespondedByPhoneNumber() {
  return 'getReturnMessageToRespondedByPhoneNumber'
}

function dummyGetReturnMessageToOtherResponderPhoneNumbers() {
  return 'getReturnMessageToOtherResponderPhoneNumbers'
}

describe('braveAlerter.js unit tests: constructor', () => {
  beforeEach(() => {
    // Don't actually log
    sinon.stub(helpers, 'log')

    this.braveAlerter = new BraveAlerter(
      dummyGetAlertSession,
      dummyGetAlertSessionByPhoneNumber,
      dummyGetAlertSessionBySessionIdAndAlertApiKey,
      dummyAlertSessionChangedCallback,
      dummyGetLocationByAlertApiKey,
      dummyGetActiveAlertsByAlertApiKey,
      dummyGetHistoricAlertsByAlertApiKey,
      dummyGetNewNotificationsCountByAlertApiKey,
      dummyGetReturnMessageToRespondedByPhoneNumber,
      dummyGetReturnMessageToOtherResponderPhoneNumbers,
    )
  })

  afterEach(() => {
    helpers.log.restore()
  })

  it('should be able to call the functions set by in the constructor', () => {
    const result = `
      ${this.braveAlerter.getAlertSession()}
      ${this.braveAlerter.getAlertSessionByPhoneNumber()}
      ${this.braveAlerter.getAlertSessionBySessionIdAndAlertApiKey()}
      ${this.braveAlerter.alertSessionChangedCallback()}
      ${this.braveAlerter.getLocationByAlertApiKey()}
      ${this.braveAlerter.getActiveAlertsByAlertApiKey()}
      ${this.braveAlerter.getHistoricAlertsByAlertApiKey()}
      ${this.braveAlerter.getNewNotificationsCountByAlertApiKey()}
      ${this.braveAlerter.getReturnMessageToRespondedByPhoneNumber()}
      ${this.braveAlerter.getReturnMessageToOtherResponderPhoneNumbers()}
    `

    expect(result).to.equal(
      `
      getAlertSession
      getAlertSessionByPhoneNumber
      getAlertSessionBySessionIdAndAlertApiKey
      alertSessionChangedCallback
      getLocationByAlertApiKey
      getActiveAlertsByAlertApiKey
      getHistoricAlertsByAlertApiKey
      getNewNotificationsCountByAlertApiKey
      getReturnMessageToRespondedByPhoneNumber
      getReturnMessageToOtherResponderPhoneNumbers
    `,
    )
  })

  it('should initialize the router', () => {
    expect(this.braveAlerter.router).to.not.be.undefined
  })

  it('should initialize the state machine with the function to get the return messages', () => {
    expect(this.braveAlerter.alertStateMachine.getReturnMessageToRespondedByPhoneNumber()).to.equal('getReturnMessageToRespondedByPhoneNumber')
  })

  it('should initialize the state machine with the function to get the return messages', () => {
    expect(this.braveAlerter.alertStateMachine.getReturnMessageToOtherResponderPhoneNumbers()).to.equal(
      'getReturnMessageToOtherResponderPhoneNumbers',
    )
  })
})
