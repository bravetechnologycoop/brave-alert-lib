const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require("sinon-chai");

const BraveAlerter = require('../../../lib/braveAlerter.js')
const helpers = require('../../../lib/helpers.js')
const Twilio = require ('../../../lib/twilio.js')
const AlertSession = require('../../../lib/alertSession.js')

chai.use(sinonChai)

const dummyGetAlertSession = function() { return 'getAlertSession' }
const dummyGetAlertSessionByPhoneNumber = function() { return 'getAlertSessionByPhoneNumber' }

describe('braveAlerter.js unit tests: startAlertSession unit tests', function() {
    beforeEach(function() {
        // Don't actually log
        sinon.stub(helpers, 'log')
    })
    
    afterEach(function() {
        helpers.log.restore()
    })

    describe('if there is toPhoneNumber and fromPhoneNumber', function() {
        beforeEach(async function() {
            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioMessage').returns({})
            
            // Spy on the alertSessionChangedCallback call
            this.fakeAlertSessionChangedCallback = sinon.fake()
            
            const braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                this.fakeAlertSessionChangedCallback,
            )
            
            await braveAlerter.startAlertSession({
                alertSession: new AlertSession('guid-123'),
                toPhoneNumber: '+11231231234',
                fromPhoneNumber: '+11231231234',
                reminderMessage: 'My message',
            })
        })

        afterEach(function() {
            Twilio.sendTwilioMessage.restore()
        })

        it('should send alert', function() {
            expect(Twilio.sendTwilioMessage).to.be.calledOnce
        })
    })
    
    describe('if there is no toPhoneNumber', function() {
        beforeEach(async function() {
            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioMessage').returns({})
            
            // Spy on the alertSessionChangedCallback call
            this.fakeAlertSessionChangedCallback = sinon.fake()
            
            const braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                this.fakeAlertSessionChangedCallback,
            )
            
            await braveAlerter.startAlertSession({
                alertSession: new AlertSession('guid-123'),
                fromPhoneNumber: '+11231231234',
                reminderMessage: 'My message',
            })
        })

        afterEach(function() {
            Twilio.sendTwilioMessage.restore()
        })

        it('should not send alert', function() {
            expect(Twilio.sendTwilioMessage).not.to.be.called
        })

        it('should not call the callback', function() {
            expect(this.fakeAlertSessionChangedCallback).not.to.be.called
        })
    })

    describe('if there is no fromPhoneNumber', function() {
        beforeEach(async function() {
            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioMessage').returns({})
            
            // Spy on the alertSessionChangedCallback call
            this.fakeAlertSessionChangedCallback = sinon.fake()
            
            const braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                this.fakeAlertSessionChangedCallback,
            )
            
            await braveAlerter.startAlertSession({
                alertSession: new AlertSession('guid-123'),
                toPhoneNumber: '+11231231234',
                reminderMessage: 'My message',
            })
        })

        afterEach(function() {
            Twilio.sendTwilioMessage.restore()
        })
        
        it('should not send alert', function() {
            expect(Twilio.sendTwilioMessage).not.to.be.called
        })

        it('should not call the callback', function() {
            expect(this.fakeAlertSessionChangedCallback).not.to.be.called
        })
    })

    describe('if twilio fails to send the message', function() {
        beforeEach(async function() {
            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioMessage').returns()
            
            // Spy on the alertSessionChangedCallback call
            this.fakeAlertSessionChangedCallback = sinon.fake()
            
            const braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                this.fakeAlertSessionChangedCallback,
            )
            
            await braveAlerter.startAlertSession({
                sessionId: 'guid-123',
                toPhoneNumber: '+11231231234',
                fromPhoneNumber: '+11231231234',
                reminderMessage: 'My message',
            })
        })

        afterEach(function() {
            Twilio.sendTwilioMessage.restore()
        })

        it('should not call the callback', function() {
            expect(this.fakeAlertSessionChangedCallback).not.to.be.called
        })

        it('should log the error', function() {
            expect(helpers.log).to.be.calledWith('Failed to send alert for session guid-123')
        })
    })

    describe('if reminderTimeoutMillis is', function() {
        beforeEach(function() {
            this.clock = sinon.useFakeTimers()

            this.braveAlerter = new BraveAlerter()
            sinon.stub(this.braveAlerter, 'sendReminderMessageForSession')
        })

        afterEach(function() {
            this.braveAlerter.sendReminderMessageForSession.restore()

            this.clock.restore()
        })

        it('non-negative should send a reminder', async function() {
            await this.braveAlerter.startAlertSession({
                alertSession: new AlertSession('guid-123'),
                reminderTimeoutMillis: 1,
            })
            this.clock.tick(2)
    
            expect(this.braveAlerter.sendReminderMessageForSession).to.be.calledOnce
        })

        it('negative should not send a reminder', async function() {
            await this.braveAlerter.startAlertSession({
                alertSession: new AlertSession('guid-123'),
                reminderTimeoutMillis: -1,
            })
            this.clock.tick(2)
    
            expect(this.braveAlerter.sendReminderMessageForSession).not.to.be.called
        })

        it('not given should not send a reminder', async function() {
            await this.braveAlerter.startAlertSession({
                alertSession: new AlertSession('guid-123'),
            })
            this.clock.tick(2)
    
            expect(this.braveAlerter.sendReminderMessageForSession).not.to.be.called
        })
    })

    describe('if fallbackTimeoutMillis is', function() {
        beforeEach(function() {
            this.clock = sinon.useFakeTimers()

            this.braveAlerter = new BraveAlerter()
            sinon.stub(this.braveAlerter, 'sendFallbackMessageForSession')
        })

        afterEach(function() {
            this.braveAlerter.sendFallbackMessageForSession.restore()

            this.clock.restore()
        })

        it('non-negative should send a fallback alert', async function() {
            await this.braveAlerter.startAlertSession({
                alertSession: new AlertSession('guid-123'),
                fallbackTimeoutMillis: 1,
            })
            this.clock.tick(2)
    
            expect(this.braveAlerter.sendFallbackMessageForSession).to.be.calledOnce
        })

        it('negative should not send a fallback alert', async function() {
            await this.braveAlerter.startAlertSession({
                alertSession: new AlertSession('guid-123'),
                fallbackTimeoutMillis: -1,
            })
            this.clock.tick(2)
    
            expect(this.braveAlerter.sendFallbackMessageForSession).not.to.be.called
        })

        it('not given should not send a fallback alert', async function() {
            await this.braveAlerter.startAlertSession({
                alertSession: new AlertSession('guid-123'),
            })
            this.clock.tick(2)
    
            expect(this.braveAlerter.sendFallbackMessageForSession).not.to.be.called
        })
    })
})
