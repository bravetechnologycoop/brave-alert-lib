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
const initialMessage = 'Ok'
const incidentCategoryKey = '1'
const details = 'my details'
const validIncidentCategoryKeys = ['1', '2']
const initialAlertInfo = {
  sessionId,
  toPhoneNumber: responderPhoneNumber,
  fromPhoneNumber: devicePhoneNumber,
  message: initialMessage,
  reminderTimeoutMillis: 1 * 60 * 1000, // 1 minute
  fallbackTimeoutMillis: 5 * 60 * 1000, // 5 minutes
  reminderMessage: 'Reminder message',
  fallbackMessage: 'Fallback message',
  fallbackToPhoneNumbers: ['+17778889999'],
  fallbackFromPhoneNumber: '+13336669999',
}

describe('happy path Twilio integration test: responder responds right away and provides incident category and details', () => {
  beforeEach(() => {
    this.clock = sandbox.useFakeTimers()

    this.currentAlertSession = new AlertSession(
      sessionId,
      CHATBOT_STATE.STARTED,
      undefined,
      undefined,
      undefined,
      responderPhoneNumber,
      validIncidentCategoryKeys,
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
    // Initial alert sent to responder phone
    await this.braveAlerter.startAlertSession(initialAlertInfo)

    // Expect to log the Twilio ID
    expect(helpers.log.getCall(0)).to.be.calledWithMatch('Sent by Twilio:')

    // Expect the state to change to STARTED
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(sessionId, CHATBOT_STATE.STARTED))

    this.currentAlertSession.alertState = CHATBOT_STATE.STARTED

    // Responder replies 'Ok'
    let response = await chai.request(this.app).post('/alert/sms').send({
      From: responderPhoneNumber,
      To: devicePhoneNumber,
      Body: initialMessage,
    })
    expect(response).to.have.status(200)

    // Expect the state to change to WAITING_FOR_CATEGORY
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(sessionId, CHATBOT_STATE.WAITING_FOR_CATEGORY))

    this.currentAlertSession.alertState = CHATBOT_STATE.WAITING_FOR_CATEGORY

    // Responder replies with an incident category
    response = await chai.request(this.app).post('/alert/sms').send({
      From: responderPhoneNumber,
      To: devicePhoneNumber,
      Body: incidentCategoryKey,
    })
    expect(response).to.have.status(200)

    // Expect the state to change to WAITING_FOR_DETAILS and that the incident cateogry is updated to what the responder sent
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(
      new AlertSession(sessionId, CHATBOT_STATE.WAITING_FOR_DETAILS, incidentCategoryKey),
    )

    this.currentAlertSession.alertState = CHATBOT_STATE.WAITING_FOR_DETAILS
    this.currentAlertSession.incidentCategoryKey = incidentCategoryKey

    // Responder replies with incident details
    response = await chai.request(this.app).post('/alert/sms').send({
      From: responderPhoneNumber,
      To: devicePhoneNumber,
      Body: details,
    })
    expect(response).to.have.status(200)

    // Expect the state to change to COMPLETED and that the incident details are updated to what the responder sent
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(sessionId, CHATBOT_STATE.COMPLETED, undefined, details))

    this.currentAlertSession.alertState = CHATBOT_STATE.COMPLETED
    this.currentAlertSession.details = details

    // Let the reminder and fallback timer run out
    this.clock.tick(6 * 60 * 1000)
  })
})
