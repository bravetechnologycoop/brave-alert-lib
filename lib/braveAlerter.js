const express = require('express')
const jsonBodyParser = require('body-parser').json()
const Validator = require('express-validator')

const AlertSession = require('./alertSession')
const CHATBOT_STATE = require('./chatbotStateEnum')
const AlertStateMachine = require('./alertStateMachine')
const helpers = require('./helpers')
const twilio = require('./twilio')
const { handleDesignateDevice } = require('./designateDevice')

class BraveAlerter {
  // See README for description of parameters
  // eslint-disable-next-line prettier/prettier
  constructor(getAlertSession, getAlertSessionByPhoneNumber, alertSessionChangedCallback, getLocationByAlertApiKey, getHistoricAlertsByAlertApiKey, getNewNotificationsCountByAlertApiKey, asksIncidentDetails, getReturnMessage) {
    this.getAlertSession = getAlertSession
    this.getAlertSessionByPhoneNumber = getAlertSessionByPhoneNumber
    this.alertSessionChangedCallback = alertSessionChangedCallback
    this.getLocationByAlertApiKey = getLocationByAlertApiKey
    this.getHistoricAlertsByAlertApiKey = getHistoricAlertsByAlertApiKey
    this.getNewNotificationsCountByAlertApiKey = getNewNotificationsCountByAlertApiKey

    this.router = express.Router()
    this.router.post('/alert/sms', jsonBodyParser, this.handleTwilioRequest.bind(this))
    this.router.post(
      '/alert/designatedevice',
      jsonBodyParser,
      Validator.body(['verificationCode', 'responderPushId']).notEmpty(),
      Validator.header(['X-API-KEY']).notEmpty(),
      handleDesignateDevice,
    )
    this.router.get('/alert/location', Validator.header(['X-API-KEY']).notEmpty(), this.handleGetLocation.bind(this))
    this.router.get(
      '/alert/historicAlerts',
      Validator.header(['X-API-KEY']).notEmpty(),
      Validator.query(['maxHistoricAlerts']).isInt({ min: 0 }),
      this.handleGetHistoricAlerts.bind(this),
    )
    this.router.get('/alert/newNotificationsCount', Validator.header(['X-API-KEY']).notEmpty(), this.handleGetNewNotificationsCount.bind(this))

    this.alertStateMachine = new AlertStateMachine(asksIncidentDetails, getReturnMessage)
  }

  getRouter() {
    return this.router
  }

  /* eslint-disable class-methods-use-this */
  async sendSingleAlert(toPhoneNumber, fromPhoneNumber, message) {
    let response
    try {
      response = await twilio.sendTwilioMessage(toPhoneNumber, fromPhoneNumber, message)
    } catch (err) {
      // Error handling will be done below because response is undefined
      helpers.logError(err)
    }

    if (response === undefined) {
      helpers.logError(`Failed to send single alert to ${toPhoneNumber} from ${fromPhoneNumber}: ${message}`)
    }
  }

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
      const changedAlertSession = new AlertSession(alertInfo.sessionId, CHATBOT_STATE.STARTED)
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

      if (alertSession.alertState === CHATBOT_STATE.STARTED) {
        // Send reminder message
        if (alertInfo.toPhoneNumber && alertInfo.fromPhoneNumber) {
          const response = await twilio.sendTwilioMessage(alertInfo.toPhoneNumber, alertInfo.fromPhoneNumber, alertInfo.reminderMessage)

          if (response) {
            const changedAlertSession = new AlertSession(alertInfo.sessionId, CHATBOT_STATE.WAITING_FOR_REPLY)
            await this.alertSessionChangedCallback(changedAlertSession)
          } else {
            // TODO Better error handling (maybe try to send the fallback message immediately)
            helpers.logError(`Failed to send reminder message for session ${alertInfo.sessionId}`)
          }
        }
      }
    } catch (err) {
      // TODO Better error handling (maybe try to send the fallback message immediately)
      helpers.logError(`Failed to send reminder message for session ${alertInfo.sessionId}. ${err.toString()}`)
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

      if (!twilio.isValidTwilioRequest(request)) {
        const errorMessage = `Bad request to ${request.path}: Sender ${request.body.From} is not Twilio`
        helpers.logError(errorMessage)
        response.status(401).send(errorMessage)
        return
      }

      const fromPhoneNumber = request.body.From
      const toPhoneNumber = request.body.To
      const message = request.body.Body

      const alertSession = await this.getAlertSessionByPhoneNumber(toPhoneNumber)
      if (alertSession === null) {
        helpers.log(`Received twilio message from ${fromPhoneNumber} to ${toPhoneNumber} with no corresponding open session: ${message}`)
        response.status(200).send()
        return
      }

      // Ensure message was sent from the Responder phone
      if (fromPhoneNumber !== alertSession.responderPhoneNumber) {
        const errorMessage = `Bad request to ${request.path}: ${fromPhoneNumber} is not the responder phone for ${alertSession.sessionId}`
        helpers.logError(errorMessage)
        response.status(400).send(errorMessage)
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
    const validationErrors = Validator.validationResult(request).formatWith(helpers.formatExpressValidationErrors)

    if (validationErrors.isEmpty()) {
      const alertApiKey = request.header('X-API-KEY')

      const location = await this.getLocationByAlertApiKey(alertApiKey)
      if (location) {
        response.status(200).json(JSON.stringify(location))
      } else {
        response.status(200).json(JSON.stringify({}))
      }
    } else {
      const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
      helpers.logError(errorMessage)
      response.status(400).send(errorMessage)
    }
  }

  async handleGetHistoricAlerts(request, response) {
    const validationErrors = Validator.validationResult(request).formatWith(helpers.formatExpressValidationErrors)

    if (validationErrors.isEmpty()) {
      const { maxHistoricAlerts } = request.query
      const alertApiKey = request.header('X-API-KEY')

      const historicAlerts = await this.getHistoricAlertsByAlertApiKey(alertApiKey, maxHistoricAlerts)
      if (historicAlerts === null) {
        const errorMessage = `Something went wrong in request to ${request.path}. Historic Alerts is null.`
        helpers.logError(errorMessage)
        response.status(500).send(errorMessage)
      }

      response.status(200).json(JSON.stringify(historicAlerts))
    } else {
      const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
      helpers.logError(errorMessage)
      response.status(400).send(errorMessage)
    }
  }

  async handleGetNewNotificationsCount(request, response) {
    const validationErrors = Validator.validationResult(request).formatWith(helpers.formatExpressValidationErrors)

    if (validationErrors.isEmpty()) {
      const alertApiKey = request.header('X-API-KEY')
      const newNotificationsCount = await this.getNewNotificationsCountByAlertApiKey(alertApiKey)
      response.status(200).json(JSON.stringify(newNotificationsCount))
    } else {
      const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
      helpers.logError(errorMessage)
      response.status(400).send(errorMessage)
    }
  }
}

module.exports = BraveAlerter
