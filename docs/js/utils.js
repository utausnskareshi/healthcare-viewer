// Shared utilities: date math, formatting, DOM helpers.

// ---- DOM ----
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k in el) {
        try { el[k] = v; } catch { el.setAttribute(k, v); }
      }
      else el.setAttribute(k, v);
    }
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return el;
}

export function $(sel, root = document) { return root.querySelector(sel); }
export function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

// ---- Toast / modal ----
export function toast(msg, ms = 2000) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, ms);
}

export function confirmDialog(bodyHTML, { okText = 'OK', cancelText = 'キャンセル', danger = false } = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal');
    const body = document.getElementById('modalBody');
    const ok = document.getElementById('modalOk');
    const cancel = document.getElementById('modalCancel');
    body.innerHTML = bodyHTML;
    ok.textContent = okText;
    cancel.textContent = cancelText;
    ok.className = danger ? 'btn btn-danger' : 'btn btn-primary';
    modal.hidden = false;
    const close = (v) => {
      modal.hidden = true;
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      resolve(v);
    };
    const onOk = () => close(true);
    const onCancel = () => close(false);
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
  });
}

export function promptDialog(label, defaultValue = '') {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal');
    const body = document.getElementById('modalBody');
    const ok = document.getElementById('modalOk');
    const cancel = document.getElementById('modalCancel');
    body.innerHTML = '';
    const l = h('div', { class: 'muted', style: { marginBottom: '8px' } }, label);
    const inp = h('input', { class: 'name-input', value: defaultValue, type: 'text' });
    body.appendChild(l);
    body.appendChild(inp);
    ok.textContent = 'OK';
    cancel.textContent = 'キャンセル';
    ok.className = 'btn btn-primary';
    modal.hidden = false;
    setTimeout(() => inp.focus(), 50);
    const close = (v) => {
      modal.hidden = true;
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      resolve(v);
    };
    const onOk = () => close(inp.value.trim() || null);
    const onCancel = () => close(null);
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
  });
}

// ---- Date helpers (all operate in LOCAL time) ----
export function parseISO(s) { return new Date(s); }
export function todayDay() { return dayKey(new Date()); }

export function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function hourKey(d) {
  return dayKey(d) + 'T' + String(d.getHours()).padStart(2, '0');
}

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(d, n) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

export function startOfWeek(d) {
  // week starts on Monday
  const r = new Date(d);
  r.setHours(0,0,0,0);
  const day = (r.getDay() + 6) % 7; // 0 = Mon
  r.setDate(r.getDate() - day);
  return r;
}

export function startOfMonth(d) {
  const r = new Date(d);
  r.setDate(1);
  r.setHours(0,0,0,0);
  return r;
}

export function startOfDay(d) {
  const r = new Date(d);
  r.setHours(0,0,0,0);
  return r;
}

export function daysBetween(a, b) {
  const ms = startOfDay(b) - startOfDay(a);
  return Math.round(ms / 86400000);
}

export function fmtDay(d) {
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtDayShort(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtMonth(d) {
  return `${d.getFullYear()}/${d.getMonth() + 1}`;
}

export const DAY_NAMES_JA = ['日','月','火','水','木','金','土'];

// ---- Formatting ----
export function fmtNum(n, digits = 0) {
  if (n == null || !isFinite(n)) return '--';
  const abs = Math.abs(n);
  if (digits === 0 && abs >= 100) return Math.round(n).toLocaleString('ja-JP');
  return n.toLocaleString('ja-JP', { maximumFractionDigits: digits });
}

export function fmtBytes(n) {
  if (n == null) return '--';
  const u = ['B','KB','MB','GB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
}

export function fmtDateTime(d) {
  if (!(d instanceof Date)) d = new Date(d);
  if (isNaN(d)) return '--';
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export function fmtDuration(seconds) {
  if (!seconds || !isFinite(seconds)) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}時間${m}分`;
  return `${m}分`;
}

// ---- Segmented control factory ----
export function segmented(options, value, onChange) {
  const el = h('div', { class: 'seg' });
  for (const opt of options) {
    const b = h('button', {
      class: opt.value === value ? 'on' : '',
      onclick: () => {
        el.querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        onChange(opt.value);
      },
    }, opt.label);
    b.dataset.value = opt.value;
    el.appendChild(b);
  }
  return el;
}

// ---- iOS PWA install helper ----
export function isiOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function isStandalone() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}
