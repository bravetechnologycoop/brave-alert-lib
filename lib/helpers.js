// helpers.js
//
// This file is for convenience only. It should not be expanded without careful
// consideration. We want to avoid scope creep in this library that would require
// changes for non-library-related things.

// Third-party dependencies
const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')
const chalk = require('chalk')
const dotenv = require('dotenv')

// In-house dependencies
const ALERT_TYPE = require('./alertTypeEnum')

// Setup environment variables
dotenv.config()

function isTestEnvironment() {
  return process.env.NODE_ENV === 'test'
}

// Code mostly from https://express-validator.github.io/docs/validation-result-api.html#formatwithformatter
function formatExpressValidationErrors({ msg, param, nestedErrors }) {
  if (nestedErrors) {
    return `${nestedErrors.map(e => e.param).join('/')} (${msg})`
  }

  return `${param} (${msg})`
}

function getEnvVar(name) {
  return isTestEnvironment() ? process.env[`${name}_TEST`] : process.env[name]
}

function setupSentry(app, dsnString, env, releaseName) {
  Sentry.init({
    dsn: dsnString,
    environment: env,
    release: releaseName,
    integrations: [new Tracing.Integrations.Postgres(), new Sentry.Integrations.Http({ tracing: true }), new Tracing.Integrations.Express({ app })],
  })
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())
  app.use(Sentry.Handlers.errorHandler())
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
    Sentry.captureException(logString)
  }
}

function logSentry(logString) {
  if (isTestEnvironment()) {
    // Output in colour in test
    console.log(chalk.dim.cyan(`\t${logString}`)) // eslint-disable-line no-console
  } else {
    Sentry.captureMessage(logString)
  }
}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

async function runQuery(functionName, queryString, queryParams, pool, clientParam) {
  let client = clientParam
  const transactionMode = client !== undefined

  try {
    if (!transactionMode) {
      client = await pool.connect()
    }

    return await client.query(queryString, queryParams)
  } catch (e) {
    logError(`Error running the ${functionName} query: ${e}`)
  } finally {
    if (!transactionMode) {
      try {
        client.release()
      } catch (err) {
        logError(`${functionName}: Error releasing client: ${err}`)
      }
    }
  }
}

function getAlertTypeDisplayName(alertType) {
  let displayName = ''
  if (alertType === ALERT_TYPE.SENSOR_DURATION) {
    displayName = 'Duration'
  } else if (alertType === ALERT_TYPE.SENSOR_STILLNESS) {
    displayName = 'Stillness'
  } else if (alertType === ALERT_TYPE.BUTTONS_NOT_URGENT) {
    displayName = 'Button Press'
  } else if (alertType === ALERT_TYPE.BUTTONS_URGENT) {
    displayName = 'URGENT Button Press'
  } else {
    displayName = 'Unknown'
  }

  return displayName
}

module.exports = {
  formatExpressValidationErrors,
  getAlertTypeDisplayName,
  getEnvVar,
  isTestEnvironment,
  isValidRequest,
  log,
  logError,
  logSentry,
  runQuery,
  sleep,
  setupSentry,
}
