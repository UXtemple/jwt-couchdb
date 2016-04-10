import { sign } from 'jsonwebtoken';
import fetchAuth from 'fetch-auth-node';
import HAS_VALID_AUTHORISATION_HEADER from './has-valid-authorisation-header';
import NEEDS_TO_REFRESH_ROLES from './needs-to-refresh-roles';

const POST = 'POST';

export default function createHandler({endpoint, options, secret}={}) {
  return async function handler(req, res) {
    if (req.method === POST && HAS_VALID_AUTHORISATION_HEADER.test(req.headers.authorization)) {
      let name;
      let roles;

      try {
        const { userCtx } = await fetchAuth(`${endpoint}/_session`, req.headers.authorization);
        name = userCtx.name;
        roles = userCtx.roles;

        if (NEEDS_TO_REFRESH_ROLES.test(req.url)) {
          const nextUserCtx = await fetchAuth(`${endpoint}/_users/org.couchdb.user:${name}`, req.headers.authorization);
          roles = nextUserCtx.roles;
        }

        const token = sign({name, roles}, secret, options);

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
