const CHATBOT_STATE = require('./chatbotStateEnum')

class AlertStateMachine {
  constructor(getReturnMessageToRespondedByPhoneNumber, getReturnMessageToOtherResponderPhonesNumbers) {
    this.getReturnMessageToRespondedByPhoneNumber = getReturnMessageToRespondedByPhoneNumber
    this.getReturnMessageToOtherResponderPhoneNumbers = getReturnMessageToOtherResponderPhonesNumbers
  }

  processStateTransitionWithMessage(currentAlertState, messageText, validIncidentCategoryKeys, validIncidentCategories, language) {
    let nextAlertState
    let incidentCategoryKey
    let selectedIncidentCategory
    let incidentCategoryIndex

    switch (currentAlertState) {
      case CHATBOT_STATE.STARTED:
      case CHATBOT_STATE.WAITING_FOR_REPLY:
        nextAlertState = CHATBOT_STATE.WAITING_FOR_CATEGORY
        break

      case CHATBOT_STATE.WAITING_FOR_CATEGORY:
        incidentCategoryIndex = validIncidentCategoryKeys.indexOf(messageText.trim())
        if (incidentCategoryIndex >= 0) {
          incidentCategoryKey = messageText.trim()
          selectedIncidentCategory = validIncidentCategories[incidentCategoryIndex]
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
      returnMessageToRespondedByPhoneNumber: this.getReturnMessageToRespondedByPhoneNumber(
        language,
        currentAlertState,
        nextAlertState,
        validIncidentCategories,
      ),
      returnMessageToOtherResponderPhoneNumbers: this.getReturnMessageToOtherResponderPhoneNumbers(
        language,
        currentAlertState,
        nextAlertState,
        selectedIncidentCategory,
      ),
    }
  }
}

module.exports = AlertStateMachine
