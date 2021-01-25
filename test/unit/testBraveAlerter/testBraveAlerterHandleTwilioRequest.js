const chai = require('chai')
const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const ALERT_STATE = require('../../../lib/alertStateEnum')
const BraveAlerter = require('../../../lib/braveAlerter')
const helpers = require('../../../lib/helpers')
const Twilio = require('../../../lib/twilio')
const AlertSession = require('../../../lib/alertSession')

chai.use(sinonChai)

function dummyGetAlertSession() {
  return 'getAlertSession'
}

function dummyGetAlertSessionByPhoneNumber() {
  return 'getAlertSessionByPhoneNumber'
}

function dummyAlertSessionChangedCallback() {
  return 'alertSessionChangedCallback'
}

function mockResponse() {
  // From https://codewithhugo.com/express-request-response-mocking/
  const res = {}
  res.writeHead = sinon.stub().returns(res)
  res.status = sinon.stub().returns(res)
  res.send = sinon.stub().returns(res)

  return res
}

describe('braveAlerter.js unit tests: handleTwilioRequest', () => {
  beforeEach(() => {
    // Don't actually log
    sinon.stub(helpers, 'log')
  })

  afterEach(() => {
    helpers.log.restore()
  })

  describe('given the required request parameters', () => {
    describe('and there is an open session for the phone', () => {
      describe('and the request is from the responder phone', () => {
        beforeEach(async () => {
          const validRequest = {
            body: {
              From: '+11231231234',
              To: '+11231231234',
              Body: 'fake body',
            },
          }

          this.fakeExpressResponse = mockResponse()

          // Don't actually call braveAlerter methods
          this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, dummyAlertSessionChangedCallback)
          sinon
            .stub(this.braveAlerter, 'getAlertSessionByPhoneNumber')
            .returns(
              new AlertSession(
                'guid-123',
                ALERT_STATE.WAITING_FOR_DETAILS,
                '3',
                'my details',
                'my fallback message',
                '+11231231234',
                ['3'],
                ['three'],
              ),
            )
          sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
            nextAlertState: ALERT_STATE.COMPLETED,
            incidentCategoryKey: '2',
            details: 'new details',
            returnMessage: 'return message',
          })
          sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

          // Don't actually call Twilio
          sinon.stub(Twilio, 'sendTwilioResponse')
          sinon.stub(Twilio, 'isValidTwilioRequest').returns(true)

          await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
        })

        afterEach(() => {
          this.braveAlerter.getAlertSessionByPhoneNumber.restore()
          this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
          this.braveAlerter.alertSessionChangedCallback.restore()

          Twilio.sendTwilioResponse.restore()
          Twilio.isValidTwilioRequest.restore()
        })

        it('should call the callback', () => {
          expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(
            new AlertSession('guid-123', ALERT_STATE.COMPLETED, '2', 'new details'),
          )
        })

        it('should send the Twilio response', () => {
          expect(Twilio.sendTwilioResponse).to.be.calledWith(this.fakeExpressResponse, 'return message')
        })
      })

      describe('and the request is not from the responder phone', () => {
        beforeEach(async () => {
          const validRequest = {
            body: {
              From: 'not +11231231234',
              To: '+11231231234',
              Body: 'fake body',
            },
          }

          this.fakeExpressResponse = mockResponse()

          // Don't actually call braveAlerter methods
          this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, dummyAlertSessionChangedCallback)
          sinon
            .stub(this.braveAlerter, 'getAlertSessionByPhoneNumber')
            .returns(
              new AlertSession(
                'guid-123',
                ALERT_STATE.WAITING_FOR_DETAILS,
                '3',
                'my details',
                'my fallback message',
                '+11231231234',
                ['3'],
                ['three'],
              ),
            )
          sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
            nextAlertState: ALERT_STATE.COMPLETED,
            incidentCategoryKey: '2',
            details: 'new details',
            returnMessage: 'return message',
          })
          sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

          // Don't actually call Twilio
          sinon.stub(Twilio, 'sendTwilioResponse')
          sinon.stub(Twilio, 'isValidTwilioRequest').returns(true)

          await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
        })

        afterEach(() => {
          this.braveAlerter.getAlertSessionByPhoneNumber.restore()
          this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
          this.braveAlerter.alertSessionChangedCallback.restore()

          Twilio.sendTwilioResponse.restore()
          Twilio.isValidTwilioRequest.restore()
        })

        it('should log the error', () => {
          expect(helpers.log).to.be.calledWith('Invalid Phone Number')
        })

        it('should return 400', () => {
          expect(this.fakeExpressResponse.status).to.be.calledWith(400)
        })
      })
    })

    describe('and there are no open sessions for the phone', () => {
      beforeEach(async () => {
        const validRequest = {
          body: {
            From: '+11231231234',
            To: '+11231231234',
            Body: 'fake body',
          },
        }

        this.fakeExpressResponse = mockResponse()

        // Don't actually call braveAlerter methods
        this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, dummyAlertSessionChangedCallback)
        sinon.stub(this.braveAlerter, 'getAlertSessionByPhoneNumber').returns(null)
        sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
          nextAlertState: ALERT_STATE.COMPLETED,
          incidentCategoryKey: '2',
          details: 'new details',
          returnMessage: 'return message',
        })
        sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

        // Don't actually call Twilio
        sinon.stub(Twilio, 'sendTwilioResponse')
        sinon.stub(Twilio, 'isValidTwilioRequest').returns(true)

        await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
      })

      afterEach(() => {
        this.braveAlerter.getAlertSessionByPhoneNumber.restore()
        this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
        this.braveAlerter.alertSessionChangedCallback.restore()

        Twilio.sendTwilioResponse.restore()
        Twilio.isValidTwilioRequest.restore()
      })

      it('should log the error', () => {
        expect(helpers.log).to.be.calledWith('Received twilio message with no corresponding open session: fake body')
      })

      it('should return 200', () => {
        expect(this.fakeExpressResponse.status).to.be.calledWith(200)
      })
    })
  })

  describe('if missing the Body request parameter', () => {
    beforeEach(async () => {
      const validRequest = {
        body: {
          From: '+11231231234',
          To: '+11231231234',
        },
      }

      this.fakeExpressResponse = mockResponse()

      // Don't actually call braveAlerter methods
      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, dummyAlertSessionChangedCallback)
      sinon
        .stub(this.braveAlerter, 'getAlertSessionByPhoneNumber')
        .returns(
          new AlertSession('guid-123', ALERT_STATE.WAITING_FOR_DETAILS, '3', 'my details', 'my fallback message', '+11231231234', ['3'], ['three']),
        )
      sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
        nextAlertState: ALERT_STATE.COMPLETED,
        incidentCategoryKey: '2',
        details: 'new details',
        returnMessage: 'return message',
      })
      sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioResponse')

      await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
    })

    afterEach(() => {
      this.braveAlerter.getAlertSessionByPhoneNumber.restore()
      this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
      this.braveAlerter.alertSessionChangedCallback.restore()
      Twilio.sendTwilioResponse.restore()
    })

    it('should log the error', () => {
      expect(helpers.log).to.be.calledWith('Bad request: Body, From, or To fields are missing')
    })

    it('should return 400', () => {
      expect(this.fakeExpressResponse.status).to.be.calledWith(400)
    })
  })

  describe('if missing the From request parameter', () => {
    beforeEach(async () => {
      const validRequest = {
        body: {
          To: '+11231231234',
          Body: 'fake body',
        },
      }

      this.fakeExpressResponse = mockResponse()

      // Don't actually call braveAlerter methods
      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, dummyAlertSessionChangedCallback)
      sinon
        .stub(this.braveAlerter, 'getAlertSessionByPhoneNumber')
        .returns(
          new AlertSession('guid-123', ALERT_STATE.WAITING_FOR_DETAILS, '3', 'my details', 'my fallback message', '+11231231234', ['3'], ['three']),
        )
      sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
        nextAlertState: ALERT_STATE.COMPLETED,
        incidentCategoryKey: '2',
        details: 'new details',
        returnMessage: 'return message',
      })
      sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioResponse')

      await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
    })

    afterEach(() => {
      this.braveAlerter.getAlertSessionByPhoneNumber.restore()
      this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
      this.braveAlerter.alertSessionChangedCallback.restore()
      Twilio.sendTwilioResponse.restore()
    })

    it('should log the error', () => {
      expect(helpers.log).to.be.calledWith('Bad request: Body, From, or To fields are missing')
    })

    it('should return 400', () => {
      expect(this.fakeExpressResponse.status).to.be.calledWith(400)
    })
  })

  describe('if missing the To request parameter', () => {
    beforeEach(async () => {
      const validRequest = {
        body: {
          From: '+11231231234',
          Body: 'fake body',
        },
      }

      this.fakeExpressResponse = mockResponse()

      // Don't actually call braveAlerter methods
      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, dummyAlertSessionChangedCallback)
      sinon
        .stub(this.braveAlerter, 'getAlertSessionByPhoneNumber')
        .returns(
          new AlertSession('guid-123', ALERT_STATE.WAITING_FOR_DETAILS, '3', 'my details', 'my fallback message', '+11231231234', ['3'], ['three']),
        )
      sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
        nextAlertState: ALERT_STATE.COMPLETED,
        incidentCategoryKey: '2',
        details: 'new details',
        returnMessage: 'return message',
      })
      sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioResponse')

      await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
    })

    afterEach(() => {
      this.braveAlerter.getAlertSessionByPhoneNumber.restore()
      this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
      this.braveAlerter.alertSessionChangedCallback.restore()
      Twilio.sendTwilioResponse.restore()
    })

    it('should log the error', () => {
      expect(helpers.log).to.be.calledWith('Bad request: Body, From, or To fields are missing')
    })

    it('should return 400', () => {
      expect(this.fakeExpressResponse.status).to.be.calledWith(400)
    })
  })

  describe('if request does not come from Twilio', () => {
    beforeEach(async () => {
      const validRequest = {
        body: {
          From: '+11231231234',
          To: '+11231231234',
          Body: 'fake body',
        },
      }

      this.fakeExpressResponse = mockResponse()

      // Don't actually call braveAlerter methods
      this.braveAlerter = new BraveAlerter(dummyGetAlertSession, dummyGetAlertSessionByPhoneNumber, dummyAlertSessionChangedCallback)
      sinon
        .stub(this.braveAlerter, 'getAlertSessionByPhoneNumber')
        .returns(
          new AlertSession('guid-123', ALERT_STATE.WAITING_FOR_DETAILS, '3', 'my details', 'my fallback message', '+11231231234', ['3'], ['three']),
        )
      sinon.stub(this.braveAlerter.alertStateMachine, 'processStateTransitionWithMessage').returns({
        nextAlertState: ALERT_STATE.COMPLETED,
        incidentCategoryKey: '2',
        details: 'new details',
        returnMessage: 'return message',
      })
      sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

      // Don't actually call Twilio
      sinon.stub(Twilio, 'sendTwilioResponse')
      sinon.stub(Twilio, 'isValidTwilioRequest').returns(false)

      await this.braveAlerter.handleTwilioRequest(validRequest, this.fakeExpressResponse)
    })

    afterEach(() => {
      this.braveAlerter.getAlertSessionByPhoneNumber.restore()
      this.braveAlerter.alertStateMachine.processStateTransitionWithMessage.restore()
      this.braveAlerter.alertSessionChangedCallback.restore()

      Twilio.sendTwilioResponse.restore()
      Twilio.isValidTwilioRequest.restore()
    })

    it('should log the error', () => {
      expect(helpers.log).to.be.calledWith('Bad request: Sender is not Twilio')
    })

    it('should return 401', () => {
      expect(this.fakeExpressResponse.status).to.be.calledWith(401)
    })
  })
})
