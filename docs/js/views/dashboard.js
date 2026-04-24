// Dashboard: shows metric groups with per-metric summary cards for the active file.
import { h, clear, fmtNum, fmtDay } from '../utils.js';
import { getFile, getAllDaily } from '../db.js';
import { METRICS, GROUPS, metricByShortId, metricForType } from '../metrics.js';

export async function renderDashboard(container, fileId, { onMetricTap, onCycleTap } = {}) {
  clear(container);

  if (!fileId) {
    container.appendChild(h('div', { class: 'empty' },
      h('div', { class: 'big' }, '📂'),
      h('div', null, 'ファイルを選択してください'),
      h('div', { class: 'tiny', style: { marginTop: '8px' } }, 'ファイルタブから.zipを読み込み、選択してください')
    ));
    return;
  }

  const file = await getFile(fileId);
  if (!file) {
    container.appendChild(h('div', { class: 'empty' }, 'ファイルが見つかりません'));
    return;
  }

  // Header card (file meta)
  const rangeText = file.rangeStart && file.rangeEnd
    ? `${fmtDay(new Date(file.rangeStart))} 〜 ${fmtDay(new Date(file.rangeEnd))}`
    : '期間不明';
  container.appendChild(h('div', { class: 'card' },
    h('h2', null, file.name),
    h('div', { class: 'muted' }, rangeText),
    h('div', { class: 'tiny', style: { marginTop: '4px' } },
      `レコード ${(file.counts?.records || 0).toLocaleString('ja-JP')}件 ／ ワークアウト ${file.counts?.workouts || 0}件 ／ 日次 ${file.counts?.days || 0}`
    )
  ));

  // Compute 30-day summary per metric
  const metrics = file.metrics || [];
  if (!metrics.length) {
    container.appendChild(h('div', { class: 'empty' }, 'データがありません'));
    return;
  }

  const endDate = new Date(file.rangeEnd || Date.now());
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);
  const startDay = dayKey(startDate);
  const endDay   = dayKey(endDate);

  // Group metrics
  const grouped = {};
  for (const shortId of metrics) {
    const m = metricByShortId(shortId);
    if (!m) {
      // unknown - fallback by reconstructing via metricForType? We don't have hkType here; skip into 'other'.
      (grouped.other = grouped.other || []).push({ id: shortId, name: shortId, icon: '📈', unit: '', group: 'other', agg: 'avg' });
      continue;
    }
    (grouped[m.group] = grouped[m.group] || []).push(m);
  }

  // Section for each group present
  const groupOrder = Object.keys(GROUPS).sort((a, b) => GROUPS[a].order - GROUPS[b].order);
  for (const gk of groupOrder) {
    if (!grouped[gk] || !grouped[gk].length) continue;
    const gdef = GROUPS[gk];
    const sec = h('div', null,
      h('h3', { style: { margin: '14px 4px 8px', fontSize: '13px', color: 'var(--c-text-2)', fontWeight: 600 } },
        (gdef.icon || '') + ' ' + (gdef.name || gk)
      )
    );
    const grid = h('div', { class: 'grid' });
    // Sort metrics by a consistent order
    grouped[gk].sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    // For reproductive group, add a special "Cycle prediction" card first.
    if (gk === 'reproductive' && grouped[gk].some(m => m.id === 'MenstrualFlow')) {
      const cycleCard = h('button', { class: 'metric-card', onclick: () => onCycleTap?.() },
        h('div', { class: 'ic' }, '📅'),
        h('div', { class: 'name' }, '月経周期予測'),
        h('div', { class: 'value' }, h('span', { style: { fontSize: '14px' } }, '次回・排卵日推定')),
        h('div', { class: 'note' }, 'カレンダー表示')
      );
      grid.appendChild(cycleCard);
    }

    for (const m of grouped[gk]) {
      const goCycle = (m.id === 'MenstrualFlow' || m.id === 'OvulationTestResult');
      const card = h('button', { class: 'metric-card', onclick: () => goCycle ? onCycleTap?.() : onMetricTap?.(m.id) },
        h('div', { class: 'ic' }, m.icon || '📈'),
        h('div', { class: 'name' }, m.name || m.id),
        h('div', { class: 'value', 'data-val': '' }, '--'),
        h('div', { class: 'note', 'data-note': '' }, '直近30日')
      );
      grid.appendChild(card);
      loadMetricSummary(fileId, m, startDay, endDay, card);
    }
    sec.appendChild(grid);
    container.appendChild(sec);
  }
}

async function loadMetricSummary(fileId, m, startDay, endDay, card) {
  try {
    const rows = await getAllDaily(fileId, m.id);
    if (!rows || !rows.length) {
      card.querySelector('[data-val]').textContent = '--';
      return;
    }
    // Restrict to window
    const win = rows.filter(r => r.day >= startDay && r.day <= endDay);
    const valEl = card.querySelector('[data-val]');
    const noteEl = card.querySelector('[data-note]');

    if (m.agg === 'sum') {
      const sum = win.reduce((a, r) => a + (r.sum || 0), 0);
      const days = win.length;
      const avg = days ? sum / days : 0;
      valEl.innerHTML = `${fmtNum(sum, sum < 10 ? 2 : 0)} <span class="unit">${m.unit || ''}</span>`;
      noteEl.textContent = `日平均 ${fmtNum(avg, avg < 10 ? 2 : 0)}${m.unit || ''}（直近30日）`;
    } else if (m.agg === 'avg') {
      let s = 0, c = 0;
      for (const r of win) { s += (r.sum || 0); c += (r.count || 0); }
      const avg = c ? s / c : 0;
      valEl.innerHTML = `${fmtNum(avg, avg < 10 ? 2 : 0)} <span class="unit">${m.unit || ''}</span>`;
      noteEl.textContent = `平均（直近30日）`;
    } else if (m.agg === 'minmax') {
      let s = 0, c = 0, mn = Infinity, mx = -Infinity;
      for (const r of win) { s += (r.sum || 0); c += (r.count || 0); if (r.min < mn) mn = r.min; if (r.max > mx) mx = r.max; }
      const avg = c ? s / c : 0;
      valEl.innerHTML = `${fmtNum(avg, 0)} <span class="unit">${m.unit || ''}</span>`;
      noteEl.textContent = isFinite(mn) ? `範囲 ${fmtNum(mn, 0)}-${fmtNum(mx, 0)}${m.unit || ''}` : '--';
    } else if (m.agg === 'last') {
      // Latest row
      const last = rows[rows.length - 1];
      valEl.innerHTML = `${fmtNum(last.value, last.value < 100 ? 1 : 0)} <span class="unit">${m.unit || ''}</span>`;
      noteEl.textContent = `${last.day}`;
    } else if (m.agg === 'count') {
      const cnt = win.reduce((a, r) => a + (r.count || 0), 0);
      valEl.innerHTML = `${fmtNum(cnt, 0)} <span class="unit">${m.unit || ''}</span>`;
      noteEl.textContent = `直近30日`;
    } else if (m.agg === 'duration') {
      const sum = win.reduce((a, r) => a + (r.sum || 0), 0);
      valEl.innerHTML = `${fmtNum(sum, 0)} <span class="unit">${m.unit || '分'}</span>`;
      noteEl.textContent = `合計（直近30日）`;
    } else if (m.agg === 'flow') {
      const flowDays = win.filter(r => (r.level || 0) > 0).length;
      valEl.innerHTML = `${fmtNum(flowDays, 0)} <span class="unit">日</span>`;
      noteEl.textContent = `直近30日の月経記録日数（タップで予測表示）`;
    } else if (m.agg === 'sleep') {
      // Total asleep time per day = core + deep + rem (+ asleep fallback)
      let total = 0, days = 0;
      for (const r of win) {
        const t = (r.core || 0) + (r.deep || 0) + (r.rem || 0) + (r.asleep || 0);
        if (t > 0) { total += t; days += 1; }
      }
      const avgH = days ? (total / days / 3600) : 0;
      valEl.innerHTML = `${fmtNum(avgH, 1)} <span class="unit">時間</span>`;
      noteEl.textContent = `平均睡眠（直近30日, ${days}日）`;
    }
  } catch (e) {
    card.querySelector('[data-val]').textContent = '--';
  }
}

function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}
