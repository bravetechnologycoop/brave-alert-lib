// Third-party dependencies
const axios = require('axios')

// In-house dependencies
const helpers = require('./helpers')

const ONESIGNAL_APP_ID = helpers.getEnvVar('ONESIGNAL_APP_ID')
const ONESIGNAL_API_KEY = helpers.getEnvVar('ONESIGNAL_API_KEY')

async function sendOneSignalMessage(responderPushId, messageName, message) {
  let response

  try {
    const config = {
      method: 'POST',
      url: 'https://onesignal.com/api/v1/notifications',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${ONESIGNAL_API_KEY}`,
      },
      data: {
        name: messageName,
        app_id: ONESIGNAL_APP_ID,
        contents: { en: message },
        headings: { en: 'Brave Alert' },
        include_player_ids: [responderPushId],
        priority: 10,
      },
    }

    response = await axios.request(config)

    if (response.data.errors === undefined) {
      helpers.log(`Sent by OneSignal: ${response.data.id}`)
    }
  } catch (err) {
    helpers.logError(`Error sending push notification to ${responderPushId}: ${err.toString()}`)
  }

  return response
}

module.exports = {
  sendOneSignalMessage,
}
