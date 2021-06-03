const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const BraveAlerter = require('../../../lib/braveAlerter')
const helpers = require('../../../lib/helpers')
const Twilio = require('../../../lib/twilio')

chai.use(sinonChai)

describe('braveAlerter.js unit tests: sendSingleAlert', () => {
  beforeEach(() => {
    // Don't actually log
    sinon.stub(helpers, 'logError')
  })

  afterEach(() => {
    helpers.logError.restore()
  })

  describe('if successfully sends the alert', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage')

      const braveAlerter = new BraveAlerter()

      await braveAlerter.sendSingleAlert('+11231231234', '+11231231234', 'My message')
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should send alert', () => {
      expect(Twilio.sendTwilioMessage).to.be.calledOnce
    })
  })

  describe('if fails to send the alert', () => {
    beforeEach(async () => {
      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioMessage').returns()

      const braveAlerter = new BraveAlerter()

      this.toNumber = '+11231231234'
      this.fromNumber = '+18885552222'
      this.message = 'My message'
      await braveAlerter.sendSingleAlert(this.toNumber, this.fromNumber, this.message)
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should log the response error', () => {
      expect(helpers.logError).to.be.calledWith(`Failed to send single alert to ${this.toNumber} from ${this.fromNumber}: ${this.message}`)
    })
  })
})
