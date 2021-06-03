class HistoricAlert {
  constructor(id, deviceName, category, alertType, numButtonPresses, createdTimestamp, respondedTimestamp) {
    this.id = id
    this.deviceName = deviceName
    this.category = category
    this.alertType = alertType
    this.numButtonPresses = numButtonPresses
    this.createdTimestamp = createdTimestamp
    this.respondedTimestamp = respondedTimestamp
  }
}

module.exports = HistoricAlert
