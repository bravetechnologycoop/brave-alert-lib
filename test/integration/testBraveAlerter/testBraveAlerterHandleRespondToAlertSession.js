// Third-party dependencies
const { expect } = require('chai')
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const express = require('express')
const chai = require('chai')
const chaiHttp = require('chai-http')

// In-house dependencies
const helpers = require('../../../lib/helpers')
const testingHelpers = require('../../testingHelpers')
const AlertSession = require('../../../lib/alertSession')
const CHATBOT_STATE = require('../../../lib/chatbotStateEnum')
const ALERT_TYPE = require('../../../lib/alertTypeEnum')
const ActiveAlert = require('../../../lib/activeAlert')

chai.use(chaiHttp)
chai.use(sinonChai)

const sandbox = sinon.createSandbox()

describe('braveAlerter.js integration tests: handleRespondToAlertSession', () => {
  beforeEach(() => {
    sandbox.spy(helpers, 'log')
    sandbox.spy(helpers, 'logError')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('given valid request parameters', () => {
    beforeEach(async () => {
      this.goodSessionId = 'mySessionId'
      this.activeAlerts = [
        new ActiveAlert(
          this.goodSessionId,
          CHATBOT_STATE.WAITING_FOR_CATEGORY,
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

      const app = express()
      app.use(this.braveAlerter.getRouter())

      this.response = await chai
        .request(app)
        .post('/alert/respondToAlertSession')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({ sessionId: this.goodSessionId })
    })

    it('should not log any errors', () => {
      expect(helpers.logError).not.to.be.called
    })

    it('should return the active alerts', () => {
      expect(this.response.body).to.eql(this.activeAlerts)
    })

    it('should return 200', () => {
      expect(this.response.status).to.equal(200)
    })

    it('should return json', () => {
      expect(this.response).to.be.json
    })
  })

  describe('given that sessionId is missing', () => {
    beforeEach(async () => {
      const braveAlerter = testingHelpers.braveAlerterFactory()

      const app = express()
      app.use(braveAlerter.getRouter())

      // prettier-ignore
      this.response = await chai
        .request(app)
        .post('/alert/respondToAlertSession')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/respondToAlertSession: sessionId (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })

    it('should return json', () => {
      expect(this.response).to.be.json
    })
  })

  describe('given that sessionId is blank', () => {
    beforeEach(async () => {
      const braveAlerter = testingHelpers.braveAlerterFactory()

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai
        .request(app)
        .post('/alert/respondToAlertSession')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({ sessionId: '' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/respondToAlertSession: sessionId (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })

    it('should return json', () => {
      expect(this.response).to.be.json
    })
  })

  describe('given that the API key is missing', () => {
    beforeEach(async () => {
      const braveAlerter = testingHelpers.braveAlerterFactory()

      const app = express()
      app.use(braveAlerter.getRouter())

      // prettier-ignore
      this.response = await chai
        .request(app)
        .post('/alert/respondToAlertSession')
        .send({ sessionId: 'sessionId' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/respondToAlertSession: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })

    it('should return json', () => {
      expect(this.response).to.be.json
    })
  })

  describe('given that the API key is blank', () => {
    beforeEach(async () => {
      const braveAlerter = testingHelpers.braveAlerterFactory()

      const app = express()
      app.use(braveAlerter.getRouter())

      // prettier-ignore
      this.response = await chai
        .request(app)
        .post('/alert/respondToAlertSession')
        .set('X-API-KEY', '')
        .send({ sessionId: 'sessionId' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/respondToAlertSession: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })

    it('should return json', () => {
      expect(this.response).to.be.json
    })
  })
})
