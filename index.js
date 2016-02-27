import createHandler from './create-handler';
import getServerConfig from './get-server-config';
import http from 'http';

const { endpoint, options, port, secret } = getServerConfig();

http.createServer(createHandler({endpoint, options, secret})).listen(port);

console.log(`CouchDB JWT auth running on port http://localhost:${port} against ${endpoint}`);
