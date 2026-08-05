// Minimal in-memory store of created meetings.
// (A real deployment would persist these in Postgres — fine to keep in memory
// for this test, but call it out if you rely on it.)
const meetings = new Map();

module.exports = {
  create(rec) {
    meetings.set(rec.meetingID, rec);
    return rec;
  },
  get(id) {
    return meetings.get(id);
  },
  list() {
    return [...meetings.values()];
  },
};
