# jwt-couchdb

JWT endpoint to authenticate users and create JSON Web Tokens out of the CouchDB's session API.

## Usage

Install it:
```
npm i -g jwt-couchdb
```

Run it:
```
COUCH=/path/to/config.json jwt-couchdb
```

It will open up a server on `http://localhost:5985` that accepts POST requests to create JWT
tokens out of a valid CouchDB's authenticated user.

In order to get a token we need valid credentials. Both basic HTTP authentication and a JWT token
are valid choices.
Practically, both approaches are the same because they both give you a new token.
Semantically they are different though, as using HTTP authentication means that you're logging in,
while using an existing JWT token means you want to renew it.

## Config

The config file is in JSON format, here's an example of all the options you can set:

```
{
  "endpoint": "http://127.0.0.1:5984/_session",
  "options": {
    "algorithms": ["HS256"],
    "expiresIn": "30s"
  },
  "secret": "supersecret",
  "port": 3000
}
```

At a minimum, you need to set the `secret`. This value is the same that you used on
`couch_jwt_auth` on your CouchDB server's configuration.

## CouchDB's counterpart

In order for CouchDB to accept JWT tokens, you need to have an authentication handler on CouchDB's
land. Your best bet is to use `couch_jwt_auth`.
Until merged, I suggest you use [UXtemple's
fork](https://github.com/UXtemple/couch_jwt_auth) as it supports token
blacklisting which can come in very handy if a token goes missing in the wild and a possible
attacker gains access to it.

## How do I blacklist a token?

License MIT.
with <3 by UXtemple.
