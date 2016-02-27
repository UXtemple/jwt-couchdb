import { readFileSync } from 'fs';
import invariant from 'invariant';

export default function getServerConfig() {
  const {
    endpoint = 'http://127.0.0.1:5984/_session',
    options = {
      algorithms: ['HS256'],
      expiresIn: '5m'
    },
    secret,
    port = 5985
  } = JSON.parse(readFileSync(process.env.CONFIG || 'config.json', 'utf8'));

  invariant(endpoint, 'missing authorisation endpoint');
  invariant(options, 'missing jwt options');
  invariant(options.algorithms, 'missing jwt algorithms');
  invariant(options.expiresIn, 'missing jwt expiresIn');
  invariant(secret, 'missing secret');
  invariant(port, 'missing port');

  return {
    endpoint,
    options,
    secret,
    port
  };
}
