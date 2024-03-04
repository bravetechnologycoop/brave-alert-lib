class Session {
  constructor(
    id,
    chatbotState,
    alertType,
    createdAt,
    updatedAt,
    numberOfAlerts,
    isResettable,
    incidentCategory,
    respondedAt,
    respondedByPhoneNumber,
    device,
  ) {
    this.id = id
    this.chatbotState = chatbotState
    this.alertType = alertType
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.numberOfAlerts = numberOfAlerts
    this.isResettable = isResettable
    this.incidentCategory = incidentCategory
    this.respondedAt = respondedAt
    this.respondedByPhoneNumber = respondedByPhoneNumber
    this.device = device
  }
}

module.exports = Session
