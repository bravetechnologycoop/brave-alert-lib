// Third-party dependencies
const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

// In-house dependencies
const helpers = require('../../../lib/helpers')
const twilioHelpers = require('../../../lib/twilioHelpers')
const OneSignal = require('../../../lib/oneSignal')
const testingHelpers = require('../../testingHelpers')

chai.use(sinonChai)

const sandbox = sinon.createSandbox()

describe('braveAlerter.js unit tests: sendAlertSessionUpdate unit tests', () => {
  beforeEach(() => {
    sandbox.spy(helpers, 'logError')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('if there is responderPushId, toPhoneNumbers, and fromPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      this.braveAlerter = testingHelpers.braveAlerterFactory()

      this.sessionId = 'guid-123'
      this.responderPushId = 'pushId'
      await this.braveAlerter.sendAlertSessionUpdate(
        this.sessionId,
        this.responderPushId,
        '+11231231234',
        '+11231231234',
        'text message',
        'push message',
      )
    })

    it('should not send Twilio alert', () => {
      expect(twilioHelpers.sendTwilioMessage).not.to.be.called
    })

    it('should send OneSignal alert with the right parameters', () => {
      expect(OneSignal.sendOneSignalMessage).to.be.calledOnceWithExactly(this.responderPushId, `${this.sessionId} UPDATE`, 'push message')
    })
  })

  describe('if there is responderPushId', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      this.braveAlerter = testingHelpers.braveAlerterFactory()

      this.sessionId = 'guid-123'
      this.responderPushId = 'pushId'
      await this.braveAlerter.sendAlertSessionUpdate(this.sessionId, this.responderPushId, undefined, undefined, 'text message', 'push message')
    })

    it('should not send Twilio alert', () => {
      expect(twilioHelpers.sendTwilioMessage).not.to.be.called
    })

    it('should send OneSignal alert with the right parameters', () => {
      expect(OneSignal.sendOneSignalMessage).to.be.calledOnceWithExactly(this.responderPushId, `${this.sessionId} UPDATE`, 'push message')
    })
  })

  describe('if there is no responderPushId but there is toPhoneNumbers and fromPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      this.braveAlerter = testingHelpers.braveAlerterFactory()

      this.sessionId = 'guid-123'
      this.toPhoneNumbers = ['+11231231234']
      this.fromPhoneNumber = '+18887776666'
      await this.braveAlerter.sendAlertSessionUpdate(
        this.sessionId,
        undefined,
        this.toPhoneNumbers,
        this.fromPhoneNumber,
        'text message',
        'push message',
      )
    })

    it('should send Twilio alert with the right parameters', () => {
      expect(twilioHelpers.sendTwilioMessage).to.be.calledOnceWithExactly(this.toPhoneNumbers[0], this.fromPhoneNumber, 'text message')
    })

    it('should not send OneSignal alert', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })
  })

  describe('if there is no responderPushId but there is multiple toPhoneNumbers and fromPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      this.braveAlerter = testingHelpers.braveAlerterFactory()

      this.sessionId = 'guid-123'
      this.toPhoneNumbers = ['+11231231234', '+15557778888']
      this.fromPhoneNumber = '+18887776666'
      await this.braveAlerter.sendAlertSessionUpdate(
        this.sessionId,
        undefined,
        this.toPhoneNumbers,
        this.fromPhoneNumber,
        'text message',
        'push message',
      )
    })

    it('should send Twilio alert with the right parameters to the first responder phone', () => {
      expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly(this.toPhoneNumbers[0], this.fromPhoneNumber, 'text message')
    })

    it('should send Twilio alert with the right parameters to the second responder phone', () => {
      expect(twilioHelpers.sendTwilioMessage).to.be.calledWithExactly(this.toPhoneNumbers[1], this.fromPhoneNumber, 'text message')
    })

    it('should not send OneSignal alert', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })
  })

  describe('if there is no responderPushId and no toPhoneNumbers', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      this.braveAlerter = testingHelpers.braveAlerterFactory()

      await this.braveAlerter.sendAlertSessionUpdate('guid-123', undefined, undefined, '+11231231234', 'text message', 'push message')
    })

    it('should not send Twilio alert', () => {
      expect(twilioHelpers.sendTwilioMessage).not.to.be.called
    })

    it('should not send OneSignal alert', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Failed to send alert update for session guid-123: push message')
    })
  })

  describe('if there is no responderPushId and no fromPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      this.braveAlerter = testingHelpers.braveAlerterFactory()

      await this.braveAlerter.sendAlertSessionUpdate('guid-123', undefined, '+11231231234', undefined, 'text message', 'push message')
    })

    it('should not send Twilio alert', () => {
      expect(twilioHelpers.sendTwilioMessage).not.to.be.called
    })

    it('should not send OneSignal alert', () => {
      expect(OneSignal.sendOneSignalMessage).not.to.be.called
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Failed to send alert update for session guid-123: push message')
    })
  })

  describe('if twilio fails to send the message', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns()

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: {} })

      this.braveAlerter = testingHelpers.braveAlerterFactory()

      await this.braveAlerter.sendAlertSessionUpdate('guid-123', undefined, '+11231231234', '+11231231234', 'text message', 'push message')
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Failed to send alert update for session guid-123: push message')
    })
  })

  describe('if onesignal fails to send the message', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sandbox.stub(twilioHelpers, 'sendTwilioMessage').returns({})

      // Don't actually call OneSignal
      sandbox.stub(OneSignal, 'sendOneSignalMessage').returns({ data: { errors: ['All included players are not subscribed'] } })

      this.braveAlerter = testingHelpers.braveAlerterFactory()

      await this.braveAlerter.sendAlertSessionUpdate('guid-123', 'pushId', undefined, undefined, 'text message', 'push message')
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith(
        'Failed to send push alert update for session guid-123: push message: ["All included players are not subscribed"]',
      )
    })
  })
})
