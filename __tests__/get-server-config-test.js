import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';
import test from 'tape';

const invariant = spy();
invariant.withArgs(undefined, 'missing secret');

const readFileSync = stub();
readFileSync.onCall(0).returns(`{
}`);
readFileSync.onCall(1).returns(`{
  "secret": "supersecret"
}`);
readFileSync.onCall(2).returns(`{
  "endpoint": "endpoint",
  "options": {
    "algorithms": ["alg"],
    "expiresIn": "30s"
  },
  "secret": "secret",
  "port": 3000
}`);

const getServerConfig = proxyquire('../get-server-config', {
  fs: {
    readFileSync
  },
  invariant
}).default;

test('#getServerConfig', t => {
  getServerConfig();
  t.ok(invariant.firstCall, 'warns missing secret');

  t.deepEquals(getServerConfig(), {
    endpoint: 'http://127.0.0.1:5984',
    options: {
      algorithms: ['HS256'],
      expiresIn: '5m'
    },
    secret: 'supersecret',
    port: 5985
  }, 'defaults');

  t.deepEquals(getServerConfig(), {
    "endpoint": "endpoint",
    "options": {
      "algorithms": ["alg"],
      "expiresIn": "30s"
    },
    "secret": "secret",
    "port": 3000
  }, 'overrides');

  t.end();
});
