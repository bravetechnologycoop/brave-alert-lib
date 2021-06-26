const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = require('chai').expect
const express = require('express')
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const AlertSession = require('../../lib/alertSession')
const ALERT_STATE = require('../../lib/alertStateEnum')
const BraveAlerter = require('../../lib/braveAlerter')
const Twilio = require('../../lib/twilio')

chai.use(chaiHttp)
chai.use(sinonChai)

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

function dummyGetRetunMessages(fromAlertState, toAlertState) {
  return `${fromAlertState} --> ${toAlertState}`
}

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

describe('happy path integration test: responder responds right away and provides incident category and details', () => {
  beforeEach(() => {
    this.clock = sinon.useFakeTimers()

    this.currentAlertSession = new AlertSession(
      sessionId,
      ALERT_STATE.STARTED,
      undefined,
      undefined,
      undefined,
      responderPhoneNumber,
      validIncidentCategoryKeys,
    )

    this.braveAlerter = new BraveAlerter(
      dummyGetAlertSession,
      dummyGetAlertSessionByPhoneNumber,
      dummyAlertSessionChangedCallback,
      dummyGetLocationByAlertApiKey,
      dummyGetHistoricAlertsByAlertApiKey,
      dummyGetNewNotificationsCountByAlertApiKey,
      true,
      dummyGetRetunMessages,
    )

    sinon.stub(this.braveAlerter, 'getAlertSession').returns(this.currentAlertSession)
    sinon.stub(this.braveAlerter, 'getAlertSessionByPhoneNumber').returns(this.currentAlertSession)
    sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

    sinon.stub(Twilio, 'isValidTwilioRequest').returns(true)

    this.app = express()
    this.app.use(this.braveAlerter.getRouter())
  })

  afterEach(() => {
    this.braveAlerter.getAlertSession.restore()
    this.braveAlerter.getAlertSessionByPhoneNumber.restore()
    this.braveAlerter.alertSessionChangedCallback.restore()

    this.clock.restore()

    Twilio.isValidTwilioRequest.restore()
  })

  it('', async () => {
    // Initial alert sent to responder phone
    await this.braveAlerter.startAlertSession(initialAlertInfo)

    // Expect the state to change to STARTED
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(sessionId, ALERT_STATE.STARTED))

    this.currentAlertSession.alertState = ALERT_STATE.WAITING_FOR_CATEGORY

    // Responder replies 'Ok'
    let response = await chai.request(this.app).post('/alert/sms').send({
      From: responderPhoneNumber,
      To: devicePhoneNumber,
      Body: initialMessage,
    })
    expect(response).to.have.status(200)

    // Expect the state to change to WAITING_FOR_CATEGORY
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(sessionId, ALERT_STATE.WAITING_FOR_CATEGORY))

    this.currentAlertSession.alertState = ALERT_STATE.WAITING_FOR_CATEGORY

    // Responder replies with an incident category
    response = await chai.request(this.app).post('/alert/sms').send({
      From: responderPhoneNumber,
      To: devicePhoneNumber,
      Body: incidentCategoryKey,
    })
    expect(response).to.have.status(200)

    // Expect the state to change to WAITING_FOR_DETAILS and that the incident cateogry is updated to what the responder sent
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(
      new AlertSession(sessionId, ALERT_STATE.WAITING_FOR_DETAILS, incidentCategoryKey),
    )

    this.currentAlertSession.alertState = ALERT_STATE.WAITING_FOR_DETAILS
    this.currentAlertSession.incidentCategoryKey = incidentCategoryKey

    // Responder replies with incident details
    response = await chai.request(this.app).post('/alert/sms').send({
      From: responderPhoneNumber,
      To: devicePhoneNumber,
      Body: details,
    })
    expect(response).to.have.status(200)

    // Expect the state to change to COMPLETED and that the incident details are updated to what the responder sent
    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(sessionId, ALERT_STATE.COMPLETED, undefined, details))

    this.currentAlertSession.alertState = ALERT_STATE.COMPLETED
    this.currentAlertSession.details = details

    // Let the reminder and fallback timer run out
    this.clock.tick(6 * 60 * 1000)
  })
})
