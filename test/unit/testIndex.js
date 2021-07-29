const expect = require('chai').expect
const { describe, it } = require('mocha')

const index = require('../../index')

describe('index.js unit tests:', () => {
  it('exports ALERT_TYPE', () => {
    expect(index.ALERT_TYPE).not.to.be.undefined
  })

  it('exports AlertSession', () => {
    expect(index.AlertSession).not.to.be.undefined
  })

  it('exports BraveAlerter', () => {
    expect(index.BraveAlerter).not.to.be.undefined
  })

  it('exports CHATBOT_STATE', () => {
    expect(index.CHATBOT_STATE).not.to.be.undefined
  })

  it('exports helpers', () => {
    expect(index.helpers).not.to.be.undefined
  })

  it('exports HistoricAlert', () => {
    expect(index.HistoricAlert).not.to.be.undefined
  })

  it('exports Location', () => {
    expect(index.Location).not.to.be.undefined
  })

  it('exports SYSTEM', () => {
    expect(index.SYSTEM).not.to.be.undefined
  })
})
