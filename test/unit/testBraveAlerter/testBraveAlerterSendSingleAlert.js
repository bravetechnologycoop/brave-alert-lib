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
    sinon.stub(helpers, 'log')
  })

  afterEach(() => {
    helpers.log.restore()
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

      await braveAlerter.sendSingleAlert('+11231231234', '+11231231234', 'My message')
    })

    afterEach(() => {
      Twilio.sendTwilioMessage.restore()
    })

    it('should log the response error', () => {
      expect(helpers.log).to.be.calledWith('Failed to send single alert: My message')
    })
  })
})
