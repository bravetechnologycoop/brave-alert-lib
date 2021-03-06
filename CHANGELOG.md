# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

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

[unreleased]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v3.5.0...HEAD
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
