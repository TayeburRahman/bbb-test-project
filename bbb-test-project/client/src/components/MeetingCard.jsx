import { useEffect, useState } from 'react';
import { api } from '../api';

function StatusPill({ running }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        running ? 'text-emerald-600' : 'text-slate-400'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${running ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      {running ? 'Live' : 'Not started'}
    </span>
  );
}

export default function MeetingCard({ meeting, isCreator, onJoin }) {
  const [running, setRunning] = useState(false);
  const [joining, setJoining] = useState(false);

  // Poll live status; cleaned up properly on unmount (reference implementation).
  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const s = await api.status(meeting.meetingID);
        if (active) setRunning(s.running);
      } catch {
        /* transient — keep polling */
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [meeting.meetingID]);

  const handleJoinClick = async (isHost) => {
    setJoining(true);
    try {
      await onJoin(meeting, isHost);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-800">{meeting.name}</p>
        <StatusPill running={running} />
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          disabled={joining}
          onClick={() => handleJoinClick(false)}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
        >
          {joining ? 'Joining…' : 'Join as student'}
        </button>
        <button
          disabled={joining}
          onClick={() => handleJoinClick(true)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium text-white transition disabled:opacity-50 ${
            isCreator ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-600 hover:bg-slate-700'
          }`}
          title={isCreator ? 'Join as host (Creator)' : 'Join as host'}
        >
          {joining ? 'Joining…' : 'Join as host'}
        </button>
      </div>
    </div>
  );
}
