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

chai.use(chaiHttp)
chai.use(sinonChai)

describe('braveAlerter.js integration tests: handleGetNewNotificationsCount', () => {
  beforeEach(() => {
    sinon.spy(helpers, 'logError')
  })

  afterEach(() => {
    helpers.logError.restore()
  })

  describe('given valid request parameters and API key', () => {
    beforeEach(async () => {
      this.fakeNewNotificationsCount = 4

      const braveAlerter = testingHelpers.braveAlerterFactory({
        getNewNotificationsCountByAlertApiKey: () => {
          return this.fakeNewNotificationsCount
        },
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      // eslint-disable-next-line prettier/prettier
      this.response = await chai.request(app).get('/alert/newNotificationsCount').set('X-API-KEY', '00000000-000000000000000').send({})
    })

    it('should return 200', () => {
      expect(this.response).to.have.status(200)
    })

    it('should return the notification count', async () => {
      expect(this.response.body).to.equal(this.fakeNewNotificationsCount)
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

      // eslint-disable-next-line prettier/prettier
      this.response = await chai.request(app).get('/alert/newNotificationsCount').set('X-API-KEY', '').send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/newNotificationsCount: x-api-key (Invalid value)')
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

      // eslint-disable-next-line prettier/prettier
      this.response = await chai.request(app).get('/alert/newNotificationsCount').send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/newNotificationsCount: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })

    it('should return json', () => {
      expect(this.response).to.be.json
    })
  })
})
