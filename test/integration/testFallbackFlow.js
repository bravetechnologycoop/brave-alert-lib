const chai = require('chai')
const chaiHttp = require('chai-http');
const expect = require('chai').expect
const express = require('express')
const { afterEach, beforeEach, describe, it } = require('mocha')
const sinon = require('sinon')
const sinonChai = require("sinon-chai");

const AlertSession = require('../../lib/alertSession.js')
const ALERT_STATE = require('./../../lib/alertStateEnum.js')
const BraveAlerter = require ('./../../lib/braveAlerter.js')
const helpers = require ('./../../lib/helpers.js')

chai.use(chaiHttp);
chai.use(sinonChai)

const dummyGetAlertSession = function() { return 'getAlertSession' }
const dummyGetAlertSessionByPhoneNumber = function() { return 'getAlertSessionByPhoneNumber' }
const dummyAlertSessionChangedCallback = function() { return 'alertSessionChangedCallback' }
const dummyGetRetunMessages = function(fromAlertState, toAlertState) {
    return `${fromAlertState} --> ${toAlertState}`
}

const sessionId = 'guid-123'
const responderPhoneNumber = '+15147886598'
const devicePhoneNumber = '+15005550006'
const initialMessage = 'Ok'
const validIncidentCategories = {
    '1': 'one',
}
const initialAlertInfo = {
    sessionId: sessionId,
    toPhoneNumber: responderPhoneNumber,
    fromPhoneNumber: devicePhoneNumber,
    message: initialMessage,
    reminderTimeoutMillis: 1,          // 1 ms
    fallbackTimeoutMillis: 3000,       // 3 seconds
    reminderMessage: 'Reminder message',
    fallbackMessage: 'Fallback message',
    fallbackToPhoneNumber: '+15147332272',
    fallbackFromPhoneNumber: '+15005550006',
}

describe('fallback flow: responder never responds so fallback message is sent to manager', function() {
    beforeEach(function() {
        this.currentAlertSession = new AlertSession(
            sessionId,
            ALERT_STATE.STARTED,
            undefined,
            undefined,
            undefined,
            responderPhoneNumber,
            validIncidentCategories,
        )

        this.braveAlerter = new BraveAlerter(
            dummyGetAlertSession,
            dummyGetAlertSessionByPhoneNumber,
            dummyAlertSessionChangedCallback,
            true,
            dummyGetRetunMessages,
        )
        
        sinon.stub(this.braveAlerter, 'getAlertSession').returns(this.currentAlertSession)
        sinon.stub(this.braveAlerter, 'getAlertSessionByPhoneNumber').returns(this.currentAlertSession)
        sinon.stub(this.braveAlerter, 'alertSessionChangedCallback')

        this.app = express()
        this.app.use(this.braveAlerter.getRouter())
    })

    afterEach(function() {
        this.braveAlerter.getAlertSession.restore()
        this.braveAlerter.getAlertSessionByPhoneNumber.restore()
        this.braveAlerter.alertSessionChangedCallback.restore()
    })

    it('', async function() {
        // Initial alert sent to responder phone
        await this.braveAlerter.startAlertSession(initialAlertInfo)
        
        // Wait for the reminder to send
        await helpers.sleep(2000)
        
        // Expect the state to change to WAITING_FOR_REPLY
        expect(this.braveAlerter.alertSessionChangedCallback.getCall(0).args[0]).to.eql(new AlertSession(
            sessionId,
            ALERT_STATE.WAITING_FOR_REPLY,
        ))

        this.currentAlertSession.alertState = ALERT_STATE.WAITING_FOR_REPLY
            
        // Wait for the fallback to send
        await helpers.sleep(3000)

        // Expect the fallback return message from a successful Twilio request to be 'queued'
        expect(this.braveAlerter.alertSessionChangedCallback.getCall(1).args[0]).to.eql(new AlertSession(
            sessionId,
            undefined,
            undefined,
            undefined,
            'queued'
        ))
    })
})
