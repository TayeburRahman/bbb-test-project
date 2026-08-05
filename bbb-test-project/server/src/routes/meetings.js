const express = require('express');
const { randomUUID } = require('crypto');
const bbb = require('../bbb');
const store = require('../store');

const router = express.Router();

// Create a live class (BBB meeting).
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Class name is required' });
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({ error: 'Class name must be 100 characters or fewer' });
    }

    const meetingID = randomUUID();
    const moderatorPW = randomUUID();
    const attendeePW = randomUUID();
    const hostToken = randomUUID();

    await bbb.createMeeting({ meetingID, name: trimmedName, moderatorPW, attendeePW });
    const rec = { meetingID, name: trimmedName, moderatorPW, attendeePW, hostToken, createdAt: Date.now() };
    store.create(rec);

    // Secure response: Passwords (moderatorPW & attendeePW) remain strictly server-side.
    // Return only safe metadata + opaque hostToken for the class creator.
    res.status(201).json({
      meetingID: rec.meetingID,
      name: rec.name,
      hostToken: rec.hostToken,
      createdAt: rec.createdAt,
    });
  } catch (e) {
    next(e);
  }
});

// List classes (id + name only).
router.get('/', (req, res) => {
  res.json(store.list().map(({ meetingID, name, createdAt }) => ({ meetingID, name, createdAt })));
});

// Join a class → returns the redirect URL the browser opens.
router.post('/:id/join', async (req, res, next) => {
  try {
    const rec = store.get(req.params.id);
    if (!rec) return res.status(404).json({ error: 'Meeting not found' });

    const rawFullName = req.body.fullName;
    const fullName = typeof rawFullName === 'string' && rawFullName.trim()
      ? rawFullName.trim().slice(0, 50)
      : 'Guest';

    // Role authorization: Decided strictly on the server based on hostToken verification.
    // Client input 'role' is ignored to prevent privilege escalation attacks.
    const providedHostToken = req.body.hostToken || req.headers['x-host-token'];
    const isHost = Boolean(providedHostToken && providedHostToken === rec.hostToken);
    const password = isHost ? rec.moderatorPW : rec.attendeePW;

    const url = bbb.buildJoinUrl({ meetingID: rec.meetingID, fullName, password });
    res.json({ url });
  } catch (e) {
    next(e);
  }
});

// Live status (running?) — polled by the frontend.
router.get('/:id/status', async (req, res, next) => {
  try {
    const rec = store.get(req.params.id);
    if (!rec) return res.status(404).json({ error: 'not found' });
    const running = await bbb.isMeetingRunning(rec.meetingID);
    res.json({ running });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
