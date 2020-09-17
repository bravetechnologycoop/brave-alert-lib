const expect = require('chai').expect
const { describe, it } = require('mocha')

const index = require('./../../index.js')

describe('index.js unit tests:', function() {
    it('exports BraveAlerter', function() {
        expect(index.BraveAlerter).not.to.be.undefined
    })

    it('exports helpers', function() {
        expect(index.helpers).not.to.be.undefined
    })

    it('exports ALERT_STATE', function() {
        expect(index.ALERT_STATE).not.to.be.undefined
    })

    it('exports AlertSession', function() {
        expect(index.AlertSession).not.to.be.undefined
    })
})