// Third-party dependencies
const { expect } = require('chai')
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chai = require('chai')
const axios = require('axios')

// In-house dependencies
const helpers = require('../../../lib/helpers')
const clickUpHelpers = require('../../../lib/clickUpHelpers')
const testingHelpers = require('../../testingHelpers')

chai.use(sinonChai)

const sandbox = sinon.createSandbox()

describe('clickUpHelpers.js unit tests: clickUpChecker', () => {
  beforeEach(() => {
    sandbox.spy(helpers, 'log')
    sandbox.spy(helpers, 'logError')

    this.clickUpTeamName = 'teamName'
    this.clickUpTeamId = 'teamId'
    sandbox
      .stub(helpers, 'getEnvVar')
      .withArgs('CLICKUP_TEAM_NAME')
      .returns(this.clickUpTeamName)
      .withArgs('CLICKUP_TEAM_ID')
      .returns(this.clickUpTeamId)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('when given a valid token, clickup team name, and clickup team ID', () => {
    beforeEach(async () => {
      sandbox.stub(axios, 'get').returns({
        data: {
          teams: [
            {
              name: this.clickUpTeamName,
              id: this.clickUpTeamId,
            },
          ],
        },
      })

      this.myToken = 'myClickUpToken'
      this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)
      this.nextStub = sandbox.stub()
      await clickUpHelpers.clickUpChecker(
        {
          body: {
            clickupToken: this.myToken,
          },
        },
        this.fakeExpressResponse,
        this.nextStub,
      )
    })

    it('should make a request for the ClickUp teams using the given token', () => {
      expect(axios.get).to.be.calledWithExactly('https://api.clickup.com/api/v2/team', {
        headers: {
          Authorization: this.myToken,
        },
      })
    })

    it('should call the next function', () => {
      expect(this.nextStub).to.be.called
    })

    it('should not log any errors', () => {
      expect(helpers.logError).not.to.be.called
    })

    it('should not log any information', () => {
      expect(helpers.log).not.to.be.called
    })
  })

  describe('when given a valid token and clickup team name but an invalid clickup team ID', () => {
    beforeEach(async () => {
      sandbox.stub(axios, 'get').returns({
        data: {
          teams: [
            {
              name: this.clickUpTeamName,
              id: 'invalidId',
            },
          ],
        },
      })

      this.myToken = 'myClickUpToken'
      this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)
      this.nextStub = sandbox.stub()
      await clickUpHelpers.clickUpChecker(
        {
          body: {
            clickupToken: this.myToken,
          },
        },
        this.fakeExpressResponse,
        this.nextStub,
      )
    })

    it('should make a request for the ClickUp teams using the given token', () => {
      expect(axios.get).to.be.calledWithExactly('https://api.clickup.com/api/v2/team', {
        headers: {
          Authorization: this.myToken,
        },
      })
    })

    it('should not call the next function', () => {
      expect(this.nextStub).not.to.be.called
    })

    it('should return status 401', () => {
      expect(this.fakeExpressResponse.status).to.be.calledWith(401)
    })

    it('should return an error message', () => {
      expect(this.fakeExpressResponse.send).to.be.calledWith({ message: 'Error in ClickUp Authentication' })
    })

    it('should log the information about the error', () => {
      expect(helpers.log).to.be.calledWithExactly('ClickUp Team Name and ID are not accessible using this ClickUp Token')
    })
  })

  describe('when given a valid token and clickup team id but an invalid clickup team name', () => {
    beforeEach(async () => {
      sandbox.stub(axios, 'get').returns({
        data: {
          teams: [
            {
              name: 'invalidName',
              id: this.clickUpTeamId,
            },
          ],
        },
      })

      this.myToken = 'myClickUpToken'
      this.nextStub = sandbox.stub()
      this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)
      await clickUpHelpers.clickUpChecker(
        {
          body: {
            clickupToken: this.myToken,
          },
        },
        this.fakeExpressResponse,
        this.nextStub,
      )
    })

    it('should make a request for the ClickUp teams using the given token', () => {
      expect(axios.get).to.be.calledWithExactly('https://api.clickup.com/api/v2/team', {
        headers: {
          Authorization: this.myToken,
        },
      })
    })

    it('should not call the next function', () => {
      expect(this.nextStub).not.to.be.called
    })

    it('should return status 401', () => {
      expect(this.fakeExpressResponse.status).to.be.calledWith(401)
    })

    it('should return an error message', () => {
      expect(this.fakeExpressResponse.send).to.be.calledWith({ message: 'Error in ClickUp Authentication' })
    })

    it('should log the information about the error', () => {
      expect(helpers.log).to.be.calledWithExactly('ClickUp Team Name and ID are not accessible using this ClickUp Token')
    })
  })

  describe('when given a valid clickup team and and clickup team id but an invalid token', () => {
    beforeEach(async () => {
      sandbox.stub(axios, 'get').throws(new Error())

      this.myToken = 'myClickUpToken'
      this.fakeExpressResponse = testingHelpers.mockResponse(sandbox)
      this.nextStub = sandbox.stub()
      await clickUpHelpers.clickUpChecker(
        {
          body: {
            clickupToken: 'invalidToken',
          },
        },
        this.fakeExpressResponse,
        this.nextStub,
      )
    })

    it('should not call the next function', () => {
      expect(this.nextStub).not.to.be.called
    })

    it('should return status 401', () => {
      expect(this.fakeExpressResponse.status).to.be.calledWith(401)
    })

    it('should return an error message', () => {
      expect(this.fakeExpressResponse.send).to.be.calledWith({ message: 'Error in ClickUp Authentication' })
    })

    it('should log the errors', () => {
      expect(helpers.logError).to.be.called
    })
  })
})
