import NEEDS_TO_REFRESH_ROLES from '../needs-to-refresh-roles';
import test from 'tape';

test('NEEDS_TO_REFRESH_ROLES', t => {
  t.ok(NEEDS_TO_REFRESH_ROLES.test('auth.com/refresh-roles'), 'auth.com/refresh-roles');
  t.notOk(NEEDS_TO_REFRESH_ROLES.test('auth.com'), 'auth.com');
  t.end();
});
