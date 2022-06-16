const CHATBOT_STATE = require('./chatbotStateEnum')

class AlertStateMachine {
  constructor(getReturnMessage) {
    this.getReturnMessage = getReturnMessage
  }

  processStateTransitionWithMessage(currentAlertState, messageText, validIncidentCategoryKeys, validIncidentCategories) {
    let nextAlertState
    let incidentCategoryKey

    switch (currentAlertState) {
      case CHATBOT_STATE.STARTED:
      case CHATBOT_STATE.WAITING_FOR_REPLY:
        nextAlertState = CHATBOT_STATE.WAITING_FOR_CATEGORY
        break

      case CHATBOT_STATE.WAITING_FOR_CATEGORY:
        if (validIncidentCategoryKeys.indexOf(messageText.trim()) >= 0) {
          incidentCategoryKey = messageText.trim()
          nextAlertState = CHATBOT_STATE.COMPLETED
        } else {
          nextAlertState = currentAlertState
        }
        break

      case CHATBOT_STATE.COMPLETED:
      default:
        nextAlertState = currentAlertState
        break
    }

    return {
      nextAlertState,
      incidentCategoryKey,
      returnMessage: this.getReturnMessage(currentAlertState, nextAlertState, validIncidentCategories),
    }
  }
}

module.exports = AlertStateMachine
