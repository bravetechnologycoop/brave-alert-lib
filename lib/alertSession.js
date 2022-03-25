class AlertSession {
  constructor(
    sessionId,
    alertState,
    incidentCategoryKey,
    details,
    deviceName,
    responderPhoneNumber,
    validIncidentCategoryKeys,
    validIncidentCategories,
  ) {
    this.sessionId = sessionId
    this.alertState = alertState
    this.incidentCategoryKey = incidentCategoryKey
    this.details = details
    this.deviceName = deviceName
    this.responderPhoneNumber = responderPhoneNumber
    this.validIncidentCategoryKeys = validIncidentCategoryKeys
    this.validIncidentCategories = validIncidentCategories
  }
}

module.exports = AlertSession
