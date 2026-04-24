// Thin localStorage wrapper with JSON defaults.
const NS = 'hv:';

export function get(key, fallback = null) {
  try {
    const v = localStorage.getItem(NS + key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function set(key, val) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(val));
  } catch {}
}

export function del(key) {
  try { localStorage.removeItem(NS + key); } catch {}
}

// Convenience: per-metric view settings
export function getMetricPrefs(metric) {
  return get('view:' + metric, {});
}
export function setMetricPrefs(metric, prefs) {
  const cur = getMetricPrefs(metric);
  set('view:' + metric, { ...cur, ...prefs });
}

// Active file id
export function getActiveFile() { return get('activeFileId', null); }
export function setActiveFile(id) { set('activeFileId', id); }
