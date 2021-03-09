const express = require('express')
const jsonBodyParser = require('body-parser').json()
const Validator = require('express-validator')

const AlertSession = require('./alertSession')
const ALERT_STATE = require('./alertStateEnum')
const AlertStateMachine = require('./alertStateMachine')
const helpers = require('./helpers')
const twilio = require('./twilio')
const { handleDesignateDevice } = require('./designateDevice')

class BraveAlerter {
  // See README for description of parameters
  // eslint-disable-next-line prettier/prettier
  constructor(getAlertSession, getAlertSessionByPhoneNumber, alertSessionChangedCallback, getLocationByAlertApiKey, asksIncidentDetails, getReturnMessage) {
    this.getAlertSession = getAlertSession
    this.getAlertSessionByPhoneNumber = getAlertSessionByPhoneNumber
    this.alertSessionChangedCallback = alertSessionChangedCallback
    this.getLocationByAlertApiKey = getLocationByAlertApiKey

    this.router = express.Router()
    this.router.post('/alert/sms', jsonBodyParser, this.handleTwilioRequest.bind(this))
    this.router.post(
      '/alert/designatedevice',
      jsonBodyParser,
      Validator.body(['verificationCode']).notEmpty(),
      Validator.header(['X-API-KEY']).notEmpty(),
      handleDesignateDevice,
    )
    this.router.get('/alert/location', Validator.header(['X-API-KEY']).notEmpty(), this.handleGetLocation.bind(this))

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
      helpers.logError(err)
    }

    if (response === undefined) {
      helpers.logError(`Failed to send single alert: ${message}`)
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
        helpers.logError(err)
      }
    }

    if (response !== undefined) {
      const changedAlertSession = new AlertSession(alertInfo.sessionId, ALERT_STATE.STARTED)
      await this.alertSessionChangedCallback(changedAlertSession)
    } else {
      // TODO Better error handling
      helpers.logError(`Failed to send alert for session ${alertInfo.sessionId}`)
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
            helpers.logError(`Failed to send reminder message for session ${alertInfo.sessionId}`)
          }
        }
      }
    } catch (err) {
      // TODO Better error handling (maybe try to send the fallback message immediately)
      helpers.logError(`Failed to send reminder message for session ${alertInfo.sessionId}. ${JSON.stringify(err)}`)
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
            helpers.logError(`Failed to send any fallbacks for session ${alertInfo.sessionId}`)
          }
        }
      }
    } catch (err) {
      // TODO Better error handling
      helpers.logError(`Failed to send any fallbacks for session ${alertInfo.sessionId}. ${JSON.stringify(err)}`)
    }
  }

  async handleTwilioRequest(request, response) {
    try {
      const requiredBodyParams = ['Body', 'From', 'To']
      if (!helpers.isValidRequest(request, requiredBodyParams)) {
        helpers.log('Bad request to /: Body, From, or To fields are missing')
        response.status(400).send()
        return
      }

      if (!twilio.isValidTwilioRequest(request)) {
        helpers.log('Bad request to /: Sender is not Twilio')
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
      helpers.logError(err)
      response.status(500).send()
    }
  }

  async handleGetLocation(request, response) {
    const validationErrors = Validator.validationResult(request)

    if (validationErrors.isEmpty()) {
      const alertApiKey = request.header('X-API-KEY')

      const location = await this.getLocationByAlertApiKey(alertApiKey)
      if (location) {
        response.status(200).json(JSON.stringify(location))
      } else {
        response.status(200).json(JSON.stringify({}))
      }
    } else {
      helpers.log(`Bad request to ${request.path}: ${JSON.stringify(validationErrors)}`)
      response.status(400).send()
    }
  }
}

module.exports = BraveAlerter
