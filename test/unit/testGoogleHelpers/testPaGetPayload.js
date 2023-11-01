// Third-party dependencies
const { expect } = require('chai')
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const axios = require('axios')
const rewire = require('rewire')

// In-house dependencies
const helpers = require('../../../lib/helpers')
const googleHelpers = rewire('../../../lib/googleHelpers')
const { mockIDTokenFactory, mockOAuth2Client } = require('../../testingHelpers')

// have googleHelpers use a mock OAuth2Client instead of Google's
googleHelpers.__set__('paOAuth2Client', new mockOAuth2Client)

// class definition of PayloadError
const PayloadError = googleHelpers.__get__('PayloadError')

chai.use(sinonChai)
chai.use(chaiAsPromised)

const sandbox = sinon.createSandbox()

describe('googleHelpers.js unit tests: paGetPayload', () => {
  /* There are 16 + 1 different cases for an ID token (2**4) as there are 4 qualities to check for:
   * whether the token is expired, whether it originated from PA, whether it is signed by Google, and whether it is for a Brave account.
   * This four loop generates each test case, and the behaviour expected for each case.
   * The + 1 test case is where the ID token is empty or absolute gibberish. */
  for (let n = 0; n < 16; n++) {
    const reason = {
      expired: !(Math.floor(n / 8) % 2), // 8 true, 8 false
      audience: !(Math.floor(n / 4) % 2), // 4 true, 4 false, 4 true, 4 false
      signature: !(Math.floor(n / 2) % 2), // 2 true, 2 false, 2 true, 2 false, ..
      profile: !(n % 2), // 1 true, 1 false, 1 true, 1 false, ..
    }

    describe(
      `for an ID token that ${reason.expired ? 'is' : 'is not'} expired, ` +
      `${reason.audience ? 'is not' : 'is'} from PA, ` +
      `${reason.signature ? 'is not' : 'is'} signed by Google, ` +
      `and ${reason.profile ? 'is not' :'is'} for a Brave account`, () => {

      // all expired ID tokens should throw an Error
      if (reason.expired) {
        it('should throw an Error for being expired', () => {
          expect(googleHelpers.paGetPayload(mockIDTokenFactory(reason))).to.be.rejectedWith(Error)
        })
      // if all four qualities of the ID token are met, then paGetPayload should resolve successfully and return a populated payload
      } else if (!reason.expired && !reason.audience && !reason.signature && !reason.profile) {
        it('should resolve successfully and return a populated payload', async () => {
          let error = undefined
          let payload = undefined

          try {
            payload = await googleHelpers.paGetPayload(mockIDTokenFactory(reason))
          } catch (err) {
            error = err
          }

          expect(!!error).to.be.false
          expect(payload).to.include.all.keys('aud', 'iss', 'exp', 'hd', 'email', 'name')
        })
      // all non-expired ID tokens should throw a PayloadError with a 'reason' attribute containing why the error was thrown
      } else {
        it(`should throw a PayloadError with reasons ${JSON.stringify(reason)}`, async () => {
          let payloadError = undefined

          try {
            await googleHelpers.paGetPayload(mockIDTokenFactory(reason))
          } catch (error) {
            payloadError = error
          }

          expect(payloadError)
            .to.be.an.instanceof(PayloadError)
            .and.to.have.deep.property('reason', reason)
        })
      }
    })
  }

  describe('for a completely invalid ID token', () => {
    it('should throw an Error for being unparsable', () => {
      expect(googleHelpers.paGetPayload('gibberish')).to.be.rejected
      expect(googleHelpers.paGetPayload('')).to.be.rejected
      expect(googleHelpers.paGetPayload(undefined)).to.be.rejected
    })
  })
})
