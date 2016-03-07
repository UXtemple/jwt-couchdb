import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';
import test from 'tape';

const authHeaderTest = stub();
authHeaderTest.withArgs('valid').returns(true);
authHeaderTest.withArgs('valid token but wrong user').returns(true);
authHeaderTest.returns(false);

const endpoint = 'endpoint';
const userCtx = 'userCtx';
const fetchAuth = stub();
fetchAuth.withArgs(endpoint, 'valid').returns({userCtx});
fetchAuth.withArgs(endpoint, 'valid token but wrong user').throws();

const options = 'options';
const secret = 'secret';
const token = 'token';
const sign = stub().returns(token);

const createHandler = proxyquire.noCallThru()('../create-handler', {
  'fetch-auth-node': fetchAuth,
  './has-valid-authorisation-header': {
    test: authHeaderTest
  },
  jsonwebtoken: {
    sign
  }
}).default;

test('#createHandler', t => {
  t.equals(typeof createHandler(), 'function', 'returns a thunk');
  t.end();
});

const methods = ['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PUT', 'TRACE'];
test(`#handler doesn't handle ${methods.join(', ')}`, async t => {
  const handler = createHandler();
  const res = {
    end: spy(),
    writeHead: spy()
  };

  try {
    await Promise.all(methods.map(method => handler({method}, res)));

    t.deepEquals(res.writeHead.args, methods.map(m => [404]), 'responds with 404');
    t.equals(res.end.callCount, methods.length, 'ends the responses');

    t.end();
  } catch(e) {
    console.log(e);
  }
});

test(`#handler fails with POST and an invalid auth header`, async t => {
  const handler = createHandler();
  const res = {
    end: spy(),
    writeHead: spy()
  };

  try {
    await handler({method: 'POST', headers: {authorization: 'invalid'}}, res);
    t.equals(res.writeHead.args[0][0], 404, 'responds with 404');
    t.ok(res.end.called, 'ends the response');
    t.end();
  } catch(e) {
    console.log(e);
  }
});

test('#handler handles POST with valid auth header returns token', async t => {
  const handler = createHandler({endpoint, options, secret});
  const res = {
    end: spy(),
    writeHead: spy()
  };

  try {
    await handler({method: 'POST', headers: {authorization: 'valid'}}, res);
    t.ok(fetchAuth.args[0], [endpoint, 'valid'], 'authorises user');
    t.deepEquals(sign.args[0], [userCtx, secret, options], 'creates a token');
    t.deepEquals(res.writeHead.args[0], [200, {'Content-Type': 'application/json'}], 'responds with 200 and content-type application/json');
    t.ok(res.end.args[0][0], '"token"', 'ends the response with the token as a JSON string');
    t.end();
  } catch(e) {
    console.log(e);
  }
});

test('#handler handles POST with valid auth header but invalid credentials ends up in 401', async t => {
  const handler = createHandler({endpoint, options, secret});
  const res = {
    end: spy(),
    writeHead: spy()
  };
  spy(console, 'error');

  try {
    await handler({method: 'POST', headers: {authorization: 'valid token but wrong user'}}, res);

    t.ok(fetchAuth.args[1], [endpoint, 'valid token but wrong user'], 'tries to authorise user');
    t.ok(console.error.called, 'logs the error');
    t.equals(res.writeHead.args[0][0], 401, 'responds with 401');
    t.ok(res.end.called, 'ends the response');

    console.error.restore();
    t.end();
  } catch(e) {
    console.log(e);
  }
});
