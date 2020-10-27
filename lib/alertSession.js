class AlertSession {
    constructor(sessionId, alertState, incidentCategoryKey, details, fallbackReturnMessage, responderPhoneNumber, validIncidentCategoryKeys) {
        this.sessionId = sessionId
        this.alertState = alertState
        this.incidentCategoryKey = incidentCategoryKey
        this.details = details
        this.fallbackReturnMessage = fallbackReturnMessage
        this.responderPhoneNumber = responderPhoneNumber
        this.validIncidentCategoryKeys = validIncidentCategoryKeys
    }
}

module.exports = AlertSession