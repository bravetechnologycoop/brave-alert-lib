const expect = require('chai').expect
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const express = require('express')
const chai = require('chai')
const chaiHttp = require('chai-http')

const helpers = require('../../../lib/helpers')
const BraveAlerter = require('../../../lib/braveAlerter')

chai.use(chaiHttp)
chai.use(sinonChai)

describe('braveAlerter.js integration tests: handleDesignateDevice', () => {
  beforeEach(() => {
    this.braveAlerter = new BraveAlerter()

    this.app = express()
    this.app.use(this.braveAlerter.getRouter())

    sinon.stub(helpers, 'log')
  })

  afterEach(() => {
    helpers.log.restore()
  })

  describe('given valid request parameters', () => {
    beforeEach(async () => {
      this.response = await chai
        .request(this.app)
        .post('/alert/designatedevice')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({ verificationCode: 'ABC123' })
    })

    it('should log the verification code and device ID', () => {
      expect(helpers.log).to.be.calledWith('************* Verification Code: ABC123 Device ID: 00000000-000000000000000')
    })

    it('should return 200', () => {
      expect(this.response.status).to.equal(200)
    })
  })

  describe('given that verificationCode is missing', () => {
    beforeEach(async () => {
      this.response = await chai.request(this.app).post('/alert/designatedevice').set('X-API-KEY', '00000000-000000000000000').send({})
    })

    it('should log the error', () => {
      expect(helpers.log).to.be.calledWith(
        'Bad request, parameters missing {"errors":[{"msg":"Invalid value","param":"verificationCode","location":"body"}]}',
      )
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that the API key is missing', () => {
    beforeEach(async () => {
      this.response = await chai.request(this.app).post('/alert/designatedevice').send({ verificationCode: 'ABC123' })
    })

    it('should log the error', () => {
      expect(helpers.log).to.be.calledWith(
        'Bad request, parameters missing {"errors":[{"msg":"Invalid value","param":"x-api-key","location":"headers"}]}',
      )
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })
})
