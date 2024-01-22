const ALERT_TYPE = require('../alertTypeEnum')

class Session {
  // prettier-ignore
  constructor(id, chatbotState, alertType, numberOfAlerts, createdAt, updatedAt, incidentCategory, respondedAt, respondedByPhoneNumber, device) {
    this.id = id
    this.chatbotState = chatbotState
    this.alertType = alertType
    this.numberOfAlerts = numberOfAlerts
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.incidentCategory = incidentCategory
    this.respondedAt = respondedAt
    this.respondedByPhoneNumber = respondedByPhoneNumber

    // this is temporary: change these two lines to `this.device = device` when renaming buttons and locations table to devices table in both buttons and sensor
    this.button = device
    this.location = device
  }

  // this is specific to buttons: notice that this.alertType is updated
  incrementButtonPresses(numberOfAlerts) {
    this.numberOfAlerts += numberOfAlerts
    this.alertType = ALERT_TYPE.BUTTONS_URGENT
  }
}

module.exports = Session
