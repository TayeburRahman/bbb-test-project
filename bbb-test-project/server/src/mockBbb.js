// A tiny, self-contained mock of the BigBlueButton API so this project runs
// end-to-end WITHOUT a real BBB server. It validates the checksum exactly like
// BBB does (so a broken checksum implementation would fail here too) and keeps
// meeting state in memory.
//
// Enabled when BBB_MOCK=true. Point BBB_URL at a real server to disable it.
const express = require('express');
const crypto = require('crypto');

const router = express.Router();
const meetings = new Map(); // meetingID -> { name, moderatorPW, attendeePW, running, participants }

function sha1(s) {
  return crypto.createHash('sha1').update(s).digest('hex');
}

// Recompute the checksum over the raw query string as received (minus the
// checksum param), mirroring BBB's own verification.
function checksumValid(req, callName) {
  const secret = process.env.BBB_SECRET || '';
  const raw = req.originalUrl.includes('?') ? req.originalUrl.split('?')[1] : '';
  const given = new URLSearchParams(raw).get('checksum');
  const withoutChecksum = raw
    .split('&')
    .filter((p) => !p.startsWith('checksum='))
    .join('&');
  return given && given === sha1(callName + withoutChecksum + secret);
}

function xml(fields) {
  const inner = Object.entries(fields)
    .map(([k, v]) => `<${k}>${v}</${k}>`)
    .join('');
  return `<response>${inner}</response>`;
}

function sendXml(res, fields) {
  res.set('Content-Type', 'text/xml').send(xml(fields));
}

function checksumError(res) {
  return sendXml(res, {
    returncode: 'FAILED',
    messageKey: 'checksumError',
    message: 'You did not pass the checksum security check',
  });
}

router.get('/create', (req, res) => {
  if (!checksumValid(req, 'create')) return checksumError(res);
  const { meetingID, name, moderatorPW, attendeePW } = req.query;
  meetings.set(meetingID, { name, moderatorPW, attendeePW, running: false, participants: 0 });
  sendXml(res, { returncode: 'SUCCESS', meetingID, hasBeenForciblyEnded: 'false' });
});

router.get('/join', (req, res) => {
  if (!checksumValid(req, 'join')) return checksumError(res);
  const { meetingID, fullName, password } = req.query;
  const m = meetings.get(meetingID);
  if (!m) return checksumError(res); // BBB would return notFound; good enough for the mock
  m.running = true;
  m.participants += 1;
  const role = password === m.moderatorPW ? 'MODERATOR' : 'attendee';
  // Real BBB redirects the browser into the HTML5 client. The mock just shows a
  // confirmation page so the flow is visible — and so the role is observable.
  res.set('Content-Type', 'text/html').send(`<!doctype html>
<html><head><meta charset="utf-8"><title>${m.name}</title>
<style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;display:grid;place-items:center;height:100vh;margin:0}
.card{background:#1e293b;padding:2rem 2.5rem;border-radius:12px;text-align:center}
.role{font-weight:700;color:${role === 'MODERATOR' ? '#f87171' : '#34d399'}}</style></head>
<body><div class="card"><h1>${m.name}</h1>
<p>${fullName} joined as <span class="role">${role}</span></p>
<p style="color:#64748b;font-size:.85rem">(BigBlueButton mock — a real server opens the live class here.)</p>
</div></body></html>`);
});

router.get('/isMeetingRunning', (req, res) => {
  if (!checksumValid(req, 'isMeetingRunning')) return checksumError(res);
  const m = meetings.get(req.query.meetingID);
  sendXml(res, { returncode: 'SUCCESS', running: m ? String(m.running) : 'false' });
});

module.exports = router;
