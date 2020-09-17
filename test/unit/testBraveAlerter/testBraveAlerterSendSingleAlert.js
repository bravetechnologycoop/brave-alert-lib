const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require("sinon-chai");

const BraveAlerter = require('../../../lib/braveAlerter.js')
const helpers = require('../../../lib/helpers.js')
const Twilio = require ('../../../lib/twilio.js')

chai.use(sinonChai)

describe('braveAlerter.js unit tests: sendSingleAlert', function() {
    beforeEach(function() {
        // Don't actually log
        sinon.stub(helpers, 'log')
    })

    afterEach(function() {
        helpers.log.restore()
    })

    describe('if successfully sends the alert', function() {
        beforeEach(async function() {
            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioMessage').returns({
                sid: 'my sid'
            })

            const braveAlerter = new BraveAlerter()

            await braveAlerter.sendSingleAlert('+11231231234', '+11231231234', 'My message')
        })

        afterEach(function() {
            Twilio.sendTwilioMessage.restore()
        })

        it('should send alert', function() {
            expect(Twilio.sendTwilioMessage).to.be.calledOnce
        })

        it('should log the response sid', function() {
            expect(helpers.log).to.be.calledWith('my sid')
        })
    })

    describe('if fails to send the alert', function() {
        beforeEach(async function() {
            // Don't actually call Twilio
            sinon.stub(Twilio, 'sendTwilioMessage').returns()

            const braveAlerter = new BraveAlerter()

            await braveAlerter.sendSingleAlert('+11231231234', '+11231231234', 'My message')
        })

        afterEach(function() {
            Twilio.sendTwilioMessage.restore()
        })

        it('should log the response sid', function() {
            expect(helpers.log).to.be.calledWith('Failed to send single alert: My message')
        })
    })
})
