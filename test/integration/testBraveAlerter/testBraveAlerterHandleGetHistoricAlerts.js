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
const BraveAlerter = require('../../../lib/braveAlerter')
const HistoricAlert = require('../../../lib/historicAlert')
const ALERT_TYPE = require('../../../lib/alertTypeEnum')

chai.use(chaiHttp)
chai.use(sinonChai)

describe('braveAlerter.js integration tests: handleGetHistoricAlerts', () => {
  beforeEach(() => {
    sinon.spy(helpers, 'logError')
  })

  afterEach(() => {
    helpers.logError.restore()
  })

  describe('given valid request parameters and historicAlerts that corresponds to the API key', () => {
    beforeEach(async () => {
      this.fakeHistoricAlerts = [
        new HistoricAlert('fakeId', 'fakeDeviceName', 'fakeCategory', ALERT_TYPE.BUTTONS_URGENT, 4, '2021-01-05T15:22:30.000Z'),
        new HistoricAlert('fakeId2', 'fakeDeviceName2', 'fakeCategory2', ALERT_TYPE.BUTTONS_NOT_URGENT, 4, '2021-01-06T15:22:30.000Z'),
      ]

      const braveAlerter = new BraveAlerter(null, null, null, null, () => {
        return this.fakeHistoricAlerts
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      // eslint-disable-next-line prettier/prettier
      this.response = await chai
        .request(app)
        .get('/alert/historicAlerts')
        .set('X-API-KEY', '00000000-000000000000000')
        .query({ maxHistoricAlerts: 2 })
        .send({})
    })

    it('should return 200', () => {
      expect(this.response).to.have.status(200)
    })

    it('should return a JSON response body', async () => {
      expect(this.response.body).to.equal(JSON.stringify(this.fakeHistoricAlerts))
    })
  })

  describe('given valid request parameters but no historic alerts that corresponds to the API key', () => {
    beforeEach(async () => {
      const braveAlerter = new BraveAlerter(null, null, null, null, () => {
        return []
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      // eslint-disable-next-line prettier/prettier
      this.response = await chai
        .request(app)
        .get('/alert/historicAlerts')
        .set('X-API-KEY', '00000000-000000000000000')
        .query({ maxHistoricAlerts: 2 })
        .send({})
    })

    it('should return 200', () => {
      expect(this.response).to.have.status(200)
    })

    it('should return a JSON response body', async () => {
      expect(this.response.body).to.equal('[]')
    })
  })

  describe('given that the API key is blank', () => {
    beforeEach(async () => {
      const braveAlerter = new BraveAlerter(null, null, null, null, () => {
        return [
          new HistoricAlert('fakeId', 'fakeDeviceName', 'fakeCategory', ALERT_TYPE.BUTTONS_URGENT, 4, '2021-01-05T15:22:30.000Z'),
          new HistoricAlert('fakeId2', 'fakeDeviceName2', 'fakeCategory2', ALERT_TYPE.BUTTONS_NOT_URGENT, 4, '2021-01-06T15:22:30.000Z'),
        ]
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      // eslint-disable-next-line prettier/prettier
      this.response = await chai
        .request(app)
        .get('/alert/historicAlerts')
        .set('X-API-KEY', '')
        .query({ maxHistoricAlerts: 20 })
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/historicAlerts: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that the API key is missing', () => {
    beforeEach(async () => {
      const braveAlerter = new BraveAlerter(null, null, null, null, () => {
        return [
          new HistoricAlert('fakeId', 'fakeDeviceName', 'fakeCategory', ALERT_TYPE.BUTTONS_URGENT, 4, '2021-01-05T15:22:30.000Z'),
          new HistoricAlert('fakeId2', 'fakeDeviceName2', 'fakeCategory2', ALERT_TYPE.BUTTONS_NOT_URGENT, 4, '2021-01-06T15:22:30.000Z'),
        ]
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      // eslint-disable-next-line prettier/prettier
      this.response = await chai
        .request(app)
        .get('/alert/historicAlerts')
        .query({ maxHistoricAlerts: 20 })
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/historicAlerts: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that maxHistoricAlerts is blank', () => {
    beforeEach(async () => {
      const braveAlerter = new BraveAlerter(null, null, null, null, () => {
        return [
          new HistoricAlert('fakeId', 'fakeDeviceName', 'fakeCategory', ALERT_TYPE.BUTTONS_URGENT, 4, '2021-01-05T15:22:30.000Z'),
          new HistoricAlert('fakeId2', 'fakeDeviceName2', 'fakeCategory2', ALERT_TYPE.BUTTONS_NOT_URGENT, 4, '2021-01-06T15:22:30.000Z'),
        ]
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai
        .request(app)
        .get('/alert/historicAlerts')
        .set('X-API-KEY', '00000000-000000000000000')
        .query({ maxHistoricAlerts: '' })
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/historicAlerts: maxHistoricAlerts (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that maxHistoricAlerts is missing', () => {
    beforeEach(async () => {
      const braveAlerter = new BraveAlerter(null, null, null, null, () => {
        return [
          new HistoricAlert('fakeId', 'fakeDeviceName', 'fakeCategory', ALERT_TYPE.BUTTONS_URGENT, 4, '2021-01-05T15:22:30.000Z'),
          new HistoricAlert('fakeId2', 'fakeDeviceName2', 'fakeCategory2', ALERT_TYPE.BUTTONS_NOT_URGENT, 4, '2021-01-06T15:22:30.000Z'),
        ]
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      // eslint-disable-next-line prettier/prettier
      this.response = await chai
        .request(app)
        .get('/alert/historicAlerts')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/historicAlerts: maxHistoricAlerts (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that maxHistoricAlerts is not an integer', () => {
    beforeEach(async () => {
      const braveAlerter = new BraveAlerter(null, null, null, null, () => {
        return [
          new HistoricAlert('fakeId', 'fakeDeviceName', 'fakeCategory', ALERT_TYPE.BUTTONS_URGENT, 4, '2021-01-05T15:22:30.000Z'),
          new HistoricAlert('fakeId2', 'fakeDeviceName2', 'fakeCategory2', ALERT_TYPE.BUTTONS_NOT_URGENT, 4, '2021-01-06T15:22:30.000Z'),
        ]
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai
        .request(app)
        .get('/alert/historicAlerts')
        .set('X-API-KEY', '00000000-000000000000000')
        .query({ maxHistoricAlerts: 'ABC' })
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/historicAlerts: maxHistoricAlerts (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that maxHistoricAlerts is less than 0', () => {
    beforeEach(async () => {
      const braveAlerter = new BraveAlerter(null, null, null, null, () => {
        return [
          new HistoricAlert('fakeId', 'fakeDeviceName', 'fakeCategory', ALERT_TYPE.BUTTONS_URGENT, 4, '2021-01-05T15:22:30.000Z'),
          new HistoricAlert('fakeId2', 'fakeDeviceName2', 'fakeCategory2', ALERT_TYPE.BUTTONS_NOT_URGENT, 4, '2021-01-06T15:22:30.000Z'),
        ]
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai
        .request(app)
        .get('/alert/historicAlerts')
        .set('X-API-KEY', '00000000-000000000000000')
        .query({ maxHistoricAlerts: -1 })
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/historicAlerts: maxHistoricAlerts (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that something goes wrong getting the historic alerts', () => {
    beforeEach(async () => {
      const braveAlerter = new BraveAlerter(null, null, null, null, () => {
        return null
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai
        .request(app)
        .get('/alert/historicAlerts')
        .set('X-API-KEY', '00000000-000000000000000')
        .query({ maxHistoricAlerts: 10 })
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Something went wrong in request to /alert/historicAlerts. Historic Alerts is null.')
    })

    it('should return 500', () => {
      expect(this.response.status).to.equal(500)
    })
  })
})
