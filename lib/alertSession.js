class AlertSession {
  constructor(
    sessionId,
    alertState,
    respondedByPhoneNumber,
    incidentCategoryKey,
    responderPhoneNumbers,
    validIncidentCategoryKeys,
    validIncidentCategories,
    language,
  ) {
    this.sessionId = sessionId
    this.alertState = alertState
    this.respondedByPhoneNumber = respondedByPhoneNumber
    this.incidentCategoryKey = incidentCategoryKey
    this.responderPhoneNumbers = responderPhoneNumbers
    this.validIncidentCategoryKeys = validIncidentCategoryKeys
    this.validIncidentCategories = validIncidentCategories
    this.language = language
  }
}

module.exports = AlertSession
