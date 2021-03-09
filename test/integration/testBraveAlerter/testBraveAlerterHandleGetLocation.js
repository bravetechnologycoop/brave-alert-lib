const { expect } = require('chai')
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const express = require('express')
const chai = require('chai')
const chaiHttp = require('chai-http')

const helpers = require('../../../lib/helpers')
const BraveAlerter = require('../../../lib/braveAlerter')
const Location = require('../../../lib/location')
const SYSTEM = require('../../../lib/systemEnum')

chai.use(chaiHttp)
chai.use(sinonChai)

describe('braveAlerter.js integration tests: handleGetLocation', () => {
  beforeEach(() => {
    sinon.stub(helpers, 'log')
  })

  afterEach(() => {
    helpers.log.restore()
  })

  describe('given valid request parameters and a location that corresponds to the API key', () => {
    beforeEach(async () => {
      this.fakeLocation = new Location('fakeName', SYSTEM.BUTTONS)

      const braveAlerter = new BraveAlerter(null, null, null, () => {
        return this.fakeLocation
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai.request(app).get('/alert/location').set('X-API-KEY', '00000000-000000000000000').send()
    })

    it('should return 200', () => {
      expect(this.response).to.have.status(200)
    })

    it('should return a JSON response body', async () => {
      expect(this.response.body).to.equal(JSON.stringify(this.fakeLocation))
    })
  })

  describe('given valid request parameters but no location that corresponds to the API key', () => {
    beforeEach(async () => {
      this.fakeLocation = new Location('fakeName', SYSTEM.BUTTONS)

      const braveAlerter = new BraveAlerter(null, null, null, () => {
        return null
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai.request(app).get('/alert/location').set('X-API-KEY', '00000000-000000000000000').send()
    })

    it('should return 200', () => {
      expect(this.response).to.have.status(200)
    })

    it('should return a JSON response body', async () => {
      expect(this.response.body).to.equal('{}')
    })
  })

  describe('given that the API key is blank', () => {
    beforeEach(async () => {
      const braveAlerter = new BraveAlerter(null, null, null, () => {
        return new Location('fakeName', SYSTEM.BUTTONS)
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai.request(app).get('/alert/location').set('X-API-KEY', '').send()
    })

    it('should log the error', () => {
      expect(helpers.log).to.be.calledWith(
        'Bad request to /alert/location: {"errors":[{"value":"","msg":"Invalid value","param":"x-api-key","location":"headers"}]}',
      )
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that the API key is missing', () => {
    beforeEach(async () => {
      const braveAlerter = new BraveAlerter(null, null, null, () => {
        return new Location('fakeName', SYSTEM.BUTTONS)
      })

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai.request(app).get('/alert/location').send()
    })

    it('should log the error', () => {
      expect(helpers.log).to.be.calledWith(
        'Bad request to /alert/location: {"errors":[{"msg":"Invalid value","param":"x-api-key","location":"headers"}]}',
      )
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })
})
