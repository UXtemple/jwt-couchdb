import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';
import test from 'tape';

const authHeaderTest = stub();
authHeaderTest.withArgs('valid').returns(true);
authHeaderTest.withArgs('valid token but wrong user').returns(true);
authHeaderTest.returns(false);

const userCtx = {'name': 'name', 'roles': ['role1']};
const userCtx2 = {'name': 'name', 'roles': ['role1', 'role2']};

const endpoint = 'endpoint';
const endpointSession = `${endpoint}/_session`;
const endpointUser = `${endpoint}/_users/org.couchdb.user:${userCtx.name}`;

const fetchAuth = stub();
fetchAuth.withArgs(endpointSession, 'valid').returns({userCtx});
fetchAuth.withArgs(endpointUser, 'valid').returns(userCtx2);
fetchAuth.withArgs(endpointSession, 'valid token but wrong user').throws();

const url = 'url';
const urlRefreshRoles = 'url-refresh-roles';

const needsToRefreshRolesTest = stub();
needsToRefreshRolesTest.withArgs(urlRefreshRoles).returns(true);
needsToRefreshRolesTest.returns(false);

const options = 'options';
const secret = 'secret';
const token = 'token';
const tokenRefreshedRoles = 'token-refreshed-roles';
const sign = stub();
sign.withArgs(userCtx2, secret, options).returns(tokenRefreshedRoles);
sign.returns(token);

const createHandler = proxyquire.noCallThru()('../create-handler', {
  'fetch-auth-node': fetchAuth,
  './has-valid-authorisation-header': {
    test: authHeaderTest
  },
  './needs-to-refresh-roles': {
    test: needsToRefreshRolesTest
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
    await Promise.all(methods.map(method => handler({method, url}, res)));

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
    await handler({method: 'POST', headers: {authorization: 'invalid'}, url}, res);
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
    await handler({method: 'POST', headers: {authorization: 'valid'}, url}, res);
    t.ok(fetchAuth.args[0], [endpointSession, 'valid'], 'authorises user');
    t.deepEquals(sign.args[0], [userCtx, secret, options], 'creates a token');
    t.deepEquals(res.writeHead.args[0], [200, {'Content-Type': 'application/json'}], 'responds with 200 and content-type application/json');
    t.ok(res.end.args[0][0], `"${token}"`, 'ends the response with the token as a JSON string');
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
    await handler({method: 'POST', headers: {authorization: 'valid token but wrong user'}, url}, res);

    t.ok(fetchAuth.args[1], [endpointSession, 'valid token but wrong user'], 'tries to authorise user');
    t.ok(console.error.called, 'logs the error');
    t.equals(res.writeHead.args[0][0], 401, 'responds with 401');
    t.ok(res.end.called, 'ends the response');

    console.error.restore();
    t.end();
  } catch(e) {
    console.log(e);
  }
});

test('#handler handles POST with valid auth header that needs to refresh roles returns token with new roles', async t => {
  const handler = createHandler({endpoint, options, secret});
  const res = {
    end: spy(),
    writeHead: spy()
  };

  try {
    await handler({method: 'POST', headers: {authorization: 'valid'}, url: urlRefreshRoles}, res);
    t.ok(fetchAuth.args[2], [endpointSession, 'valid'], 'authorises user');
    t.ok(fetchAuth.args[3], [endpointUser, 'valid'], 'fetches user');
    t.deepEquals(sign.args[1], [userCtx2, secret, options], 'creates a token');
    t.deepEquals(res.writeHead.args[0], [200, {'Content-Type': 'application/json'}], 'responds with 200 and content-type application/json');
    t.ok(res.end.args[0][0], `"${tokenRefreshedRoles}"`, 'ends the response with the token as a JSON string');
    t.end();
  } catch(e) {
    console.log(e);
  }
});
