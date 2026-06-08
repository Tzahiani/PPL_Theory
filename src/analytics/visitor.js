const VISITOR_KEY = 'ppl_stats_visitor';

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadVisitor() {
  try {
    const raw = localStorage.getItem(VISITOR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveVisitor(visitor) {
  try {
    localStorage.setItem(VISITOR_KEY, JSON.stringify(visitor));
  } catch {
    /* ignore */
  }
}

export function getOrCreateVisitorId() {
  const existing = loadVisitor();
  if (existing?.id) return existing.id;
  const id = randomId();
  saveVisitor({ id, name: null, namePromptDismissed: false });
  return id;
}

export function getVisitorName() {
  return loadVisitor()?.name ?? null;
}

export function setVisitorName(name) {
  const visitor = loadVisitor() ?? { id: getOrCreateVisitorId() };
  saveVisitor({
    ...visitor,
    name: name.trim(),
    namePromptDismissed: true,
  });
}

export function dismissNamePrompt() {
  const visitor = loadVisitor() ?? { id: getOrCreateVisitorId() };
  const anonymousName = `אנונימי-${visitor.id.slice(0, 6)}`;
  saveVisitor({
    ...visitor,
    name: anonymousName,
    namePromptDismissed: true,
  });
  return anonymousName;
}

export function shouldShowNamePrompt() {
  const visitor = loadVisitor();
  if (!visitor) return true;
  return !visitor.namePromptDismissed;
}
