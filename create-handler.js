import { sign } from 'jsonwebtoken';
import fetchAuth from 'fetch-auth-node';
import HAS_VALID_AUTHORISATION_HEADER from './has-valid-authorisation-header';

const POST = 'POST';

export default function createHandler({endpoint, options, secret}={}) {
  return async function handler(req, res) {
    if (req.method === POST && HAS_VALID_AUTHORISATION_HEADER.test(req.headers.authorization)) {
      try {
        const { userCtx } = await fetchAuth(endpoint, req.headers.authorization);
        const token = sign(userCtx, secret, options);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(token));
      } catch(err) {
        console.error(`${new Date().toISOString().replace('T', ' ').substr(0, 19)} 401 ${err.message}`);
        res.writeHead(401);
        res.end();
      }
    } else {
      res.writeHead(404);
      res.end();
    }
  };
}
