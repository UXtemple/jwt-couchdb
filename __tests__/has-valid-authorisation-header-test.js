import HAS_VALID_AUTHORISATION_HEADER from '../has-valid-authorisation-header';
import test from 'tape';

test('HAS_VALID_AUTHORISATION_HEADER', t => {
  t.ok(HAS_VALID_AUTHORISATION_HEADER.test('Basic token'), 'Basic token');
  t.notOk(HAS_VALID_AUTHORISATION_HEADER.test('Basictoken'), 'Basictoken');
  t.notOk(HAS_VALID_AUTHORISATION_HEADER.test('Basic'), 'Basic');

  t.ok(HAS_VALID_AUTHORISATION_HEADER.test('Bearer token'), 'Bearer token');
  t.notOk(HAS_VALID_AUTHORISATION_HEADER.test('Bearertoken'), 'Bearertoken');
  t.notOk(HAS_VALID_AUTHORISATION_HEADER.test('Bearer'), 'Bearer');
  t.end();
});
