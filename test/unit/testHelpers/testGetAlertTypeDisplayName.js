const expect = require('chai').expect
const { describe, it } = require('mocha')

const helpers = require('../../../lib/helpers')

describe('helpers.js unit tests: getAlertTypeDisplayName', () => {
  it('given Alert type, Language, t-function, then returns the human readable displayName of that AlertType in that language according to the t function', () => {
    const parameters = {
      alertType: 'SENSOR_STILLNESS',
      language: 'en',
      t: function mock_t(key, options) {
        return `${key} - ${options.lng}`
      },
    }

    const actual = helpers.getAlertTypeDisplayName(parameters.alertType, parameters.language, parameters.t)

    expect(actual).to.equal(`SENSOR_STILLNESS - en`)
  })
})
