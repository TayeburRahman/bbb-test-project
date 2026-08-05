// BigBlueButton API client.
//
// Every BBB API call is authenticated with a checksum:
//   checksum = SHA1( callName + queryString + sharedSecret )
// The critical rule is that the queryString you hash must be byte-for-byte the
// same string you send on the wire. We build ONE canonical serialization and
// use it for both — so this part is intentionally correct.
const crypto = require('crypto');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser();

function sha1(input) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

// Returns "<encoded-query>&checksum=<hash>" — the query is serialized once and
// hashed exactly as sent.
function buildQuery(callName, params, secret) {
  const qs = new URLSearchParams(params).toString();
  const checksum = sha1(callName + qs + secret);
  return `${qs}&checksum=${checksum}`;
}

function callUrl(callName, params) {
  const base = process.env.BBB_URL;
  const secret = process.env.BBB_SECRET || '';
  return `${base}/${callName}?${buildQuery(callName, params, secret)}`;
}

async function callApi(callName, params) {
  const res = await fetch(callUrl(callName, params), { redirect: 'manual' });
  const body = parser.parse(await res.text()).response;
  if (!body || body.returncode !== 'SUCCESS') {
    const err = new Error(
      `BBB ${callName} failed: ${body?.messageKey || res.status} ${body?.message || ''}`.trim()
    );
    err.bbb = body;
    throw err;
  }
  return body;
}

async function createMeeting({ meetingID, name, moderatorPW, attendeePW }) {
  return callApi('create', { name, meetingID, moderatorPW, attendeePW });
}

// The browser opens this URL to enter the meeting (redirect=true sends the user
// straight into the BBB HTML5 client).
function buildJoinUrl({ meetingID, fullName, password }) {
  return callUrl('join', { fullName, meetingID, password, redirect: 'true' });
}

async function isMeetingRunning(meetingID) {
  const body = await callApi('isMeetingRunning', { meetingID });
  return body.running === true || body.running === 'true';
}

module.exports = { buildQuery, callUrl, createMeeting, buildJoinUrl, isMeetingRunning };
