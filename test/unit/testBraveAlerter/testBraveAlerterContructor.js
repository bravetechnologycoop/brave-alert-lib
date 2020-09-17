const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')

const BraveAlerter = require('../../../lib/braveAlerter.js')
const helpers = require('../../../lib/helpers.js')

const dummyGetAlertSession = function() { return 'getAlertSession' }
const dummyGetAlertSessionByPhoneNumber = function() { return 'getAlertSessionByPhoneNumber' }
const dummyAlertSessionChangedCallback = function() { return 'alertSessionChangedCallback' }
const dummyGetReturnMessage = function() { return 'getReturnMessage' }

describe('braveAlerter.js unit tests: constructor', function () {
    beforeEach(function() {
        // Don't actually log
        sinon.stub(helpers, 'log')

        this.braveAlerter = new BraveAlerter(
            dummyGetAlertSession,
            dummyGetAlertSessionByPhoneNumber,
            dummyAlertSessionChangedCallback,
            true,
            dummyGetReturnMessage,
        )
    })

    afterEach(function() {
        helpers.log.restore()
    })

    it('should be able to call the functions set by in the constructor', function () {
        const result = 
            this.braveAlerter.getAlertSession() + ' ' +
            this.braveAlerter.getAlertSessionByPhoneNumber() + ' ' +
            this.braveAlerter.alertSessionChangedCallback()

        expect(result).to.equal('getAlertSession getAlertSessionByPhoneNumber alertSessionChangedCallback')
    })

    it('should initialize the router', function() {
        expect(this.braveAlerter.router).to.not.be.undefined
    })

    it('should initialize the state machine with whether to ask for incident details', function() {
        expect(this.braveAlerter.alertStateMachine.asksIncidentDetails).to.be.true
    })

    it('should initialize the state machine with the function to get the return messages', function() {
        expect(this.braveAlerter.alertStateMachine.getReturnMessage()).to.equal('getReturnMessage')
    })
})