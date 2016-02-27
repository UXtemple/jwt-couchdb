import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';
import test from 'tape';

const config = {
  endpoint: 'endpoint',
  options: 'options',
  port: 'port',
  secret: 'secret'
};

const handler = 'handler';
const createHandler = stub().returns(handler);
const listen = spy();
const createServer = stub().returns({listen});
const getServerConfig = stub().returns(config);

spy(console, 'log');

proxyquire.noCallThru()('../index', {
  './create-handler': createHandler,
  './get-server-config': getServerConfig,
  http: {
    createServer
  }
}).default;

test('server', t => {
  const { port, ...handlerArgs } = config;

  t.ok(getServerConfig.called, `gets the server's config`);
  t.deepEquals(createHandler.args[0][0], handlerArgs, `creates handler passing endpoint, options and secret`);
  t.equals(createServer.args[0][0], handler, 'creates a server with that handler');
  t.equals(listen.args[0][0], config.port, 'runs that server on the specified port');
  t.equals(console.log.args[0][0], `CouchDB JWT auth running on port http://localhost:${config.port} against ${config.endpoint}`, `logs the server info to the console`);

  console.log.restore();
  t.end();
});
