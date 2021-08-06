const { expect, assert } = require('chai')
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const express = require('express')
const chai = require('chai')
const chaiHttp = require('chai-http')

const helpers = require('../../lib/helpers')
const testingHelper = require('../testingHelpers')

chai.use(chaiHttp)
chai.use(sinonChai)

describe('designateDevice.js integration tests: handleDesignateDevice', () => {
  beforeEach(() => {
    this.braveAlerter = testingHelper.braveAlerterFactory()

    this.app = express()
    this.app.use(this.braveAlerter.getRouter())

    sinon.stub(helpers, 'log')
    sinon.stub(helpers, 'logError')
  })

  afterEach(() => {
    helpers.log.restore()
    helpers.logError.restore()
  })

  describe('given valid request parameters', () => {
    beforeEach(async () => {
      this.response = await chai
        .request(this.app)
        .post('/alert/designatedevice')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({ verificationCode: 'ABC123', responderPushId: 'pushID' })
    })

    it('should log the verification code, Alert API Key, and Responder Push ID', () => {
      expect(helpers.log).to.be.calledWith(
        '************* Verification Code: ABC123 Alert API Key: 00000000-000000000000000 Responder Push ID: pushID',
      )
    })

    it('should return a JSON response body', async () => {
      try {
        JSON.parse(this.response.body)
      } catch (e) {
        assert.fail('Getting the JSON string should not throw an error. Make sure that your response is sent with ".json(JSON.stringify(...))"')
      }
    })

    it('should return 200', () => {
      expect(this.response.status).to.equal(200)
    })
  })

  describe('given that verificationCode is missing', () => {
    beforeEach(async () => {
      this.response = await chai
        .request(this.app)
        .post('/alert/designatedevice')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({ responderPushId: 'pushID' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/designatedevice: verificationCode (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that verificationCode is blank', () => {
    beforeEach(async () => {
      this.response = await chai
        .request(this.app)
        .post('/alert/designatedevice')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({ verificationCode: '', responderPushId: 'pushID' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/designatedevice: verificationCode (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that responderPushId is missing', () => {
    beforeEach(async () => {
      this.response = await chai
        .request(this.app)
        .post('/alert/designatedevice')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({ verificationCode: 'ABC123' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/designatedevice: responderPushId (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that responderPushId is blank', () => {
    beforeEach(async () => {
      this.response = await chai
        .request(this.app)
        .post('/alert/designatedevice')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({ verificationCode: 'ABC123', responderPushId: '' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/designatedevice: responderPushId (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that the API key is missing', () => {
    beforeEach(async () => {
      this.response = await chai.request(this.app).post('/alert/designatedevice').send({ verificationCode: 'ABC123', responderPushId: 'pushID' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/designatedevice: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that the API key is blank', () => {
    beforeEach(async () => {
      this.response = await chai
        .request(this.app)
        .post('/alert/designatedevice')
        .set('X-API-KEY', '')
        .send({ verificationCode: 'ABC123', responderPushId: 'pushID' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/designatedevice: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })
})
