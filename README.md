# brave-alert-lib

[![Build Status](https://travis-ci.com/bravetechnologycoop/brave-alert-lib.svg?branch=main)](https://travis-ci.com/bravetechnologycoop/brave-alert-lib)

Library to communicate with responders and staff when action is required.

# How to setup a local dev environment

1. clone this repository

1. run `npm install` to install the dependencies

1. run `npm run lint` to run the linter

1. run `npm test` to run the tests


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