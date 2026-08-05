# Technical & Security Notes — BigBlueButton Live Classes

## 1. Production Security Vulnerabilities & Fixes

During architectural and code review of the API routes (`server/src/routes/meetings.js`), two linked production security vulnerabilities were identified and resolved:

### Vulnerability A: Client-Controlled Role (Privilege Escalation)
- **Finding:** The join endpoint (`POST /api/meetings/:id/join`) trusted `{ role }` directly from the HTTP request body (`role === 'moderator' ? rec.moderatorPW : rec.attendeePW`).
- **Impact:** An attendee/student could call the API directly with `{ role: 'moderator' }` and receive host/moderator privileges in the BigBlueButton room, allowing them to mute participants, eject tutors, or end classes.
- **Fix:** Removed client input `role` entirely. Role authorization is now decided server-side. Upon class creation, the server generates an opaque `hostToken` (`crypto.randomUUID()`) and returns it exclusively to the creator. To join as moderator, the client must present the matching `hostToken`. Requests without a valid `hostToken` default strictly to attendee access.

### Vulnerability B: Meeting Passwords Exposure to Browser
- **Finding:** The creation endpoint (`POST /api/meetings`) returned the entire database record (`rec`) in the JSON response, including `moderatorPW` and `attendeePW`.
- **Impact:** Anyone creating a class could read both passwords in the browser Network tab and reuse the moderator password indefinitely to hijack sessions. BBB passwords must remain server-side secrets.
- **Fix:** Redacted `moderatorPW` and `attendeePW` from the `POST /api/meetings` response. The server now returns only safe metadata: `{ meetingID, name, hostToken, createdAt }`. Passwords are saved in memory and consumed internally during BBB URL generation.

---

## 2. Engineering Improvements & Task Details

### Task 3: Improvements (Input Validation, Route Tests & UX)
1. **Server Input Validation:** Added sanitization and validation for `name` on creation (must be non-empty string <= 100 chars) and `fullName` on join (trimmed <= 50 chars). Invalid inputs return `400 Bad Request` with clear error messages.
2. **API Route Integration Testing (`server/test/routes.test.js`):** Added a comprehensive integration test suite using Node's native test runner (`node:test` & `node:assert`). Tests verify zero password exposure, strict role authorization, input validation, 404 handling, and status polling.
3. **Client UX & Error Management:**
   - Managed `hostToken` state and persisted it to `localStorage` so tutors retain host privileges across browser reloads.
   - Added user-facing error notification banners in `App.jsx` for API failures.
   - Added loading indicators during class creation and join actions.
   - Cleaned up malformed third-party plugins in `client/tailwind.config.js` to ensure fast, stable CSS compilation during dev & reload.

### Task 4: CI/CD Pipeline Extension
Created `.github/workflows/ci.yml` using GitHub Actions. The pipeline executes:
1. **Automated Unit & Integration Tests:** Runs `npm test` on Node 20.
2. **Syntax Verification / Linting:** Runs `node --check` across core server files.
3. **Frontend Build Verification:** Runs `npm run build` inside `client/`.
4. **Docker Container Verification:** Executes `docker compose build` to guarantee production container images build cleanly.

---

## 3. Future Production Readiness (Next Steps)

With additional time, the following production enhancements would be prioritized:
1. **Database Persistence:** Replace the in-memory `Map` store with PostgreSQL + Prisma/Knex for transactional durability.
2. **User Authentication & RBAC:** Implement JWT or session-based authentication (OAuth2/OIDC) so tutor/student identity and roles are verified via authenticated user tokens rather than standalone host tokens.
3. **Rate Limiting & Security Headers:** Add `express-rate-limit` to prevent brute-force BBB URL generation and `helmet` for HTTP security headers.
4. **WebSocket / SSE Live Status:** Replace 5-second polling in `MeetingCard.jsx` with Server-Sent Events (SSE) or WebSockets for real-time status updates.

---

## 4. AI Recommendation Engine Approach (Milestone 1 Strategy)

For the upcoming AI recommendation engine milestone:
1. **Phase 1 (Heuristics & Telemetry):** Start with telemetry capture (lesson completion rate, assessment scores, interaction time, topic drop-offs). Implement a rule-based/content-based filtering engine matching student weak areas with recommended review modules before introducing heavy ML models.
2. **Phase 2 (Decoupled Service):** Host the recommender as a decoupled Python FastAPI microservice communicating asynchronously via events (Kafka/RabbitMQ) or REST API. This keeps the Node.js web server lightweight and decoupled from model inference latency.
