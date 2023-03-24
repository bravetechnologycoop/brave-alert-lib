class Client {
  constructor(
    id,
    displayName,
    responderPhoneNumbers,
    responderPushId,
    alertApiKey,
    reminderTimeout,
    fallbackPhoneNumbers,
    fromPhoneNumber,
    fallbackTimeout,
    heartbeatPhoneNumbers,
    incidentCategories,
    isDisplayed,
    isSendingAlerts,
    isSendingVitals,
    language,
    createdAt,
    updatedAt,
  ) {
    this.id = id
    this.displayName = displayName
    this.responderPhoneNumbers = responderPhoneNumbers
    this.responderPushId = responderPushId
    this.alertApiKey = alertApiKey
    this.reminderTimeout = reminderTimeout
    this.fallbackPhoneNumbers = fallbackPhoneNumbers
    this.fromPhoneNumber = fromPhoneNumber
    this.fallbackTimeout = fallbackTimeout
    this.heartbeatPhoneNumbers = heartbeatPhoneNumbers
    this.incidentCategories = incidentCategories
    this.isDisplayed = isDisplayed
    this.isSendingAlerts = isSendingAlerts
    this.isSendingVitals = isSendingVitals
    this.language = language
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

module.exports = Client
