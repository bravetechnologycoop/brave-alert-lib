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
const dummyAlertSessionChangedCallback = function() { return 'alertSessionChangedCallback' }

const mockResponse = function() {
    // From https://codewithhugo.com/express-request-response-mocking/
    const res = {}
    res.writeHead = sinon.stub().returns(res)
    res.status = sinon.stub().returns(res)
    res.send = sinon.stub().returns(res)

    return res
}

describe('braveAlerter.js unit tests: handleTwilioRequest', function() {
    beforeEach(function() {
        // Don't actually log
        sinon.stub(helpers, 'log')
    })

    afterEach(function() {
        helpers.log.restore()
    })

    describe('given the required request parameters', function() {
        describe('and there is an open session for the phone', function() {
            describe('and the request is from the responder phone', function() {
                beforeEach(async function() {
                    const validRequest = {
                        body: {
                            From: '+11231231234',
                            To: '+11231231234',
                            Body: 'fake body',
                        }
                    }
    
                    this.fakeExpressResponse = mockResponse()
    
                    // Don't actually call braveAlerter methods
                    this.braveAlerter = new BraveAlerter(
                        dummyGetAlertSession,
                        dummyGetAlertSessionByPhoneNumber,
                        dummyAlertSessionChangedCallback,
                    )
                    sinon.stub(this.braveAlerter, 'getAlertSessionByPhoneNumber').returns(
                        new AlertSession(
                            'guid-123', 
                            ALERT_STATE.WAITING_FOR_DETAILS, 
                            '3', 
                            'my details', 
                            'my fallback message', 
                            '+11231231234', 
                            {'3': 'three'}
                        )
                    )
                    sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
                        nextAlertState: ALERT_STATE.COMPLETED,
                        incidentCategoryKey: '2',
                        details: 'new details',
                        returnMessage: 'return message',
                    })
                    sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

                    // Don't actually call Twilio
                    sinon.stub(Twilio, 'sendTwilioResponse')

                    await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
                })

                afterEach(function() {
                    this.braveAlerter.getAlertSessionByPhoneNumber.restore()
                    this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
                    this.braveAlerter.alertSessionChangedCallback.restore()
                    Twilio.sendTwilioResponse.restore()
                })

                it('should call the callback', function() {
                    expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(
                        'guid-123',
                        ALERT_STATE.COMPLETED,
                        '2',
                        'new details',
                    ))
                })

                it('should send the Twilio response', function() {
                    expect(Twilio.sendTwilioResponse).to.be.calledWith(this.fakeExpressResponse, 'return message')
                })
            })

            describe('and the request is not from the responder phone', function() {
                beforeEach(async function() {
                    const validRequest = {
                        body: {
                            From: 'not +11231231234',
                            To: '+11231231234',
                            Body: 'fake body',
                        }
                    }
    
                    this.fakeExpressResponse = mockResponse()
    
                    // Don't actually call braveAlerter methods
                    this.braveAlerter = new BraveAlerter(
                        dummyGetAlertSession,
                        dummyGetAlertSessionByPhoneNumber,
                        dummyAlertSessionChangedCallback,
                    )
                    sinon.stub(this.braveAlerter, 'getAlertSessionByPhoneNumber').returns(
                        new AlertSession(
                            'guid-123', 
                            ALERT_STATE.WAITING_FOR_DETAILS, 
                            '3', 
                            'my details', 
                            'my fallback message', 
                            '+11231231234', 
                            {'3': 'three'}
                        )
                    )
                    sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
                        nextAlertState: ALERT_STATE.COMPLETED,
                        incidentCategoryKey: '2',
                        details: 'new details',
                        returnMessage: 'return message',
                    })
                    sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

                    // Don't actually call Twilio
                    sinon.stub(Twilio, 'sendTwilioResponse')

                    await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
                })

                afterEach(function() {
                    this.braveAlerter.getAlertSessionByPhoneNumber.restore()
                    this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
                    this.braveAlerter.alertSessionChangedCallback.restore()
                    Twilio.sendTwilioResponse.restore()
                })

                it('should log the error', function() {
                    expect(helpers.log).to.be.calledWith('Invalid Phone Number')
                })

                it('should return 400', function () {
                    expect(this.fakeExpressResponse.status).to.be.calledWith(400)
                })
            })
        })

        describe('and there are no open sessions for the phone', function() {
            beforeEach(async function() {
                const validRequest = {
                    body: {
                        From: '+11231231234',
                        To: '+11231231234',
                        Body: 'fake body',
                    }
                }

                this.fakeExpressResponse = mockResponse()

                // Don't actually call braveAlerter methods
                this.braveAlerter = new BraveAlerter(
                    dummyGetAlertSession,
                    dummyGetAlertSessionByPhoneNumber,
                    dummyAlertSessionChangedCallback,
                )
                sinon.stub(this.braveAlerter, 'getAlertSessionByPhoneNumber').returns(null)
                sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
                    nextAlertState: ALERT_STATE.COMPLETED,
                    incidentCategoryKey: '2',
                    details: 'new details',
                    returnMessage: 'return message',
                })
                sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

                // Don't actually call Twilio
                sinon.stub(Twilio, 'sendTwilioResponse')

                await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
            })

            afterEach(function() {
                this.braveAlerter.getAlertSessionByPhoneNumber.restore()
                this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
                this.braveAlerter.alertSessionChangedCallback.restore()
                Twilio.sendTwilioResponse.restore()
            })

            it('should log the error', function() {
                expect(helpers.log).to.be.calledWith('Received twilio message with no corresponding open session: fake body')
            })

            it('should return 200', function () {
                expect(this.fakeExpressResponse.status).to.be.calledWith(200)
            })
        })
    })

    describe('if missing the Body request parameter', function() {
        beforeEach(async function() {
            const validRequest = {
                body: {
                    From: '+11231231234',
                    To: '+11231231234',
                }
            }

            this.fakeExpressResponse = mockResponse()

            // Don't actually call braveAlerter methods
            this.braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                dummyAlertSessionChangedCallback,
            )
            sinon.stub(this.braveAlerter, 'getAlertSessionByPhoneNumber').returns(
                new AlertSession(
                    'guid-123', 
                    ALERT_STATE.WAITING_FOR_DETAILS, 
                    '3', 
                    'my details', 
                    'my fallback message', 
                    '+11231231234', 
                    {'3': 'three'}
                )
            )
            sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
                nextAlertState: ALERT_STATE.COMPLETED,
                incidentCategoryKey: '2',
                details: 'new details',
                returnMessage: 'return message',
            })
            sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioResponse')

            await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
        })

        afterEach(function() {
            this.braveAlerter.getAlertSessionByPhoneNumber.restore()
            this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
            this.braveAlerter.alertSessionChangedCallback.restore()
            Twilio.sendTwilioResponse.restore()
        })

        it('should log the error', function() {
            expect(helpers.log).to.be.calledWith('Bad request: Body, From, or To fields are missing')
        })

        it('should return 400', function () {
            expect(this.fakeExpressResponse.status).to.be.calledWith(400)
        })
    })

    describe('if missing the From request parameter', function() {
        beforeEach(async function() {
            const validRequest = {
                body: {
                    To: '+11231231234',
                    Body: 'fake body',
                }
            }

            this.fakeExpressResponse = mockResponse()

            // Don't actually call braveAlerter methods
            this.braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                dummyAlertSessionChangedCallback,
            )
            sinon.stub(this.braveAlerter, 'getAlertSessionByPhoneNumber').returns(
                new AlertSession(
                    'guid-123', 
                    ALERT_STATE.WAITING_FOR_DETAILS, 
                    '3', 
                    'my details', 
                    'my fallback message', 
                    '+11231231234', 
                    {'3': 'three'}
                )
            )
            sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
                nextAlertState: ALERT_STATE.COMPLETED,
                incidentCategoryKey: '2',
                details: 'new details',
                returnMessage: 'return message',
            })
            sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioResponse')

            await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
        })

        afterEach(function() {
            this.braveAlerter.getAlertSessionByPhoneNumber.restore()
            this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
            this.braveAlerter.alertSessionChangedCallback.restore()
            Twilio.sendTwilioResponse.restore()
        })

        it('should log the error', function() {
            expect(helpers.log).to.be.calledWith('Bad request: Body, From, or To fields are missing')
        })

        it('should return 400', function () {
            expect(this.fakeExpressResponse.status).to.be.calledWith(400)
        })
    })

    describe('if missing the To request parameter', function() {
        beforeEach(async function() {
            const validRequest = {
                body: {
                    From: '+11231231234',
                    Body: 'fake body',
                }
            }

            this.fakeExpressResponse = mockResponse()

            // Don't actually call braveAlerter methods
            this.braveAlerter = new BraveAlerter(
                dummyGetAlertSession,
                dummyGetAlertSessionByPhoneNumber,
                dummyAlertSessionChangedCallback,
            )
            sinon.stub(this.braveAlerter, 'getAlertSessionByPhoneNumber').returns(
                new AlertSession(
                    'guid-123', 
                    ALERT_STATE.WAITING_FOR_DETAILS, 
                    '3', 
                    'my details', 
                    'my fallback message', 
                    '+11231231234', 
                    {'3': 'three'}
                )
            )
            sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
                nextAlertState: ALERT_STATE.COMPLETED,
                incidentCategoryKey: '2',
                details: 'new details',
                returnMessage: 'return message',
            })
            sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioResponse')

            await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
        })

        afterEach(function() {
            this.braveAlerter.getAlertSessionByPhoneNumber.restore()
            this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
            this.braveAlerter.alertSessionChangedCallback.restore()
            Twilio.sendTwilioResponse.restore()
        })

        it('should log the error', function() {
            expect(helpers.log).to.be.calledWith('Bad request: Body, From, or To fields are missing')
        })

        it('should return 400', function () {
            expect(this.fakeExpressResponse.status).to.be.calledWith(400)
        })
    })
})
