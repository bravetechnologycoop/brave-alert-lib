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

describe('braveAlerter.js unit tests: handleIncidentCategory', () => {
  beforeEach(() => {
    sandbox.spy(helpers, 'log')
    sandbox.spy(helpers, 'logError')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('given the required request parameters', () => {
    describe('and there is a session with the given ID for the clients with the given API Key', () => {
      describe('and the given incident category is valid for the client', () => {
        describe('and the session state is WAITING_FOR_CATEGORY', () => {
          beforeEach(async () => {
            this.goodSessionId = 'mySessionId'
            const alertSession = new AlertSession(this.goodSessionId, CHATBOT_STATE.WAITING_FOR_CATEGORY)
            alertSession.validIncidentCategories = ['My Category']
            alertSession.validIncidentCategoryKeys = ['1']
            this.activeAlerts = [
              new ActiveAlert(this.goodSessionId, CHATBOT_STATE.WAITING_FOR_DETAILS, 'myDeviceId', ALERT_TYPE.SENSOR_DURATION, ['Cat1', 'Cat2']),
            ]

            this.braveAlerter = testingHelpers.braveAlerterFactory({
              getAlertSessionBySessionIdAndAlertApiKey: () => {
                return alertSession
              },
              getActiveAlertsByAlertApiKey: () => {
                return this.activeAlerts
              },
              alertSessionChangedCallback: sandbox.stub(),
            })

            const validRequest = {
              path: '/alert/setIncidentCategory',
              header: sandbox.stub().withArgs('X-API-KEY').returns('00000000-000000000000000'),
              body: {
                sessionId: this.goodSessionId,
                incidentCategory: 'My Category',
              },
            }

            this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

            await this.braveAlerter.handleIncidentCategory(validRequest, this.fakeExpressResponse)
          })

          it('should call the callback', () => {
            expect(this.braveAlerter.alertSessionChangedCallback).to.be.calledWith(new AlertSession(this.goodSessionId, CHATBOT_STATE.COMPLETED, '1'))
          })

          it('should return the active alerts', () => {
            expect(this.fakeExpressResponse.json).to.be.calledWith(JSON.stringify(this.activeAlerts))
          })

          it('should return 200', () => {
            expect(this.fakeExpressResponse.status).to.be.calledWith(200)
          })
        })

        describe('and the session state is not WAITING_FOR_CATEGORY', () => {
          beforeEach(async () => {
            this.goodSessionId = 'mySessionId'
            const alertSession = new AlertSession(this.goodSessionId, CHATBOT_STATE.COMPLETED)
            alertSession.validIncidentCategories = ['My Category']
            alertSession.validIncidentCategoryKeys = ['1']

            this.braveAlerter = testingHelpers.braveAlerterFactory({
              getAlertSessionBySessionIdAndAlertApiKey: () => {
                return alertSession
              },
              alertSessionChangedCallback: sandbox.stub(),
            })

            this.incidentCategory = 'My Category'

            const validRequest = {
              path: '/alert/setIncidentCategory',
              header: sandbox.stub().withArgs('X-API-KEY').returns('00000000-000000000000000'),
              body: {
                sessionId: this.goodSessionId,
                incidentCategory: this.incidentCategory,
              },
            }

            this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

            await this.braveAlerter.handleIncidentCategory(validRequest, this.fakeExpressResponse)
          })

          it('should log the failure', () => {
            expect(helpers.logError).to.be.calledWith(
              `Failed to record incident category ${this.incidentCategory} for session ${this.goodSessionId}: Session is not waiting for incident category (current state: ${CHATBOT_STATE.COMPLETED})`,
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

      describe('and the given incident category is not valid for the client', () => {
        beforeEach(async () => {
          this.goodSessionId = 'mySessionId'
          const alertSession = new AlertSession(this.goodSessionId, CHATBOT_STATE.STARTED)
          alertSession.validIncidentCategories = ['My Category']
          alertSession.validIncidentCategoryKeys = ['1']

          this.braveAlerter = testingHelpers.braveAlerterFactory({
            getAlertSessionBySessionIdAndAlertApiKey: () => {
              return alertSession
            },
            alertSessionChangedCallback: sandbox.stub(),
          })

          this.incidentCategory = 'Not My Category'

          const validRequest = {
            path: '/alert/setIncidentCategory',
            header: sandbox.stub().withArgs('X-API-KEY').returns('00000000-000000000000000'),
            body: {
              sessionId: this.goodSessionId,
              incidentCategory: this.incidentCategory,
            },
          }

          this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

          await this.braveAlerter.handleIncidentCategory(validRequest, this.fakeExpressResponse)
        })

        it('should log the failure', () => {
          expect(helpers.logError).to.be.calledWith(
            `Failed to record incident category ${this.incidentCategory} for session ${this.goodSessionId}: Invalid category for client`,
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

    describe('and there are no sessions with the given ID for the clients with the given API key', () => {
      beforeEach(async () => {
        this.badSessionId = 'notMySessionId'

        this.braveAlerter = testingHelpers.braveAlerterFactory({
          getAlertSessionBySessionIdAndAlertApiKey: () => {
            return null
          },
          alertSessionChangedCallback: sandbox.stub(),
        })

        this.incidentCategory = 'My Category'

        const validRequest = {
          path: '/alert/setIncidentCategory',
          header: sandbox.stub().withArgs('X-API-KEY').returns('00000000-000000000000000'),
          body: {
            sessionId: this.badSessionId,
            incidentCategory: this.incidentCategory,
          },
        }

        this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)

        await this.braveAlerter.handleIncidentCategory(validRequest, this.fakeExpressResponse)
      })

      it('should log the failure', () => {
        expect(helpers.logError).to.be.calledWith(
          `Failed to record incident category ${this.incidentCategory} for session ${this.badSessionId}: No corresponding session`,
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
