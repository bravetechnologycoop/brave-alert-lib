class ActiveAlert {
  constructor(id, chatbotState, deviceName, alertType, validIncidentCategories, createdAt) {
    this.id = id
    this.chatbotState = chatbotState
    this.deviceName = deviceName
    this.alertType = alertType
    this.validIncidentCategories = validIncidentCategories
    this.createdAt = createdAt
  }
}

module.exports = ActiveAlert
