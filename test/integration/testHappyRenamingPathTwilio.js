const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = require('chai').expect
const express = require('express')
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const AlertSession = require('../../lib/alertSession')
const CHATBOT_STATE = require('../../lib/chatbotStateEnum')
const helpers = require('../../lib/helpers')
const Twilio = require('../../lib/twilio')
const testingHelpers = require('../testingHelpers')

chai.use(chaiHttp)
chai.use(sinonChai)

const sandbox = sinon.createSandbox()

const sessionId = 'guid-123'
const responderPhoneNumber = '+15147886598'
const devicePhoneNumber = '+15005550006'
const initialMessage = 'New Button 123'
const initialAlertInfo = {
  sessionId,
  toPhoneNumber: responderPhoneNumber,
  fromPhoneNumber: devicePhoneNumber,
  message: initialMessage,
}

describe('happy path renaming Twilio integration test: responder responds right away with a valid name', () => {
  beforeEach(() => {
    this.clock = sandbox.useFakeTimers()

    this.currentAlertSession = new AlertSession(
      sessionId,
      CHATBOT_STATE.NAMING_STARTED,
      undefined,
      undefined,
      'fake serial number',
      responderPhoneNumber,
    )

    this.braveAlerter = testingHelpers.braveAlerterFactory({
      getAlertSession: sandbox.stub().returns(this.currentAlertSession),
      getAlertSessionByPhoneNumber: sandbox.stub().returns(this.currentAlertSession),
      alertSessionChangedCallback: sandbox.stub(),
    })

    sandbox.stub(Twilio, 'isValidTwilioRequest').returns(true)
    sandbox.spy(helpers, 'log')

    this.app = express()
    this.app.use(this.braveAlerter.getRouter())
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('', async () => {
    // Initial renaming message sent to responder phone
    await this.braveAlerter.startAlertSession(initialAlertInfo)

    // Expect to log the Twilio ID
    expect(helpers.log.getCall(0)).to.be.calledWithMatch('Sent by Twilio:')

    this.currentAlertSession.alertState = CHATBOT_STATE.NAMING_STARTED
    this.currentAlertSession.deviceName = initialMessage

    // Responder replies 'New Button 123'
    const response = await chai.request(this.app).post('/alert/sms').send({
      From: responderPhoneNumber,
      To: devicePhoneNumber,
      Body: initialMessage,
    })
    expect(response).to.have.status(200)

    this.currentAlertSession.alertState = CHATBOT_STATE.NAMING_COMPLETED
    this.currentAlertSession.deviceName = initialMessage

    // Expect the state to change to NAMING_COMPLETED
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(
      new AlertSession(sessionId, CHATBOT_STATE.NAMING_COMPLETED, undefined, undefined, initialMessage),
    )
  })
})
