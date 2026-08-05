const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { buildQuery } = require('../src/bbb');

test('checksum is deterministic', () => {
  const a = buildQuery('create', { name: 'Algebra', meetingID: 'm1' }, 'secret');
  const b = buildQuery('create', { name: 'Algebra', meetingID: 'm1' }, 'secret');
  assert.strictEqual(a, b);
});

test('checksum is computed over the exact query string that is sent', () => {
  // Names with spaces / unicode must be encoded once and hashed as sent.
  const q = buildQuery('create', { name: 'AP Bio — Cells', meetingID: 'm1' }, 'secret');
  const qs = q.slice(0, q.lastIndexOf('&checksum='));
  const checksum = q.slice(q.lastIndexOf('checksum=') + 'checksum='.length);
  const expected = crypto.createHash('sha1').update('create' + qs + 'secret').digest('hex');
  assert.strictEqual(checksum, expected);
});
