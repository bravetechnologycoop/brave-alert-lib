class Client {
  constructor(
    id,
    displayName,
    responderPhoneNumber,
    responderPushId,
    alertApiKey,
    reminderTimeout,
    fallbackPhoneNumbers,
    fromPhoneNumber,
    fallbackTimeout,
    heartbeatPhoneNumbers,
    incidentCategories,
    isActive,
    createdAt,
    updatedAt,
  ) {
    this.id = id
    this.displayName = displayName
    this.responderPhoneNumber = responderPhoneNumber
    this.responderPushId = responderPushId
    this.alertApiKey = alertApiKey
    this.reminderTimeout = reminderTimeout
    this.fallbackPhoneNumbers = fallbackPhoneNumbers
    this.fromPhoneNumber = fromPhoneNumber
    this.fallbackTimeout = fallbackTimeout
    this.heartbeatPhoneNumbers = heartbeatPhoneNumbers
    this.incidentCategories = incidentCategories
    this.isActive = isActive
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

module.exports = Client
