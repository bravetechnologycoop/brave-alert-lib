const Validator = require('express-validator')

const helpers = require('./helpers')

function handleDesignateDevice(request, response) {
  const validationErrors = Validator.validationResult(request)

  if (validationErrors.isEmpty()) {
    const { verificationCode } = request.body
    const alertApiKey = request.header('X-API-KEY')

    helpers.log(`************* Verification Code: ${verificationCode} Alert API Key: ${alertApiKey}`)
    response.status(200).json(JSON.stringify('OK'))
  } else {
    helpers.log(`Bad request to ${request.path}: ${JSON.stringify(validationErrors)}`)
    response.status(400).send()
  }
}

module.exports = {
  handleDesignateDevice,
}
