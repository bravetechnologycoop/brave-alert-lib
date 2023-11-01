// Third-party dependencies
const { expect } = require('chai')
const { describe, it } = require('mocha')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const rewire = require('rewire')

// In-house dependencies
const googleHelpers = rewire('../../../lib/googleHelpers')
const { mockIDTokenFactory, mockOAuth2Client } = require('../../testingHelpers')

chai.use(chaiAsPromised)

// have googleHelpers use a mock OAuth2Client instead of Google's
// eslint-disable-next-line no-underscore-dangle
googleHelpers.__set__('paOAuth2Client', mockOAuth2Client)

describe('googleHelpers.js unit tests: paGetPayload', () => {
  // first case: unparesable ID token
  describe('for an unparseable ID token', () => {
    it('should throw an Error', () => {
      expect(googleHelpers.paGetPayload('gibberish')).to.be.rejected
      expect(googleHelpers.paGetPayload('')).to.be.rejected
      expect(googleHelpers.paGetPayload(undefined)).to.be.rejected
    })
  })

  /* There are 16 different cases for an ID token (2**4) as there are 4 qualities to check for:
   * whether the token is expired, whether it originated from PA, whether it is signed by Google, and whether it is for a Brave account.
   * This four loop generates each test case, and the behaviour expected for each case. */
  for (let n = 0; n < 16; n += 1) {
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
        `and ${reason.profile ? 'is not' : 'is'} for a Brave account`,
      () => {
        // if all four qualities of the ID token are met, then paGetPayload should resolve successfully and return a populated payload
        if (!reason.expired && !reason.audience && !reason.signature && !reason.profile) {
          it('should resolve successfully and return a populated payload', async () => {
            let error
            let payload

            try {
              payload = await googleHelpers.paGetPayload(mockIDTokenFactory(reason))
            } catch (err) {
              error = err
            }

            expect(!error).to.be.true
            expect(payload).to.include.all.keys('aud', 'iss', 'exp', 'hd', 'email', 'name')
          })
        } else {
          // for any other case, an Error should be thrown
          it('should throw an Error', () => {
            expect(googleHelpers.paGetPayload(mockIDTokenFactory(reason))).to.be.rejected
          })
        }
      },
    )
  }
})
