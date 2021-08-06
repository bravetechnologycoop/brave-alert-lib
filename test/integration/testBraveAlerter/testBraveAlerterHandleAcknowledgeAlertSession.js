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

chai.use(chaiHttp)
chai.use(sinonChai)

const sandbox = sinon.createSandbox()

describe('braveAlerter.js integration tests: handleAcknowledgeAlertSession', () => {
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

      this.braveAlerter = testingHelpers.braveAlerterFactory({
        getAlertSessionBySessionIdAndAlertApiKey: () => {
          return new AlertSession(this.goodSessionId, CHATBOT_STATE.STARTED)
        },
        alertSessionChangedCallback: sandbox.stub(),
      })

      const app = express()
      app.use(this.braveAlerter.getRouter())

      this.response = await chai
        .request(app)
        .post('/alert/acknowledgeAlertSession')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({ sessionId: this.goodSessionId })
    })

    it('should not log any errors', () => {
      expect(helpers.logError).not.to.be.called
    })

    it('should return 200', () => {
      expect(this.response.status).to.equal(200)
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
        .post('/alert/acknowledgeAlertSession')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({})
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/acknowledgeAlertSession: sessionId (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })

  describe('given that sessionId is blank', () => {
    beforeEach(async () => {
      const braveAlerter = testingHelpers.braveAlerterFactory()

      const app = express()
      app.use(braveAlerter.getRouter())

      this.response = await chai
        .request(app)
        .post('/alert/acknowledgeAlertSession')
        .set('X-API-KEY', '00000000-000000000000000')
        .send({ sessionId: '' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/acknowledgeAlertSession: sessionId (Invalid value)')
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
        .post('/alert/acknowledgeAlertSession')
        .send({ sessionId: 'sessionId' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/acknowledgeAlertSession: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
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
        .post('/alert/acknowledgeAlertSession')
        .set('X-API-KEY', '')
        .send({ sessionId: 'sessionId' })
    })

    it('should log the error', () => {
      expect(helpers.logError).to.be.calledWith('Bad request to /alert/acknowledgeAlertSession: x-api-key (Invalid value)')
    })

    it('should return 400', () => {
      expect(this.response.status).to.equal(400)
    })
  })
})
