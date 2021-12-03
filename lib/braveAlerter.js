// Third-party dependencies
const express = require('express')
const Validator = require('express-validator')

// In-house dependencies
const AlertSession = require('./alertSession')
const CHATBOT_STATE = require('./chatbotStateEnum')
const AlertStateMachine = require('./alertStateMachine')
const helpers = require('./helpers')
const twilio = require('./twilio')
const OneSignal = require('./oneSignal')
const { handleDesignateDevice } = require('./designateDevice')

const jsonBodyParser = express.json()

class BraveAlerter {
  // See README for description of parameters
  // eslint-disable-next-line prettier/prettier
  constructor(
    getAlertSession,
    getAlertSessionByPhoneNumber,
    getAlertSessionBySessionIdAndAlertApiKey,
    alertSessionChangedCallback,
    getLocationByAlertApiKey,
    getActiveAlertsByAlertApiKey,
    getHistoricAlertsByAlertApiKey,
    getNewNotificationsCountByAlertApiKey,
    asksIncidentDetails,
    getReturnMessage,
  ) {
    this.getAlertSession = getAlertSession
    this.getAlertSessionByPhoneNumber = getAlertSessionByPhoneNumber
    this.getAlertSessionBySessionIdAndAlertApiKey = getAlertSessionBySessionIdAndAlertApiKey
    this.alertSessionChangedCallback = alertSessionChangedCallback
    this.getLocationByAlertApiKey = getLocationByAlertApiKey
    this.getActiveAlertsByAlertApiKey = getActiveAlertsByAlertApiKey
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
    this.router.get('/alert/activeAlerts', Validator.header(['X-API-KEY']).notEmpty(), this.handleGetActiveAlerts.bind(this))
    this.router.get(
      '/alert/historicAlerts',
      Validator.header(['X-API-KEY']).notEmpty(),
      Validator.query(['maxHistoricAlerts']).isInt({ min: 0 }),
      this.handleGetHistoricAlerts.bind(this),
    )
    this.router.get('/alert/newNotificationsCount', Validator.header(['X-API-KEY']).notEmpty(), this.handleGetNewNotificationsCount.bind(this))
    this.router.post(
      '/alert/acknowledgeAlertSession',
      jsonBodyParser,
      Validator.body(['sessionId']).notEmpty(),
      Validator.header(['X-API-KEY']).notEmpty(),
      this.handleAcknowledgeAlertSession.bind(this),
    )
    this.router.post(
      '/alert/respondToAlertSession',
      jsonBodyParser,
      Validator.body(['sessionId']).notEmpty(),
      Validator.header(['X-API-KEY']).notEmpty(),
      this.handleRespondToAlertSession.bind(this),
    )
    this.router.post(
      '/alert/setIncidentCategory',
      jsonBodyParser,
      Validator.body(['incidentCategory', 'sessionId']).notEmpty(),
      Validator.header(['X-API-KEY']).notEmpty(),
      this.handleIncidentCategory.bind(this),
    )

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

  /* eslint-disable class-methods-use-this */
  async sendAlertSessionUpdate(sessionId, responderPushId, toPhoneNumber, fromPhoneNumber, textMessage, pushMessage) {
    let response
    try {
      if (responderPushId) {
        // Send update using the Alert App
        response = await OneSignal.sendOneSignalMessage(responderPushId, `${sessionId} UPDATE`, pushMessage)
      } else if (toPhoneNumber && fromPhoneNumber) {
        // Send update using SMS
        response = await twilio.sendTwilioMessage(toPhoneNumber, fromPhoneNumber, textMessage)
      }
    } catch (err) {
      helpers.logError(err)
    }

    if (response === undefined) {
      helpers.logError(`Failed to send alert update for session ${sessionId}: ${pushMessage}`)
    } else if (response.data !== undefined && response.data.errors !== undefined) {
      helpers.logError(`Failed to send push alert update for session ${sessionId}: ${pushMessage}: ${JSON.stringify(response.data.errors)}`)
    }
  }

  // See README for description of alertInfo
  async startAlertSession(alertInfo) {
    let response

    try {
      if (alertInfo.responderPushId) {
        // Send initial message using the Alert App
        response = await OneSignal.sendOneSignalMessage(
          alertInfo.responderPushId,
          `${alertInfo.sessionId} START`,
          `New ${helpers.getAlertTypeDisplayName(alertInfo.alertType)} Alert:\n${alertInfo.deviceName}`,
        )
      } else if (alertInfo.toPhoneNumber && alertInfo.fromPhoneNumber) {
        // Send initial message using SMS
        response = await twilio.sendTwilioMessage(alertInfo.toPhoneNumber, alertInfo.fromPhoneNumber, alertInfo.message)
      }
    } catch (err) {
      // Error handling will be done below because response is undefined
      helpers.logError(err)
    }

    if (response === undefined) {
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

      if (alertInfo.responderPushId) {
        // Send reminder using the Alert App
        response = await OneSignal.sendOneSignalMessage(
          alertInfo.responderPushId,
          `${alertInfo.sessionId} REMINDER`,
          `${helpers.getAlertTypeDisplayName(alertInfo.alertType)} Alert Reminder:\n${alertInfo.deviceName}`,
        )
      } else if (alertInfo.toPhoneNumber && alertInfo.fromPhoneNumber) {
        // Send reminder using SMS
        response = await twilio.sendTwilioMessage(alertInfo.toPhoneNumber, alertInfo.fromPhoneNumber, alertInfo.reminderMessage)
      }
    } catch (err) {
      // TODO Better error handling (maybe try to send the fallback message immediately)
      helpers.logError(`Failed to send reminder message for session ${alertInfo.sessionId}. ${err.toString()}`)
    }

    if (response === undefined) {
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
        response.status(200).json(location)
      } else {
        response.status(200).json({})
      }
    } else {
      const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
      helpers.logError(errorMessage)
      response.status(400).json(errorMessage)
    }
  }

  async handleGetActiveAlerts(request, response) {
    const validationErrors = Validator.validationResult(request).formatWith(helpers.formatExpressValidationErrors)

    if (validationErrors.isEmpty()) {
      const alertApiKey = request.header('X-API-KEY')

      const activeAlerts = await this.getActiveAlertsByAlertApiKey(alertApiKey)
      if (activeAlerts === null) {
        const errorMessage = `Something went wrong in request to ${request.path}. Active Alerts is null.`
        helpers.logError(errorMessage)
        response.status(500).json(errorMessage)
        return
      }

      response.status(200).json(activeAlerts)
    } else {
      const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
      helpers.logError(errorMessage)
      response.status(400).json(errorMessage)
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
        response.status(500).json(errorMessage)
        return
      }

      response.status(200).json(historicAlerts)
    } else {
      const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
      helpers.logError(errorMessage)
      response.status(400).json(errorMessage)
    }
  }

  async handleGetNewNotificationsCount(request, response) {
    const validationErrors = Validator.validationResult(request).formatWith(helpers.formatExpressValidationErrors)

    if (validationErrors.isEmpty()) {
      const alertApiKey = request.header('X-API-KEY')
      const newNotificationsCount = await this.getNewNotificationsCountByAlertApiKey(alertApiKey)
      response.status(200).json(newNotificationsCount)
    } else {
      const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
      helpers.logError(errorMessage)
      response.status(400).json(errorMessage)
    }
  }

  async handleAcknowledgeAlertSession(request, response) {
    const validationErrors = Validator.validationResult(request).formatWith(helpers.formatExpressValidationErrors)
    if (!validationErrors.isEmpty()) {
      const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
      helpers.logError(errorMessage)
      response.status(400).json(errorMessage)
      return
    }

    const alertApiKey = request.header('X-API-KEY')
    const { sessionId } = request.body

    try {
      const alertSession = await this.getAlertSessionBySessionIdAndAlertApiKey(sessionId, alertApiKey)
      if (alertSession === null) {
        const errorMessage = `Failed to acknowledge alert for session ${sessionId}: No corresponding session`
        helpers.logError(errorMessage)
        response.status(400).json(errorMessage)
        return
      }

      if (alertSession.alertState !== CHATBOT_STATE.STARTED && alertSession.alertState !== CHATBOT_STATE.WAITING_FOR_REPLY) {
        // This case is unexpected, but could potentially happen if the app allowed a double-click on the button
        // So we'll log it because it's unnecessary, but still return 200 because it probably isn't wrong
        helpers.log(
          `Failed to acknowledge alert for session ${sessionId}: Session has already been acknowledged (current state: ${alertSession.alertState})`,
        )
      } else {
        const changedAlertSession = new AlertSession(alertSession.sessionId, CHATBOT_STATE.RESPONDING)
        await this.alertSessionChangedCallback(changedAlertSession)
      }

      const activeAlerts = await this.getActiveAlertsByAlertApiKey(alertApiKey)
      if (activeAlerts) {
        response.status(200).json(activeAlerts)
      } else {
        response.status(200).json({})
      }
    } catch (err) {
      const errorMessage = `Failed to acknowledge alert for session ${sessionId}: ${err.toString()}`
      helpers.logError(errorMessage)
      response.status(500).json(errorMessage)
    }
  }

  async handleRespondToAlertSession(request, response) {
    const validationErrors = Validator.validationResult(request).formatWith(helpers.formatExpressValidationErrors)
    if (!validationErrors.isEmpty()) {
      const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
      helpers.logError(errorMessage)
      response.status(400).json(errorMessage)
      return
    }

    const alertApiKey = request.header('X-API-KEY')
    const { sessionId } = request.body

    try {
      const alertSession = await this.getAlertSessionBySessionIdAndAlertApiKey(sessionId, alertApiKey)
      if (alertSession === null) {
        const errorMessage = `Failed to respond to alert for session ${sessionId}: No corresponding session`
        helpers.logError(errorMessage)
        response.status(400).json(errorMessage)
        return
      }

      if (alertSession.alertState !== CHATBOT_STATE.RESPONDING) {
        // This case is unexpected, but could potentially happen if the app allowed a double-click on the button
        // So we'll log it because it's unnecessary, but still return 200 because it probably isn't wrong
        helpers.log(
          `Failed to respond to alert for session ${sessionId}: Session has already been responded to (current state: ${alertSession.alertState})`,
        )
      } else {
        const changedAlertSession = new AlertSession(alertSession.sessionId, CHATBOT_STATE.WAITING_FOR_CATEGORY)
        await this.alertSessionChangedCallback(changedAlertSession)
      }

      const activeAlerts = await this.getActiveAlertsByAlertApiKey(alertApiKey)
      if (activeAlerts) {
        response.status(200).json(activeAlerts)
      } else {
        response.status(200).json({})
      }
    } catch (err) {
      const errorMessage = `Failed to respond to alert for session ${sessionId}: ${err.toString()}`
      helpers.logError(errorMessage)
      response.status(500).json(errorMessage)
    }
  }

  async handleIncidentCategory(request, response) {
    const validationErrors = Validator.validationResult(request).formatWith(helpers.formatExpressValidationErrors)
    if (!validationErrors.isEmpty()) {
      const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
      helpers.logError(errorMessage)
      response.status(400).json(errorMessage)
      return
    }

    const alertApiKey = request.header('X-API-KEY')
    const { incidentCategory, sessionId } = request.body

    try {
      const alertSession = await this.getAlertSessionBySessionIdAndAlertApiKey(sessionId, alertApiKey)
      if (alertSession === null) {
        const errorMessage = `Failed to record incident category ${incidentCategory} for session ${sessionId}: No corresponding session`
        helpers.logError(errorMessage)
        response.status(400).json(errorMessage)
        return
      }

      const incidentCategoryKey = alertSession.validIncidentCategoryKeys[alertSession.validIncidentCategories.indexOf(incidentCategory)]
      if (incidentCategoryKey === undefined) {
        const errorMessage = `Failed to record incident category ${incidentCategory} for session ${sessionId}: Invalid category for client`
        helpers.logError(errorMessage)
        response.status(400).json(errorMessage)
        return
      }

      if (alertSession.alertState !== CHATBOT_STATE.WAITING_FOR_CATEGORY) {
        const errorMessage = `Failed to record incident category ${incidentCategory} for session ${sessionId}: Session is not waiting for incident category (current state: ${alertSession.alertState})`
        helpers.logError(errorMessage)
        response.status(400).json(errorMessage)
        return
      }

      const changedAlertSession = new AlertSession(alertSession.sessionId, CHATBOT_STATE.COMPLETED, incidentCategoryKey)
      await this.alertSessionChangedCallback(changedAlertSession)

      const activeAlerts = await this.getActiveAlertsByAlertApiKey(alertApiKey)
      if (activeAlerts) {
        response.status(200).json(activeAlerts)
      } else {
        response.status(200).json({})
      }
    } catch (err) {
      const errorMessage = `Failed to record incident category ${incidentCategory} for session ${sessionId}: ${err.toString()}`
      helpers.logError(errorMessage)
      response.status(500).json(errorMessage)
    }
  }
}

module.exports = BraveAlerter
