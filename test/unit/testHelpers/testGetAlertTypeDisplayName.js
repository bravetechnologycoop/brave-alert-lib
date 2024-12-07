// Third-party dependencies
const expect = require('chai').expect
const { describe, it } = require('mocha')

// In-house dependencies
const helpers = require('../../../lib/helpers')

describe('helpers.js unit tests: getAlertTypeDisplayName', () => {
  it('should return the human-readable display name of the alert type in the specified language using the provided translation function', () => {
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
