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
const twilioHelpers = require('../../../lib/twilioHelpers')
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

  describe('if toPhoneNumbers and fromPhoneNumber are provided', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })

      this.sessionId = 'guid-123'
      this.toPhoneNumbers = ['+11231231234']
      this.fromPhoneNumber = '+18887776666'
      this.message = 'my message'
      await this.braveAlerter.startAlertSession({
        sessionId: this.sessionId,
        toPhoneNumbers: this.toPhoneNumbers,
        fromPhoneNumber: this.fromPhoneNumber,
        message: this.message,
        language: 'en',
        t: function mock_t(key, options) {
          return `${key} - ${options.lng}`
        },
      })
    })

    it('should send Twilio alert with the right parameters', () => {
      expect(twilioHelpers.sendTwilioMessage).to.be.calledOnceWithExactly(this.toPhoneNumbers[0], this.fromPhoneNumber, this.message)
    })

    it('should call the callback with session ID and alert state STARTED', () => {
      const expectedAlertSession = testingHelpers.alertSessionFactory({ sessionId: this.sessionId, alertState: CHATBOT_STATE.STARTED })
      expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if multiple toPhoneNumbers and fromPhoneNumber are provided', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })

      this.sessionId = 'guid-123'
      this.toPhoneNumbers = ['+11231231234', '+19998885555']
      this.fromPhoneNumber = '+18887776666'
      this.message = 'my message'
      await this.braveAlerter.startAlertSession({
        sessionId: this.sessionId,
        toPhoneNumbers: this.toPhoneNumbers,
        fromPhoneNumber: this.fromPhoneNumber,
        message: this.message,
        language: 'en',
        t: function mock_t(key, options) {
          return `${key} - ${options.lng}`
        },
      })
    })

    it('should send Twilio alert with the right parameters to first responder phone', () => {
      expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly(this.toPhoneNumbers[0], this.fromPhoneNumber, this.message)
    })

    it('should send Twilio alert with the right parameters to second responder phone', () => {
      expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly(this.toPhoneNumbers[1], this.fromPhoneNumber, this.message)
    })

    it('should call the callback with session ID and alert state STARTED', () => {
      const expectedAlertSession = testingHelpers.alertSessionFactory({ sessionId: this.sessionId, alertState: CHATBOT_STATE.STARTED })
      expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if fromPhoneNumber is provided, but no toPhoneNumbers', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.startAlertSession({
        alertSession: testingHelpers.alertSessionFactory({ sessionId: 'guid-123' }),
        fromPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
        language: 'en',
        t: function mock_t(key, options) {
          return `${key} - ${options.lng}`
        },
      })
    })

    it('should not send Twilio alert', () => {
      expect(twilioHelpers.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if toPhoneNumbers are provided, but no fromPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })

      await this.braveAlerter.startAlertSession({
        alertSession: testingHelpers.alertSessionFactory({ sessionId: 'guid-123' }),
        toPhoneNumbers: ['+11231231234'],
        reminderMessage: 'My message',
        language: 'en',
        t: function mock_t(key, options) {
          return `${key} - ${options.lng}`
        },
      })
    })

    it('should not send Twilio alert', () => {
      expect(twilioHelpers.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if Twilio fails to send the message', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns()

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.fake(),
      })
      await this.braveAlerter.startAlertSession({
        sessionId: 'guid-123',
        toPhoneNumbers: ['+11231231234'],
        fromPhoneNumber: '+11231231234',
        language: 'en',
        t: function mock_t(key, options) {
          return `${key} - ${options.lng}`
        },
      })
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Failed to send alert for session guid-123')
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
        alertSession: testingHelpers.alertSessionFactory({ sessionId: 'guid-123' }),
        reminderTimeoutMillis: 1,
        language: 'en',
        t: function mock_t(key, options) {
          return `${key} - ${options.lng}`
        },
      })
      sandbox.clock.tick(2)

      expect(this.braveAlerter.sendReminderMessageForSession).to.be.calledOnce
    })

    it('negative should not send a reminder', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: testingHelpers.alertSessionFactory({ sessionId: 'guid-123' }),
        reminderTimeoutMillis: -1,
        language: 'en',
        t: function mock_t(key, options) {
          return `${key} - ${options.lng}`
        },
      })
      sandbox.clock.tick(2)

      expect(this.braveAlerter.sendReminderMessageForSession).not.to.be.called
    })

    it('not given should not send a reminder', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: testingHelpers.alertSessionFactory({ sessionId: 'guid-123' }),
        language: 'en',
        t: function mock_t(key, options) {
          return `${key} - ${options.lng}`
        },
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
        alertSession: testingHelpers.alertSessionFactory({ sessionId: 'guid-123' }),
        fallbackTimeoutMillis: 1,
        language: 'en',
        t: function mock_t(key, options) {
          return `${key} - ${options.lng}`
        },
      })
      sandbox.clock.tick(2)

      expect(this.braveAlerter.sendFallbackMessagesForSession).to.be.calledOnce
    })

    it('negative should not send a fallback alert', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: testingHelpers.alertSessionFactory({ sessionId: 'guid-123' }),
        fallbackTimeoutMillis: -1,
        language: 'en',
        t: function mock_t(key, options) {
          return `${key} - ${options.lng}`
        },
      })
      sandbox.clock.tick(2)

      expect(this.braveAlerter.sendFallbackMessagesForSession).not.to.be.called
    })

    it('not given should not send a fallback alert', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: testingHelpers.alertSessionFactory({ sessionId: 'guid-123' }),
        language: 'en',
        t: function mock_t(key, options) {
          return `${key} - ${options.lng}`
        },
      })
      sandbox.clock.tick(2)

      expect(this.braveAlerter.sendFallbackMessagesForSession).not.to.be.called
    })
  })
})
