const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require("sinon-chai");

const ALERT_STATE = require('../../../lib/alertStateEnum.js')
const BraveAlerter = require('../../../lib/braveAlerter.js')
const helpers = require('../../../lib/helpers.js')
const Twilio = require ('../../../lib/twilio.js')
const AlertSession = require('../../../lib/alertSession.js')

chai.use(sinonChai)

const dummyGetAlertSession = function() { return 'getAlertSession' }
const dummyGetAlertSessionByPhoneNumber = function() { return 'getAlertSessionByPhoneNumber' }

describe('braveAlerter.js unit tests: sendFallbackMessageForSession', function() {
    beforeEach(function() {
        // Don't actually log
        sinon.stub(helpers, 'log')
    })

    afterEach(function() {
        helpers.log.restore()
    })

    describe('if AlertSession is waiting for a response', function() {
        beforeEach(async function() {
            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioMessage').returns({status: 'my status'})
            
            // Spy on the fakeAlertSessionChangedCallback call
            this.fakeAlertSessionChangedCallback = sinon.fake()
            
            this.braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                this.fakeAlertSessionChangedCallback,
            )

            sinon.stub(this.braveAlerter, 'getAlertSession').returns(new AlertSession(
                'guid-123',
                ALERT_STATE.WAITING_FOR_REPLY,           // Pretend the AlertSession is waiting for a response
            )),
            
            await this.braveAlerter.sendFallbackMessageForSession({
                sessionId: 'guid-123',
                fallbackToPhoneNumber: '+11231231234',
                fallbackFromPhoneNumber: '+11231231234',
                fallbackMessage: 'My message',
            })
        })

        afterEach(function() {
            this.braveAlerter.getAlertSession.restore()
            Twilio.sendTwilioMessage.restore()
        })
            
        it('should send the fallback message', function() { 
            expect(Twilio.sendTwilioMessage).to.be.calledOnce
        })

        it('should call the callback with the session ID and fallback response status', function() {
            const expectedAlertSession = new AlertSession('guid-123')
            expectedAlertSession.fallbackReturnMessage = 'my status'
            expect(this.fakeAlertSessionChangedCallback).to.be.calledWith(expectedAlertSession)
        })
    })

    describe('if there is no toFallbackPhoneNumber', function() {
        beforeEach(async function() {
            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioMessage').returns({status: 'my status'})
            
            // Spy on the fakeAlertSessionChangedCallback call
            this.fakeAlertSessionChangedCallback = sinon.fake()
            
            this.braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                this.fakeAlertSessionChangedCallback,
            )

            sinon.stub(this.braveAlerter, 'getAlertSession').returns(new AlertSession(
                'guid-123',
                ALERT_STATE.WAITING_FOR_REPLY,           // Pretend the AlertSession is waiting for a response
            )),
            
            await this.braveAlerter.sendFallbackMessageForSession({
                sessionId: 'guid-123',
                fallbackFromPhoneNumber: '+11231231234',
                fallbackMessage: 'My message',
            })
        })

        afterEach(function() {
            this.braveAlerter.getAlertSession.restore()
            Twilio.sendTwilioMessage.restore()
        })
            
        it('should not send the fallback message', function() { 
            expect(Twilio.sendTwilioMessage).not.to.be.called
        })

        it('should not call the callback', function() {
            expect(this.fakeAlertSessionChangedCallback).not.to.be.called
        })
    })

    describe('if there is no fromFallbackPhoneNumber', function() {
        beforeEach(async function() {
            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioMessage').returns({status: 'my status'})
            
            // Spy on the fakeAlertSessionChangedCallback call
            this.fakeAlertSessionChangedCallback = sinon.fake()
            
            this.braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                this.fakeAlertSessionChangedCallback,
            )

            sinon.stub(this.braveAlerter, 'getAlertSession').returns(new AlertSession(
                'guid-123',
                ALERT_STATE.WAITING_FOR_REPLY,           // Pretend the AlertSession is waiting for a response
            )),
            
            await this.braveAlerter.sendFallbackMessageForSession({
                sessionId: 'guid-123',
                fallbackToPhoneNumber: '+11231231234',
                fallbackMessage: 'My message',
            })
        })

        afterEach(function() {
            this.braveAlerter.getAlertSession.restore()
            Twilio.sendTwilioMessage.restore()
        })
            
        it('should not send the fallback message', function() { 
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
            
            // Spy on the fakeAlertSessionChangedCallback call
            this.fakeAlertSessionChangedCallback = sinon.fake()
            
            this.braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                this.fakeAlertSessionChangedCallback,
            )

            sinon.stub(this.braveAlerter, 'getAlertSession').returns(new AlertSession(
                'guid-123',
                ALERT_STATE.WAITING_FOR_REPLY,           // Pretend the AlertSession is waiting for a response
            )),
            
            await this.braveAlerter.sendFallbackMessageForSession({
                sessionId: 'guid-123',
                fallbackToPhoneNumber: '+11231231234',
                fallbackFromPhoneNumber: '+11231231234',
                fallbackMessage: 'My message',
            })
        })

        afterEach(function() {
            this.braveAlerter.getAlertSession.restore()
            Twilio.sendTwilioMessage.restore()
        })

        it('should not call the callback', function() {
            expect(this.fakeAlertSessionChangedCallback).not.to.be.called
        })

        it('should log the error', function() {
            expect(helpers.log).to.be.calledWith('Failed to send fallback for session guid-123')
        })
    })

    describe('if AlertSession is not waiting for a response', function() {
        beforeEach(async function() {
            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioMessage').returns({status: 'my status'})
            
            // Spy on the fakeAlertSessionChangedCallback call
            this.fakeAlertSessionChangedCallback = sinon.fake()
            
            this.braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                this.fakeAlertSessionChangedCallback,
            )

            sinon.stub(this.braveAlerter, 'getAlertSession').returns(new AlertSession(
                'guid-123',
                'not ALERT_STATE.WAITING_FOR_REPLY',
            )),
            
            await this.braveAlerter.sendFallbackMessageForSession({
                sessionId: 'guid-123',
                fallbackToPhoneNumber: '+11231231234',
                fallbackFromPhoneNumber: '+11231231234',
                fallbackMessage: 'My message',
            })
        })

        afterEach(function() {
            this.braveAlerter.getAlertSession.restore()
            Twilio.sendTwilioMessage.restore()
        })
            
        it('should not send the fallback message', function() { 
            expect(Twilio.sendTwilioMessage).not.to.be.called
        })

        it('should not call the callback', function() {
            expect(this.fakeAlertSessionChangedCallback).not.to.be.called
        })
    })
})