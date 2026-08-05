# Test Project — BigBlueButton Live Classes

Thanks for your interest. This is a **short, timeboxed test** (aim for ~4–6 hours; you have a few
days). It comes before the full build of our online tutoring platform, and it exists so we can see
how you work with **React, Node, the BigBlueButton API, Docker, and CI/CD**.

You are given a **small but complete, runnable app**: a React (TailwindCSS) frontend and a Node.js
API that integrates the BigBlueButton API. It boots against a built-in BBB **mock**, so you don't
need a real BBB server to run it.

---

## What the app does

- Create a live class (a BBB meeting).
- See the list of classes with a **live status** indicator.
- Join a class as a **student** or as a **host**, which opens the BBB session.

## Run it

```bash
docker-compose up --build
# Frontend: http://localhost:8080
# API:      http://localhost:3000/api/health
```

Or run the services directly for development:

```bash
# terminal 1
cd server && npm install && cp ../.env.example .env && npm run dev
# terminal 2
cd client && npm install && npm run dev   # http://localhost:5173
```

Run the API tests:

```bash
cd server && npm test
```

---

## Your tasks

1. **Get familiar & run it.** Bring the stack up with Docker and try the flow end-to-end.
2. **Harden it for production.** This starter works, but **it is not production-safe as written.**
   Review the backend the way you would a teammate's PR before it goes live. There is at least one
   issue here that a real tutoring platform must not ship — **find it, fix it, and explain your fix.**
   (Hint: think about who is allowed to do what, and what data reaches the browser.)
3. **Make one improvement of your choice** that shows your judgement — e.g. input validation,
   error/loading states, a small test, a health check in CI, image size, or a Tailwind/UX polish.
   Pick *one* and do it well rather than many half-done.
4. **Extend the pipeline (lightly).** The CI already installs, tests, and builds the Docker images.
   Add one meaningful step (lint, an image push to a registry, a smoke test — your call) and explain
   why you chose it.

You do **not** need to build the AI recommendation engine for this test — that's the first milestone
of the full project, and we'll discuss your approach to it in the interview. If you have relevant
experience with recommendation systems, mention it.

---

## `NOTES.md` — required

Half a page is plenty:
- **The production issue(s) you found**, how you spotted them, and how you fixed them.
- What you changed and why (task 3 & 4).
- Anything you'd do next with more time.
- If you want, a sentence or two on how you'd approach the AI recommendation engine.

> We weight `NOTES.md` heavily. We're hiring for judgement, not just code.

---

## What we look at

React quality · Node/API quality · **security & correctness** · Docker (does it build & run cleanly)
· CI/CD · Tailwind usage · git history · clarity of `NOTES.md`.

## Submit

A link to a Git repo (or a zip) with your commits and `NOTES.md`. Good luck — we're keen to see how
you think.
