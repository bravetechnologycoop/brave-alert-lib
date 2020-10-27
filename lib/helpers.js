// helpers.js
//
// This file is for convenience only. It should not be expanded without careful
// consideration. We want to avoid scope creep in this library that would require
// changes for non-library-related things.

const chalk = require('chalk')
const dotenv = require('dotenv')
const moment = require('moment-timezone')

// Setup environment variables
dotenv.config()

function getEnvVar(name) {
    return process.env.NODE_ENV === 'test' ? process.env[name + '_TEST'] : process.env[name]
}

function isTestEnvironment() {
    return process.env.NODE_ENV === 'test'
}

function isValidRequest(req, properties) {
    const hasAllProperties = (hasAllPropertiesSoFar, currentProperty) => hasAllPropertiesSoFar && Object.prototype.hasOwnProperty.call(req.body, currentProperty)
    return properties.reduce(hasAllProperties, true)
}

function log(logString) {
    if (process.env.NODE_ENV === 'test') {
        // Output in colour in test
        console.log(chalk.dim.cyan('\t' + logString))
    } else {
        // Prepend the timestamp in production
        console.log(moment().toISOString() + " - " + logString)
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
    sleep,
}