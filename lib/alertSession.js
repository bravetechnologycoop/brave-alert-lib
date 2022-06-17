class AlertSession {
  constructor(
    sessionId,
    alertState,
    respondedByPhoneNumber,
    incidentCategoryKey,
    responderPhoneNumbers,
    validIncidentCategoryKeys,
    validIncidentCategories,
  ) {
    this.sessionId = sessionId
    this.alertState = alertState
    this.respondedByPhoneNumber = respondedByPhoneNumber
    this.incidentCategoryKey = incidentCategoryKey
    this.responderPhoneNumbers = responderPhoneNumbers
    this.validIncidentCategoryKeys = validIncidentCategoryKeys
    this.validIncidentCategories = validIncidentCategories
  }
}

module.exports = AlertSession
