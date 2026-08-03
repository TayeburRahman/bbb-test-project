# Tasks

> Optional explicit task list. If you prefer to test whether the candidate can **find** problems on
> their own, use the README instead (which only says "there is at least one production issue — find
> it") and don't share this file.

This starter app runs, but it is **not production-safe**. Please fix the issues below, commit in small
steps, and write a short `NOTES.md` explaining what you changed and why.

---

## 1. Fix the privilege-escalation vulnerability (security — required)

The "join a class" flow lets any user choose their own role. A student can call the API directly and
join as a **moderator** — with the power to mute/kick other students, remove the tutor, and end the
class. The UI buttons hide this, but the API does not.

- Find where the join role is decided.
- Make the role a **server-side** decision based on who the user is (e.g. the class creator/tutor is
  the moderator; everyone else is an attendee). Never trust a role sent by the client.
- Briefly note how you'd back this with real authentication in production.

**Done when:** a student cannot become a moderator, no matter what they send to the API.

## 2. Stop leaking meeting passwords to the browser (security — required)

When a class is created, the API response includes the BigBlueButton **moderator and attendee
passwords**. Anyone who creates a class can read them in the browser's Network tab and reuse the
moderator password forever.

- Make sure BBB passwords never reach the client.
- The create response should return only what the frontend actually needs (e.g. `meetingID`, `name`).

**Done when:** no password appears in any API response the browser receives.

## 3. Make one production improvement of your choice (judgement)

Pick **one** and do it well (not several half-done):

- Input validation and clear error responses on the API, **or**
- Proper loading / empty / error states in the UI, **or**
- A meaningful automated test, **or**
- A smaller/cleaner Docker image, **or**
- A Tailwind / UX polish.

Explain in `NOTES.md` why you chose it.

## 4. Add one meaningful step to the CI pipeline (DevOps)

The pipeline in `.github/workflows/ci.yml` already installs, tests, and builds the Docker images.
Add **one** step that adds real value and explain why — for example:

- a linter, **or**
- pushing the built images to a container registry, **or**
- a smoke test that boots the stack and checks `GET /api/health`.

**Done when:** the pipeline is green and your new step is justified in `NOTES.md`.

---

## What to submit

- A Git repo (or zip) with your commits.
- A short `NOTES.md`: what you found, how you fixed it, what you'd do next, and — if you like — a
  couple of sentences on how you'd approach the AI recommendation engine for the full build.

## How to run

See `README.md`. In short:

```bash
docker-compose up --build     # frontend :8080, API :3000
```
