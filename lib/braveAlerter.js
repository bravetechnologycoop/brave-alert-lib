// Third-party dependencies
const express = require('express')

// In-house dependencies
const AlertSession = require('./alertSession')
const CHATBOT_STATE = require('./chatbotStateEnum')
const AlertStateMachine = require('./alertStateMachine')
const helpers = require('./helpers')
const twilioHelpers = require('./twilioHelpers')

const jsonBodyParser = express.json()

class BraveAlerter {
  // See README for description of parameters
  // eslint-disable-next-line prettier/prettier
  constructor(
    getAlertSession,
    getAlertSessionByPhoneNumbers,
    alertSessionChangedCallback,
    getReturnMessageToRespondedByPhoneNumber,
    getReturnMessageToOtherResponderPhoneNumbers,
  ) {
    this.getAlertSession = getAlertSession
    this.getAlertSessionByPhoneNumbers = getAlertSessionByPhoneNumbers
    this.alertSessionChangedCallback = alertSessionChangedCallback
    this.getReturnMessageToRespondedByPhoneNumber = getReturnMessageToRespondedByPhoneNumber
    this.getReturnMessageToOtherResponderPhoneNumbers = getReturnMessageToOtherResponderPhoneNumbers

    this.router = express.Router()
    this.router.post('/alert/sms', jsonBodyParser, this.handleTwilioRequest.bind(this))

    this.alertStateMachine = new AlertStateMachine(getReturnMessageToRespondedByPhoneNumber, getReturnMessageToOtherResponderPhoneNumbers)
  }

  getRouter() {
    return this.router
  }

  /* eslint-disable class-methods-use-this */
  async sendSingleAlert(toPhoneNumber, fromPhoneNumber, message) {
    let response
    try {
      response = await twilioHelpers.sendTwilioMessage(toPhoneNumber, fromPhoneNumber, message)
    } catch (err) {
      // Error handling will be done below because response is undefined
      helpers.logError(err)
    }

    if (response === undefined) {
      helpers.logError(`Failed to send single alert to ${toPhoneNumber} from ${fromPhoneNumber}: ${message}`)
    }
  }

  /* eslint-disable class-methods-use-this */
  async sendAlertSessionUpdate(sessionId, toPhoneNumbers, fromPhoneNumber, textMessage) {
    let response
    try {
      if (toPhoneNumbers && toPhoneNumbers.length > 0 && fromPhoneNumber) {
        // Send update(s) using SMS
        const promises = []
        toPhoneNumbers.forEach(toPhoneNumber => {
          promises.push(twilioHelpers.sendTwilioMessage(toPhoneNumber, fromPhoneNumber, textMessage))
        })
        response = await Promise.all(promises)
      }
    } catch (err) {
      helpers.logError(err)
    }

    if (response === undefined || (Array.isArray(response) && response.every(r => r === undefined))) {
      helpers.logError(`Failed to send alert update for session ${sessionId}: ${textMessage}`)
    }
  }

  // See README for description of alertInfo
  async startAlertSession(alertInfo) {
    let response

    try {
      if (alertInfo.toPhoneNumbers && alertInfo.toPhoneNumbers.length > 0 && alertInfo.fromPhoneNumber) {
        // Send initial messages(s) using SMS
        const promises = []
        alertInfo.toPhoneNumbers.forEach(toPhoneNumber => {
          promises.push(twilioHelpers.sendTwilioMessage(toPhoneNumber, alertInfo.fromPhoneNumber, alertInfo.message))
        })
        response = await Promise.all(promises)
      }
    } catch (err) {
      // Error handling will be done below because response is undefined
      helpers.logError(err)
    }

    if (response === undefined || (Array.isArray(response) && response.every(r => r === undefined))) {
      // TODO Better error handling
      helpers.logError(`Failed to send alert for session ${alertInfo.sessionId}`)
    } else if (response.data !== undefined && response.data.errors !== undefined) {
      helpers.logError(`Failed to send alert for session ${alertInfo.sessionId}: ${JSON.stringify(response.data.errors)}`)
    } else {
      const changedAlertSession = new AlertSession(alertInfo.sessionId, CHATBOT_STATE.STARTED)
      await this.alertSessionChangedCallback(changedAlertSession)
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
    let response

    try {
      const alertSession = await this.getAlertSession(alertInfo.sessionId)

      if (alertSession.alertState !== CHATBOT_STATE.STARTED) {
        return
      }

      if (alertInfo.toPhoneNumbers && alertInfo.toPhoneNumbers.length > 0 && alertInfo.fromPhoneNumber) {
        // Send reminder(s) using SMS
        const promises = []
        alertInfo.toPhoneNumbers.forEach(toPhoneNumber => {
          promises.push(twilioHelpers.sendTwilioMessage(toPhoneNumber, alertInfo.fromPhoneNumber, alertInfo.reminderMessage))
        })
        response = await Promise.all(promises)
      }
    } catch (err) {
      // TODO Better error handling (maybe try to send the fallback message immediately)
      helpers.logError(`Failed to send reminder message for session ${alertInfo.sessionId}. ${err.toString()}`)
    }

    if (response === undefined || (Array.isArray(response) && response.every(r => r === undefined))) {
      // TODO Better error handling (maybe try to send the fallback message immediately)
      helpers.logError(`Failed to send reminder message for session ${alertInfo.sessionId}`)
    } else if (response.data !== undefined && response.data.errors !== undefined) {
      helpers.logError(`Failed to send reminder message for session ${alertInfo.sessionId}: ${JSON.stringify(response.data.errors)}`)
    } else {
      const changedAlertSession = new AlertSession(alertInfo.sessionId, CHATBOT_STATE.WAITING_FOR_REPLY)
      await this.alertSessionChangedCallback(changedAlertSession)
    }
  }

  async sendFallbackMessagesForSession(alertInfo) {
    try {
      const alertSession = await this.getAlertSession(alertInfo.sessionId)

      if (alertSession.alertState === CHATBOT_STATE.WAITING_FOR_REPLY) {
        // Send fallback alert(s)
        if (alertInfo.fallbackToPhoneNumbers && alertInfo.fallbackFromPhoneNumber) {
          const promises = []
          alertInfo.fallbackToPhoneNumbers.forEach(fallbackToPhoneNumber => {
            promises.push(twilioHelpers.sendTwilioMessage(fallbackToPhoneNumber, alertInfo.fallbackFromPhoneNumber, alertInfo.fallbackMessage))
          })
          const responses = await Promise.all(promises)

          if (!responses || responses.every(r => r === undefined)) {
            // TODO Better error handling
            helpers.logError(`Failed to send any fallbacks for session ${alertInfo.sessionId}`)
          }
        }
      }
    } catch (err) {
      // TODO Better error handling
      helpers.logError(`Failed to send any fallbacks for session ${alertInfo.sessionId}. ${err.toString()}`)
    }
  }

  async handleTwilioRequest(request, response) {
    try {
      const requiredBodyParams = ['Body', 'From', 'To']
      if (!helpers.isValidRequest(request, requiredBodyParams)) {
        const errorMessage = `Bad request to ${request.path}: Body, From, or To fields are missing`
        helpers.logError(errorMessage)
        response.status(400).send(errorMessage)
        return
      }

      if (!twilioHelpers.isValidTwilioRequest(request)) {
        const errorMessage = `Bad request to ${request.path}: Sender ${request.body.From} is not Twilio`
        helpers.logError(errorMessage)
        response.status(401).send(errorMessage)
        return
      }

      const fromPhoneNumber = request.body.From
      const toPhoneNumber = request.body.To
      const message = request.body.Body

      const alertSession = await this.getAlertSessionByPhoneNumbers(toPhoneNumber, fromPhoneNumber)
      if (alertSession === null) {
        helpers.log(`Received twilio message from ${fromPhoneNumber} to ${toPhoneNumber} with no corresponding open session`)
        response.status(200).send()
        return
      }

      // Process the message through the state machine
      const { nextAlertState, incidentCategoryKey, returnMessageToRespondedByPhoneNumber, returnMessageToOtherResponderPhoneNumbers } =
        this.alertStateMachine.processStateTransitionWithMessage(
          alertSession.alertState,
          message,
          alertSession.validIncidentCategoryKeys,
          alertSession.validIncidentCategories,
          alertSession.language,
        )

      // Store the results and idemopotently get the respondedByPhoneNumber for the session
      const changedAlertSession = new AlertSession(alertSession.sessionId, nextAlertState, fromPhoneNumber, incidentCategoryKey)
      const respondedByPhoneNumber = await this.alertSessionChangedCallback(changedAlertSession)

      if (respondedByPhoneNumber === fromPhoneNumber) {
        // Send the response to the designated RespondedByPhoneNumber
        if (returnMessageToRespondedByPhoneNumber !== null) {
          await twilioHelpers.sendTwilioMessage(respondedByPhoneNumber, toPhoneNumber, returnMessageToRespondedByPhoneNumber)
        }

        // Send the response to all the other ResponderPhoneNumbers
        if (returnMessageToOtherResponderPhoneNumbers !== null) {
          for (const otherResponderPhoneNumber of alertSession.responderPhoneNumbers) {
            if (otherResponderPhoneNumber !== respondedByPhoneNumber) {
              await twilioHelpers.sendTwilioMessage(otherResponderPhoneNumber, toPhoneNumber, returnMessageToOtherResponderPhoneNumbers)
            }
          }
        }
      }

      response.status(200).send()
    } catch (err) {
      helpers.logError(err)
      response.status(500).send()
    }
  }
}

module.exports = BraveAlerter
