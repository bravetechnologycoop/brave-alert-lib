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

describe('braveAlerter.js unit tests: startAlertSession unit tests', () => {
  beforeEach(() => {
    // Don't actually log
    sinon.stub(helpers, 'logError')
  })

  afterEach(() => {
    helpers.logError.restore()
  })

  describe('if there is toPhoneNumber and fromPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({})

      // Spy on the alertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      const braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      await braveAlerter.startAlertSession({
        sessionId: 'guid-123',
        toPhoneNumber: '+11231231234',
        fromPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
      })
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should send alert', () => {
      expect(Twilio.sendTwilioMessage).to.be.calledOnce
    })

    it('should call the callback with session ID and alert state STARTED', () => {
      const expectedAlertSession = new AlertSession('guid-123', ALERT_STATE.STARTED)
      expect(this.fakeAlertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
    })
  })

  describe('if there is no toPhoneNumber', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns({})

      // Spy on the alertSessionChangedCallback call
      this.fakeAlertSessionChangedCallback = sinon.fake()

      const braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      await braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        fromPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
      })
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should not send alert', () => {
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

      const braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      await braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        toPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
      })
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should not send alert', () => {
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

      const braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, this.fakeAlertSessionChangedCallback)

      await braveAlerter.startAlertSession({
        sessionId: 'guid-123',
        toPhoneNumber: '+11231231234',
        fromPhoneNumber: '+11231231234',
        reminderMessage: 'My message',
      })
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should not call the callback', () => {
      expect(this.fakeAlertSessionChangedCallback).not.to.be.called
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Failed to send alert for session guid-123')
    })
  })

  describe('if reminderTimeoutMillis is', () => {
    beforeEach(() => {
      this.clock = sinon.useFakeTimers()

      this.braveAlerter = new BraveAlerter()
      sinon.stub(this.braveAlerter, 'sendReminderMessageForSession')
    })

    afterEach(() => {
      this.braveAlerter.sendReminderMessageForSession.restore()

      this.clock.restore()
    })

    it('non-negative should send a reminder', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        reminderTimeoutMillis: 1,
      })
      this.clock.tick(2)

      expect(this.braveAlerter.sendReminderMessageForSession).to.be.calledOnce
    })

    it('negative should not send a reminder', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        reminderTimeoutMillis: -1,
      })
      this.clock.tick(2)

      expect(this.braveAlerter.sendReminderMessageForSession).not.to.be.called
    })

    it('not given should not send a reminder', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
      })
      this.clock.tick(2)

      expect(this.braveAlerter.sendReminderMessageForSession).not.to.be.called
    })
  })

  describe('if fallbackTimeoutMillis is', () => {
    beforeEach(() => {
      this.clock = sinon.useFakeTimers()

      this.braveAlerter = new BraveAlerter()
      sinon.stub(this.braveAlerter, 'sendFallbackMessagesForSession')
    })

    afterEach(() => {
      this.braveAlerter.sendFallbackMessagesForSession.restore()

      this.clock.restore()
    })

    it('non-negative should send a fallback alert', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        fallbackTimeoutMillis: 1,
      })
      this.clock.tick(2)

      expect(this.braveAlerter.sendFallbackMessagesForSession).to.be.calledOnce
    })

    it('negative should not send a fallback alert', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
        fallbackTimeoutMillis: -1,
      })
      this.clock.tick(2)

      expect(this.braveAlerter.sendFallbackMessagesForSession).not.to.be.called
    })

    it('not given should not send a fallback alert', async () => {
      await this.braveAlerter.startAlertSession({
        alertSession: new AlertSession('guid-123'),
      })
      this.clock.tick(2)

      expect(this.braveAlerter.sendFallbackMessagesForSession).not.to.be.called
    })
  })
})
