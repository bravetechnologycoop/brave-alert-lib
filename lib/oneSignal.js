// Third-party dependencies
const axios = require('axios')

// In-house dependencies
const helpers = require('./helpers')

const ONESIGNAL_APP_ID = helpers.getEnvVar('ONESIGNAL_APP_ID')

async function sendOneSignalMessage(responderPushId, messageName, message, data) {
  try {
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
    }

    const body = {
      name: messageName,
      app_id: ONESIGNAL_APP_ID,
      contents: { en: message },
      include_player_ids: [responderPushId],
      data,
    }

    const options = {
      host: 'onesignal.com',
      port: 443,
      path: '/api/v1/notifications',
      method: 'POST',
      headers,
      data: body,
    }

    console.log(`***TKD sending push notification using ${JSON.stringify(options)}`)

    const response = await axios.request(options)

    helpers.log(`Sent push notification to ${responderPushId}: ${JSON.toString(response)}`)

    return response
  } catch (err) {
    helpers.logError(`Error sending push notification to ${responderPushId}: ${err.toString()}`)
    helpers.logError(err.toString())
  }
}

module.exports = {
  sendOneSignalMessage,
}
