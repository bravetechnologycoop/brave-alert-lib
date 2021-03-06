const twilio = require('twilio')

const helpers = require('./helpers')

// Set up Twilio
const TWILIO_SID = helpers.getEnvVar('TWILIO_SID')
const TWILIO_TOKEN = helpers.getEnvVar('TWILIO_TOKEN')
const twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN)
const MessagingResponse = twilio.twiml.MessagingResponse

function isValidTwilioRequest(request) {
  return twilio.validateExpressRequest(request, TWILIO_TOKEN)
}

async function sendTwilioMessage(toPhoneNumber, fromPhoneNumber, message) {
  try {
    const response = await twilioClient.messages.create({
      to: toPhoneNumber,
      from: fromPhoneNumber,
      body: message,
    })

    helpers.log(response.sid)

    return response
  } catch (err) {
    helpers.logError(err.toString())
  }
}

async function sendTwilioResponse(response, message) {
  const twiml = new MessagingResponse()
  twiml.message(message)
  response.writeHead(200, { 'Content-Type': 'text/xml' })
  response.end(twiml.toString())
}

module.exports = {
  isValidTwilioRequest,
  sendTwilioMessage,
  sendTwilioResponse,
}
