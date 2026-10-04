const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new Error('Unable to connect to IncidentIQ API. Start the FastAPI backend and try again.');
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const detail = typeof payload.detail === 'string' ? payload.detail : 'Analysis failed. Please try again.';
    throw new Error(detail);
  }
  return response.json();
}

export const healthCheck = () => request('/health');
export const runDemo = () => request('/api/demo', { method: 'POST' });
export const getSample = () => request('/api/sample');
export function analyzeIncident(files) {
  if (!files?.length) return Promise.reject(new Error('Please select at least one file.'));
  const form = new FormData();
  [...files].forEach((file) => form.append('files', file));
  return request('/api/analyze', { method: 'POST', body: form });
}
