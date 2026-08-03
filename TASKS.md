# Tasks

> Optional explicit task list. If you prefer to test whether the candidate can **find** problems on
> their own, use the README instead (which only says "there is at least one production issue — find
> it") and don't share this file.

This starter app runs, but it is **not production-safe**. Please fix the issues below, commit in small
steps, and write a short `NOTES.md` explaining what you changed and why.

---

## 1. Fix the frontend loading issue (security — required)

ERR_CONNECTION_REFUSED means nothing is listening on 5173 — the client dev server isn't running.
ERR_CONNECTION_REFUSED was a timing issue:  opened the URL before Vite finished binding.
Chrome tries when you type localhost, nothing on IPv4 127.0.0.
And direct IPv6 access returned a permissions error, which on Windows usually means the port sits inside a reserved/excluded port range 
(Hyper-V/WSL/WinNAT grab these). That would also explain why Vite couldn't bind IPv4 and fell back to IPv6. Let me confirm:

## 2. Stop leaking meeting passwords to the browser (security — required)

When a class is created, the API response includes the BigBlueButton **moderator and attendee
passwords**. Anyone who creates a class can read them in the browser's Network tab and reuse the
moderator password forever.

- Make sure BBB passwords never reach the client.
- The create response should return only what the frontend actually needs (e.g. `meetingID`, `name`).

**Done when:** no password appears in any API response the browser receives.

## How to run

See `README.md`. In short:

```bash
docker-compose up --build     # frontend :8080, API :3000
```
