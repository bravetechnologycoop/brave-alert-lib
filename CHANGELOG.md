# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Upgraded NodeJS (CU-28na1ge).

## [8.0.0] - 2022-07-04

### Added

- Client-specific language settings (CU-2dtutrx).

## [7.0.0] - 2022-06-23

### Changed

- Updated CHATBOT_STATE enum to make it more obvious that these values shouldn't be changed.
- Use a factory function for creating test AlertSessions.
- AlertSession and Client objects take an array of responderPhoneNumbers (CU-2dm6x2j).
- startAlertSession and sendAlertSessionUpdate take an array of toPhoneNumbers (CU-2dm6x2j).
- `AlertSession` now distinguishes between the responder phone number that responded first to the first messasge (thus becoming the respondedByPhoneNumber) and all the others
- Split the getReturnMessage function into two: one for the respondedByPhoneNumber and one for all the otherResponderPhoneNumbers. This changed the BraveAlerter constructor (CU-2dm6x2j).
- Require that the `alertSessionChangedCallback` returns the value of the `respondedByPhoneNumber` for the session after making any changes to the session (CU-2dm6x2j).

### Removed

- Fallback Twilio Status and Details/Notes (CU-2cc1zuu).

## [6.9.0] - 2022-06-07

### Removed

- Log message containing the body of text messages sent when there are no open sessions.

## [6.8.0] - 2022-05-13

### Added

- DB debug logging that is controlled by an environment variable (CU-2atyr1z).

## [6.7.0] - 2022-04-25

### Added

- twilioHelpers.buyAndConfigureTwilioPhoneNumber helper function to be used by PA (CU-21ghk0x).
- clickUpHelpers.clickUpChecker for use in authentication middleware (CU-21ghk0x).

### Security

- Updated dependencies.

## [6.6.0] - 2022-02-17

### Added

- generateCalculatedTimeDifferenceString helper function.
- formatDateTimeForDashboard helper.

### Security

- Updated dependencies.

## [6.5.0] - 2022-01-27

### Added

- Client model and factories to be used by both Buttons and Sensors (CU-13kqjz8).

## [6.4.0] - 2022-01-14

### Security

- Updated dependencies to address high security vulnerability.

## [6.3.0] - 2022-01-14

### Security

- Updated eslint and mocha to address moderate security vulnerabilities.

## [6.2.0] - 2021-12-06

### Changed

- Use `express.json()` instead of `body-parser` (CU-13kqxyt).
- `logSentry` also logs to the console.

## [6.1.0] - 2021-11-04

### Added

- Sound effects to push notifications (CU-10xfkhr).

### Security

- Updated dependencies.

## [6.0.0] - 2021-10-07

### Changed

- Changed the return values to be more consistent across all the endpoints.

### Fixed

- Designate Device response now returns JSON.

## [5.0.0] - 2021-09-27

### Added

- `POST /alert/acknowledgeAlertSession` to acknowledge an alert session through the Alert App (CU-10xfkhr).
- `POST /alert/respondToAlertSession` to respond to an alert session through the Alert App (CU-10xfkhr).
- `POST /alert/setIncidentCategory` to set the incident category for an alert session through the Alert App (CU-10xfkhr).
- `GET /alert/activeAlerts` to get the active alerts for a given client (CU-10xfkhr).

### Changed

- `POST /alert/designatedevice` also logs the given Responder Push ID (CU-10xfkhr).
- `startAlertSession` and `sendAlertSessionUpdate` will send messages to the designated device using the Push Notification ID, if given one. Only if not given a Push Notification ID will it send the messages using SMS (CU-hjwjfj).

## [4.0.0] - 2021-07-29

### Added

- Security audit to Travis (CU-121j1qz).
- `helpers.runQuery` (CU-tbazt8).

### Updated

- Values in `ALERT_TYPE` enum (CU-x1d6mq, CU-hjwfx2).
- Name of `CHATBOT_STATE` enum (CU-x1d6mq).

### Security

- Updated dependencies (CU-121j1qz).

## [3.5.0] - 2021-07-09

### Added

- `GET /alert/newNotificationsCount` endpoint (CU-hjwcwk).

## [3.4.0] - 2021-06-24

### Added

- Mocha debugging configuration.
- `GET /alert/historicAlerts` endpoint (CU-hjwfx2).

### Changed

- Added more detail to API error messages.

## [3.3.0] - 2021-05-27

### Fixed

- Route in API error messages.

## [3.2.0] - 2021-05-03

### Added

- `POST /alert/designatedevice` endpoint (CU-hjwazd).
- `GET /alert/location` endpoint (CU-hjwazd).
- A helper function to format Express Validation errors.

## [3.1.0] - 2021-04-30

### Added

- Sentry setup and error tracking (CU-32a5wb) (CU-px7k6e).

## [3.0.0] - 2021-03-29

### Changed

- Alert Sessions expect an array of fallback phone numbers, which will all be messaged simultaneously after the fallback timeout (CU-pv8hd5).

## [2.4.0] - 2021-02-23

### Removed

- Timestamps from production out and error logs (CU-jcuw85).

## [2.3.0] - 2021-02-11

### Added

- `helpers.logError` function that will output to `console.error` with the same format at `helpers.log` (CU-jcuw85).

### Changed

- Use Brave-wide ESLint and Prettier configuration (CU-eprhhn).

## [2.2.0] - 2021-01-07

### Security

- Update Twilio to include latest version of axios (CU-j6yuzk).

## [2.1.0] - 2020-12-11

### Security

- Add Twilio validation to make sure that post requests are coming from Twilio and relevant tests (CU-dgmfbv).

## [2.0.0] - 2020-11-20

### Added

- A call to the `sessionChangedCallback` after sending the initial alert session message (CU-bar1zy).
- helpers.isTestEnvironment helper method (CU-bar0fm).
- try/catch blocks to better handle `UnhandledPromiseRejectionWarning`s (CU-bar0fm).

### Changed

- IncidentCategory handling (CU-bar0fm).

## [1.0.0] - 2020-10-15

### Added

- `BraveAlerter` implementation (CU-baqza9).
- `helpers` helper functions that are already used in multiple Brave NodeJS projects.

## [0.1.0] - 2020-09-04

### Added

- Changelog.
- `.gitignore`.
- Node package definition.
- Linting.
- Travis configuration to run the tests in GitHub.
- Proof of concept test.
- Proof of concept function to output to the console "BraveAlertLib here".

## [0.0.0] - 2020-08-31

### Added

- GPL 3.0 license.
- README.

[unreleased]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v8.0.0...HEAD
[7.0.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v7.0.0...v8.0.0
[7.0.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v6.9.0...v7.0.0
[6.9.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v6.8.0...v6.9.0
[6.8.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v6.7.0...v6.8.0
[6.7.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v6.6.0...v6.7.0
[6.6.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v6.5.0...v6.6.0
[6.5.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v6.4.0...v6.5.0
[6.4.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v6.3.0...v6.4.0
[6.3.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v6.2.0...v6.3.0
[6.2.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v6.1.0...v6.2.0
[6.1.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v6.0.0...v6.1.0
[6.0.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v5.0.0...v6.0.0
[5.0.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v4.0.0...v5.0.0
[4.0.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v3.5.0...v4.0.0
[3.5.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v3.4.0...v3.5.0
[3.4.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v3.3.0...v3.4.0
[3.3.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v3.2.0...v3.3.0
[3.2.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v2.4.0...v3.0.0
[2.4.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/bravetechnologycoop/brave-alert-lib/releases/tag/v0.0.0
