const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')

const helpers = require('./../../lib/helpers.js')
const twilio = require ('./../../lib/twilio.js')

describe('twilio.js integration tests:', function() {
    describe('sendTwilioMessage', function() {
        describe('given valid phone numbers', function() {
            const validToPhoneNumber = '+12345678900'
            const validFromPhoneNumber = '+15005550006'

            beforeEach(function() {
                // Do not actually log
                sinon.stub(helpers, 'log')
            })
        
            afterEach(function() {
                helpers.log.restore()
            })

            it('should return the message status', async function() {
                const response = await twilio.sendTwilioMessage(validToPhoneNumber, validFromPhoneNumber, 'test message')

                expect(response.status).not.to.be.undefined
            })

            it('should log the returned Twilio SID', async function() {
                const response = await twilio.sendTwilioMessage(validToPhoneNumber, validFromPhoneNumber, 'test message')

                expect(helpers.log.getCall(0).args[0]).to.equal(response.sid)
            })
        })

        describe('given an invalid toPhoneNumber', function() {
            const invalidToPhoneNumber = '+15005550009'
            const validFromPhoneNumber = '+15005550006'

            beforeEach(function() {
                // Do not actually log
                sinon.stub(helpers, 'log')
            })

            afterEach(function() {
                helpers.log.restore()
            })

            it('should return nothing', async function() {
                const response = await twilio.sendTwilioMessage(invalidToPhoneNumber, validFromPhoneNumber, 'test message')

                expect(response).to.be.undefined
            })

            it('should log an error', async function() {
                await twilio.sendTwilioMessage(invalidToPhoneNumber, validFromPhoneNumber, 'test message')

                expect(helpers.log.getCall(0).args[0]).matches(/^Error/)
            })
        })
    })
})