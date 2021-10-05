// Third-party dependencies
const { expect } = require('chai')
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chai = require('chai')

// In-house dependencies
const helpers = require('../../../lib/helpers')
const testingHelpers = require('../../testingHelpers')
const AlertSession = require('../../../lib/alertSession')
const CHATBOT_STATE = require('../../../lib/chatbotStateEnum')
const ALERT_TYPE = require('../../../lib/alertTypeEnum')
const ActiveAlert = require('../../../lib/activeAlert')

chai.use(sinonChai)

const sandbox = sinon.createSandbox()

describe('braveAlerter.js unit tests: handleAcknowledgeAlertSession', () => {
  beforeEach(() => {
    sandbox.spy(helpers, 'log')
    sandbox.spy(helpers, 'logError')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('given the required request parameters', () => {
    describe('and there is a session with the given ID for the clients with the given API Key', () => {
      describe('and the session state is STARTED', () => {
        beforeEach(async () => {
          this.goodSessionId = 'mySessionId'
          this.activeAlerts = [
            new ActiveAlert(
              this.goodSessionId,
              CHATBOT_STATE.RESPONDING,
              'myDeviceId',
              ALERT_TYPE.SENSOR_DURATION,
              ['Cat1', 'Cat2'],
              '2021-01-05T15:22:30.000Z',
            ),
          ]

          this.braveAlerter = testingHelpers.braveAlerterFactory({
            getAlertSessionBySessionIdAndAlertApiKey: () => {
              return new AlertSession(this.goodSessionId, CHATBOT_STATE.STARTED)
            },
            getActiveAlertsByAlertApiKey: () => {
              return this.activeAlerts
            },
            alertSessionChangedCallback: sandbox.stub(),
          })

          const validRequest = {
            path: '/alert/acknowledgeAlertSession',
            header: sandbox.stub().withArgs('X-API-KEY').returns('00000000-000000000000000'),
            body: {
              sessionId: this.goodSessionId,
            },
          }

          this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

          await this.braveAlerter.handleAcknowledgeAlertSession(validRequest, this.fakeExpressResponse)
        })

        it('should call the callback', () => {
          expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(this.goodSessionId, CHATBOT_STATE.RESPONDING))
        })

        it('should return the active alerts as JSON', () => {
          expect(this.fakeExpressResponse.json).to.be.calledWith(this.activeAlerts)
        })

        it('should return 200', () => {
          expect(this.fakeExpressResponse.status).to.be.calledWith(200)
        })
      })

      describe('and the session state is WAITING_FOR_REPLY', () => {
        beforeEach(async () => {
          this.goodSessionId = 'mySessionId'
          this.activeAlerts = [
            new ActiveAlert(
              this.goodSessionId,
              CHATBOT_STATE.RESPONDING,
              'myDeviceId',
              ALERT_TYPE.SENSOR_DURATION,
              ['Cat1', 'Cat2'],
              '2021-01-05T15:22:30.000Z',
            ),
          ]

          this.braveAlerter = testingHelpers.braveAlerterFactory({
            getAlertSessionBySessionIdAndAlertApiKey: () => {
              return new AlertSession(this.goodSessionId, CHATBOT_STATE.WAITING_FOR_REPLY)
            },
            getActiveAlertsByAlertApiKey: () => {
              return this.activeAlerts
            },
            alertSessionChangedCallback: sandbox.stub(),
          })

          const validRequest = {
            path: '/alert/acknowledgeAlertSession',
            header: sandbox.stub().withArgs('X-API-KEY').returns('00000000-000000000000000'),
            body: {
              sessionId: this.goodSessionId,
            },
          }

          this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

          await this.braveAlerter.handleAcknowledgeAlertSession(validRequest, this.fakeExpressResponse)
        })

        it('should call the callback', () => {
          expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(this.goodSessionId, CHATBOT_STATE.RESPONDING))
        })

        it('should return the active alerts as JSON', () => {
          expect(this.fakeExpressResponse.json).to.be.calledWith(this.activeAlerts)
        })

        it('should return 200', () => {
          expect(this.fakeExpressResponse.status).to.be.calledWith(200)
        })
      })

      describe('and the session state is RESPONDING', () => {
        beforeEach(async () => {
          this.goodSessionId = 'mySessionId'
          this.activeAlerts = [
            new ActiveAlert(
              this.goodSessionId,
              CHATBOT_STATE.RESPONDING,
              'myDeviceId',
              ALERT_TYPE.SENSOR_DURATION,
              ['Cat1', 'Cat2'],
              '2021-01-05T15:22:30.000Z',
            ),
          ]

          this.braveAlerter = testingHelpers.braveAlerterFactory({
            getAlertSessionBySessionIdAndAlertApiKey: () => {
              return new AlertSession(this.goodSessionId, CHATBOT_STATE.RESPONDING)
            },
            getActiveAlertsByAlertApiKey: () => {
              return this.activeAlerts
            },
            alertSessionChangedCallback: sandbox.stub(),
          })

          const validRequest = {
            path: '/alert/acknowledgeAlertSession',
            header: sandbox.stub().withArgs('X-API-KEY').returns('00000000-000000000000000'),
            body: {
              sessionId: this.goodSessionId,
            },
          }

          this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

          await this.braveAlerter.handleAcknowledgeAlertSession(validRequest, this.fakeExpressResponse)
        })

        it('should log the failure', () => {
          expect(helpers.log).to.be.calledWith(
            `Failed to acknowledge alert for session ${this.goodSessionId}: Session has already been acknowledged (current state: ${CHATBOT_STATE.RESPONDING})`,
          )
        })

        it('should not call alertSessionChangedCallback', () => {
          expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
        })

        it('should return the active alerts as JSON', () => {
          expect(this.fakeExpressResponse.json).to.be.calledWith(this.activeAlerts)
        })

        it('should return 200', () => {
          expect(this.fakeExpressResponse.status).to.be.calledWith(200)
        })
      })

      describe('and the session state is WAITING_FOR_CATEGORY', () => {
        beforeEach(async () => {
          this.goodSessionId = 'mySessionId'
          this.activeAlerts = [
            new ActiveAlert(
              this.goodSessionId,
              CHATBOT_STATE.RESPONDING,
              'myDeviceId',
              ALERT_TYPE.SENSOR_DURATION,
              ['Cat1', 'Cat2'],
              '2021-01-05T15:22:30.000Z',
            ),
          ]

          this.braveAlerter = testingHelpers.braveAlerterFactory({
            getAlertSessionBySessionIdAndAlertApiKey: () => {
              return new AlertSession(this.goodSessionId, CHATBOT_STATE.WAITING_FOR_CATEGORY)
            },
            getActiveAlertsByAlertApiKey: () => {
              return this.activeAlerts
            },
            alertSessionChangedCallback: sandbox.stub(),
          })

          const validRequest = {
            path: '/alert/acknowledgeAlertSession',
            header: sandbox.stub().withArgs('X-API-KEY').returns('00000000-000000000000000'),
            body: {
              sessionId: this.goodSessionId,
            },
          }

          this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

          await this.braveAlerter.handleAcknowledgeAlertSession(validRequest, this.fakeExpressResponse)
        })

        it('should log the failure', () => {
          expect(helpers.log).to.be.calledWith(
            `Failed to acknowledge alert for session ${this.goodSessionId}: Session has already been acknowledged (current state: ${CHATBOT_STATE.WAITING_FOR_CATEGORY})`,
          )
        })

        it('should not call alertSessionChangedCallback', () => {
          expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
        })

        it('should return the active alerts as JSON', () => {
          expect(this.fakeExpressResponse.json).to.be.calledWith(this.activeAlerts)
        })

        it('should return 200', () => {
          expect(this.fakeExpressResponse.status).to.be.calledWith(200)
        })
      })

      describe('and the session state is WAITING_FOR_DETAILS', () => {
        beforeEach(async () => {
          this.goodSessionId = 'mySessionId'
          this.activeAlerts = [
            new ActiveAlert(
              this.goodSessionId,
              CHATBOT_STATE.RESPONDING,
              'myDeviceId',
              ALERT_TYPE.SENSOR_DURATION,
              ['Cat1', 'Cat2'],
              '2021-01-05T15:22:30.000Z',
            ),
          ]

          this.braveAlerter = testingHelpers.braveAlerterFactory({
            getAlertSessionBySessionIdAndAlertApiKey: () => {
              return new AlertSession(this.goodSessionId, CHATBOT_STATE.WAITING_FOR_DETAILS)
            },
            getActiveAlertsByAlertApiKey: () => {
              return this.activeAlerts
            },
            alertSessionChangedCallback: sandbox.stub(),
          })

          const validRequest = {
            path: '/alert/acknowledgeAlertSession',
            header: sandbox.stub().withArgs('X-API-KEY').returns('00000000-000000000000000'),
            body: {
              sessionId: this.goodSessionId,
            },
          }

          this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

          await this.braveAlerter.handleAcknowledgeAlertSession(validRequest, this.fakeExpressResponse)
        })

        it('should log the failure', () => {
          expect(helpers.log).to.be.calledWith(
            `Failed to acknowledge alert for session ${this.goodSessionId}: Session has already been acknowledged (current state: ${CHATBOT_STATE.WAITING_FOR_DETAILS})`,
          )
        })

        it('should not call alertSessionChangedCallback', () => {
          expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
        })

        it('should return the active alerts as JSON', () => {
          expect(this.fakeExpressResponse.json).to.be.calledWith(this.activeAlerts)
        })

        it('should return 200', () => {
          expect(this.fakeExpressResponse.status).to.be.calledWith(200)
        })
      })

      describe('and the session state is COMPLETED', () => {
        beforeEach(async () => {
          this.goodSessionId = 'mySessionId'
          this.activeAlerts = [
            new ActiveAlert(
              this.goodSessionId,
              CHATBOT_STATE.RESPONDING,
              'myDeviceId',
              ALERT_TYPE.SENSOR_DURATION,
              ['Cat1', 'Cat2'],
              '2021-01-05T15:22:30.000Z',
            ),
          ]

          this.braveAlerter = testingHelpers.braveAlerterFactory({
            getAlertSessionBySessionIdAndAlertApiKey: () => {
              return new AlertSession(this.goodSessionId, CHATBOT_STATE.COMPLETED)
            },
            getActiveAlertsByAlertApiKey: () => {
              return this.activeAlerts
            },
            alertSessionChangedCallback: sandbox.stub(),
          })

          const validRequest = {
            path: '/alert/acknowledgeAlertSession',
            header: sandbox.stub().withArgs('X-API-KEY').returns('00000000-000000000000000'),
            body: {
              sessionId: this.goodSessionId,
            },
          }

          this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

          await this.braveAlerter.handleAcknowledgeAlertSession(validRequest, this.fakeExpressResponse)
        })

        it('should log the failure', () => {
          expect(helpers.log).to.be.calledWith(
            `Failed to acknowledge alert for session ${this.goodSessionId}: Session has already been acknowledged (current state: ${CHATBOT_STATE.COMPLETED})`,
          )
        })

        it('should not call alertSessionChangedCallback', () => {
          expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
        })

        it('should return the active alerts as JSON', () => {
          expect(this.fakeExpressResponse.json).to.be.calledWith(this.activeAlerts)
        })

        it('should return 200', () => {
          expect(this.fakeExpressResponse.status).to.be.calledWith(200)
        })
      })
    })

    describe('and there are no sessions with the given ID for the clients with the given API key', () => {
      beforeEach(async () => {
        this.badSessionId = 'notMySessionId'

        this.braveAlerter = testingHelpers.braveAlerterFactory({
          getAlertSessionBySessionIdAndAlertApiKey: () => {
            return null
          },
          alertSessionChangedCallback: sandbox.stub(),
        })

        const validRequest = {
          path: '/alert/acknowledgeAlertSession',
          header: sandbox.stub().withArgs('X-API-KEY').returns('00000000-000000000000000'),
          body: {
            sessionId: this.badSessionId,
          },
        }

        this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

        await this.braveAlerter.handleAcknowledgeAlertSession(validRequest, this.fakeExpressResponse)
      })

      it('should log the failure', () => {
        expect(helpers.logError).to.be.calledWith(`Failed to acknowledge alert for session ${this.badSessionId}: No corresponding session`)
      })

      it('should return the error message as JSON', () => {
        expect(this.fakeExpressResponse.json).to.be.calledWith(
          `Failed to acknowledge alert for session ${this.badSessionId}: No corresponding session`,
        )
      })

      it('should not call alertSessionChangedCallback', () => {
        expect(this.braveAlerter.alertSessionChangedCallback).not.to.be.called
      })

      it('should return 400', () => {
        expect(this.fakeExpressResponse.status).to.be.calledWith(400)
      })
    })
  })
})
