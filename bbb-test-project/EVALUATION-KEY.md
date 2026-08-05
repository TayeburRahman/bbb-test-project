# PRIVATE — Evaluation Key (do NOT give to candidates)

This test is deliberately small so you can review submissions fast. Its job is to tell a **strong,
production-minded full-stack developer** apart from someone who can only wire up a happy path. The
single embedded issue below is the main filter; the rest is craft signal.

---

## The embedded issue — insecure join / privilege escalation + password exposure

Two halves of the same mistake, both in `server/src/routes/meetings.js`:

### (a) Client-controlled role — privilege escalation
`POST /api/meetings/:id/join` reads `role` straight from the request body:

```js
const { role = 'attendee' } = req.body;
const password = role === 'moderator' ? rec.moderatorPW : rec.attendeePW;
```

The frontend's "Join as student" button sends `role: 'attendee'`, but **nothing stops a student
from calling the API directly with `role: 'moderator'`.** In BBB a moderator can mute/kick other
participants, remove the tutor, and end the class. This is a real privilege-escalation hole — and
it's invisible in the UI, because the buttons "look right."

### (b) Meeting passwords sent to the browser
`POST /api/meetings` returns the full record — including `moderatorPW` and `attendeePW`:

```js
res.status(201).json(rec); // rec contains moderatorPW / attendeePW
```

Anyone who creates a class can read both passwords in the Network tab and reuse the moderator
password forever. BBB passwords are server-side secrets and must never reach the client.

### What a strong candidate does
- **Decides the role on the server**, from who the user is — not from client input. In a minimal
  form that means: the creator/tutor is the moderator (e.g. issue an opaque host token at create
  time, or a simple signed/JWT session), everyone else is an attendee. They will note that a real
  system needs auth here and stub it sensibly.
- **Stops sending passwords to the client** — the create response returns only `meetingID` + `name`;
  join is performed server-side and only the redirect URL is handed back.
- **Explains both in `NOTES.md`**, ideally noting that the vulnerability is exploitable via the API
  even though the UI looks correct.

### Scoring the embedded issue
| Level | Signal |
|---|---|
| **Strong** | Finds *both* halves, moves role/authz server-side, stops leaking passwords, explains the attack in NOTES.md. |
| **Mid** | Finds one half (usually the role) and fixes it; misses the password leak, or "fixes" role only by hiding the host button in the UI (client-side only — still exploitable). Probe in interview. |
| **Weak** | Ships it as-is, reports "everything works." Red flag for a production hire. |

> Note: the checksum/BBB signing in `server/src/bbb.js` is written **correctly** on purpose — it is
> not the trap. A candidate who rewrites it is fine, but the security issue is the real test.

---

## Craft signals (score alongside the embedded issue)

| Dimension | What "good" looks like | Red flags |
|---|---|---|
| **Backend** | Validates input, clear errors, sensible structure, doesn't trust the client | Trusts client, no validation, leaks internals |
| **React** | Clean hooks, proper effect cleanup, loading/empty/error states | Interval/listener leaks, unhandled rejections |
| **Docker** | Both images build & run; `docker-compose up` just works; slim images, .dockerignore | Broken build, dev deps in prod image, secrets baked in |
| **CI/CD** | Pipeline is green; added step is meaningful and explained | Red pipeline, cargo-culted step they can't justify |
| **Tailwind** | Consistent scale, reused component classes, responsive | Arbitrary-value soup, inline-style mix |
| **Git / NOTES** | Small commits; NOTES explains the *why* and the security find | One giant commit; "done" with no explanation |

---

## What "done" looks like (the honest bar)
In 4–6 hours we expect: the security issue found and fixed (at least half (a); strong candidates get
both), one thoughtful improvement, one CI step added, and a clear `NOTES.md`. Someone who fixes only
the role but writes a sharp NOTES flagging the password leak as "next" is stronger than someone who
silently patches things with no reasoning.

**Auto-advance if:** both halves of the security issue found + explained, stack builds & runs, clean
git history.
**Hard pass (probably not our hire) if:** leaves `role` client-trusted, sends passwords to the
browser without noticing, Docker/CI don't run, or no tests/notes at all.

---

## Interview follow-ups (30 min, after review)

**On the test:**
1. "A student tells me they became a moderator and ended someone else's class. How, and how did you
   fix it?" *(Do they understand the API-vs-UI distinction?)*
2. "Where do the BBB moderator passwords live in your fix, and why does that matter?"
3. "Walk me through your Docker setup — how does the browser reach the API in the container?"
4. "What would you add to this pipeline before it deploys to production?"

**On the full build (AI recommendation engine — the real first milestone):**
5. "We want personalized study recommendations from each student's performance and interaction
   history. How would you approach v1?" *(Listen for: start simple — rules/heuristics or
   collaborative filtering / content-based on lesson metadata before reaching for heavy ML; how they
   collect signals/events; cold-start; how they'd measure whether recommendations help; where the
   model runs relative to the Node API; privacy of student data.)*
6. "How would you serve and update that model without coupling it to the web API?" *(Separate
   service, batch vs. realtime, feature store, retraining cadence.)*
7. Ask for links to prior recommender / ML work and have them explain their specific contribution.

**Green flags for the full build:** proposes a simple, measurable v1 before big ML; thinks about
event/telemetry capture early; keeps the AI layer as its own service; asks about data volume and
privacy.
