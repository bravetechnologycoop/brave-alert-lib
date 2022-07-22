// Third-party dependencies
const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

// In-house dependencies
const helpers = require('../../lib/helpers')
const twilioHelpers = require('../../lib/twilioHelpers')

chai.use(sinonChai)

const sandbox = sinon.createSandbox()

describe('twilioHelpers.js integration tests:', () => {
  beforeEach(() => {
    sandbox.spy(helpers, 'log')
    sandbox.spy(helpers, 'logError')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('sendTwilioMessage', () => {
    describe('given valid phone numbers', () => {
      const validToPhoneNumber = '+12345678900'
      const validFromPhoneNumber = '+15005550006'

      it('should return the message status', async () => {
        const response = await twilioHelpers.sendTwilioMessage(validToPhoneNumber, validFromPhoneNumber, 'test message')

        expect(response.status).not.to.be.undefined
      })

      it('should log the returned Twilio SID', async () => {
        const response = await twilioHelpers.sendTwilioMessage(validToPhoneNumber, validFromPhoneNumber, 'test message')

        expect(helpers.log.getCall(0).args[0]).to.equal(`Sent by Twilio: ${response.sid}`)
      })
    })

    describe('given invalid toPhoneNumbers', () => {
      const invalidToPhoneNumbers = ['+15005550009']
      const validFromPhoneNumber = '+15005550006'

      it('should return nothing', async () => {
        const response = await twilioHelpers.sendTwilioMessage(invalidToPhoneNumbers, validFromPhoneNumber, 'test message')

        expect(response).to.be.undefined
      })

      it('should log an error', async () => {
        await twilioHelpers.sendTwilioMessage(invalidToPhoneNumbers, validFromPhoneNumber, 'test message')

        expect(helpers.logError.getCall(0).args[0]).matches(/^Error/)
      })
    })
  })

  describe('buyAndConfigureTwilioPhoneNumber', () => {
    describe('given an invalid area code', () => {
      beforeEach(async () => {
        this.response = await twilioHelpers.buyAndConfigureTwilioPhoneNumber('invalidAreaCode', 'friendlyName')
      })

      it('should return an error object', async () => {
        expect(this.response).to.eql({ message: 'Error: No phone numbers found' })
      })

      it('should log the error', async () => {
        expect(helpers.log).to.be.called
      })
    })
  })
})
