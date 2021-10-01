const Validator = require('express-validator')

const helpers = require('./helpers')

function handleDesignateDevice(request, response) {
  const validationErrors = Validator.validationResult(request).formatWith(helpers.formatExpressValidationErrors)

  if (validationErrors.isEmpty()) {
    const { responderPushId, verificationCode } = request.body
    const alertApiKey = request.header('X-API-KEY')

    helpers.log(`************* Verification Code: ${verificationCode} Alert API Key: ${alertApiKey} Responder Push ID: ${responderPushId}`)
    response.status(200).json('OK')
  } else {
    const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
    helpers.logError(errorMessage)
    response.status(400).json(errorMessage)
  }
}

module.exports = {
  handleDesignateDevice,
}
