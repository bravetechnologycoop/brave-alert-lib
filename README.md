# brave-alert-lib

[![Build Status](https://travis-ci.com/bravetechnologycoop/brave-alert-lib.svg?branch=main)](https://travis-ci.com/bravetechnologycoop/brave-alert-lib)

Library to communicate with responders and staff when action is required.

# How to deploy a new version

On your local machine, in the `brave-alert-lib` repository:

1. Pull the latest code for release: `git checkout main && git pull origin main`

1. Decide on an appropriate version number for the new version

1. Update `CHANGELOG.md` by moving everything in `Unreleased` to a section for the new version

1. Update the version in `package.json` and `package-lock.json`

1. Make a new commit directly on `main` with those updates

1. Tag the new commit - for example, if the version number is v1.0.0 use `git tag v1.0.0`

1. Push the new version to GitHub: `git push origin main --tags`

# Prerequisites

1. Must have a `.env` file containing following environment variables:
   - `TWILIO_SID`: The Twilio SID to use in production
   - `TWILIO_SID_TEST`: The Twilio SID to use in testing
   - `TWILIO_MESSAGING_SERVICE_SID`: The Twilio Messaging Service SID to use in production
   - `TWILIO_MESSAGING_SERVICE_SID_TEST`: The Twilio Messaging Service SID to use in testing
   - `TWILIO_TOKEN`: The Twilio token to use in production
   - `TWILIO_TOKEN_TEST`: The Twilio token to use in testing
   - `DOMAIN`: The domain name pointing to this server in production
   - `DOMAIN_TEST`: The domain name pointing to this server in testing
   - `IS_DB_LOGGING`: Whether (true) or not (false) we are printing DB debug logs to the console
   - `PA_CLIENT_ID`: The client ID of PA. Can be found under the Brave PA Sign-In resource in Google Cloud. 
   - `PA_CLIENT_ID_TEST`: The client ID of PA. Can be found under the Brave PA Sign-In resource in Google Cloud. 
   - `PA_CLIENT_SECRET`: The client secret of PA. Can be found under the Brave PA Sign-In resource in Google Cloud. 
   - `PA_CLIENT_SECRET_TEST`: The client secret of PA. Can be found under the Brave PA Sign-In resource in Google Cloud. 

# How to setup a local dev environment

1. clone this repository

1. Copy `.env.example` to `.env` and fill out variables appropriately for your local environment

1. run `npm install` to install the dependencies

1. run `npm run lint` to run the linter

1. run `npm test` to run the tests

# How to add or change an encrypted Travis environment variable

Reference: https://docs.travis-ci.com/user/environment-variables/#encrypting-environment-variables

1. Download the Travis CLI `gem install travis`

1. cd to anywhere in this repo

1. temporarily create a personal access token on GitHub https://github.com/settings/tokens with the following permissions:

   - `repo`
   - `read:packages`
   - `read:org`
   - `read:public_key`
   - `read:repo_hook`
   - `user`
   - `read:discussion`
   - `read:enterprise`

1. login using `travis login --pro --github-token <token from github>`

1. For a given `VAR_NAME` that you want to have value `secret_value`, run
   `travis encrypt --pro VAR_NAME=secret_value`
   which will ask for your GitHub username and password and then
   output your encrypted variable

1. Copy the encrypted variable into `.travis.yml`

1. Delete your personal access token from GitHub

# How to use this library in another code base

1.  if you are upgrading from a previous version of `brave-alert-lib`, run `npm uninstall brave-alert-lib` to remove it
    from `package.json` and `package-lock.json`

1.  in the `package.json` file of the other code base, add the following where `VERSION` is the tag that you've chosen
    (for example `v0.1.0`):

        ```
        "dependencies": {
            ...
            "brave-alert-lib": "https://github.com/bravetechnologycoop/brave-alert-lib#<VERSION>",
            ...
        }
        ```

1.  Run `npm install` to download the library and include it in `package-lock.json`

# API

## `BraveAlerter` class

The main class of this library. It is used to send single alerts or to start alert sessions with the responders.

### constructor(getAlertSession, getAlertSessionByPhoneNumbers, alertSessionChangedCallback, getReturnMessageToRespondedByPhoneNumber, getReturnMessageToOtherResponderPhoneNumbers, getClientMessageForRequestToReset)

**getAlertSession (async function(sessionId)):** function that returns the AlertSession object with the given `sessionId`

**getAlertSessionByPhoneNumbers (async function(devicePhoneNumber, responderPhoneNumber)):** function that returns the AlertSession object for the most recent unfinished session for the device with the given devicePhoneNumber and client with the given responderPhoneNumber

**alertSessionChangedCallback (async function(alertSession)):** function that will be called whenever an alertSession's values change; should be used to update the session in the DB. Will return an object containing the fields: respondedByPhoneNumber, replacementReturnMessageToRespondedByPhoneNumber, replacementReturnMessageToOtherResponderPhoneNumbers. The two replacement fields should be left as undefined to use messages determined through the below two functions, null to send no message at all, or other for a custom message.

**getReturnMessageToRespondedByPhoneNumber (function(language, fromAlertState, toAlertState, validIncidentCategories)):** function that returns the message to send to the RespondedByPhoneNumber when there is a transition from `fromAlertState` to `toAlertState` (note that `fromAlertState` and `toAlertState` will have the same value for cases where a transition doesn't change the alert state). Sometimes this message needs to know the `validIncidentCategories` for the particular session.

**getReturnMessageToOtherResponderPhoneNumbers (function(language, fromAlertState, toAlertState, selectedIncidentCategory)):** function that returns the message to send to all the other Responder Phone Numbers (i.e. not the RespondedByPhoneNumber) when there is a transition from `fromAlertState` to `toAlertState` (note that `fromAlertState` and `toAlertState` will have the same value for cases where a transition doesn't change the alert state). Sometimes this message needs to know which incidentCategory was chosen by the respondedByPhoneNumber for the particular session.

**getClientMessageForRequestToReset (function(language)):** function that returns the message that is considered a request to reset. This is checked against a message received from the client, while the chatbot is in the `STARTED` or `WAITING_FOR_REPLY` states. If the client message equals the return value of this function, then the client has performed a request to reset, and the alert state machine will transition to the `RESET` state. If this function returns `null`, then the alert state machine will not transition from `STARTED` or `WAITING_FOR_REPLY` to the `RESET` state, and all messages will transition into the `WAITING_FOR_CATEGORY` state.

### getRouter()

The BraveAlerter's Express Router contains the route

- `POST /alert/sms`

  Generally, a call to the `POST /alert/sms` endpoint results in a call to the BraveAlerter's `alertSessionChangedCallback` with an `AlertSession` object as a parameter. The `AlertSession.sessionId` field will always be present. Other fields will only be present if they have updated. This parameter should be used to update the session's DB.

which can be added to an existing Express app by:

```
const BraveAlerter = require('brave-alert-lib')
let express = require('express')
const braveAlerter = new BraveAlerter(...)
express.use(braveAlerter.getRouter())
```

**Returns:** The BraveAlerter's Express Router

### sendSingleAlert(toPhoneNumber, fromPhoneNumber, message)

Sends the given `message` to the `toPhoneNumber` from the `fromPhoneNumber`.

**toPhoneNumber (string):** Phone number to send the message to

**fromPhoneNumber (string):** Phone number to send the message from

**message (string):** The message to send

**Returns:** A promise that is resolved when the message is sent.

### sendAlertSessionUpdate(sessionId, toPhoneNumbers, fromPhoneNumber, textMessage)

Updates an ongoing alert session.

**sessionId (GUID):** Unique identifier for the alert session that was updated; this should match the session ID in the DB

**toPhoneNumbers (array of strings):** The phone numbers to send text message alerts to.

**fromPhoneNumber (string):** The phone number to send text message alerts from.

**textMessage (string):** Message containing the update to be sent over SMS.

### startAlertSession(alertInfo)

Starts a full alert session configured with the given `alertInfo` object.

**alertInfo.sessionId (GUID):** Unique identifier for the session; this should match the session ID in the DB

**alertInfo.toPhoneNumbers (string):** The phone numbers to send text message alerts to.

**alertInfo.fromPhoneNumber (string):** The phone number to send text message alerts from.

**alertInfo.message (string):** First message to send as part of this session

**alertInfo.deviceName (string):** The display name of the device that intiated the alert. This is often the unit number of the room.

**alertInfo.alertType (ALERT_TYPE):** The Alert Type.

**alertInfo.reminderTimeoutMillis (int):** How long to wait after initial alert before sending a reminder message; if falsy or not positive, will not send a reminder message

**alertInfo.fallbackTimeoutMillis (int):** How long to wait after initial alert before sending the fallback message; if falsy or not positive, will not send a fallback message

**alertInfo.reminderMessage (string):** Message for the reminder

**alertInfo.fallbackMessage (string):** Message for the fallback

**alertInfo.fallbackToPhoneNumbers (array of strings):** The phone numbers to send fallback text messages to

**alertInfo.fallbackFromPhoneNumber (string):** The phone number to send fallback text messages from

**Returns:** A promise that is resolved when the first message is sent, the reminder is scheduled, and the fallback is scheduled.

## `AlertSession` class

An object representing an alert session. Contains the following fields:

**sessionId (GUID):** Unique identifier for the alert session; should be the session ID from the DB

**alertState (CHATBOT_STATE):** Thc current alert state of the alert session

**incidentCategoryKey (string):** The string representing the incident category associated with the alert session

**respondedByPhoneNumber (string):** The phone number of the Responded Phone who first responded to the sessions and that will be the only one to continue progressing the chatbot

**responderPhoneNumbers (array of string):** The phone numbers of the Responder Phones associated with the alert session

**validIncidentCategories (array of strings):** The valid incident cateogries for this session. These are the values that will be stored in the DB. For example:

```
['Accidental', 'Safer Use', 'Overdose', 'Other']
```

Note that these line up one-to-one with the `validIncidentCategoryKeys`. So for any `i`, `validIncidentCategories[i]` is the human-readable DB value for the `validIncidentCategoryKeys[i]` value given by the Responder in a text message.

**validIncidentCategoryKeys (array of strings):** The valid incident cateogry keys for this session. These are the values that the responder will use to select an incident category through text message. For example:

```
['1', '2', '3', '4']
```

Note that these line up one-to-one with the `validIncidentCategoryKeys`. So for any `i`, `validIncidentCategories[i]` is the
human-readable DB value for the `validIncidentCategoryKeys[i]` value given by the Responder in a text message.

**language (string):** The language code in which client-facing messages should be sent.

## `Client` class

An object representing a client. Contains the following fields:

**id (GUID):** Unique identifier for the client; should be the database value `client.id`

**displayName (string):** Client name is a displayable format; should be the database value `client.display_name`

**responderPhoneNumbers (array of string):** Client's responder phone numbers in the form `+133344455555`; should be the database value `client.responder_phone_numbers`

**reminderTimeout (int):** Number of seconds after the initial alert before a reminder is sent; should be the database value `client.reminder_timeout`

**fallbackPhoneNumbers (array of strings):** Array of the Client's fallback phone numbers in the form `'["+12223334444","+19998887777"]'`; should be the database value `client.fallback_phone_numbers`

**fromPhoneNumber (string):** Twilio phone number that is used to send fallback and vitals messages in the form `+12223334444`; should be the database value `client.from_phone_number`

**fallbackTimeout (int):** Number of seconds after the initial alert before a fallback message is sent; should be the database value `client.fallback_timeout`

**heartbeatPhoneNumbers (array of strings):** Array of phone numbers to receive vitals/heartbeat messages about this Client, in the form `'["+12223334444","+19998887777"]'`; should be the database value `client.heartbeat_phone_numbers`

**incidentCategories (array of strings):** Array of incident categories the Client's responder will be asked to choose from for each alert; should be the database value `client.incident_categories`

**isDisplayed (boolean):** If this Client is displayed on the dashboard by default; should be the database value `client.is_displayed`

**isSendingAlerts (boolean):** If this Client should send alert messages; should be the database value `client.is_sending_alerts`

**isSendingVitals (boolean):** If this Client is should send vitals messages; should be the database value `client.is_sending_vitals`

**createdAt (Date):** When the Client was created in the database; should be the database value `client.created_at`

**updatedAt (Date):** When the Client was last updated in the database; should be the database value `client.updated_at`

## `Session` class

An object representing a session. Contains the following fields:

**id (GUID):** Unique identifier of the session; should be the database value `session.id`

**chatbotState (CHATBOT_STATE enum):** The chatbot state of the session; should be the database value `session.chatbot_state`

**alertType (ALERT_TYPE enum):** The alert type of the session; should be the database value `session.alert_type`

**numberOfAlerts (int):** The number of alerts sent during the session; should be the database value `session.number_of_alerts`

**createdAt (Date):** When the Session was created in the database; should be the database value `session.created_at`

**updatedAt (Date):** When the Session was last updated in the database; should be the database value `session.updated_at`

**incidentCategory (string):** The chosen incident category of the session; should be the database value `session.incident_category`

**respondedAt (Date):** When the Session was responded to; should be the database value `session.responded_at`

**respondedByPhoneNumber (string):** The phone number of the responder that replied to the alert this session describes; should be the database value `session.responded_by_phone_number`

**device (object):** The device which generated this alert. Note: **button**, and **location** represent the same object as **device**.

**isResettable (boolean):** Whether or not this device can be reset by the client. This should be set to true if the device is acting strange.

## `ALERT_TYPE` enum

An enum of the possible types of alert that can be triggered.

## `CHATBOT_STATE` enum

An enum of the possible states the Alert Session could be in at any given time.

## `twilioHelpers` functions

Small collection of functions that handle the interaction with the Twilio client.

### buyAndConfigureTwilioPhoneNumber(areaCode, friendlyName)

Buys and configures a Twilio Phone number for use with the current server (i.e. using the Buttons project, webhook, and messaging service if deployed on Buttons, and using the Sensor project, webhook, and messaging service if deployed on Sensor).

** areaCode (string):** the three-digit US or Canadian area code of the phone number to buy and configure

** friendlyName (string):** the friendly name to assign to the phone number within Twilio

** Returns:** if successful, an object with `message: 'success'` and other key/values of interest; if not successful, an object with `message` explaining the error and other key/values of interest

## `helpers` functions

A collection of functions that are useful across the Brave NodeJS applications.

### formatDateTimeForDashboard(date)

Format the given `date` into English and Pacific Time

** date (Date):** the JS Date object to format

** Returns:** a string with the given `date` formatted into English and Pacific Time

### formatExpressValidationErrors(expressErrorObject)

A function that can be sent as an argument to the Express Validation `formatWith` function (https://express-validator.github.io/docs/validation-result-api.html#formatwithformatter). It takes an Express error object and returns a consistent, readable string to be used for error logs and sending in error HTTP messages.

## getAlertTypeDisplayName(alertType, language, t)

Get a human-readable display name for the given `alertType` in the given language.

**alertType (ALERT_TYPE):** the alert type whose display name to get

**language (String):** the language the return value would be in

**t (function):** the i18Next function that handles the translation

**Returns:** the display name corresponding to the given `alertType` in the given language

### getEnvVars(name)

In the test environment, returns the test version of the environment variable with the given name. Otherwise, returns the production version of the environment variable with the given name.

**name (string):** the name of the environment variable

**Returns:** the correct environment variable for the situation.

### generateCalculatedTimeDifferenceString(timeToCompare, db)

Returns an English string containing the time difference between the given `timeToCompare` and now according to an async function `db.getCurrentTime()`.

**timeToCompare (Date):** the date to compare to

**db (object):** object containing an async function `getCurrentTime()` that resolves to a Date respresenting the current time

**Returns:** the English string containing the time difference between the given `timeToCompare` and the date returned by `db.getCurrentTime`

### isDbLogging()

Controls whether the program should output DB debug logs.

**Returns:** `true` if the program should output DB debug logs. `false` otherwise. Under normal circumstances, this should be `false`.

### isTestEnvironment()

Determines whether we are executing in a test environment (i.e. with the value of NODE_ENV === 'test').

**Returns:** `true` if the current execution is in a test environment. `false` otherwise.

### isValidRequest(req, properties)

Determines whether the given Express request is valid if the given set of properties are required.

**req (Express Request object):** the request to validate

**properties (Array of strings):** the body parameters that must be given in the request in order for it to be valid.

**Returns:** `true` if the given request's body contains all of the given properties. `false` otherwise.

### logError(logString)

Logs the given string to stderr as appropriate for the situation. Also forwards the error to Sentry.

**logString (string):** The string to log

**Returns:** nothing

### log(logString)

Logs the given string to stdout as appropriate for the situation.

**logString (string):** The string to log

**Returns:** nothing

### logSentry(logString)

Logs the given string to stdout as appropriate for the situation. Also forwards the string to Sentry.

**logString (string):** The string to log

**Returns:** nothing

### runQuery(functionName, queryString, queryParams, pool, clientParam)

Runs a database query with correct transaction- and error-handling if required.

**functionName (string):** The name of the function that called `runQuery`. Used to make good error messages.

**queryString (string):** The `pg`-style query string to run in the database.

**queryParams (array):** The `pg`-style query parameters to be used in the `queryString`.

**pool (pg.Pool):** The pool of `pg` database connections.

**clientParam (pg.PoolClient):** The database connection client to be used if the query should be part of an ongoing transactions. Undefined if the query should not be part of an ongoing transaction.

### sleep(millis)

Sleep for the given number of milliseconds. Must use `await` when calling this function, so much be called from an `async` function. Reference: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep

**millis (int):** The number of milliseconds to sleep for

**Returns:** a promise that will resolve after the given number of milliseconds

### setupSentry(app, dsn, environment, release)

Set up Sentry for tracking errors and outages. NOTE: this needs to be called _after_ all other app.use() calls

**app (express()):** The express instance that you want to track errors in

**dsnString (string):** The Sentry data source name you'd like to connect to

**env (string):** The environment you are tracking errors in

**releaseName (string):** The name of the release you are tracking errors for

**Returns:** nothing

## `factories` functions

A collection of functions that are used to create valid, customizable model objects or insert models into the database

### clientDBFactory(db, overrides = {})

Insert a row into the `clients` table in the given `db` with valid default values unless they are overridden by values in the given `overrides` array.

**db (Buttons or Sensors db object):** The database that contains a `createClient` function usable to insert a row into the `clients` table

**overrides (object):** Any custom values to use for the new `client` row other than the defaults

### clientFactory(overrides = {})

Create a new `Client` object with valid default values unless they are overridden by the values in the given `overries` array

**overrides (object):** Any custom values to use for the new `Client` object other than the defaults

## `googleHelpers` functions

A collection of functions providing authentication for PA.

### paGetPayload(googleIdToken)

Gets payload contained in a given Google ID token.
If the Google ID token is invalid, this will throw an Error.

An ID token is deemed valid if:
- It isn't expired
- It was created for PA
- It was signed by Google
- It is for a Brave Google account
- It contains email and name fields

**googleIdToken (string):** ID token as given from Google. Should be retrieved using `paGetTokens`.

**Returns:** Payload information contained in the provided ID token.
More information can be read in this [Google documentation](https://cloud.google.com/docs/authentication/token-types#id).

### paGetTokens(googleAuthCode)

Gets tokens (Google access token and Google ID token) from Google using an authorization code.
If the authorization code is invalid, then this function will throw a `GaxiosError`.

**googleAuthCode (string):** Authorization code from Google retrieved in the frontend application (PA).

**Returns:** Object containing access token (googleAccessToken) and ID token (googleIdToken).

### paAuthorize(req, res, next)

Express middleware function to authorize a request to a PA API call.
Attempts to authorize the request using a submitted Google ID token in the Authorization header or body of the request.
The criteria for a valid Google ID token is defined under the `paGetPayload` function.

**req (Request):** The Express Request object. Should contain googleIdToken in the Authorization header or body of the request.

**res (Response):** The Express Response object.

**next (function):** The next function to run if this request is authorized.
