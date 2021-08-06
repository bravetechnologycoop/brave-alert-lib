// Third-party dependencies
const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

// In-house dependencies
const ALERT_TYPE = require('../../../lib/alertTypeEnum')
const CHATBOT_STATE = require('../../../lib/chatbotStateEnum')
const helpers = require('../../../lib/helpers')
const Twilio = require('../../../lib/twilio')
const OneSignal = require('../../../lib/oneSignal')
const AlertSession = require('../../../lib/alertSession')
const testingHelpers = require('../../testingHelpers')

chai.use(sinonChai)

const sandbox = sinon.createSandbox()

describe('braveAlerter.js unit tests: startAlertSession unit tests', () => {
  beforeEach(() => {
    sandbox.spy(helpers, 'logError')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('if there is responderPushId, toPhoneNumber, and fromPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(Twilio, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      // Don't use real time
      sandbox.useFakeTimers()

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })

      this.sessionId = 'guid-123'
      this.message = 'my message'
      this.responderPushId = 'pushId'
      this.alertType = ALERT_TYPE.SENSOR_DURATION
      this.deviceName = 'Room 101'
      this.fallbackTimeoutMillis = 60000
      await this.braveAlerter.startAlertSession({
        responderPushId: this.responderPushId,
        toPhoneNumber: '+11231231234',
        fromPhoneNumber: '+11231231234',
        sessionId: this.sessionId,
        message: this.message,
        alertType: this.alertType,
        deviceName: this.deviceName,
        fallbackTimeoutMillis: this.fallbackTimeoutMillis,
      })
    })

    it('should not send Twilio alert', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.calledOnce
    })

    it('should send OneSignal alert with the right parameters', () => {
      expect(OneSignal.sendOneSignalMessage).to.be.calledOnceWithExactly(
        this.responderPushId,
        `${this.sessionId} START`,
        `New Duration Alert:\n${this.deviceName}`,
      )
    })

    it('should call the callback with session ID and alert state STARTED', () => {
      const expectedAlertSession = new AlertSession(this.sessionId, CHATBOT_STATE.STARTED)
      expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if there is responderPushId', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(Twilio, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      // Don't use real time
      sandbox.useFakeTimers()

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })

      this.sessionId = 'guid-123'
      this.message = 'my message'
      this.responderPushId = 'pushId'
      this.alertType = ALERT_TYPE.SENSOR_DURATION
      this.deviceName = 'Room 101'
      this.fallbackTimeoutMillis = 60000
      await this.braveAlerter.startAlertSession({
        responderPushId: this.responderPushId,
        sessionId: this.sessionId,
        message: this.message,
        alertType: this.alertType,
        deviceName: this.deviceName,
        fallbackTimeoutMillis: this.fallbackTimeoutMillis,
      })
    })

    it('should not send Twilio alert', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.calledOnce
    })

    it('should send OneSignal alert with the right parameters', () => {
      expect(OneSignal.sendOneSignalMessage).to.be.calledOnceWithExactly(
        this.responderPushId,
        `${this.sessionId} START`,
        `New Duration Alert:\n${this.deviceName}`,
      )
    })

    it('should call the callback with session ID and alert state STARTED', () => {
      const expectedAlertSession = new AlertSession(this.sessionId, CHATBOT_STATE.STARTED)
      expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if there is no responderPushId but there is toPhoneNumber and fromPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(Twilio, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })

      this.sessionId = 'guid-123'
      this.toPhoneNumber = '+11231231234'
      this.fromPhoneNumber = '+18887776666'
      this.message = 'my message'
      await this.braveAlerter.startAlertSession({
        sessionId: this.sessionId,
        toPhoneNumber: this.toPhoneNumber,
        fromPhoneNumber: this.fromPhoneNumber,
        message: this.message,
      })
    })

    it('should send Twilio alert with the right parameters', () => {
      expect(Twilio.sendTwilioMessage).to.be.calledOnceWithExactly(this.toPhoneNumber, this.fromPhoneNumber, this.message)
    })

    it('should not send OneSignal alert', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })

    it('should call the callback with session ID and alert state STARTED', () => {
      const expectedAlertSession = new AlertSession(this.sessionId, CHATBOT_STATE.STARTED)
      expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if there is no responderPushId and no toPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(Twilio, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        fromPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
      })
    })

    it('should not send Twilio alert', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.called
    })

    it('should not send OneSignal alert', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if there is no responderPushId and no fromPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(Twilio, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        toPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
      })
    })

    it('should not send Twilio alert', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.called
    })

    it('should not send OneSignal alert', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if twilio fails to send the message', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(Twilio, 'sendTwilioMessage').returns()

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })
      await this.braveAlerter.startAlertSession({
        sessionId: 'guid-123',
        toPhoneNumber: '+11231231234',
        fromPhoneNumber: '+11231231234',
      })
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Failed to send alert for session guid-123')
    })
  })

  describe('if onesignal fails to send the message', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(Twilio, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({
        data: {
          errors: {
            invalid_external_user_ids: ['786956'],
          },
        },
      })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })
      await this.braveAlerter.startAlertSession({
        sessionId: 'guid-123',
        responderPushId: 'pushId',
      })
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Failed to send alert for session guid-123: {"invalid_external_user_ids":["786956"]}')
    })
  })

  describe('if reminderTimeoutMillis is', () => {
    beforeEach(() => {
      sandbox.useFakeTimers()

      this.braveAlerter = testingHelpers.braveAlerterFactory()
      sandbox.stub(this.braveAlerter, 'sendReminderMessageForSession')
    })

    it('non-negative should send a reminder', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        reminderTimeoutMillis: 1,
      })
      sandbox.clock.tick(2)

      expect(this.braveAlerter.sendReminderMessageForSession).to.be.calledOnce
    })

    it('negative should not send a reminder', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        reminderTimeoutMillis: -1,
      })
      sandbox.clock.tick(2)

      expect(this.braveAlerter.sendReminderMessageForSession).not.to.be.called
    })

    it('not given should not send a reminder', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
      })
      sandbox.clock.tick(2)

      expect(this.braveAlerter.sendReminderMessageForSession).not.to.be.called
    })
  })

  describe('if fallbackTimeoutMillis is', () => {
    beforeEach(() => {
      sandbox.useFakeTimers()

      this.braveAlerter = testingHelpers.braveAlerterFactory()
      sandbox.stub(this.braveAlerter, 'sendFallbackMessagesForSession')
    })

    it('non-negative should send a fallback alert', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        fallbackTimeoutMillis: 1,
      })
      sandbox.clock.tick(2)

      expect(this.braveAlerter.sendFallbackMessagesForSession).to.be.calledOnce
    })

    it('negative should not send a fallback alert', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        fallbackTimeoutMillis: -1,
      })
      sandbox.clock.tick(2)

      expect(this.braveAlerter.sendFallbackMessagesForSession).not.to.be.called
    })

    it('not given should not send a fallback alert', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
      })
      sandbox.clock.tick(2)

      expect(this.braveAlerter.sendFallbackMessagesForSession).not.to.be.called
    })
  })
})
