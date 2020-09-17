const ALERT_STATE = require('./alertStateEnum.js')

class AlertStateMachine {
    // asksIncidentDetails (Boolean)
    //    true if the user should be asked about the incident details.
    // getReturnMessage (Function)
    //    Takes two parameters: the current AlertState and the next AlertState
    //    Returns the message to send to the user for that state transition
    constructor (asksIncidentDetails, getReturnMessage) {
        this.asksIncidentDetails = asksIncidentDetails
        this.getReturnMessage = getReturnMessage
    }

    processStateTransitionWithMessage(currentAlertState, messageText, validIncidentCategories) {
        let nextAlertState
        let incidentCategory
        let details

        switch (currentAlertState) {
            case ALERT_STATE.STARTED:
            case ALERT_STATE.WAITING_FOR_REPLY:
                nextAlertState = ALERT_STATE.WAITING_FOR_CATEGORY
                break

            case ALERT_STATE.WAITING_FOR_CATEGORY:
                if (messageText.trim() in validIncidentCategories) {
                    incidentCategory = messageText.trim()
                    nextAlertState = this.asksIncidentDetails ? ALERT_STATE.WAITING_FOR_DETAILS : nextAlertState = ALERT_STATE.COMPLETED
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
            nextAlertState: nextAlertState,
            incidentCategory: incidentCategory,
            details: details,
            returnMessage: this.getReturnMessage(currentAlertState, nextAlertState),
        }
    }
}

module.exports = AlertStateMachine
