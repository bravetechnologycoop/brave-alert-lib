const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const helpers = require('../../../lib/helpers')
const twilioHelpers = require('../../../lib/twilioHelpers')
const testingHelpers = require('../../testingHelpers')

chai.use(sinonChai)

describe('braveAlerter.js unit tests: sendSingleAlert', () => {
  beforeEach(() => {
    // Don't actually log
    sinon.stub(helpers, 'logError')
  })

  afterEach(() => {
    helpers.logError.restore()
  })

  describe('if it successfully sends the alert', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(twilioHelpers, 'sendTwilioMessage')

      const braveAlerter = testingHelpers.braveAlerterFactory()

      await braveAlerter.sendSingleAlert('+11231231234', '+11231231234', 'My message')
    })

    afterEach(() => {
      twilioHelpers.sendTwilioMessage.restore()
    })

    it('should send alert', () => {
      expect(twilioHelpers.sendTwilioMessage).to.be.calledOnce
    })
  })

  describe('if it fails to send the alert', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(twilioHelpers, 'sendTwilioMessage').returns()

      const braveAlerter = testingHelpers.braveAlerterFactory()

      this.toNumber = '+11231231234'
      this.fromNumber = '+18885552222'
      this.message = 'My message'
      await braveAlerter.sendSingleAlert(this.toNumber, this.fromNumber, this.message)
    })

    afterEach(() => {
      twilioHelpers.sendTwilioMessage.restore()
    })

    it('should log the response error', () => {
      expect(helpers.logError).to.be.calledWith(`Failed to send single alert to ${this.toNumber} from ${this.fromNumber}: ${this.message}`)
    })
  })
})
