const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const CHATBOT_STATE = require('../../../lib/chatbotStateEnum')
const helpers = require('../../../lib/helpers')
const Twilio = require('../../../lib/twilio')
const AlertSession = require('../../../lib/alertSession')
const testingHelpers = require('../../testingHelpers')

chai.use(sinonChai)

const sandbox = sinon.createSandbox()

describe('braveAlerter.js unit tests: handleTwilioRequest', () => {
  beforeEach(() => {
    // Don't actually log
    sandbox.stub(helpers, 'log')
    sandbox.stub(helpers, 'logError')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('given the required request parameters', () => {
    describe('and there is an open session for the phone', () => {
      describe('and the request is from the responder phone', () => {
        beforeEach(async () => {
          const validRequest = {
            path: '/alert/sms',
            body: {
              From: '+11231231234',
              To: '+11231231234',
              Body: 'fake body',
            },
          }

          this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

          // Don't actually call braveAlerter methods
          this.braveAlerter = testingHelpers.braveAlerterFactory({
            alertSessionChangedCallback: sandbox.stub(),
            getAlertSessionByPhoneNumber: sinon
              .stub()
              .returns(
                new AlertSession(
                  'guid-123',
                  CHATBOT_STATE.WAITING_FOR_DETAILS,
                  '3',
                  'my details',
                  'my fallback message',
                  '+11231231234',
                  ['3'],
                  ['three'],
                ),
              ),
          })
          sandbox.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
            nextAlertState: CHATBOT_STATE.COMPLETED,
            incidentCategoryKey: '2',
            details: 'new details',
            returnMessage: 'return message',
          })

          // Don't actually call Twilio
          sandbox.stub(Twilio, 'sendTwilioResponse')
          sandbox.stub(Twilio, 'isValidTwilioRequest').returns(true)

          await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
        })

        it('should call the callback', () => {
          expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(
            new AlertSession('guid-123', CHATBOT_STATE.COMPLETED, '2', 'new details'),
          )
        })

        it('should send the Twilio response', () => {
          expect(Twilio.sendTwilioResponse).to.be.calledWith(this.fakeExpressResponse, 'return message')
        })
      })

      describe('and the request is not from the responder phone', () => {
        beforeEach(async () => {
          this.invalidFromNumber = 'not +11231231234'
          this.guid = 'guid-123'

          const invalidRequest = {
            path: '/alert/sms',
            body: {
              From: this.invalidFromNumber,
              To: '+11231231234',
              Body: 'fake body',
            },
          }

          this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

          // Don't actually call braveAlerter methods
          this.braveAlerter = testingHelpers.braveAlerterFactory({
            alertSessionChangedCallback: sandbox.stub(),
            getAlertSessionByPhoneNumber: sinon
              .stub()
              .returns(
                new AlertSession(
                  this.guid,
                  CHATBOT_STATE.WAITING_FOR_DETAILS,
                  '3',
                  'my details',
                  'my fallback message',
                  '+11231231234',
                  ['3'],
                  ['three'],
                ),
              ),
          })
          sandbox.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
            nextAlertState: CHATBOT_STATE.COMPLETED,
            incidentCategoryKey: '2',
            details: 'new details',
            returnMessage: 'return message',
          })

          // Don't actually call Twilio
          sandbox.stub(Twilio, 'sendTwilioResponse')
          sandbox.stub(Twilio, 'isValidTwilioRequest').returns(true)

          await this.braveAlerter.handleTwilioRequest(invalidRequest, this.fakeExpressResponse)
        })

        it('should log the error', () => {
          expect(helpers.logError).to.be.calledWith(
            `Bad request to /alert/sms: ${this.invalidFromNumber} is not the responder phone for ${this.guid}`,
          )
        })

        it('should return 400', () => {
          expect(this.fakeExpressResponse.status).to.be.calledWith(400)
        })
      })
    })

    describe('and there are no open sessions for the phone', () => {
      beforeEach(async () => {
        this.fromNumber = '+11231231234'
        this.toNumber = '+19995554444'
        this.body = 'fake body'

        const validRequest = {
          path: '/alert/sms',
          body: {
            From: this.fromNumber,
            To: this.toNumber,
            Body: this.body,
          },
        }

        this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

        // Don't actually call braveAlerter methods
        this.braveAlerter = testingHelpers.braveAlerterFactory({
          getAlertSessionByPhoneNumber: sandbox.stub().returns(null),
          alertSessionChangedCallback: sandbox.stub(),
        })
        sandbox.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
          nextAlertState: CHATBOT_STATE.COMPLETED,
          incidentCategoryKey: '2',
          details: 'new details',
          returnMessage: 'return message',
        })

        // Don't actually call Twilio
        sandbox.stub(Twilio, 'sendTwilioResponse')
        sandbox.stub(Twilio, 'isValidTwilioRequest').returns(true)

        await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
      })

      it('should log the error', () => {
        expect(helpers.log).to.be.calledWith(
          `Received twilio message from ${this.fromNumber} to ${this.toNumber} with no corresponding open session: ${this.body}`,
        )
      })

      it('should return 200', () => {
        expect(this.fakeExpressResponse.status).to.be.calledWith(200)
      })
    })
  })

  describe('if missing the Body request parameter', () => {
    beforeEach(async () => {
      const inValidRequest = {
        path: '/alert/sms',
        body: {
          From: '+11231231234',
          To: '+11231231234',
        },
      }

      this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

      // Don't actually call braveAlerter methods
      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.stub(),
        getAlertSessionByPhoneNumber: sinon
          .stub()
          .returns(
            new AlertSession(
              'guid-123',
              CHATBOT_STATE.WAITING_FOR_DETAILS,
              '3',
              'my details',
              'my fallback message',
              '+11231231234',
              ['3'],
              ['three'],
            ),
          ),
      })
      sandbox.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
        nextAlertState: CHATBOT_STATE.COMPLETED,
        incidentCategoryKey: '2',
        details: 'new details',
        returnMessage: 'return message',
      })

      // Don't actually call Twilio
      sandbox.stub(Twilio, 'sendTwilioResponse')

      await this.braveAlerter.handleTwilioRequest(inValidRequest, this.fakeExpressResponse)
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/sms: Body, From, or To fields are missing')
    })

    it('should return 400', () => {
      expect(this.fakeExpressResponse.status).to.be.calledWith(400)
    })
  })

  describe('if missing the From request parameter', () => {
    beforeEach(async () => {
      const inValidRequest = {
        path: '/alert/sms',
        body: {
          To: '+11231231234',
          Body: 'fake body',
        },
      }

      this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

      // Don't actually call braveAlerter methods
      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.stub(),
        getAlertSessionByPhoneNumber: sinon
          .stub()
          .returns(
            new AlertSession(
              'guid-123',
              CHATBOT_STATE.WAITING_FOR_DETAILS,
              '3',
              'my details',
              'my fallback message',
              '+11231231234',
              ['3'],
              ['three'],
            ),
          ),
      })
      sandbox.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
        nextAlertState: CHATBOT_STATE.COMPLETED,
        incidentCategoryKey: '2',
        details: 'new details',
        returnMessage: 'return message',
      })

      // Don't actually call Twilio
      sandbox.stub(Twilio, 'sendTwilioResponse')

      await this.braveAlerter.handleTwilioRequest(inValidRequest, this.fakeExpressResponse)
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/sms: Body, From, or To fields are missing')
    })

    it('should return 400', () => {
      expect(this.fakeExpressResponse.status).to.be.calledWith(400)
    })
  })

  describe('if missing the To request parameter', () => {
    beforeEach(async () => {
      const inValidRequest = {
        path: '/alert/sms',
        body: {
          From: '+11231231234',
          Body: 'fake body',
        },
      }

      this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

      // Don't actually call braveAlerter methods
      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.stub(),
        getAlertSessionByPhoneNumber: sinon
          .stub()
          .returns(
            new AlertSession(
              'guid-123',
              CHATBOT_STATE.WAITING_FOR_DETAILS,
              '3',
              'my details',
              'my fallback message',
              '+11231231234',
              ['3'],
              ['three'],
            ),
          ),
      })
      sandbox.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
        nextAlertState: CHATBOT_STATE.COMPLETED,
        incidentCategoryKey: '2',
        details: 'new details',
        returnMessage: 'return message',
      })

      // Don't actually call Twilio
      sandbox.stub(Twilio, 'sendTwilioResponse')

      await this.braveAlerter.handleTwilioRequest(inValidRequest, this.fakeExpressResponse)
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/sms: Body, From, or To fields are missing')
    })

    it('should return 400', () => {
      expect(this.fakeExpressResponse.status).to.be.calledWith(400)
    })
  })

  describe('if request does not come from Twilio', () => {
    beforeEach(async () => {
      this.fromNumber = '+11231231234'

      const validRequest = {
        path: '/alert/sms',
        body: {
          From: this.fromNumber,
          To: '+19995551111',
          Body: 'fake body',
        },
      }

      this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

      // Don't actually call braveAlerter methods
      this.braveAlerter = testingHelpers.braveAlerterFactory({
        alertSessionChangedCallback: sandbox.stub(),
        getAlertSessionByPhoneNumber: sinon
          .stub()
          .returns(
            new AlertSession(
              'guid-123',
              CHATBOT_STATE.WAITING_FOR_DETAILS,
              '3',
              'my details',
              'my fallback message',
              '+11231231234',
              ['3'],
              ['three'],
            ),
          ),
      })
      sandbox.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
        nextAlertState: CHATBOT_STATE.COMPLETED,
        incidentCategoryKey: '2',
        details: 'new details',
        returnMessage: 'return message',
      })

      // Don't actually call Twilio
      sandbox.stub(Twilio, 'sendTwilioResponse')
      sandbox.stub(Twilio, 'isValidTwilioRequest').returns(false)

      await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith(`Bad request to /alert/sms: Sender ${this.fromNumber} is not Twilio`)
    })

    it('should return 401', () => {
      expect(this.fakeExpressResponse.status).to.be.calledWith(401)
    })
  })
})
