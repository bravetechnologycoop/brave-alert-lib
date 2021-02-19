// helpers.js
//
// This file is for convenience only. It should not be expanded without careful
// consideration. We want to avoid scope creep in this library that would require
// changes for non-library-related things.

const chalk = require('chalk')
const dotenv = require('dotenv')

// Setup environment variables
dotenv.config()

function isTestEnvironment() {
  return process.env.NODE_ENV === 'test'
}

function getEnvVar(name) {
  return isTestEnvironment() ? process.env[`${name}_TEST`] : process.env[name]
}

function isValidRequest(req, properties) {
  return properties.reduce(
    (hasAllPropertiesSoFar, currentProperty) => hasAllPropertiesSoFar && Object.prototype.hasOwnProperty.call(req.body, currentProperty),
    true,
  )
}

function log(logString) {
  if (isTestEnvironment()) {
    // Output in colour in test
    console.log(chalk.dim.cyan(`\t${logString}`)) // eslint-disable-line no-console
  } else {
    // Prepend the timestamp in production
    console.log(logString) // eslint-disable-line no-console
  }
}

function logError(logString) {
  if (isTestEnvironment()) {
    // Output in colour in test
    console.error(chalk.dim.cyan(`\t${logString}`)) // eslint-disable-line no-console
  } else {
    // Prepend the timestamp in production
    console.error(logString) // eslint-disable-line no-console
  }
}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

module.exports = {
  getEnvVar,
  isTestEnvironment,
  isValidRequest,
  log,
  logError,
  sleep,
}
