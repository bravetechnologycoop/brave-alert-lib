// Third-party dependencies
const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = require('chai').expect
const express = require('express')
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

// In-house dependencies
const AlertSession = require('../../lib/alertSession')
const ALERT_TYPE = require('../../lib/alertTypeEnum')
const CHATBOT_STATE = require('../../lib/chatbotStateEnum')
const helpers = require('../../lib/helpers')
const testingHelpers = require('../testingHelpers')

chai.use(chaiHttp)
chai.use(sinonChai)

const sandbox = sinon.createSandbox()

const sessionId = 'guid-123'
const responderPushId = helpers.getEnvVar('TEST_ONESIGNAL_PUSH_ID')
const initialMessage = 'Ok'
const deviceName = 'Room 303'
const alertType = ALERT_TYPE.BUTTONS_NOT_URGENT
const incidentCategoryKey = '1'
const validIncidentCategories = ['My Category', 'Another Category']
const validIncidentCategoryKeys = ['1', '2']
const apiKey = '00000000-000000000000000'
const initialAlertInfo = {
  sessionId,
  responderPushId,
  message: initialMessage,
  deviceName,
  alertType,
  reminderTimeoutMillis: 1 * 60 * 1000, // 1 minute
  fallbackTimeoutMillis: 5 * 60 * 1000, // 5 minutes
  reminderMessage: 'Reminder message',
  fallbackMessage: 'Fallback message',
  fallbackToPhoneNumbers: ['+17778889999'],
  fallbackFromPhoneNumber: '+13336669999',
}

describe('happy path OneSignal integration test: responder responds right away and provides incident category', () => {
  beforeEach(() => {
    this.clock = sandbox.useFakeTimers()

    this.currentAlertSession = new AlertSession(sessionId, CHATBOT_STATE.STARTED, undefined, validIncidentCategoryKeys, validIncidentCategories)

    this.braveAlerter = testingHelpers.braveAlerterFactory({
      getAlertSession: sandbox.stub().returns(this.currentAlertSession),
      getAlertSessionBySessionIdAndAlertApiKey: sandbox.stub().returns(this.currentAlertSession),
      alertSessionChangedCallback: sandbox.stub(),
    })

    this.app = express()
    this.app.use(this.braveAlerter.getRouter())

    sandbox.spy(helpers, 'log')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('', async () => {
    // Initial alert sent to responder phone
    await this.braveAlerter.startAlertSession(initialAlertInfo)

    // Expect to log the OneSignal ID
    expect(helpers.log.getCall(0)).to.be.calledWithMatch('Sent by OneSignal:')

    // Expect the state to change to STARTED
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(sessionId, CHATBOT_STATE.STARTED))

    this.currentAlertSession.alertState = CHATBOT_STATE.STARTED

    // Responder acknowledges the alert
    // prettier-ignore
    let response = await chai
      .request(this.app)
      .post('/alert/acknowledgeAlertSession')
      .set('X-API-KEY', apiKey)
      .send({ sessionId })
    expect(response).to.have.status(200)

    // Expect the state to change to RESPONDING
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(sessionId, CHATBOT_STATE.RESPONDING))

    this.currentAlertSession.alertState = CHATBOT_STATE.RESPONDING

    // Responder responds to the alert
    // prettier-ignore
    response = await chai
      .request(this.app)
      .post('/alert/respondToAlertSession')
      .set('X-API-KEY', apiKey)
      .send({ sessionId })
    expect(response).to.have.status(200)

    // Expect the state to change to WAITING_FOR_CATEGORY
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(sessionId, CHATBOT_STATE.WAITING_FOR_CATEGORY))

    this.currentAlertSession.alertState = CHATBOT_STATE.WAITING_FOR_CATEGORY

    // Responder replies with an incident category
    response = await chai
      .request(this.app)
      .post('/alert/setIncidentCategory')
      .set('X-API-KEY', apiKey)
      .send({ sessionId, incidentCategory: 'My Category' })
    expect(response).to.have.status(200)

    // Expect the state to change to COMPLETED and that the incident cateogry is updated to what the responder sent
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(sessionId, CHATBOT_STATE.COMPLETED, incidentCategoryKey))

    this.currentAlertSession.alertState = CHATBOT_STATE.COMPLETED
    this.currentAlertSession.incidentCategoryKey = incidentCategoryKey

    // Let the reminder and fallback timer run out
    this.clock.tick(6 * 60 * 1000)
  })
})
