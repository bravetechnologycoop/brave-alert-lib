# brave-alert-lib

[![Build Status](https://travis-ci.com/bravetechnologycoop/brave-alert-lib.svg?branch=main)](https://travis-ci.com/bravetechnologycoop/brave-alert-lib)

Library to communicate with responders and staff when action is required.


# Prerequisites

1. Must have a `.env` file containing following environment variables:
   - `TWILIO_SID`: The Twilio SID to use in production
   - `TWILIO_SID_TEST`: The Twilio SID to use in testing
   - `TWILIO_TOKEN`: The Twilio token to use in production
   - `TWILIO_TOKEN_TEST`: The Twilio token to use in testing


# How to setup a local dev environment

1. clone this repository

1. Copy `.env.example` to `.env` and fill out variables appropriately for your local environment

1. run `npm install` to install the dependencies

1. run `npm run lint` to run the linter

1. run `npm test` to run the tests


# How to add or change an encrypted Travis environment variable

Reference: https://docs.travis-ci.com/user/environment-variables/#encrypting-environment-variables

1. Download the Travis CLI `brew install travis` or `gem install travis`

1. cd to anywhere in this repo

1. For a given `VAR_NAME` that you want to have value `secret_value`, run
   `travis encrypt --pro VAR_NAME=secret_value`
   which will ask for your GitHub username and password and then
   output your encrypted variable

1. Copy the encrypted variable into `.travis.yml`


# How to use this library in another code base

1. if you are upgrading from a previous version of `brave-alert-lib`, run `npm uninstall brave-alert-lib` to remove it
from `package.json` and `package-lock.json`

1. in the `package.json` file of the other code base, add the following where `VERSION` is the tag that you've chosen
(for example `v0.1.0`):

    ```
    "dependencies": {
        ...
        "brave-alert-lib": "https://github.com/bravetechnologycoop/brave-alert-lib#<VERSION>",
        ...
    }
    ```

1. Run `npm install` to download the library and include it in `package-lock.json`


# API

## `BraveAlerter` class

The main class of this library. It is used to send single alerts or to start alert sessions with the responders.

### constructor(getAlertSession, getAlertSessionByPhoneNumber, alertSessionChangedCallback, asksIncidentDetails, getReturnMessage)

**getAlertSession (async function(sessionId)):** function that returns the AlertSession object with the given sessionId

**getAlertSessionByPhoneNumber (async function(toPhoneNumber)):** function that returns the AlertSession object for the most recent unfinished session with the given phone number

**alertSessionChangedCallback (async function(alertSession)):** function that will be called whenever an alertSession's values change; should be used to update the session in the DB

**asksIncidentDetails (boolean):** `true` if alert sessions should ask for incident details, `false` otherwise

**getReturnMessage (function(fromAlertState, toAlertState)):** function that returns the message to send back when there is a transition from `fromAlertState` to `toAlertState` (note that `fromAlertState` and `toAlertState` will have the same value for cases where a transition doesn't change the alert state)


### getRouter()

The BraveAlerter's Express Router contains the route `POST /alert/sms` that can be added to an existing Express app by:

```
const BraveAlerter = require('brave-alert-lib')
let express = require('express')
const braveAlerter = new BraveAlerter(...)
express.use(braveAlerter.getRouter())
```

Generally, a call to the `POST /alert/sms` endpoint results in a call to the BraveAlerter's `alertSessionChangedCallback` with an `AlertSession` object as a parameter. The `AlertSession.sessionId` field will always be present. Other fields will only be present if they have updated. This parameter should be used to update the session's DB.

**Returns:** The BraveAlerter's Express Router


### sendSingleAlert(toPhoneNumber, fromPhoneNumber, message)

Sends the given `message` to the `toPhoneNumber` from the `fromPhoneNumber`.

**toPhoneNumber (string):** Phone number to send the message to

**fromPhoneNumber (string):** Phone number to send the message from

**message (string):** The message to send

**Returns:** A promise that is resolved when the message is sent.


### startAlertSession(alertInfo)

Starts a full alert session configured with the given `alertInfo` object.

**alertInfo.sessionId (GUID):** Unique identifier for the session; this should match the session ID in the DB

**alertInfo.toPhoneNumber (string):** The phone number to send text message alert to

**alertInfo.fromPhoneNumber (string):** The phone number to send text message alert from

**alertInfo.message (string):** First message to send as part of this session

**alertInfo.reminderTimeoutMillis (int):** How long to wait after initial alert before sending a reminder message; if falsy or not positive, will not send a reminder message

**alertInfo.fallbackTimeoutMillis (int):** How long to wait after initial alert before sending the fallback message; if falsy or not positive, will not send a reminder message

**alertInfo.reminderMessage (string):** Message for the reminder

**alertInfo.fallbackMessage (string):** Message for the fallback

**alertInfo.fallbackToPhoneNumber (string):** The phone number to send fallback text messages to

**alertInfo.fallbackFromPhoneNumber (string):** The phone number to send fallback text messages from

**Returns:** A promise that is resolved when the first message is sent, the reminder is scheduled, and the fallback is scheduled.


## `AlertSession` class

An object representing an alert session. Contains the following fields:

**sessionId (GUID):** Unique identifier for the alert session; should be the session ID from the DB

**alertState (ALERT_STATE):** Thc current alert state of the alert session

**incidentCategory (int):** The integer representing the incident category associated with the alert session

**details (string):** The incident details associated with the alert session

**fallbackReturnMessage (string):** The message to send as a fallback for the alert session

**responderPhoneNumber(string):** The phone number of th responder phone associated with the alert session

**validIncidentCategories (object):** The valid incident cateogries for this session. The object keys are the values we expect the responder to return (for example '1' or '2'). The object values are the interpretation of these keys that will be stored in the DB. For example:

```
{
    '1': 'No One Inside',
    '2': 'Person responded',
    '3': 'Overdose',
    '4': 'None of the above'
}
````


## `ALERT_STATE` enum

An enum of the possible states the Alert Session could be in at any given time.


## `helpers` functions

A collection of functions that are useful across the Brave NodeJS applications.


### getEnvVars(name)

In the test environment, returns the test version of the environment variable with the given name. Otherwise, returns the production version of the environment variable with the given name.

**name (string):** the name of the environment variable

**Returns:** the correct environment variable for the situation.


### isValidRequest(req, properties)

Determines whether the given Express request is valid if the given set of properties are required.

**req (Express Request object):** the request to validate

**properties (Array of strings):** the body parameters that must be given in the request in order for it to be valid.

**Returns:** `true` if the given request's body contains all of the given properties. `false` otherwise. 


### log(logString)

Logs the given string as appropriate for the situation.

**logString (string):** The string to log

**Returns:** nothing


### sleep(millis)

Sleep for the given number of milliseconds. Must use `await` when calling this function, so much be called from an `async` function. Reference: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep

**millis (int):** The number of milliseconds to sleep for

**Returns:** a promise that will resolve after the given number of milliseconds
