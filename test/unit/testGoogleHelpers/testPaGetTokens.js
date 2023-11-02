// Third-party dependencies
const { expect } = require('chai')
const { describe, it } = require('mocha')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const rewire = require('rewire')

// In-house dependencies
const googleHelpers = rewire('../../../lib/googleHelpers')
const { mockOAuth2Client } = require('../../testingHelpers')

chai.use(chaiAsPromised)

// have googleHelpers use a mock OAuth2Client instead of Google's
// eslint-disable-next-line no-underscore-dangle
googleHelpers.__set__('paOAuth2Client', mockOAuth2Client)

describe('googleHelpers.js unit tests: paGetTokens', () => {
  describe('for an invalid authorization code', () => {
    it('should throw an Error', () => {
      expect(googleHelpers.paGetTokens('invalid-authorization-code')).to.be.rejected
      expect(googleHelpers.paGetTokens('')).to.be.rejected
      expect(googleHelpers.paGetTokens(undefined)).to.be.rejected
    })
  })
  describe('for a valid authorization code', () => {
    it('should return an object containing idToken and accessToken', async () => {
      expect(googleHelpers.paGetTokens('valid-authorization-code')).to.eventually.include.all.keys('accessToken', 'idToken')
    })
  })
})
