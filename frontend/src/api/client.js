async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: 'include',   // sends httpOnly cookie automatically
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !window.location.pathname.startsWith('/login')) {
    localStorage.removeItem('branchiq_user');
    window.location.href = '/login';
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    // FastAPI 422 errors return detail as an array — flatten to a readable string
    const detail = Array.isArray(err.detail)
      ? err.detail.map(d => d.msg || JSON.stringify(d)).join(', ')
      : (err.detail || `HTTP ${res.status}`);
    throw new Error(detail);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  delete: (path)       => request('DELETE', path),
};
