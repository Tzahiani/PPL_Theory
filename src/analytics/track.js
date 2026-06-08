import {
  getOrCreateVisitorId,
  getVisitorName,
  loadVisitor,
} from './visitor';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SESSION_KEY = 'ppl_stats_session';
let sessionStartMs = Date.now();

function isEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s-${Date.now()}`;
  }
}

function buildEvent(eventType, { moduleId, payload = {} } = {}) {
  const visitor = loadVisitor();
  return {
    visitor_id: getOrCreateVisitorId(),
    visitor_name: visitor?.name ?? getVisitorName(),
    session_id: getSessionId(),
    event_type: eventType,
    module_id: moduleId ?? null,
    payload,
  };
}

async function sendEvent(event, { beacon = false } = {}) {
  if (!isEnabled()) return;

  const url = `${SUPABASE_URL}/rest/v1/stats_events`;
  const body = JSON.stringify(event);
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers,
      body,
      keepalive: beacon,
    });
  } catch {
    /* silent — analytics must not break the app */
  }
}

export function analyticsEnabled() {
  return isEnabled();
}

export function trackEvent(eventType, options = {}, sendOptions = {}) {
  return sendEvent(buildEvent(eventType, options), sendOptions);
}

export function trackAppVisit() {
  return trackEvent('app_visit', {
    payload: {
      referrer: document.referrer || null,
      path: window.location.pathname + window.location.hash,
    },
  });
}

export function trackModuleOpen(moduleId) {
  return trackEvent('module_open', { moduleId });
}

export function trackAnswer(moduleId, { questionId, correct, category }) {
  return trackEvent('answer', {
    moduleId,
    payload: { question_id: questionId, correct, category },
  });
}

export function trackExamSubmit(moduleId, { scorePct, answered, correct, total }) {
  return trackEvent('exam_submit', {
    moduleId,
    payload: { score_pct: scorePct, answered, correct, total },
  });
}

export function trackSessionEnd() {
  const durationSec = Math.round((Date.now() - sessionStartMs) / 1000);
  return trackEvent('session_end', { payload: { duration_sec: durationSec } }, { beacon: true });
}

export async function fetchAdminStats(adminKey) {
  if (!isEnabled()) {
    throw new Error('Analytics not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_admin_stats`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ admin_key: adminKey }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (text.includes('unauthorized') || res.status === 401 || res.status === 403) {
      throw new Error('סיסמה שגויה');
    }
    throw new Error('שגיאה בטעינת הסטטיסטיקות');
  }

  return res.json();
}

export const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'ppl-ya-stats';

export function isAdminRoute() {
  return window.location.hash === `#/${ADMIN_PATH}`;
}

export function openAdminRoute() {
  window.location.hash = `/${ADMIN_PATH}`;
}

export function closeAdminRoute() {
  if (window.location.hash === `#/${ADMIN_PATH}`) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

const ADMIN_SESSION_KEY = 'ppl_admin_auth';

export function saveAdminSession(adminKey) {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, adminKey);
  } catch {
    /* ignore */
  }
}

export function loadAdminSession() {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY);
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
