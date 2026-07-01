import { AppState, type AppStateStatus } from 'react-native';
import { LargeSecureStore } from './secureStore';
import { apiBaseUrl } from './config';
import { loggedFetch } from './network';

const SESSION_KEY = 'auth-session';
const store = new LargeSecureStore();

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix seconds
  user: AuthUser;
};

type Listener = (session: AuthSession | null) => void;

let currentSession: AuthSession | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener(currentSession));
}

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function scheduleRefresh(session: AuthSession) {
  clearRefreshTimer();
  // Refresh a minute before expiry; never schedule sooner than 5s out.
  const msUntilRefresh = Math.max(session.expiresAt * 1000 - Date.now() - 60_000, 5_000);
  refreshTimer = setTimeout(() => {
    refreshSession().catch(() => {
      // Refresh failed (e.g. revoked/expired refresh token) — drop the session.
      setSession(null);
    });
  }, msUntilRefresh);
}

async function setSession(session: AuthSession | null) {
  currentSession = session;
  if (session) {
    await store.setItem(SESSION_KEY, JSON.stringify(session));
    scheduleRefresh(session);
  } else {
    await store.removeItem(SESSION_KEY);
    clearRefreshTimer();
  }
  notify();
}

async function postJson(path: string, body: unknown) {
  const response = await loggedFetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? `Request to ${path} failed`);
  }
  return data;
}

function toSession(data: any): AuthSession {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: data.expiresAt,
    user: data.user,
  };
}

// Loads any persisted session on app start, refreshing it first if it's
// expired (or about to expire) so callers always get a usable session.
export async function loadSession(): Promise<AuthSession | null> {
  const raw = await store.getItem(SESSION_KEY);
  if (!raw) {
    currentSession = null;
    return null;
  }

  currentSession = JSON.parse(raw) as AuthSession;
  if (currentSession.expiresAt * 1000 < Date.now() + 10_000) {
    try {
      await refreshSession();
    } catch {
      await setSession(null);
      return null;
    }
  } else {
    scheduleRefresh(currentSession);
  }
  return currentSession;
}

export function getSession() {
  return currentSession;
}

export function onAuthStateChange(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function signInWithPassword(email: string, password: string) {
  const data = await postJson('/api/auth/login', { email, password });
  await setSession(toSession(data));
}

export async function refreshSession() {
  if (!currentSession) {
    throw new Error('No session to refresh');
  }
  const data = await postJson('/api/auth/refresh', { refreshToken: currentSession.refreshToken });
  await setSession(toSession(data));
}

export async function signOut() {
  const session = currentSession;
  await setSession(null);
  if (session) {
    loggedFetch(`${apiBaseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }).catch(() => {});
  }
}

export async function signUp(email: string, password: string): Promise<void> {
  const data = await postJson('/api/auth/register', { email, password });
  await setSession(toSession(data));
}

export async function changePassword(newPassword: string): Promise<void> {
  if (!currentSession) throw new Error('Not signed in');
  const response = await loggedFetch(`${apiBaseUrl}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentSession.accessToken}`,
    },
    body: JSON.stringify({ password: newPassword }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to change password');
  }
}

AppState.addEventListener('change', (state: AppStateStatus) => {
  if (state === 'active' && currentSession) {
    scheduleRefresh(currentSession);
  }
});
