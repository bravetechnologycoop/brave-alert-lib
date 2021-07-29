const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const CHATBOT_STATE = require('../../../lib/chatbotStateEnum')
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

describe('braveAlerter.js unit tests: sendReminderMessageForSession', () => {
  beforeEach(() => {
    // Don't actually log
    sinon.stub(helpers, 'logError')
  })

  afterEach(() => {
    helpers.logError.restore()
  })

  describe('if AlertSession is started', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({})

      // Spy on the alertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(
        new AlertSession(
          'guid-123',
          CHATBOT_STATE.STARTED, // Pretend the AlertSession has started
        ),
      )

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        toPhoneNumber: '+11231231234',
        fromPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
      })
    })

    afterEach(() => {
      this.braveAlerter.getAlertSession.restore()
      Twilio.sendTwilioMessage.restore()
    })

    it('should send the reminder', () => {
      expect(Twilio.sendTwilioMessage).to.be.calledOnce
    })

    it('should call the callback with session ID and alert state WAITING_FOR_REPLY', () => {
      const expectedAlertSession = new AlertSession('guid-123', CHATBOT_STATE.WAITING_FOR_REPLY)
      expect(this.fakeAlertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if there is no toPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({})

      // Spy on the alertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(
        new AlertSession(
          'guid-123',
          CHATBOT_STATE.STARTED, // Pretend the AlertSession has started
        ),
      )

      await this.braveAlerter.sendReminderMessageForSession({
        alertSession: new AlertSession(
          'guid-123',
          CHATBOT_STATE.STARTED, // Pretend the AlertSession has been started
        ),
        fromPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
      })
    })

    afterEach(() => {
      this.braveAlerter.getAlertSession.restore()
      Twilio.sendTwilioMessage.restore()
    })

    it('should not send the reminder', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.fakeAlertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if there is no fromPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({})

      // Spy on the alertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(
        new AlertSession(
          'guid-123',
          CHATBOT_STATE.STARTED, // Pretend the AlertSession has started
        ),
      )

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        toPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
      })
    })

    afterEach(() => {
      this.braveAlerter.getAlertSession.restore()
      Twilio.sendTwilioMessage.restore()
    })

    it('should not send the reminder', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.fakeAlertSessionChangedCallback).not.to.be.called
    })
  })

  describe('if twilio fails to send the message', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns()

      // Spy on the alertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(
        new AlertSession(
          'guid-123',
          CHATBOT_STATE.STARTED, // Pretend the AlertSession has started
        ),
      )

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        toPhoneNumber: '+11231231234',
        fromPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
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
      expect(helpers.logError).to.be.calledWith('Failed to send reminder message for session guid-123')
    })
  })

  describe('if AlertSession is not started', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({})

      // Spy on the alertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      sinon.stub(this.braveAlerter, 'getAlertSession').returns(new AlertSession('guid-123', 'not CHATBOT_STATE.STARTED'))

      await this.braveAlerter.sendReminderMessageForSession({
        sessionId: 'guid-123',
        toPhoneNumber: '+11231231234',
        fromPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
      })
    })

    afterEach(() => {
      this.braveAlerter.getAlertSession.restore()
      Twilio.sendTwilioMessage.restore()
    })

    it('should not send the reminder', () => {
      expect(Twilio.sendTwilioMessage).not.to.be.called
    })

    it('should not call the callback', () => {
      expect(this.fakeAlertSessionChangedCallback).not.to.be.called
    })
  })
})
