// Third-party dependencies
const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

// In-house dependencies
const helpers = require('../../lib/helpers')
const OneSignal = require('../../lib/oneSignal')

chai.use(sinonChai)

const sandbox = sinon.createSandbox()

describe('oneSignal.js integration tests:', () => {
  beforeEach(() => {
    sandbox.spy(helpers, 'log')
    sandbox.spy(helpers, 'logError')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('sendOneSignalMessage', () => {
    describe('given valid push ID', () => {
      beforeEach(async () => {
        this.validPushId = helpers.getEnvVar('TEST_ONESIGNAL_PUSH_ID')
        this.messageName = 'my name'
        this.message = 'my message'

        this.response = await OneSignal.sendOneSignalMessage(this.validPushId, this.messageName, this.message)
      })

      it('should return the message status', () => {
        expect(this.response).not.to.be.undefined
      })

      it('should not return any errors', () => {
        expect(this.response.errors).to.be.undefined
      })

      it('should log the returned OneSignal message ID', () => {
        expect(helpers.log).to.be.calledOnceWithExactly(`Sent by OneSignal: ${this.response.data.id}`)
      })
    })

    describe('given correctly-formatted, but nonexistent push ID', () => {
      beforeEach(async () => {
        this.invalidPushId = 'baf912eb-f856-4bda-8e1f-69610d6dcde7'
        this.messageName = 'my name'
        this.message = 'my message'

        this.response = await OneSignal.sendOneSignalMessage(this.invalidPushId, this.messageName, this.message)
      })

      it('should return the message status', () => {
        expect(this.response).not.to.be.undefined
      })

      it('should return errors', () => {
        expect(this.response.data.errors).not.to.be.undefined
      })

      it('should not log the returned OneSignal message ID', () => {
        expect(helpers.log).not.to.be.called
      })
    })

    describe('given incorrectly-formatted push ID', () => {
      beforeEach(async () => {
        this.invalidPushId = 'bad push id'
        this.messageName = 'my name'
        this.message = 'my message'

        this.response = await OneSignal.sendOneSignalMessage(this.invalidPushId, this.messageName, this.message)
      })

      it('should return nothing', () => {
        expect(this.response).to.be.undefined
      })

      it('should log the error', () => {
        expect(helpers.logError).to.be.calledOnceWithExactly(
          'Error sending push notification to bad push id: Error: Request failed with status code 400',
        )
      })

      it('should not log the returned OneSignal message ID', () => {
        expect(helpers.log).not.to.be.called
      })
    })
  })
})
