const ALERT_TYPE = require('../alertTypeEnum')
const Client = require('./Client')
const CHATBOT_STATE = require('../chatbotStateEnum')
const Device = require('./Device')
const DEVICE_TYPE = require('../deviceTypeEnum')
const Session = require('./Session')

async function clientDBFactory(db, overrides = {}) {
  const client = await db.createClient(
    overrides.displayName !== undefined ? overrides.displayName : 'fakeClientName',
    overrides.responderPhoneNumbers !== undefined ? overrides.responderPhoneNumbers : ['+17781234567'],
    overrides.reminderTimeout !== undefined ? overrides.reminderTimeout : 1,
    overrides.fallbackPhoneNumbers !== undefined ? overrides.fallbackPhoneNumbers : ['+13336669999'],
    overrides.fromPhoneNumber !== undefined ? overrides.fromPhoneNumber : '+15005550006',
    overrides.fallbackTimeout !== undefined ? overrides.fallbackTimeout : 2,
    overrides.heartbeatPhoneNumbers !== undefined ? overrides.heartbeatPhoneNumbers : ['+18889997777'],
    overrides.incidentCategories !== undefined ? overrides.incidentCategories : ['Accidental', 'Safer Use', 'Unsafe Guest', 'Overdose', 'Other'],
    overrides.isDisplayed !== undefined ? overrides.isDisplayed : true,
    overrides.isSendingAlerts !== undefined ? overrides.isSendingAlerts : true,
    overrides.isSendingVitals !== undefined ? overrides.isSendingVitals : true,
    overrides.language !== undefined ? overrides.language : 'en',
  )

  return client
}

function clientFactory(overrides = {}) {
  return new Client(
    overrides.id !== undefined ? overrides.id : 'fakeClientId',
    overrides.displayName !== undefined ? overrides.displayName : 'fakeClientName',
    overrides.responderPhoneNumbers !== undefined ? overrides.responderPhoneNumbers : ['+17781234567'],
    overrides.reminderTimeout !== undefined ? overrides.reminderTimeout : 1,
    overrides.fallbackPhoneNumbers !== undefined ? overrides.fallbackPhoneNumbers : ['+13336669999'],
    overrides.fromPhoneNumber !== undefined ? overrides.fromPhoneNumber : '+15005550006',
    overrides.fallbackTimeout !== undefined ? overrides.fallbackTimeout : 2,
    overrides.heartbeatPhoneNumbers !== undefined ? overrides.heartbeatPhoneNumbers : ['+18889997777'],
    overrides.incidentCategories !== undefined ? overrides.incidentCategories : ['Accidental', 'Safer Use', 'Unsafe Guest', 'Overdose', 'Other'],
    overrides.isDisplayed !== undefined ? overrides.isDisplayed : true,
    overrides.isSendingAlerts !== undefined ? overrides.isSendingAlerts : true,
    overrides.isSendingVitals !== undefined ? overrides.isSendingVitals : true,
    overrides.language !== undefined ? overrides.language : 'en',
    overrides.createdAt !== undefined ? overrides.createdAt : new Date(),
    overrides.updatedAt !== undefined ? overrides.updatedAt : new Date(),
  )
}

async function deviceDBFactory(db, overrides = {}) {
  const device = await db.createDevice(
    overrides.id !== undefined ? overrides.id : 'fakeDeviceId',
    overrides.deviceType !== undefined ? overrides.deviceType : DEVICE_TYPE.DEVICE_BUTTON,
    overrides.locationid !== undefined ? overrides.locationid : null,
    overrides.phoneNumber !== undefined ? overrides.phoneNumber : '+12223334444',
    overrides.displayName !== undefined ? overrides.displayName : 'Unit 305',
    overrides.serialNumber !== undefined ? overrides.serialNumber : 'AB12-12345',
    overrides.sentLowBatteryAlertAt !== undefined ? overrides.sentLowBatteryAlertAt : null,
    overrides.sentVitalsAlertAt !== undefined ? overrides.sentVitalsAlertAt : null,
    overrides.createdAt !== undefined ? overrides.createdAt : new Date(),
    overrides.updatedAt !== undefined ? overrides.updatedAt : new Date(),
    overrides.isDisplayed !== undefined ? overrides.isDisplayed : true,
    overrides.isSendingAlerts !== undefined ? overrides.isSendingAlerts : true,
    overrides.isSendingVitals !== undefined ? overrides.isSendingVitals : true,
    overrides.clientId !== undefined ? overrides.clientId : 'fakeClientId',
  )

  return device
}

function deviceFactory(db, overrides = {}) {
  return new Device(
    overrides.id !== undefined ? overrides.id : 'fakeDeviceId',
    overrides.deviceType !== undefined ? overrides.deviceType : DEVICE_TYPE.DEVICE_BUTTON,
    overrides.locationid !== undefined ? overrides.locationid : null,
    overrides.phoneNumber !== undefined ? overrides.phoneNumber : '+12223334444',
    overrides.displayName !== undefined ? overrides.displayName : 'Unit 305',
    overrides.serialNumber !== undefined ? overrides.serialNumber : 'AB12-12345',
    overrides.sentLowBatteryAlertAt !== undefined ? overrides.sentLowBatteryAlertAt : null,
    overrides.sentVitalsAlertAt !== undefined ? overrides.sentVitalsAlertAt : null,
    overrides.createdAt !== undefined ? overrides.createdAt : new Date(),
    overrides.updatedAt !== undefined ? overrides.updatedAt : new Date(),
    overrides.isDisplayed !== undefined ? overrides.isDisplayed : true,
    overrides.isSendingAlerts !== undefined ? overrides.isSendingAlerts : true,
    overrides.isSendingVitals !== undefined ? overrides.isSendingVitals : true,
    overrides.client !== undefined ? overrides.client : clientFactory(),
  )
}

async function sessionDBFactory(db, overrides = {}) {
  const session = await db.createSession(
    overrides.deviceId !== undefined ? overrides.deviceId : 'fakeDeviceId',
    overrides.chatbotState !== undefined ? overrides.chatbotState : CHATBOT_STATE.STARTED,
    overrides.alertType !== undefined ? overrides.alertType : ALERT_TYPE.BUTTONS_NOT_URGENT,
    overrides.createdAt !== undefined ? overrides.createdAt : new Date(),
    overrides.isResettable !== undefined ? overrides.isResettable : false,
    overrides.incidentCategory !== undefined ? overrides.incidentCategory : null,
    overrides.respondedAt !== undefined ? overrides.respondedAt : null,
    overrides.respondedByPhoneNumber !== undefined ? overrides.respondedByPhoneNumber : null,
  )

  return session
}

function sessionFactory(db, overrides = {}) {
  return new Session(
    overrides.id !== undefined ? overrides.id : 'fakeSessionId',
    overrides.chatbotState !== undefined ? overrides.chatbotState : CHATBOT_STATE.STARTED,
    overrides.alertType !== undefined ? overrides.alertType : ALERT_TYPE.BUTTONS_NOT_URGENT,
    overrides.numberOfAlerts !== undefined ? overrides.numberOfAlerts : 1,
    overrides.createdAt !== undefined ? overrides.createdAt : new Date(),
    overrides.updatedAt !== undefined ? overrides.updatedAt : new Date(),
    overrides.incidentCategory !== undefined ? overrides.incidentCategory : null,
    overrides.respondedAt !== undefined ? overrides.respondedAt : null,
    overrides.respondedByPhoneNumber !== undefined ? overrides.respondedByPhoneNumber : null,
    overrides.isResettable !== undefined ? overrides.isResettable : false,
    overrides.device !== undefined ? overrides.device : deviceFactory(),
  )
}

module.exports = {
  clientDBFactory,
  clientFactory,
  deviceDBFactory,
  deviceFactory,
  sessionDBFactory,
  sessionFactory,
}
