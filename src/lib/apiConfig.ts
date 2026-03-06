/**
 * Backend API base URL (ticket service). Use for fetch() and server-side calls.
 * Set NEXT_PUBLIC_BACKEND_URL in CapRover (e.g. https://ticket-backend.yourdomain.com).
 */
export function getBackendApiUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
  }
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
}

/**
 * WebSocket URL for backend. Converts http(s) to ws(s).
 */
export function getBackendWsUrl(): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
  return base.replace(/^http/, 'ws');
}
