// Third-party dependencies
const { expect } = require('chai')
const { describe, it } = require('mocha')

// In-house dependencies
const { formatDateTimeForDashboard } = require('../../../lib/helpers')

describe('dashboard.js unit tests: formatDateTimeForDashboard', () => {
  it('should format the JS date into a English Pacific Timezone string', () => {
    const actual = formatDateTimeForDashboard(new Date('2022-01-08T00:29:00.000Z'))
    expect(actual).to.equal('2022 Jan 7, 16:29:00 PST')
  })
})
