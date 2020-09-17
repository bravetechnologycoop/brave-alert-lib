class AlertSession {
    constructor(sessionId, alertState, incidentCategory, details, fallbackReturnMessage, responderPhoneNumber, validIncidentCategories) {
        this.sessionId = sessionId
        this.alertState = alertState
        this.incidentCategory = incidentCategory
        this.details = details
        this.fallbackReturnMessage = fallbackReturnMessage
        this.responderPhoneNumber = responderPhoneNumber
        this.validIncidentCategories = validIncidentCategories
    }
}

module.exports = AlertSession