const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const CHATBOT_STATE = require('../../../lib/chatbotStateEnum')
const helpers = require('../../../lib/helpers')
const Twilio = require('../../../lib/twilio')
const AlertSession = require('../../../lib/alertSession')
const testingHelpers = require('../../testingHelpers')

chai.use(sinonChai)

describe('braveAlerter.js unit tests: sendFallbackMessagesForSession', () => {
  beforeEach(() => {
    // Don't actually log
    sinon.stub(helpers, 'logError')
  })

  afterEach(() => {
    helpers.logError.restore()
  })

  describe('if AlertSession is waiting for a response', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({ status: 'my status' })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sinon.stub().returns(
          new AlertSession(
            'guid-123',
            CHATBOT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
          ),
        ),
        alertSessionChangedCallback: sinon.fake(),
      })

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234'],
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should send the fallback message', () => {
      expect(Twilio.sendTwilioMessage).to.be.calledOnce
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if there is more than one toFallbackPhoneNumbers', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({ status: 'my status' })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sinon.stub().returns(
          new AlertSession(
            'guid-123',
            CHATBOT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
          ),
        ),
        alertSessionChangedCallback: sinon.fake(),
      })

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234', '+13331114444', '+19998887777'],
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should send all the fallback messages', () => {
      expect(Twilio.sendTwilioMessage).to.be.calledThrice
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if there is no toFallbackPhoneNumbers', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({ status: 'my status' })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sinon.stub().returns(
          new AlertSession(
            'guid-123',
            CHATBOT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
          ),
        ),
        alertSessionChangedCallback: sinon.fake(),
      })

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should not send the fallback message', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if there is no fromFallbackPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({ status: 'my status' })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sinon.stub().returns(
          new AlertSession(
            'guid-123',
            CHATBOT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
          ),
        ),
        alertSessionChangedCallback: sinon.fake(),
      })

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234'],
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should not send the fallback message', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if twilio fails to send the fallback messages', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').resolves()

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sinon.stub().returns(
          new AlertSession(
            'guid-123',
            CHATBOT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
          ),
        ),
        alertSessionChangedCallback: sinon.fake(),
      })

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234', '+12223334444'],
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Failed to send any fallbacks for session guid-123')
    })
  })

  describe('if successfully sends only some of the fallback messages', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon
        .stub(Twilio, 'sendTwilioMessage')
        .onCall(0)
        .returns()
        .onCall(1)
        .returns({ status: 'my status' })
        .onCall(2)
        .returns({ status: 'my status' })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sinon.stub().returns(
          new AlertSession(
            'guid-123',
            CHATBOT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
          ),
        ),
        alertSessionChangedCallback: sinon.fake(),
      })

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234', '+12223334444', '+19998887777'],
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should send the fallback messages', () => {
      expect(Twilio.sendTwilioMessage).to.be.calledThrice
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if AlertSession is not waiting for a response', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({ status: 'my status' })

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSession: sinon.stub().returns(new AlertSession('guid-123', 'not CHATBOT_STATE.WAITING_FOR_REPLY')),
        alertSessionChangedCallback: sinon.fake(),
      })

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234'],
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should not send the fallback message', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
    })
  })
})
