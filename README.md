# MHoC Bridge

MHoC Bridge is an experimental Discord/Reddit bot that facilitates bill discussions occurring in the Model House of Commons discord being crossposted to Reddit.

This is in beta/active development/whatever platitudes are necessary to excuse the fact I'm very bad at programming despite having an honest to god degree in it

## Installation

You will need

* A discord bot account and accompanying token
* A reddit bot account and accompanying username, password, client ID, and client secret (I am far too lazy for OAuth)
* Node.js (I am using v20.10.0 but not-very-outdated versions probably work)
* A MySQL database when I can be bothered setting one up instead of a [deeply terrible json one](./src/database.js)

```
$ git clone https://github.com/lily-irl/mhoc-bridge.git
$ cd mhoc-bridge
$ npm install
$ node register-command-bootstrap.js (first run only)
$ node src/index.js
```

## Credentials

The bot expects a `credentials.json` file which should look a bit like this

```json
{
    "REDDIT": {
        "username": "bot reddit account",
        "password": "bot account password",
        "clientId": "bot client id",
        "clientSecret": "bot client secret"
    },
    "DISCORD": {
        "token": "bot token",
        "clientId": "bot discord client id"
    }
}
```
