const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const ALERT_STATE = require('../../../lib/alertStateEnum')
const BraveAlerter = require('../../../lib/braveAlerter')
const helpers = require('../../../lib/helpers')
const Twilio = require('../../../lib/twilio')
const AlertSession = require('../../../lib/alertSession')

chai.use(sinonChai)

function dummyGetAlertSession() {
  return 'getAlertSession'
}

function dummyGetAlertSessionByPhoneNumber() {
  return 'getAlertSessionByPhoneNumber'
}

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

      // Spy on the fakeAlertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(
        new AlertSession(
          'guid-123',
          ALERT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
        ),
      )

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234'],
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      this.braveAlerter.getAlertSession.restore()
      Twilio.sendTwilioMessage.restore()
    })

    it('should send the fallback message', () => {
      expect(Twilio.sendTwilioMessage).to.be.calledOnce
    })

    it('should call the callback with the session ID and fallback response status', () => {
      const expectedAlertSession = new AlertSession('guid-123')
      expectedAlertSession.fallbackReturnMessage = 'my status'
      expect(this.fakeAlertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if there is more than one toFallbackPhoneNumbers', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({ status: 'my status' })

      // Spy on the fakeAlertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(
        new AlertSession(
          'guid-123',
          ALERT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
        ),
      )

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234', '+13331114444', '+19998887777'],
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      this.braveAlerter.getAlertSession.restore()
      Twilio.sendTwilioMessage.restore()
    })

    it('should send all the fallback messages', () => {
      expect(Twilio.sendTwilioMessage).to.be.calledThrice
    })

    it('should call the callback with the session ID and fallback response statuses', () => {
      const expectedAlertSession = new AlertSession('guid-123')
      expectedAlertSession.fallbackReturnMessage = 'my status, my status, my status'
      expect(this.fakeAlertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if there is no toFallbackPhoneNumbers', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({ status: 'my status' })

      // Spy on the fakeAlertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(
        new AlertSession(
          'guid-123',
          ALERT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
        ),
      )

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      this.braveAlerter.getAlertSession.restore()
      Twilio.sendTwilioMessage.restore()
    })

    it('should not send the fallback message', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.fakeAlertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if there is no fromFallbackPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({ status: 'my status' })

      // Spy on the fakeAlertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(
        new AlertSession(
          'guid-123',
          ALERT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
        ),
      )

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234'],
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      this.braveAlerter.getAlertSession.restore()
      Twilio.sendTwilioMessage.restore()
    })

    it('should not send the fallback message', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.fakeAlertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if twilio fails to send the fallback messages', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').resolves()

      // Spy on the fakeAlertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(
        new AlertSession(
          'guid-123',
          ALERT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
        ),
      )

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234', '+12223334444'],
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      this.braveAlerter.getAlertSession.restore()
      Twilio.sendTwilioMessage.restore()
    })

    it('should not call the callback', () => {
      expect(this.fakeAlertSessionChangedCallback).not.to.be.called
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

      // Spy on the fakeAlertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(
        new AlertSession(
          'guid-123',
          ALERT_STATE.WAITING_FOR_REPLY, // Pretend the AlertSession is waiting for a response
        ),
      )

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234', '+12223334444', '+19998887777'],
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      this.braveAlerter.getAlertSession.restore()
      Twilio.sendTwilioMessage.restore()
    })

    it('should send the fallback messages', () => {
      expect(Twilio.sendTwilioMessage).to.be.calledThrice
    })

    it('should call the callback with the session ID and fallback response statuses, in the same order as the fallbackToPhoneNumbers array', () => {
      const expectedAlertSession = new AlertSession('guid-123')
      expectedAlertSession.fallbackReturnMessage = 'no_response, my status, my status'
      expect(this.fakeAlertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if AlertSession is not waiting for a response', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({ status: 'my status' })

      // Spy on the fakeAlertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(new AlertSession('guid-123', 'not ALERT_STATE.WAITING_FOR_REPLY'))

      await this.braveAlerter.sendFallbackMessagesForSession({
        sessionId: 'guid-123',
        fallbackToPhoneNumbers: ['+11231231234'],
        fallbackFromPhoneNumber: '+11231231234',
        fallbackMessage: 'My message',
      })
    })

    afterEach(() => {
      this.braveAlerter.getAlertSession.restore()
      Twilio.sendTwilioMessage.restore()
    })

    it('should not send the fallback message', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.fakeAlertSessionChangedCallback).not.to.be.called
    })
  })
})
