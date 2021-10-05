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
const Location = require('../../../lib/location')
const SYSTEM = require('../../../lib/systemEnum')
const testingHelpers = require('../../testingHelpers')

chai.use(chaiHttp)
chai.use(sinonChai)

describe('braveAlerter.js integration tests: handleGetLocation', () => {
  beforeEach(() => {
    sinon.stub(helpers, 'logError')
  })

  afterEach(() => {
    helpers.logError.restore()
  })

  describe('given valid request parameters and a location that corresponds to the API key', () => {
    beforeEach(async () => {
      this.fakeLocation = new Location('fakeName', SYSTEM.BUTTONS)

      const braveAlerter = testingHelpers.braveAlerterFactory({
        getLocationByAlertApiKey: () => {
          return this.fakeLocation
        },
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai.request(app).get('/alert/location').set('X-API-KEY', '00000000-000000000000000').send()
    })

    it('should return 200', () => {
      expect(this.response).to.have.status(200)
    })

    it('should return the location', async () => {
      expect(this.response.body).to.eql(this.fakeLocation)
    })

    it('should return json', () => {
      expect(this.response).to.be.json
    })
  })

  describe('given valid request parameters but no location that corresponds to the API key', () => {
    beforeEach(async () => {
      const braveAlerter = testingHelpers.braveAlerterFactory({
        getLocationByAlertApiKey: () => {
          return null
        },
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai.request(app).get('/alert/location').set('X-API-KEY', '00000000-000000000000000').send()
    })

    it('should return 200', () => {
      expect(this.response).to.have.status(200)
    })

    it('should return no location', async () => {
      expect(this.response.body).to.eql({})
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

      this.response = await chai.request(app).get('/alert/location').set('X-API-KEY', '').send()
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/location: x-api-key (Invalid value)')
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

      this.response = await chai.request(app).get('/alert/location').send()
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/location: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })

    it('should return json', () => {
      expect(this.response).to.be.json
    })
  })
})
