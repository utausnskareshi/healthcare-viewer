// Main entry: hash-based router, tab/header wiring, SW registration.
import { $, clear } from './utils.js';
import { renderFilesView } from './views/files.js';
import { renderDashboard } from './views/dashboard.js';
import { renderMetric } from './views/metric.js';
import { renderWorkoutList, renderWorkoutDetail } from './views/workout.js';
import { renderCycleView } from './views/cycle.js';
import { listFiles } from './db.js';
import { getActiveFile, setActiveFile } from './prefs.js';
import { metricByShortId } from './metrics.js';

const view = $('#view');
const titleBar = $('#titleBar');
const backBtn = $('#backBtn');
const filesBtn = $('#filesBtn');
const tabs = document.querySelectorAll('.tab');

// ----- Router state -----
// Hash formats:
//   #/files
//   #/dashboard
//   #/workouts
//   #/metric/<shortId>
//   #/workout/<idx>
function parseHash() {
  const raw = (location.hash || '').replace(/^#/, '').replace(/^\//, '');
  if (!raw) return { route: 'dashboard', params: [] };
  const parts = raw.split('/').filter(Boolean);
  return { route: parts[0], params: parts.slice(1) };
}

function go(path) {
  location.hash = path.startsWith('#') ? path : '#' + path;
}

window.addEventListener('hashchange', () => render());

// ----- Header buttons -----
backBtn.addEventListener('click', () => history.length > 1 ? history.back() : go('/dashboard'));
filesBtn.addEventListener('click', () => go('/files'));

// ----- Bottom tabs -----
tabs.forEach((t) => {
  t.addEventListener('click', () => go('/' + t.dataset.route));
});

function updateTabs(route) {
  tabs.forEach((t) => {
    t.classList.toggle('active', t.dataset.route === route);
  });
}

async function render() {
  const { route, params } = parseHash();

  // Show/hide back button based on depth
  const isDetail = (route === 'metric' || route === 'workout' || route === 'cycle');
  backBtn.hidden = !isDetail;

  // If active file is gone, clear it
  const files = await listFiles();
  let activeId = getActiveFile();
  if (activeId && !files.find(f => f.id === activeId)) {
    setActiveFile(null);
    activeId = null;
  }

  try {
    switch (route) {
      case 'files': {
        titleBar.textContent = 'ファイル';
        updateTabs('files');
        await renderFilesView(view, { onFileActivated: () => render() });
        break;
      }
      case 'dashboard': {
        titleBar.textContent = 'ダッシュボード';
        updateTabs('dashboard');
        await renderDashboard(view, activeId, {
          onMetricTap: (id) => go('/metric/' + encodeURIComponent(id)),
          onCycleTap: () => go('/cycle'),
        });
        break;
      }
      case 'cycle': {
        updateTabs('dashboard');
        titleBar.textContent = '月経周期予測';
        if (!activeId) { go('/dashboard'); return; }
        await renderCycleView(view, activeId);
        window.scrollTo(0, 0);
        break;
      }
      case 'workouts': {
        titleBar.textContent = 'ワークアウト';
        updateTabs('workouts');
        await renderWorkoutList(view, activeId, { onWorkoutTap: (idx) => go('/workout/' + idx) });
        break;
      }
      case 'metric': {
        updateTabs('dashboard');
        const shortId = decodeURIComponent(params[0] || '');
        const meta = metricByShortId(shortId);
        // Cycle-related metrics get the dedicated cycle view.
        if (shortId === 'MenstrualFlow' || shortId === 'OvulationTestResult') {
          go('/cycle');
          return;
        }
        titleBar.textContent = meta ? meta.name : '指標';
        if (!activeId || !shortId) { go('/dashboard'); return; }
        await renderMetric(view, activeId, shortId);
        // Scroll to top
        window.scrollTo(0, 0);
        break;
      }
      case 'workout': {
        updateTabs('workouts');
        titleBar.textContent = 'ワークアウト詳細';
        const idx = parseInt(params[0] || '0', 10);
        if (!activeId) { go('/workouts'); return; }
        await renderWorkoutDetail(view, activeId, idx);
        window.scrollTo(0, 0);
        break;
      }
      default: {
        go('/dashboard');
        return;
      }
    }
  } catch (e) {
    console.error(e);
    clear(view);
    const err = document.createElement('div');
    err.className = 'card';
    err.innerHTML = '<h2>エラーが発生しました</h2><div class="muted">' + escapeHtml(e.message || String(e)) + '</div>';
    view.appendChild(err);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ----- Initial route -----
(async function init() {
  // If no files imported yet, land on files page.
  const files = await listFiles();
  if (!files.length && !location.hash) {
    go('/files');
  } else if (!location.hash) {
    go('/dashboard');
  } else {
    render();
  }
})();

// ----- Service Worker registration -----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => {
      console.warn('SW registration failed:', e);
    });
  });
}

// ----- Request persistent storage on iOS (best-effort) -----
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}
