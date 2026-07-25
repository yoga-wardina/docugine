import { newId } from './document';

export const CURRENT_KEY = 'docugine:current';
export const SESSIONS_INDEX_KEY = 'docugine:sessions';
export const SESSION_PREFIX = 'docugine:session:';
export const SETTINGS_KEY = 'docugine:settings';

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function saveCurrent(doc) {
  return safeSet(CURRENT_KEY, JSON.stringify(doc));
}

export function loadCurrent() {
  const raw = safeGet(CURRENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCurrent() {
  return safeRemove(CURRENT_KEY);
}

export function listSessions() {
  const raw = safeGet(SESSIONS_INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(sessions) {
  return safeSet(SESSIONS_INDEX_KEY, JSON.stringify(sessions));
}

export function saveSession(doc, name, history, maxSessions = 10) {
  const id = newId();
  const entry = {
    id,
    name: name || defaultSessionName(),
    updatedAt: Date.now(),
    doc,
    history: history ? history.serialize() : null,
  };
  safeSet(SESSION_PREFIX + id, JSON.stringify(entry));
  const sessions = listSessions();
  sessions.unshift({ id, name: entry.name, updatedAt: entry.updatedAt });
  if (sessions.length > maxSessions) {
    const evicted = sessions.splice(maxSessions);
    for (const e of evicted) safeRemove(SESSION_PREFIX + e.id);
  }
  writeIndex(sessions);
  return entry;
}

export function loadSession(id) {
  const raw = safeGet(SESSION_PREFIX + id);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function deleteSession(id) {
  safeRemove(SESSION_PREFIX + id);
  const sessions = listSessions().filter((s) => s.id !== id);
  writeIndex(sessions);
}

export function renameSession(id, name) {
  const session = loadSession(id);
  if (!session) return false;
  session.name = name;
  session.updatedAt = Date.now();
  safeSet(SESSION_PREFIX + id, JSON.stringify(session));
  const sessions = listSessions().map((s) =>
    s.id === id ? { ...s, name, updatedAt: session.updatedAt } : s
  );
  writeIndex(sessions);
  return true;
}

export function defaultSessionName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `Snapshot ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function saveSettings(settings) {
  return safeSet(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettings() {
  const raw = safeGet(SETTINGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
