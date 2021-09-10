class ActiveAlert {
  constructor(id, chatbotState, deviceName, alertType, validIncidentCategories) {
    this.id = id
    this.chatbotState = chatbotState
    this.deviceName = deviceName
    this.alertType = alertType
    this.validIncidentCategories = validIncidentCategories
  }
}

module.exports = ActiveAlert
