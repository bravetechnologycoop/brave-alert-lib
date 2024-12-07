// Third-party dependencies
const expect = require('chai').expect
const { describe, it } = require('mocha')

// In-house dependencies
const index = require('../../index')

describe('index.js unit tests:', () => {
  it('exports Client', () => {
    expect(index.Client).not.to.be.undefined
  })

  it('exports ClientExtension', () => {
    expect(index.ClientExtension).not.to.be.undefined
  })

  it('exports Session', () => {
    expect(index.Session).not.to.be.undefined
  })

  it('exports Device', () => {
    expect(index.Device).not.to.be.undefined
  })

  it('exports Gateway', () => {
    expect(index.Gateway).not.to.be.undefined
  })

  it('exports GatewaysVital', () => {
    expect(index.GatewaysVital).not.to.be.undefined
  })

  it('exports ButtonsVital', () => {
    expect(index.ButtonsVital).not.to.be.undefined
  })

  it('exports SensorsVital', () => {
    expect(index.SensorsVital).not.to.be.undefined
  })

  it('exports ALERT_TYPE', () => {
    expect(index.ALERT_TYPE).not.to.be.undefined
  })

  it('exports CHATBOT_STATE', () => {
    expect(index.CHATBOT_STATE).not.to.be.undefined
  })

  it('exports DEVICE_TYPE', () => {
    expect(index.DEVICE_TYPE).not.to.be.undefined
  })

  it('exports factories', () => {
    expect(index.factories).not.to.be.undefined
  })

  it('exports helpers', () => {
    expect(index.helpers).not.to.be.undefined
  })

  it('exports twilioHelpers', () => {
    expect(index.twilioHelpers).not.to.be.undefined
  })

  it('exports googleHelpers', () => {
    expect(index.googleHelpers).not.to.be.undefined
  })
  
  it('exports STATUS', () => {
    expect(index.STATUS).not.to.be.undefined
  })
})
