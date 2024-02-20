class Session {
  // prettier-ignore
  constructor(id, chatbotState, alertType, numberOfAlerts, createdAt, updatedAt, incidentCategory, respondedAt, respondedByPhoneNumber, device, isResettable) {
    this.id = id
    this.chatbotState = chatbotState
    this.alertType = alertType
    this.numberOfAlerts = numberOfAlerts
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.incidentCategory = incidentCategory
    this.respondedAt = respondedAt
    this.respondedByPhoneNumber = respondedByPhoneNumber

    // remove these two assignments when both BraveButtons and BraveSensor use this.device
    this.button = device
    this.location = device

    this.device = device

    this.isResettable = isResettable
  }
}

module.exports = Session
