const Client = require('./Client')

async function clientDBFactory(db, overrides = {}) {
  const client = await db.createClient(
    overrides.displayName !== undefined ? overrides.displayName : 'fakeLocationName',
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
    overrides.id !== undefined ? overrides.id : 'fakeLocationid',
    overrides.displayName !== undefined ? overrides.displayName : 'fakeLocationName',
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
    overrides.createdAt !== undefined ? overrides.createdAt : new Date('2021-11-04T22:28:28.0248Z'),
    overrides.updatedAt !== undefined ? overrides.updatedAt : new Date('2021-11-05T02:02:22.234Z'),
  )
}

module.exports = {
  clientDBFactory,
  clientFactory,
}
