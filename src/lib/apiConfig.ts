declare global {
  interface Window {
    __BACKEND_URL__?: string;
  }
}

const FALLBACK = 'http://localhost:8001';

/**
 * Backend API base URL (ticket service). Use for fetch() and server-side calls.
 * On the client, uses window.__BACKEND_URL__ (injected at runtime from server env)
 * so production works without rebuilding. Set BACKEND_URL in CapRover for the frontend app.
 */
export function getBackendApiUrl(): string {
  if (typeof window !== 'undefined') {
    return window.__BACKEND_URL__ ?? FALLBACK;
  }
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || FALLBACK;
}

/**
 * WebSocket URL for backend. Converts http(s) to ws(s).
 */
export function getBackendWsUrl(): string {
  const base =
    (typeof window !== 'undefined' ? window.__BACKEND_URL__ : undefined) ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    FALLBACK;
  return base.replace(/^http/, 'ws');
}
