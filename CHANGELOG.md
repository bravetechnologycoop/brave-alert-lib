# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Twilio message ID logs for the alert session.
- A call to the `sessionChangedCallback` after sending the initial alert session message (CU-bar1zy).

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

[Unreleased]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/bravetechnologycoop/brave-alert-lib/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/bravetechnologycoop/brave-alert-lib/releases/tag/v0.0.0
