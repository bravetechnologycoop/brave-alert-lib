const express = require('express')
const jsonBodyParser = require('body-parser').json()

const AlertSession = require('./alertSession.js')
const ALERT_STATE = require('./alertStateEnum.js')
const AlertStateMachine = require('./alertStateMachine.js')
const helpers = require('./helpers.js')
const twilio = require('./twilio.js')

class BraveAlerter {
    // See README for description of parameters
    constructor(getAlertSession, getAlertSessionByPhoneNumber, alertSessionChangedCallback, asksIncidentDetails, getReturnMessage) {
        this.getAlertSession = getAlertSession
        this.getAlertSessionByPhoneNumber = getAlertSessionByPhoneNumber
        this.alertSessionChangedCallback = alertSessionChangedCallback

        this.router = express.Router()
        this.router.post('/alert/sms', jsonBodyParser, this.handleTwilioRequest.bind(this))

        this.alertStateMachine = new AlertStateMachine(
            asksIncidentDetails,
            getReturnMessage,
        )
    }

    getRouter() {
        return this.router
    }

    async sendSingleAlert(toPhoneNumber, fromPhoneNumber, message) {
        const response = await twilio.sendTwilioMessage(
            toPhoneNumber,
            fromPhoneNumber,
            message
        )

        if (response !== undefined) {
            helpers.log(response.sid)
        } else {
            helpers.log(`Failed to send single alert: ${message}`)
        }
    }

    // See README for description of alertInfo
    async startAlertSession(alertInfo) {
        let response

        // Send initial message
        if (alertInfo.toPhoneNumber && alertInfo.fromPhoneNumber) {
            response = await twilio.sendTwilioMessage(
                alertInfo.toPhoneNumber,
                alertInfo.fromPhoneNumber,
                alertInfo.message
            )
        }
        
        if (response !== undefined) {
            const changedAlertSession = new AlertSession(
                alertInfo.sessionId,
                ALERT_STATE.STARTED,
            )
            await this.alertSessionChangedCallback(changedAlertSession)

            helpers.log(response.sid)
        } else {
            // TODO Better error handling
            helpers.log(`Failed to send alert for session ${alertInfo.sessionId}`)
        }

        if (alertInfo.reminderTimeoutMillis && alertInfo.reminderTimeoutMillis > 0) {
            // Set a timer for the reminder
            setTimeout(
                this.sendReminderMessageForSession.bind(this),
                alertInfo.reminderTimeoutMillis,
                alertInfo
            )
        }

        if (alertInfo.fallbackTimeoutMillis && alertInfo.fallbackTimeoutMillis > 0) {
            // Set a timer for the fallback
            setTimeout(
                this.sendFallbackMessageForSession.bind(this),
                alertInfo.fallbackTimeoutMillis,
                alertInfo
            )
        }
    }

    async sendReminderMessageForSession(alertInfo) {
        const alertSession = await this.getAlertSession(alertInfo.sessionId)

        if (alertSession.alertState === ALERT_STATE.STARTED) {
            // Send reminder message
            if (alertInfo.toPhoneNumber && alertInfo.fromPhoneNumber) {
                const response = await twilio.sendTwilioMessage(
                    alertInfo.toPhoneNumber,
                    alertInfo.fromPhoneNumber,
                    alertInfo.reminderMessage
                )

                if (response) {
                    const changedAlertSession = new AlertSession(
                        alertInfo.sessionId,
                        ALERT_STATE.WAITING_FOR_REPLY,
                    )
                    await this.alertSessionChangedCallback(changedAlertSession)

                    helpers.log(response.sid)
                } else {
                    // TODO Better error handling (maybe try to send the fallback message immediately)
                    helpers.log(`Failed to send reminder message for session ${alertInfo.sessionId}`)
                }
            }
        }
    }

    async sendFallbackMessageForSession(alertInfo) {
        const alertSession = await this.getAlertSession(alertInfo.sessionId)

        if (alertSession.alertState === ALERT_STATE.WAITING_FOR_REPLY) {
            // Send fallback alert
            if (alertInfo.fallbackToPhoneNumber && alertInfo.fallbackFromPhoneNumber) {
                const response = await twilio.sendTwilioMessage(
                    alertInfo.fallbackToPhoneNumber,
                    alertInfo.fallbackFromPhoneNumber,
                    alertInfo.fallbackMessage
                )

                if (response) {
                    const changedAlertSession = new AlertSession(
                        alertInfo.sessionId,
                    )
                    changedAlertSession.fallbackReturnMessage = response.status
                    await this.alertSessionChangedCallback(changedAlertSession)

                    helpers.log(response.sid)
                } else {
                    // TODO Better error handling
                    helpers.log(`Failed to send fallback for session ${alertInfo.sessionId}`)
                }
            }
        }
    }

    async handleTwilioRequest(request, response) {
        try {
            const requiredBodyParams = ['Body', 'From', 'To']
            if (!helpers.isValidRequest(request, requiredBodyParams)) {
                helpers.log('Bad request: Body, From, or To fields are missing')
                response.status(400).send()
                return
            }

            const fromPhoneNumber = request.body.From
            const toPhoneNumber = request.body.To
            const message = request.body.Body

            const alertSession = await this.getAlertSessionByPhoneNumber(toPhoneNumber)
            if (alertSession === null) {
                helpers.log(`Received twilio message with no corresponding open session: ${message}`)
                response.status(200).send()
                return
            }

            // Ensure message was sent from the Responder phone
            if (fromPhoneNumber !== alertSession.responderPhoneNumber) {
                helpers.log('Invalid Phone Number')
                response.status(400).send()
                return
            }

            // Process the message through the state machine
            const { nextAlertState, incidentCategory, details, returnMessage }
                    = this.alertStateMachine.processStateTransitionWithMessage(alertSession.alertState, message, alertSession.validIncidentCategories)

            // Store the results
            const changedAlertSession = new AlertSession(
                alertSession.sessionId,
                nextAlertState,
                incidentCategory,
                details,
            )
            await this.alertSessionChangedCallback(changedAlertSession)

            // Send the response
            await twilio.sendTwilioResponse(response, returnMessage)
        } catch(err) {
            helpers.log(err)
            response.status(500).send()
        }
    }
}

module.exports = BraveAlerter