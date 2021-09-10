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
const ActiveAlert = require('../../../lib/activeAlert')
const ALERT_TYPE = require('../../../lib/alertTypeEnum')
const CHATBOT_STATE = require('../../../lib/chatbotStateEnum')
const testingHelpers = require('../../testingHelpers')

chai.use(chaiHttp)
chai.use(sinonChai)

describe('braveAlerter.js integration tests: handleGetActiveAlerts', () => {
  beforeEach(() => {
    sinon.spy(helpers, 'logError')
  })

  afterEach(() => {
    helpers.logError.restore()
  })

  describe('given valid request parameters and activeAlerts that corresponds to the API key', () => {
    beforeEach(async () => {
      this.fakeActiveAlerts = [
        new ActiveAlert('fakeId', CHATBOT_STATE.STARTED, 'fakeDeviceName', ALERT_TYPE.BUTTONS_URGENT, ['Cat1', 'Cat2'], '2021-01-05T15:22:30.000Z'),
        new ActiveAlert(
          'fakeId2',
          CHATBOT_STATE.RESPONDING,
          'fakeDeviceName2',
          ALERT_TYPE.BUTTONS_NOT_URGENT,
          4,
          ['Cat1', 'Cat2'],
          '2021-01-05T15:22:35.000Z',
        ),
      ]

      const braveAlerter = testingHelpers.braveAlerterFactory({
        getActiveAlertsByAlertApiKey: () => {
          return this.fakeActiveAlerts
        },
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      // prettier-ignore
      this.response = await chai
        .request(app)
        .get('/alert/activeAlerts')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({})
    })

    it('should return 200', () => {
      expect(this.response).to.have.status(200)
    })

    it('should return a JSON response body', async () => {
      expect(JSON.parse(this.response.body)).to.eql(this.fakeActiveAlerts)
    })
  })

  describe('given valid request parameters but no active alerts that corresponds to the API key', () => {
    beforeEach(async () => {
      const braveAlerter = testingHelpers.braveAlerterFactory({
        getActiveAlertsByAlertApiKey: () => {
          return []
        },
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      // prettier-ignore
      this.response = await chai
        .request(app)
        .get('/alert/activeAlerts')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({})
    })

    it('should return 200', () => {
      expect(this.response).to.have.status(200)
    })

    it('should return a JSON response body', async () => {
      expect(JSON.parse(this.response.body)).to.eql([])
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
        .get('/alert/activeAlerts')
        .set('X-API-KEY', '')
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/activeAlerts: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
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
        .get('/alert/activeAlerts')
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/activeAlerts: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that something goes wrong getting the active alerts', () => {
    beforeEach(async () => {
      const braveAlerter = testingHelpers.braveAlerterFactory({
        getActiveAlertsByAlertApiKey: () => {
          return null
        },
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      // prettier-ignore
      this.response = await chai
        .request(app)
        .get('/alert/activeAlerts')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Something went wrong in request to /alert/activeAlerts. Active Alerts is null.')
    })

    it('should return 500', () => {
      expect(this.response.status).to.equal(500)
    })
  })
})
