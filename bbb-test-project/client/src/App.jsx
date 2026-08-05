import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import MeetingCard from './components/MeetingCard';

const LOCAL_STORAGE_HOST_TOKENS_KEY = 'bbb_host_tokens';

export default function App() {
  const [meetings, setMeetings] = useState([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store of hostTokens for meetings created in this browser session
  const [hostTokens, setHostTokens] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HOST_TOKENS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await api.listMeetings();
      setMeetings(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await api.createMeeting(name.trim());
      setName('');
      
      // Store host token for creator
      if (created.hostToken) {
        setHostTokens((prev) => {
          const next = { ...prev, [created.meetingID]: created.hostToken };
          try {
            localStorage.setItem(LOCAL_STORAGE_HOST_TOKENS_KEY, JSON.stringify(next));
          } catch {
            /* ignore storage errors */
          }
          return next;
        });
      }
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (meeting, isHostRequested) => {
    setError(null);
    try {
      const hostToken = isHostRequested ? hostTokens[meeting.meetingID] : undefined;
      const fullName = isHostRequested ? 'Host' : 'Student';
      const { url } = await api.join(meeting.meetingID, fullName, hostToken);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      setError(err.message || 'Failed to join class');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Live Classes</h1>
          <p className="text-sm text-slate-500">
            Create a BigBlueButton class and join it as a student or host.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200 flex items-center justify-between text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="font-bold text-red-500 hover:text-red-800 ml-4"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleCreate} className="mb-8 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Class name, e.g. Algebra 101"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            disabled={creating}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create class'}
          </button>
        </form>

        <div className="space-y-3">
          {loading && (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Loading classes…
            </p>
          )}

          {!loading && meetings.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
              No classes yet. Create one above.
            </p>
          )}

          {!loading &&
            meetings.map((m) => (
              <MeetingCard
                key={m.meetingID}
                meeting={m}
                isCreator={Boolean(hostTokens[m.meetingID])}
                onJoin={handleJoin}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
