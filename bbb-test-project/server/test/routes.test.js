const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
process.env.BBB_MOCK = 'true';
process.env.BBB_URL = 'http://localhost:3000/bbb-mock/api';
const app = require('../src/index');

let server;
let baseUrl;

test.before((_, done) => {
  server = http.createServer(app);
  server.listen(0, () => {
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    done();
  });
});

test.after((_, done) => {
  server.close(done);
});

test('POST /api/meetings requires non-empty name', async () => {
  const res = await fetch(`${baseUrl}/api/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '   ' }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.error, 'Class name is required');
});

test('POST /api/meetings creates meeting without leaking passwords', async () => {
  const res = await fetch(`${baseUrl}/api/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Physics 101' }),
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.ok(data.meetingID);
  assert.strictEqual(data.name, 'Physics 101');
  assert.ok(data.hostToken);
  assert.strictEqual(data.moderatorPW, undefined);
  assert.strictEqual(data.attendeePW, undefined);
});

test('GET /api/meetings returns created meeting list', async () => {
  const res = await fetch(`${baseUrl}/api/meetings`);
  assert.strictEqual(res.status, 200);
  const list = await res.json();
  assert.ok(Array.isArray(list));
  assert.ok(list.some((m) => m.name === 'Physics 101'));
});

test('POST /api/meetings/:id/join ignores client role & requires hostToken for host join', async () => {
  // Create a meeting first
  const createRes = await fetch(`${baseUrl}/api/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Calculus III' }),
  });
  const created = await createRes.json();

  // Attack attempt: Student sends role: 'moderator' without hostToken
  const attackRes = await fetch(`${baseUrl}/api/meetings/${created.meetingID}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Malicious Student', role: 'moderator' }),
  });
  assert.strictEqual(attackRes.status, 200);
  const attackData = await attackRes.json();
  assert.ok(attackData.url);
  // URL should NOT contain moderator password or role elevation
  assert.strictEqual(attackData.url.includes('moderator'), false);

  // Legitimate host join with valid hostToken
  const hostRes = await fetch(`${baseUrl}/api/meetings/${created.meetingID}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Dr. Euler', hostToken: created.hostToken }),
  });
  assert.strictEqual(hostRes.status, 200);
  const hostData = await hostRes.json();
  assert.ok(hostData.url);
});

test('POST /api/meetings/:id/join returns 404 for invalid ID', async () => {
  const res = await fetch(`${baseUrl}/api/meetings/non-existent-id/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Test' }),
  });
  assert.strictEqual(res.status, 404);
});
