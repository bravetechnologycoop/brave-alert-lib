// Third-party dependencies
const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

// In-house dependencies
const CHATBOT_STATE = require('../../../lib/chatbotStateEnum')
const ALERT_TYPE = require('../../../lib/alertTypeEnum')
const helpers = require('../../../lib/helpers')
const twilioHelpers = require('../../../lib/twilioHelpers')
const testingHelpers = require('../../testingHelpers')
const OneSignal = require('../../../lib/oneSignal')

chai.use(sinonChai)

const sandbox = sinon.createSandbox()

describe('braveAlerter.js unit tests: sendReminderMessageForSession', () => {
  beforeEach(() => {
    // Don't actually call Twilio
    sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

    // Don't actually call OneSignal
    sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

    // Don't actually log
    sandbox.stub(helpers, 'logError')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('if AlertSession is started and has responderPushId', () => {
    beforeEach(async () => {
      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sandbox.stub().returns(
          testingHelpers.alertSessionFactory({
            sessionId: 'guid-123',
            alertState: CHATBOT_STATE.STARTED, // Pretend the AlertSession has started
          }),
        ),
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        responderPushId: 'pushId',
        toPhoneNumbers: ['+11231231234'],
        fromPhoneNumber: '+11231231234',
        alertType: ALERT_TYPE.BUTTONS_NOT_URGENT,
        deviceName: 'Bathroom 2',
        reminderMessage: 'My message',
      })
    })

    it('should not send the reminder using Twilio', () => {
      expect(twilioHelpers.sendTwilioMessage).not.to.be.called
    })
    it('should send the reminder using OneSignal', () => {
      expect(OneSignal.sendOneSignalMessage).to.be.calledOnceWithExactly('pushId', 'guid-123 REMINDER', 'Button Press Alert Reminder:\nBathroom 2')
    })

    it('should call the callback with session ID and alert state WAITING_FOR_REPLY', () => {
      const expectedAlertSession = testingHelpers.alertSessionFactory({
        sessionId: 'guid-123',
        alertState: CHATBOT_STATE.WAITING_FOR_REPLY,
      })
      expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if AlertSession is started and has toPhoneNumbers and fromPhoneNumber but not responderPushId', () => {
    beforeEach(async () => {
      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sandbox.stub().returns(
          testingHelpers.alertSessionFactory({
            sessionId: 'guid-123',
            alertState: CHATBOT_STATE.STARTED, // Pretend the AlertSession has started
          }),
        ),
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        toPhoneNumbers: ['+11231231234'],
        fromPhoneNumber: '+11231231235',
        alertType: ALERT_TYPE.BUTTONS_NOT_URGENT,
        deviceName: 'Bathroom 2',
        reminderMessage: 'My message',
      })
    })

    it('should send the reminder using Twilio', () => {
      expect(twilioHelpers.sendTwilioMessage).to.be.calledOnceWithExactly('+11231231234', '+11231231235', 'My message')
    })

    it('should not send the reminder using OneSignal', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })

    it('should call the callback with session ID and alert state WAITING_FOR_REPLY', () => {
      const expectedAlertSession = testingHelpers.alertSessionFactory({
        sessionId: 'guid-123',
        alertState: CHATBOT_STATE.WAITING_FOR_REPLY,
      })
      expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if AlertSession is started and has multiple toPhoneNumbers and fromPhoneNumber but not responderPushId', () => {
    beforeEach(async () => {
      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sandbox.stub().returns(
          testingHelpers.alertSessionFactory({
            sessionId: 'guid-123',
            alertState: CHATBOT_STATE.STARTED, // Pretend the AlertSession has started
          }),
        ),
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        toPhoneNumbers: ['+11231231234', '+13336665555'],
        fromPhoneNumber: '+11231231235',
        alertType: ALERT_TYPE.BUTTONS_NOT_URGENT,
        deviceName: 'Bathroom 2',
        reminderMessage: 'My message',
      })
    })

    it('should send the reminder using Twilio to the first responder phone', () => {
      expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly('+11231231234', '+11231231235', 'My message')
    })

    it('should send the reminder using Twilio to the second responder phone', () => {
      expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly('+13336665555', '+11231231235', 'My message')
    })

    it('should not send the reminder using OneSignal', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })

    it('should call the callback with session ID and alert state WAITING_FOR_REPLY', () => {
      const expectedAlertSession = testingHelpers.alertSessionFactory({
        sessionId: 'guid-123',
        alertState: CHATBOT_STATE.WAITING_FOR_REPLY,
      })
      expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if there is no responderPushId and no toPhoneNumbers', () => {
    beforeEach(async () => {
      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sandbox.stub().returns(
          testingHelpers.alertSessionFactory({
            sessionId: 'guid-123',
            alertState: CHATBOT_STATE.STARTED, // Pretend the AlertSession has started
          }),
        ),
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        fromPhoneNumber: '+11231231234',
        alertType: ALERT_TYPE.BUTTONS_NOT_URGENT,
        deviceName: 'Bathroom 2',
        reminderMessage: 'My message',
      })
    })

    it('should not send the reminder using Twilio', () => {
      expect(twilioHelpers.sendTwilioMessage).not.to.be.called
    })

    it('should not send the reminder using OneSignal', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if there is no responderPushId and no fromPhoneNumber', () => {
    beforeEach(async () => {
      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sandbox.stub().returns(
          testingHelpers.alertSessionFactory({
            sessionId: 'guid-123',
            alertState: CHATBOT_STATE.STARTED, // Pretend the AlertSession has started
          }),
        ),
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        toPhoneNumbers: ['+11231231234'],
        alertType: ALERT_TYPE.BUTTONS_NOT_URGENT,
        deviceName: 'Bathroom 2',
        reminderMessage: 'My message',
      })
    })

    it('should not send the reminder using Twilio', () => {
      expect(twilioHelpers.sendTwilioMessage).not.to.be.called
    })

    it('should not send the reminder using OneSignal', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if twilio fails to send the message', () => {
    beforeEach(async () => {
      twilioHelpers.sendTwilioMessage.restore()
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns()

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sandbox.stub().returns(
          testingHelpers.alertSessionFactory({
            sessionId: 'guid-123',
            alertState: CHATBOT_STATE.STARTED, // Pretend the AlertSession has started
          }),
        ),
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        toPhoneNumbers: ['+11231231234'],
        fromPhoneNumber: '+11231231234',
        alertType: ALERT_TYPE.BUTTONS_NOT_URGENT,
        deviceName: 'Bathroom 2',
        reminderMessage: 'My message',
      })
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })

    it('should not send the reminder using OneSignal', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Failed to send reminder message for session guid-123')
    })
  })

  describe('if onesignal fails to send the message', () => {
    beforeEach(async () => {
      OneSignal.sendOneSignalMessage.restore()
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({
        data: {
          errors: {
            invalid_player_ids: ['b186912c-cf25-4688-8218-06cb13e09a4f'],
          },
        },
      })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sandbox.stub().returns(
          testingHelpers.alertSessionFactory({
            sessionId: 'guid-123',
            alertState: CHATBOT_STATE.STARTED, // Pretend the AlertSession has started
          }),
        ),
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        responderPushId: 'pushId',
        alertType: ALERT_TYPE.BUTTONS_NOT_URGENT,
        deviceName: 'Bathroom 2',
        reminderMessage: 'My message',
      })
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })

    it('should not send the reminder using Twilio', () => {
      expect(twilioHelpers.sendTwilioMessage).not.to.be.called
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith(
        'Failed to send reminder message for session guid-123: {"invalid_player_ids":["b186912c-cf25-4688-8218-06cb13e09a4f"]}',
      )
    })
  })

  describe('if AlertSession is not started', () => {
    beforeEach(async () => {
      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sandbox.stub().returns(
          testingHelpers.alertSessionFactory({
            sessionId: 'guid-123',
            alertState: 'not CHATBOT_STATE.STARTED',
          }),
        ),
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        toPhoneNumbers: ['+11231231234'],
        fromPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
      })
    })

    it('should not send the reminder', () => {
      expect(twilioHelpers.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })
})
