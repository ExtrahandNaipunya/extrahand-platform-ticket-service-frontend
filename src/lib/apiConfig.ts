declare global {
  interface Window {
    __BACKEND_URL__?: string;
  }
}

const FALLBACK = 'https://extrahand-ticket-service-backend.apps.extrahand.in';

/**
 * Backend API base URL (ticket service). Use for fetch() and server-side calls.
 * On the client, uses window.__BACKEND_URL__ (injected at runtime from server env).
 * CapRover: set NEXT_PUBLIC_API_URL or API_URL to your backend URL (e.g. https://extrahand-ticket-service-backend.apps.extrahand.in).
 */
export function getBackendApiUrl(): string {
  if (typeof window !== 'undefined') {
    return window.__BACKEND_URL__ ?? FALLBACK;
  }
  return (
    process.env.API_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    FALLBACK
  );
}

/**
 * WebSocket URL for backend. Converts http(s) to ws(s).
 */
export function getBackendWsUrl(): string {
  const base =
    (typeof window !== 'undefined' ? window.__BACKEND_URL__ : undefined) ||
    process.env.API_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    FALLBACK;
  return base.replace(/^http/, 'ws');
}
