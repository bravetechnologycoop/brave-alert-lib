class Device {
  constructor(
    id,
    deviceType,
    locationid,
    phoneNumber,
    displayName,
    serialNumber,
    clientId,
    sentLowBatteryAlertAt,
    sentVitalsAlertAt,
    createdAt,
    updatedAt,
    isDisplayed,
    isSendingAlerts,
    isSendingVitals,
  ) {
    this.id = id
    this.deviceType = deviceType
    this.locationid = locationid
    this.phoneNumber = phoneNumber
    this.displayName = displayName
    this.serialNumber = serialNumber
    this.clientId = clientId
    this.sentLowBatteryAlertAt = sentLowBatteryAlertAt
    this.sentVitalsAlertAt = sentVitalsAlertAt
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.isDisplayed = isDisplayed
    this.isSendingAlerts = isSendingAlerts
    this.isSendingVitals = isSendingVitals
  }
}

module.exports = Device
