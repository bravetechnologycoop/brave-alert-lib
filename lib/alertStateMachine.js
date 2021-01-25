const ALERT_STATE = require('./alertStateEnum')

class AlertStateMachine {
  constructor(asksIncidentDetails, getReturnMessage) {
    this.asksIncidentDetails = asksIncidentDetails
    this.getReturnMessage = getReturnMessage
  }

  processStateTransitionWithMessage(currentAlertState, messageText, validIncidentCategoryKeys, validIncidentCategories) {
    let nextAlertState
    let incidentCategoryKey
    let details

    switch (currentAlertState) {
      case ALERT_STATE.STARTED:
      case ALERT_STATE.WAITING_FOR_REPLY:
        nextAlertState = ALERT_STATE.WAITING_FOR_CATEGORY
        break

      case ALERT_STATE.WAITING_FOR_CATEGORY:
        if (validIncidentCategoryKeys.indexOf(messageText.trim()) >= 0) {
          incidentCategoryKey = messageText.trim()
          nextAlertState = this.asksIncidentDetails ? ALERT_STATE.WAITING_FOR_DETAILS : (nextAlertState = ALERT_STATE.COMPLETED)
        } else {
          nextAlertState = currentAlertState
        }
        break

      case ALERT_STATE.WAITING_FOR_DETAILS:
        details = messageText.trim()

        nextAlertState = ALERT_STATE.COMPLETED
        break

      case ALERT_STATE.COMPLETED:
      default:
        nextAlertState = currentAlertState
        break
    }

    return {
      nextAlertState,
      incidentCategoryKey,
      details,
      returnMessage: this.getReturnMessage(currentAlertState, nextAlertState, validIncidentCategories),
    }
  }
}

module.exports = AlertStateMachine
