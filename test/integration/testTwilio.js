const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')

const helpers = require('../../lib/helpers')
const twilio = require('../../lib/twilio')

describe('twilio.js integration tests:', () => {
  describe('sendTwilioMessage', () => {
    describe('given valid phone numbers', () => {
      const validToPhoneNumber = '+12345678900'
      const validFromPhoneNumber = '+15005550006'

      beforeEach(() => {
        // Do not actually log
        sinon.stub(helpers, 'log')
      })

      afterEach(() => {
        helpers.log.restore()
      })

      it('should return the message status', async () => {
        const response = await twilio.sendTwilioMessage(validToPhoneNumber, validFromPhoneNumber, 'test message')

        expect(response.status).not.to.be.undefined
      })

      it('should log the returned Twilio SID', async () => {
        const response = await twilio.sendTwilioMessage(validToPhoneNumber, validFromPhoneNumber, 'test message')

        expect(helpers.log.getCall(0).args[0]).to.equal(response.sid)
      })
    })

    describe('given an invalid toPhoneNumber', () => {
      const invalidToPhoneNumber = '+15005550009'
      const validFromPhoneNumber = '+15005550006'

      beforeEach(() => {
        // Do not actually log
        sinon.stub(helpers, 'log')
      })

      afterEach(() => {
        helpers.log.restore()
      })

      it('should return nothing', async () => {
        const response = await twilio.sendTwilioMessage(invalidToPhoneNumber, validFromPhoneNumber, 'test message')

        expect(response).to.be.undefined
      })

      it('should log an error', async () => {
        await twilio.sendTwilioMessage(invalidToPhoneNumber, validFromPhoneNumber, 'test message')

        expect(helpers.log.getCall(0).args[0]).matches(/^Error/)
      })
    })
  })
})
