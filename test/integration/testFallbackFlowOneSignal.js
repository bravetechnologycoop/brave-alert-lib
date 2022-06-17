const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = require('chai').expect
const express = require('express')
const { beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

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
const validIncidentCategories = ['My Category']
const validIncidentCategoryKeys = ['1']
const initialAlertInfo = {
  sessionId,
  responderPushId,
  message: initialMessage,
  deviceName,
  alertType,
  reminderTimeoutMillis: 1, // 1 ms
  fallbackTimeoutMillis: 3000, // 3 seconds
  reminderMessage: 'Reminder message',
  fallbackMessage: 'Fallback message',
  fallbackToPhoneNumbers: ['+15147332272', '+15146141784'],
  fallbackFromPhoneNumber: '+15005550006',
}

describe('fallback flow with OneSignal: responder never responds so fallback message is sent to manager(s)', () => {
  beforeEach(() => {
    this.currentAlertSession = testingHelpers.alertSessionFactory({
      sessionId,
      alertState: CHATBOT_STATE.STARTED,
      validIncidentCategoryKeys,
      validIncidentCategories,
    })

    this.braveAlerter = testingHelpers.braveAlerterFactory({
      getAlertSession: sandbox.stub().returns(this.currentAlertSession),
      getAlertSessionBySessionIdAndAlertApiKey: sandbox.stub().returns(this.currentAlertSession),
      alertSessionChangedCallback: sandbox.stub().returns(undefined),
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
    expect(this.braveAlerter.alertSessionChangedCallback.getCall(0).args[0]).to.eql(
      testingHelpers.alertSessionFactory({ sessionId, alertState: CHATBOT_STATE.STARTED }),
    )

    // Wait for the reminder to send
    await helpers.sleep(2000)

    // Expect to log the OneSignal ID
    expect(helpers.log.getCall(1)).to.be.calledWithMatch('Sent by OneSignal:')

    // Expect the state to change to WAITING_FOR_REPLY
    expect(this.braveAlerter.alertSessionChangedCallback.getCall(1).args[0]).to.eql(
      testingHelpers.alertSessionFactory({ sessionId, alertState: CHATBOT_STATE.WAITING_FOR_REPLY }),
    )

    this.currentAlertSession.alertState = CHATBOT_STATE.WAITING_FOR_REPLY

    // Wait for the fallbacks to send
    await helpers.sleep(3000)

    // Expect to log the Twilio ID for each fallback number
    expect(helpers.log.getCall(2)).to.be.calledWithMatch('Sent by Twilio:')
    expect(helpers.log.getCall(3)).to.be.calledWithMatch('Sent by Twilio:')
  })
})
