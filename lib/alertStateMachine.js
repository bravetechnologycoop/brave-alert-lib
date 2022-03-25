const CHATBOT_STATE = require('./chatbotStateEnum')
const helpers = require('./helpers')

class AlertStateMachine {
  constructor(asksIncidentDetails, getReturnMessage) {
    this.asksIncidentDetails = asksIncidentDetails
    this.getReturnMessage = getReturnMessage
  }

  processStateTransitionWithMessage(currentAlertState, messageText, validIncidentCategoryKeys, validIncidentCategories) {
    const trimmedMessageText = messageText.trim()
    let nextAlertState
    let incidentCategoryKey
    let details
    let deviceName

    switch (currentAlertState) {
      case CHATBOT_STATE.NAMING_STARTED:
        if (trimmedMessageText.toLowerCase() === 'later') {
          nextAlertState = CHATBOT_STATE.NAMING_POSTPONED
        } else if (trimmedMessageText.length > 0 && !helpers.isUnnamedDevice(trimmedMessageText)) {
          deviceName = trimmedMessageText
          nextAlertState = CHATBOT_STATE.NAMING_COMPLETED
        } else {
          nextAlertState = currentAlertState
        }
        break

      case CHATBOT_STATE.STARTED:
      case CHATBOT_STATE.WAITING_FOR_REPLY:
        nextAlertState = CHATBOT_STATE.WAITING_FOR_CATEGORY
        break

      case CHATBOT_STATE.WAITING_FOR_CATEGORY:
        if (validIncidentCategoryKeys.indexOf(trimmedMessageText) >= 0) {
          incidentCategoryKey = trimmedMessageText
          nextAlertState = this.asksIncidentDetails ? CHATBOT_STATE.WAITING_FOR_DETAILS : (nextAlertState = CHATBOT_STATE.COMPLETED)
        } else {
          nextAlertState = currentAlertState
        }
        break

      case CHATBOT_STATE.WAITING_FOR_DETAILS:
        details = trimmedMessageText

        nextAlertState = CHATBOT_STATE.COMPLETED
        break

      case CHATBOT_STATE.COMPLETED:
      default:
        nextAlertState = currentAlertState
        break
    }

    return {
      nextAlertState,
      incidentCategoryKey,
      details,
      deviceName,
      returnMessage: this.getReturnMessage(currentAlertState, nextAlertState, validIncidentCategories, deviceName),
    }
  }
}

module.exports = AlertStateMachine
