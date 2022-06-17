const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = require('chai').expect
const express = require('express')
const { beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const CHATBOT_STATE = require('../../lib/chatbotStateEnum')
const helpers = require('../../lib/helpers')
const twilioHelpers = require('../../lib/twilioHelpers')
const testingHelpers = require('../testingHelpers')

chai.use(chaiHttp)
chai.use(sinonChai)

const sandbox = sinon.createSandbox()

const sessionId = 'guid-123'
const responderPhoneNumber = '+15147886598'
const otherResponderPhoneNumber = '+15148885555'
const devicePhoneNumber = '+15005550006'
const initialMessage = 'There was an alert in Bathroom 4'
const reminderMessage = 'Reminder message'
const fallbackMessage = 'Fallback message'
const fallbackToPhoneNumbers = ['+15147332272', '+15146141784']
const validIncidentCategoryKeys = ['1', '2']
const validIncidentCategories = ['Cat 1', 'Cat 2']
const initialAlertInfo = {
  sessionId,
  toPhoneNumbers: [responderPhoneNumber, otherResponderPhoneNumber],
  fromPhoneNumber: devicePhoneNumber,
  message: initialMessage,
  reminderTimeoutMillis: 1, // 1 ms
  fallbackTimeoutMillis: 3000, // 3 seconds
  reminderMessage,
  fallbackMessage,
  fallbackToPhoneNumbers,
  fallbackFromPhoneNumber: '+15005550006',
}

describe('fallback flow with Twilio: responder never responds so fallback message is sent to manager(s)', () => {
  beforeEach(() => {
    this.currentAlertSession = testingHelpers.alertSessionFactory({
      sessionId,
      alertState: CHATBOT_STATE.STARTED,
      responderPhoneNumbers: [responderPhoneNumber, otherResponderPhoneNumber],
      validIncidentCategoryKeys,
      validIncidentCategories,
    })

    this.braveAlerter = testingHelpers.braveAlerterFactory({
      getAlertSession: sandbox.stub().returns(this.currentAlertSession),
      getAlertSessionByPhoneNumber: sandbox.stub().returns(this.currentAlertSession),
      alertSessionChangedCallback: sandbox.stub().returns(responderPhoneNumber),
    })

    sandbox.spy(twilioHelpers, 'sendTwilioMessage')
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
    expect(this.braveAlerter.alertSessionChangedCallback.getCall(0).args[0]).to.eql(
      testingHelpers.alertSessionFactory({ sessionId, alertState: CHATBOT_STATE.STARTED }),
    )

    expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly(responderPhoneNumber, devicePhoneNumber, initialMessage)
    expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly(otherResponderPhoneNumber, devicePhoneNumber, initialMessage)

    // Wait for the reminder to send
    await helpers.sleep(2000)

    // Expect to log the Twilio ID
    expect(helpers.log.getCall(1)).to.be.calledWithMatch('Sent by Twilio:')

    // Expect the state to change to WAITING_FOR_REPLY
    expect(this.braveAlerter.alertSessionChangedCallback.getCall(1).args[0]).to.eql(
      testingHelpers.alertSessionFactory({ sessionId, alertState: CHATBOT_STATE.WAITING_FOR_REPLY }),
    )

    expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly(responderPhoneNumber, devicePhoneNumber, reminderMessage)
    expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly(otherResponderPhoneNumber, devicePhoneNumber, reminderMessage)

    this.currentAlertSession.alertState = CHATBOT_STATE.WAITING_FOR_REPLY

    // Wait for the fallbacks to send
    await helpers.sleep(3000)

    // Expect to log the Twilio ID for each fallback number
    expect(helpers.log.getCall(2)).to.be.calledWithMatch('Sent by Twilio:')
    expect(helpers.log.getCall(3)).to.be.calledWithMatch('Sent by Twilio:')

    expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly(fallbackToPhoneNumbers[0], devicePhoneNumber, fallbackMessage)
    expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly(fallbackToPhoneNumbers[1], devicePhoneNumber, fallbackMessage)
  })
})
