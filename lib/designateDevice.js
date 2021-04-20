const Validator = require('express-validator')

const helpers = require('./helpers')

function handleDesignateDevice(request, response) {
  const validationErrors = Validator.validationResult(request).formatWith(helpers.formatExpressValidationErrors)

  if (validationErrors.isEmpty()) {
    const { verificationCode } = request.body
    const alertApiKey = request.header('X-API-KEY')

    helpers.log(`************* Verification Code: ${verificationCode} Alert API Key: ${alertApiKey}`)
    response.status(200).json(JSON.stringify('OK'))
  } else {
    const errorMessage = `Bad request to ${request.path}: ${validationErrors.array()}`
    helpers.logError(errorMessage)
    response.status(400).send(errorMessage)
  }
}

module.exports = {
  handleDesignateDevice,
}
