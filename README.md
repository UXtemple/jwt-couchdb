# jwt-couchdb

JWT endpoint to authenticate users and create JSON Web Tokens out of the CouchDB's session API.

[![Build Status](https://travis-ci.org/UXtemple/jwt-couchdb.svg?branch=master)](https://travis-ci.org/UXtemple/jwt-couchdb)

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

## How do I authenticate?
### Basic HTTP auth

You need to send a `POST` with an `Authorization` header that looks like
`Basic BASE64_USERNAME_COLON_PASSWORD`.

```
curl -vX POST -H "Authorization: Basic dGVzdDpwYXNz" http://127.0.0.1:5985
```

`BASE64_USERNAME_COLON_PASSWORD` is a base64 encoded version of `username:password`. The example
above encodes `test:pass` into `dGVzdDpwYXNz`.

How to base64 that value?
- in the browser use the function
    [btoa](https://developer.mozilla.org/en/docs/web/api/windowbase64/btoa): `btoa('test:pass')`,
- in node you could leverage the [bota](https://www.npmjs.com/package/btoa) package. It works like
    the browser version: `require('btoa')('test:pass')`, and
- in command line: `echo -n 'test:pass' | openssl base64`.

### JWT auth

Authenticating with a token isn't that different at all. You need to send a `POST` with an
`Authorization` header that looks like `Bearer JWT_TOKEN`.

```
curl -vX POST -H "Authorization: Bearer
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiU29tZSBVc2VyIiwicm9sZXMiOltdfQ.v4QRSYnAOen_NMBzlMER_Jrkep0xEz2kL09KscALC_c" http://127.0.0.1:5985
```

## Real life examples in JS land :)

Now, those examples were done with `curl` and despite us loving `curl` we don't use it (at least
directly) from the web or node.

### Using fetch

```js
// login for the first time and get a token
fetch('http://127.0.0.1:', {
  method: 'POST',
  headers: {
    // remember we need to use `btoa` to base64 our user and password credentials
    Authorization: `Basic ${btoa('user:password')}`
  }
}).then(res => res.json()).then(token => {
  // use token to authenticate somewhere else like:
  fetch('https://auth-only-stuff.com/resource', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // since you'll probably want to use the token across requests, it might be a good idea to store
  // it somewhere you can access later, like a variable in a closure that your fetch has access to:
  var myToken = token;
  // in sessionStorage to persist across page refreshes
  sessionStorage.setItem('token', token);
  // or in localStorage to use it when the user closes and opens the browser
  localStorage.setItem('token', token);
});
```

### Renewing your token
A token may expire. How do you know if it does? It will hold an `exp` claim in its `payload`.
If it does it's probably a good idea to have a mechanism to renew it before it expires so that our
users is always logged in throughout their use of our app.

That's when token renewing comes in handy. The good thing about this library is that creating a
token out of a user and password is almost the same as renewing that token you previously got.

The only difference from the example above is in the `Authorization` header, instead of using
the keyword `Basic` we use `Bearer` which tells the server which auth mechanism we want to use.
E.g.:

the type of authentication 

```
var token = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiU29tZSBVc2VyIiwicm9sZXMiOltdfQ.v4QRSYnAOen_NMBzlMER_Jrkep0xEz2kL09KscALC_c`;
// renew token
fetch('http://127.0.0.1:', {
  method: 'POST',
  headers: {
    Authorization: `Basic ${token}`
  }
}).then(res => res.json()).then(newToken => {
  // do something with the new token :)
});
```

## How do I blacklist a token?
See [this as that's couch_jwt_auth](https://github.com/UXtemple/couch_jwt_auth#blacklisting-tokens)'s realm.

## SSL all the things
Sending authentication credentials over an unencrypted connection is a very bad practice.
Plus, now that [Let's Encrypt](https://letsencrypt.org/) has been giving away free SSL certs for
a while, securing your endpoints isn't an excuse anymore.

If you plan on exposing this endpoint directly to the internet, you may want to grab the handler
and put together your own server that deals with HTTPS.
Because our setups most times have multiple services running on SSL, we're generally putting this
behind nginx to proxy requests to the service. Here's an nginx config file that may come in handy.

```
server {
  listen 80;
  server_name my-login.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name my-login.com;

  root /usr/share/nginx/html;

  ssl on;
  ssl_certificate /etc/letsencrypt/live/my-login.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/my-login.com/privkey.pem;
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_prefer_server_ciphers on;
  ssl_ciphers 'EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH';
  ssl_session_cache shared:SSL:1m;

  location / {
    proxy_pass http://localhost:5985;
    proxy_redirect off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Ssl on;
  }
}
```

License MIT.

with <3 by UXtemple.
