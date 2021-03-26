const express = require('express')
const jsonBodyParser = require('body-parser').json()

const AlertSession = require('./alertSession')
const ALERT_STATE = require('./alertStateEnum')
const AlertStateMachine = require('./alertStateMachine')
const helpers = require('./helpers')
const twilio = require('./twilio')

class BraveAlerter {
  // See README for description of parameters
  constructor(getAlertSession, getAlertSessionByPhoneNumber, alertSessionChangedCallback, asksIncidentDetails, getReturnMessage) {
    this.getAlertSession = getAlertSession
    this.getAlertSessionByPhoneNumber = getAlertSessionByPhoneNumber
    this.alertSessionChangedCallback = alertSessionChangedCallback

    this.router = express.Router()
    this.router.post('/alert/sms', jsonBodyParser, this.handleTwilioRequest.bind(this))

    this.alertStateMachine = new AlertStateMachine(asksIncidentDetails, getReturnMessage)
  }

  getRouter() {
    return this.router
  }

  /* eslint-disable class-methods-use-this */
  // TODO Make this a static function and remove the ESLint exception, but don't break its callers
  async sendSingleAlert(toPhoneNumber, fromPhoneNumber, message) {
    let response
    try {
      response = await twilio.sendTwilioMessage(toPhoneNumber, fromPhoneNumber, message)
    } catch (err) {
      // Error handling will be done below because response is undefined
      helpers.log(err)
    }

    if (response === undefined) {
      helpers.log(`Failed to send single alert: ${message}`)
    }
  }
  /* eslint-enable class-methods-use-this */

  // See README for description of alertInfo
  async startAlertSession(alertInfo) {
    let response

    // Send initial message
    if (alertInfo.toPhoneNumber && alertInfo.fromPhoneNumber) {
      try {
        response = await twilio.sendTwilioMessage(alertInfo.toPhoneNumber, alertInfo.fromPhoneNumber, alertInfo.message)
      } catch (err) {
        // Error handling will be done below because response is undefined
        helpers.log(err)
      }
    }

    if (response !== undefined) {
      const changedAlertSession = new AlertSession(alertInfo.sessionId, ALERT_STATE.STARTED)
      await this.alertSessionChangedCallback(changedAlertSession)
    } else {
      // TODO Better error handling
      helpers.log(`Failed to send alert for session ${alertInfo.sessionId}`)
    }

    if (alertInfo.reminderTimeoutMillis && alertInfo.reminderTimeoutMillis > 0) {
      // Set a timer for the reminder
      setTimeout(this.sendReminderMessageForSession.bind(this), alertInfo.reminderTimeoutMillis, alertInfo)
    }

    if (alertInfo.fallbackTimeoutMillis && alertInfo.fallbackTimeoutMillis > 0) {
      // Set a timer for the fallback
      setTimeout(this.sendFallbackMessagesForSession.bind(this), alertInfo.fallbackTimeoutMillis, alertInfo)
    }
  }

  async sendReminderMessageForSession(alertInfo) {
    try {
      const alertSession = await this.getAlertSession(alertInfo.sessionId)

      if (alertSession.alertState === ALERT_STATE.STARTED) {
        // Send reminder message
        if (alertInfo.toPhoneNumber && alertInfo.fromPhoneNumber) {
          const response = await twilio.sendTwilioMessage(alertInfo.toPhoneNumber, alertInfo.fromPhoneNumber, alertInfo.reminderMessage)

          if (response) {
            const changedAlertSession = new AlertSession(alertInfo.sessionId, ALERT_STATE.WAITING_FOR_REPLY)
            await this.alertSessionChangedCallback(changedAlertSession)
          } else {
            // TODO Better error handling (maybe try to send the fallback message immediately)
            helpers.log(`Failed to send reminder message for session ${alertInfo.sessionId}`)
          }
        }
      }
    } catch (err) {
      // TODO Better error handling (maybe try to send the fallback message immediately)
      helpers.log(`Failed to send reminder message for session ${alertInfo.sessionId}. ${JSON.stringify(err)}`)
    }
  }

  async sendFallbackMessagesForSession(alertInfo) {
    try {
      const alertSession = await this.getAlertSession(alertInfo.sessionId)

      if (alertSession.alertState === ALERT_STATE.WAITING_FOR_REPLY) {
        // Send fallback alert(s)
        if (alertInfo.fallbackToPhoneNumbers && alertInfo.fallbackFromPhoneNumber) {
          const promises = []
          alertInfo.fallbackToPhoneNumbers.forEach(fallbackToPhoneNumber => {
            promises.push(twilio.sendTwilioMessage(fallbackToPhoneNumber, alertInfo.fallbackFromPhoneNumber, alertInfo.fallbackMessage))
          })
          const responses = await Promise.all(promises)

          if (responses && !responses.every(r => r === undefined)) {
            const changedAlertSession = new AlertSession(alertInfo.sessionId)
            changedAlertSession.fallbackReturnMessage = responses.map(r => (r !== undefined ? r.status : 'no_response')).join(', ')
            await this.alertSessionChangedCallback(changedAlertSession)
          } else {
            // TODO Better error handling
            helpers.log(`Failed to send any fallbacks for session ${alertInfo.sessionId}`)
          }
        }
      }
    } catch (err) {
      // TODO Better error handling
      helpers.log(`Failed to send any fallbacks for session ${alertInfo.sessionId}. ${JSON.stringify(err)}`)
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

      if (!twilio.isValidTwilioRequest(request)) {
        helpers.log('Bad request: Sender is not Twilio')
        response.status(401).send()
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
      const { nextAlertState, incidentCategoryKey, details, returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
        alertSession.alertState,
        message,
        alertSession.validIncidentCategoryKeys,
        alertSession.validIncidentCategories,
      )

      // Store the results
      const changedAlertSession = new AlertSession(alertSession.sessionId, nextAlertState, incidentCategoryKey, details)
      await this.alertSessionChangedCallback(changedAlertSession)

      // Send the response
      await twilio.sendTwilioResponse(response, returnMessage)
    } catch (err) {
      helpers.log(err)
      response.status(500).send()
    }
  }
}

module.exports = BraveAlerter
