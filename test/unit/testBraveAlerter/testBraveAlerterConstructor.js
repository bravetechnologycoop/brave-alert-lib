const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')

const BraveAlerter = require('../../../lib/braveAlerter')
const helpers = require('../../../lib/helpers')

function dummyGetAlertSession() {
  return 'getAlertSession'
}

function dummyGetAlertSessionByPhoneNumbers() {
  return 'getAlertSessionByPhoneNumbers'
}

function dummyAlertSessionChangedCallback() {
  return 'alertSessionChangedCallback'
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
      dummyGetAlertSessionByPhoneNumbers,
      dummyAlertSessionChangedCallback,
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
      ${this.braveAlerter.getAlertSessionByPhoneNumbers()}
      ${this.braveAlerter.alertSessionChangedCallback()}
      ${this.braveAlerter.getReturnMessageToRespondedByPhoneNumber()}
      ${this.braveAlerter.getReturnMessageToOtherResponderPhoneNumbers()}
    `

    expect(result).to.equal(
      `
      getAlertSession
      getAlertSessionByPhoneNumbers
      alertSessionChangedCallback
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
