const expect = require('chai').expect
const { describe, it } = require('mocha')

const index = require('../../index')

describe('index.js unit tests:', () => {
  it('exports BraveAlerter', () => {
    expect(index.BraveAlerter).not.to.be.undefined
  })

  it('exports helpers', () => {
    expect(index.helpers).not.to.be.undefined
  })

  it('exports ALERT_STATE', () => {
    expect(index.ALERT_STATE).not.to.be.undefined
  })

  it('exports AlertSession', () => {
    expect(index.AlertSession).not.to.be.undefined
  })
})
