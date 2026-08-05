const handleResponse = async (r) => {
  const data = await r.json();
  if (!r.ok) {
    throw new Error(data.error || `HTTP ${r.status}`);
  }
  return data;
};

export const api = {
  listMeetings: () => fetch('/api/meetings').then(handleResponse),

  createMeeting: (name) =>
    fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(handleResponse),

  join: (id, fullName, hostToken) =>
    fetch(`/api/meetings/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, hostToken }),
    }).then(handleResponse),

  status: (id) => fetch(`/api/meetings/${id}/status`).then(handleResponse),
};
