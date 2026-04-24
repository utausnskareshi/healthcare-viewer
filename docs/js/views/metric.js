// Metric detail view: period selection, aggregation unit, chart type, comparison, preferences memory.
import { h, clear, segmented, fmtNum, fmtDay, fmtDayShort, fmtMonth, addDays, addMonths,
         startOfWeek, startOfMonth, startOfDay, DAY_NAMES_JA, dayKey } from '../utils.js';
import { getDailyRange, getAllDaily, getHourlyRange, getAllHourly, getFile } from '../db.js';
import { metricByShortId, SLEEP_STAGES } from '../metrics.js';
import { getMetricPrefs, setMetricPrefs } from '../prefs.js';
import { renderBar, renderLine, renderRangeLine, renderPie, renderStacked } from '../chart-render.js';

/** Render the metric detail view inside container. */
export async function renderMetric(container, fileId, shortId) {
  clear(container);
  const file = await getFile(fileId);
  if (!file) { container.appendChild(h('div', { class: 'empty' }, 'ファイルが見つかりません')); return; }

  const m = metricByShortId(shortId) || {
    id: shortId, name: shortId, unit: '', icon: '📈', agg: 'avg', color: '#8e8e93', group: 'other'
  };

  // Defaults by agg type
  const defaults = {
    period: 'last30',     // last7 | last30 | last90 | lastYear | lastMonth | thisMonth | all | custom
    bucket: 'day',        // day | week | month | weekday | hour
    chart: m.agg === 'count' || m.agg === 'sum' ? 'bar' : 'line',
    compare: false,       // compare with previous period
    customStart: null,
    customEnd: null,
  };
  const prefs = { ...defaults, ...getMetricPrefs(shortId) };

  const savePrefs = () => setMetricPrefs(shortId, prefs);

  // --- Header ---
  container.appendChild(h('div', { class: 'card', style: { display: 'flex', gap: '10px', alignItems: 'center' } },
    h('div', { style: { fontSize: '28px' } }, m.icon || '📈'),
    h('div', { style: { flex: 1 } },
      h('div', { style: { fontWeight: 600, fontSize: '16px' } }, m.name),
      h('div', { class: 'muted' }, m.unit ? `単位: ${m.unit}` : '')
    )
  ));

  // --- Controls container ---
  const controls = h('div', { class: 'card' });
  container.appendChild(controls);

  // Period segmented
  controls.appendChild(h('div', { class: 'tiny', style: { marginBottom: '4px' } }, '期間'));
  const periodSeg = segmented([
    { value: 'last7',    label: '7日' },
    { value: 'last30',   label: '30日' },
    { value: 'last90',   label: '90日' },
    { value: 'lastYear', label: '1年' },
    { value: 'thisMonth',label: '今月' },
    { value: 'lastMonth',label: '先月' },
    { value: 'all',      label: '全期間' },
    { value: 'custom',   label: 'カスタム' },
  ], prefs.period, (v) => { prefs.period = v; savePrefs(); draw(); updateCustomRow(); });
  controls.appendChild(periodSeg);

  // Custom date range (hidden unless period='custom')
  const customRow = h('div', { class: 'daterange', style: { marginTop: '8px' } });
  const startInput = h('input', { type: 'date' });
  const endInput   = h('input', { type: 'date' });
  customRow.appendChild(startInput);
  customRow.appendChild(h('span', { class: 'tiny' }, '〜'));
  customRow.appendChild(endInput);
  controls.appendChild(customRow);
  startInput.addEventListener('change', () => { prefs.customStart = startInput.value; savePrefs(); draw(); });
  endInput.addEventListener('change',   () => { prefs.customEnd   = endInput.value;   savePrefs(); draw(); });
  function updateCustomRow() {
    customRow.style.display = (prefs.period === 'custom') ? 'flex' : 'none';
  }
  updateCustomRow();
  if (prefs.customStart) startInput.value = prefs.customStart;
  if (prefs.customEnd)   endInput.value = prefs.customEnd;

  // Bucket (aggregation) control -- depends on metric
  controls.appendChild(h('div', { class: 'tiny', style: { marginTop: '10px', marginBottom: '4px' } }, '集計単位'));
  const bucketOptions = [
    { value: 'day',     label: '日' },
    { value: 'week',    label: '週' },
    { value: 'month',   label: '月' },
    { value: 'weekday', label: '曜日別' },
    { value: 'hour',    label: '時間帯別' },
  ];
  const bucketSeg = segmented(bucketOptions, prefs.bucket, (v) => { prefs.bucket = v; savePrefs(); draw(); updateChartSeg(); });
  controls.appendChild(bucketSeg);

  // Chart type
  controls.appendChild(h('div', { class: 'tiny', style: { marginTop: '10px', marginBottom: '4px' } }, 'グラフ種類'));
  const chartRow = h('div');
  controls.appendChild(chartRow);
  function updateChartSeg() {
    clear(chartRow);
    const opts = allowedChartTypes(m, prefs.bucket);
    if (!opts.find(o => o.value === prefs.chart)) prefs.chart = opts[0].value;
    const seg = segmented(opts, prefs.chart, (v) => { prefs.chart = v; savePrefs(); draw(); });
    chartRow.appendChild(seg);
  }
  updateChartSeg();

  // Compare toggle
  const compareRow = h('div', { class: 'row between', style: { marginTop: '10px' } },
    h('div', null, '前期間と比較'),
    h('label', { class: 'row', style: { gap: '6px' } },
      h('input', {
        type: 'checkbox',
        checked: prefs.compare,
        onchange: (e) => { prefs.compare = e.target.checked; savePrefs(); draw(); }
      }),
      h('span', { class: 'tiny' }, 'オン')
    )
  );
  controls.appendChild(compareRow);

  // --- Stats strip ---
  const stats = h('div', { class: 'stats' });
  container.appendChild(stats);

  // --- Chart canvas ---
  const chartWrap = h('div', { class: 'chart-wrap' });
  const canvas = h('canvas');
  chartWrap.appendChild(canvas);
  container.appendChild(chartWrap);

  // --- Comparison stats (only when compare is on) ---
  const compareCard = h('div', { class: 'card', style: { display: 'none' } });
  container.appendChild(compareCard);

  // --- Raw info / tips ---
  container.appendChild(h('div', { class: 'tiny', style: { textAlign: 'center', marginTop: '8px' } },
    '表示設定はこの指標ごとに自動で保存されます。'
  ));

  async function draw() {
    const range = resolvePeriod(prefs, file);
    const buckets = await loadBuckets(fileId, m, prefs.bucket, range);
    renderStats(stats, m, buckets);
    renderChart(canvas, m, prefs, buckets);

    if (prefs.compare) {
      const prevRange = previousPeriod(range);
      const prevBuckets = await loadBuckets(fileId, m, prefs.bucket, prevRange);
      renderCompare(compareCard, m, buckets, prevBuckets, range, prevRange);
      compareCard.style.display = '';
    } else {
      compareCard.style.display = 'none';
    }
  }

  draw();
}

// ---------------- Period resolution ----------------
function resolvePeriod(prefs, file) {
  const endRef = file.rangeEnd ? new Date(file.rangeEnd) : new Date();
  let start, end = new Date(endRef);
  switch (prefs.period) {
    case 'last7':    start = addDays(end, -6); break;
    case 'last30':   start = addDays(end, -29); break;
    case 'last90':   start = addDays(end, -89); break;
    case 'lastYear': start = addDays(end, -364); break;
    case 'thisMonth':start = startOfMonth(end); break;
    case 'lastMonth': {
      const cur = startOfMonth(end);
      start = new Date(cur); start.setMonth(start.getMonth() - 1);
      end = new Date(cur); end.setDate(0);
      break;
    }
    case 'all':
      start = file.rangeStart ? new Date(file.rangeStart) : addDays(end, -365);
      break;
    case 'custom':
      if (prefs.customStart) start = new Date(prefs.customStart);
      else start = addDays(end, -29);
      if (prefs.customEnd)   end   = new Date(prefs.customEnd);
      break;
    default:
      start = addDays(end, -29);
  }
  return {
    start: startOfDay(start),
    end: startOfDay(end),
  };
}

function previousPeriod(range) {
  const daysInclusive = Math.round((range.end - range.start) / 86400000) + 1;
  const prevEnd = addDays(range.start, -1);
  const prevStart = addDays(prevEnd, -(daysInclusive - 1));
  return { start: prevStart, end: prevEnd };
}

// ---------------- Buckets loading / aggregation ----------------
async function loadBuckets(fileId, m, bucket, range) {
  const startDay = dayKey(range.start);
  const endDay   = dayKey(range.end);

  if (bucket === 'hour') {
    const rows = await getHourlyRange(fileId, m.id, startDay + 'T00', endDay + 'T23');
    return bucketByHour(rows, m);
  }
  const daily = await getDailyRange(fileId, m.id, startDay, endDay);

  if (bucket === 'day')    return bucketByDay(daily, m, range);
  if (bucket === 'week')   return bucketByWeek(daily, m, range);
  if (bucket === 'month')  return bucketByMonth(daily, m, range);
  if (bucket === 'weekday')return bucketByWeekday(daily, m);
  return bucketByDay(daily, m, range);
}

// Aggregate helpers. Output: { labels: string[], values: number[] | {avg,min,max}[] | sleep-object[], totals: summary, raw: rows }
function bucketByDay(rows, m, range) {
  const map = Object.fromEntries(rows.map(r => [r.day, r]));
  const labels = [];
  const values = [];
  let d = new Date(range.start);
  const endMs = range.end.getTime();
  while (d.getTime() <= endMs) {
    const key = dayKey(d);
    labels.push(key);
    values.push(bucketValue(map[key], m));
    d = addDays(d, 1);
  }
  return { labels, values, raw: rows, axis: 'day' };
}

function bucketByWeek(rows, m, range) {
  const labels = [];
  const groups = [];
  let ws = startOfWeek(range.start);
  const endMs = range.end.getTime();
  while (ws.getTime() <= endMs) {
    labels.push(fmtDayShort(ws));
    groups.push({ start: new Date(ws), rows: [] });
    ws = addDays(ws, 7);
  }
  for (const r of rows) {
    const d = new Date(r.day + 'T00:00:00');
    const idx = Math.floor((startOfWeek(d) - startOfWeek(range.start)) / (7 * 86400000));
    if (idx >= 0 && idx < groups.length) groups[idx].rows.push(r);
  }
  const values = groups.map(g => combineRows(g.rows, m));
  return { labels, values, raw: rows, axis: 'week' };
}

function bucketByMonth(rows, m, range) {
  const labels = [];
  const groups = [];
  let ms = startOfMonth(range.start);
  const endMs = range.end.getTime();
  while (ms.getTime() <= endMs) {
    labels.push(fmtMonth(ms));
    groups.push({ start: new Date(ms), rows: [] });
    ms = addMonths(ms, 1);
  }
  for (const r of rows) {
    const d = new Date(r.day + 'T00:00:00');
    const idx = groups.findIndex(g => g.start.getFullYear() === d.getFullYear() && g.start.getMonth() === d.getMonth());
    if (idx >= 0) groups[idx].rows.push(r);
  }
  const values = groups.map(g => combineRows(g.rows, m));
  return { labels, values, raw: rows, axis: 'month' };
}

function bucketByWeekday(rows, m) {
  const labels = DAY_NAMES_JA.map(n => n + '曜');
  const groups = [[], [], [], [], [], [], []];
  for (const r of rows) {
    const d = new Date(r.day + 'T00:00:00');
    groups[d.getDay()].push(r);
  }
  const values = groups.map(g => combineRows(g, m, /*average=*/true));
  return { labels, values, raw: rows, axis: 'weekday' };
}

function bucketByHour(rows, m) {
  const labels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const groups = Array.from({ length: 24 }, () => []);
  for (const r of rows) {
    const hh = parseInt(r.hour.slice(11, 13), 10);
    if (hh >= 0 && hh < 24) groups[hh].push(r);
  }
  const values = groups.map(g => combineRows(g, m, /*average=*/true));
  return { labels, values, raw: rows, axis: 'hour' };
}

/** Compute a representative value for a single bucket row (one day). */
function bucketValue(r, m) {
  if (!r) return zeroValue(m);
  if (m.agg === 'sum' || m.agg === 'duration') return { v: r.sum || 0, n: r.count || 0 };
  if (m.agg === 'avg') return { v: r.count ? r.sum / r.count : 0, n: r.count };
  if (m.agg === 'minmax') return {
    v: r.count ? r.sum / r.count : 0,
    min: isFinite(r.min) ? r.min : null,
    max: isFinite(r.max) ? r.max : null,
    n: r.count,
  };
  if (m.agg === 'last') return { v: r.value != null ? r.value : 0, n: r.count };
  if (m.agg === 'count') return { v: r.count || 0, n: r.count };
  if (m.agg === 'sleep') {
    const total = (r.core || 0) + (r.deep || 0) + (r.rem || 0) + (r.asleep || 0);
    return {
      v: total / 3600, // hours asleep
      sleep: {
        core: (r.core || 0) / 3600,
        deep: (r.deep || 0) / 3600,
        rem:  (r.rem  || 0) / 3600,
        awake:(r.awake|| 0) / 3600,
        inBed:(r.inBed|| 0) / 3600,
        asleep:(r.asleep||0)/ 3600,
      },
    };
  }
  return { v: 0, n: 0 };
}

function zeroValue(m) {
  if (m.agg === 'minmax') return { v: 0, min: null, max: null, n: 0 };
  if (m.agg === 'sleep') return { v: 0, sleep: { core:0,deep:0,rem:0,awake:0,inBed:0,asleep:0 } };
  return { v: 0, n: 0 };
}

/** Combine multiple daily rows into one bucket value. */
function combineRows(rows, m, average = false) {
  if (!rows.length) return zeroValue(m);

  if (m.agg === 'sum' || m.agg === 'duration') {
    const sum = rows.reduce((a, r) => a + (r.sum || 0), 0);
    return { v: average ? sum / rows.length : sum, n: rows.length };
  }
  if (m.agg === 'avg') {
    let s = 0, c = 0;
    for (const r of rows) { s += (r.sum || 0); c += (r.count || 0); }
    return { v: c ? s / c : 0, n: c };
  }
  if (m.agg === 'minmax') {
    let s = 0, c = 0, mn = Infinity, mx = -Infinity;
    for (const r of rows) {
      s += (r.sum || 0); c += (r.count || 0);
      if (r.min < mn) mn = r.min; if (r.max > mx) mx = r.max;
    }
    return { v: c ? s / c : 0, min: isFinite(mn) ? mn : null, max: isFinite(mx) ? mx : null, n: c };
  }
  if (m.agg === 'last') {
    // pick latest
    let last = null, ts = -1;
    for (const r of rows) { if ((r.ts || 0) > ts) { ts = r.ts || 0; last = r; } }
    return { v: last?.value || 0, n: rows.length };
  }
  if (m.agg === 'count') {
    const cnt = rows.reduce((a, r) => a + (r.count || 0), 0);
    return { v: average ? cnt / rows.length : cnt, n: rows.length };
  }
  if (m.agg === 'sleep') {
    const t = { core:0, deep:0, rem:0, awake:0, inBed:0, asleep:0 };
    for (const r of rows) {
      t.core += r.core || 0; t.deep += r.deep || 0; t.rem += r.rem || 0;
      t.awake += r.awake || 0; t.inBed += r.inBed || 0; t.asleep += r.asleep || 0;
    }
    const days = rows.length || 1;
    if (average) for (const k in t) t[k] /= days;
    const totalSec = t.core + t.deep + t.rem + t.asleep;
    const sleepHours = {
      core: t.core / 3600,
      deep: t.deep / 3600,
      rem:  t.rem  / 3600,
      awake:t.awake/ 3600,
      inBed:t.inBed/ 3600,
      asleep:t.asleep/3600,
    };
    return { v: totalSec / 3600, sleep: sleepHours };
  }
  return { v: 0, n: 0 };
}

// ---------------- Chart types per bucket / metric ----------------
function allowedChartTypes(m, bucket) {
  // For weekday/hour we want average per group; for sleep, stacked.
  const isSleep = m.agg === 'sleep';
  const opts = [];
  if (isSleep) {
    opts.push({ value: 'stacked', label: '積み上げ棒' });
    opts.push({ value: 'line',    label: '折れ線' });
    opts.push({ value: 'pie',     label: '円（平均割合）' });
    return opts;
  }
  opts.push({ value: 'bar',   label: '棒' });
  opts.push({ value: 'line',  label: '折れ線' });
  // Pie: meaningful only for bucket='weekday'/'month' with sum-type metric
  if ((bucket === 'weekday' || bucket === 'month' || bucket === 'week') &&
      (m.agg === 'sum' || m.agg === 'count' || m.agg === 'duration')) {
    opts.push({ value: 'pie', label: '円' });
  }
  if (m.agg === 'minmax') {
    opts.push({ value: 'range', label: '範囲帯' });
  }
  return opts;
}

// ---------------- Stats strip ----------------
function renderStats(el, m, b) {
  clear(el);
  const vals = b.values.map(x => x?.v || 0);
  const nonZero = vals.filter(v => v > 0);
  const total = vals.reduce((a, v) => a + v, 0);
  const avg   = nonZero.length ? nonZero.reduce((a,v)=>a+v,0) / nonZero.length : 0;
  const max   = vals.length ? Math.max(...vals) : 0;
  const min   = nonZero.length ? Math.min(...nonZero) : 0;

  const stats = [];
  if (m.agg === 'sum' || m.agg === 'count' || m.agg === 'duration') {
    stats.push(['合計', fmtNum(total, total < 10 ? 2 : 0), m.unit]);
    stats.push(['平均', fmtNum(avg, avg < 10 ? 2 : 0), m.unit]);
    stats.push(['最大', fmtNum(max, max < 10 ? 2 : 0), m.unit]);
    stats.push(['日数', fmtNum(nonZero.length, 0), '']);
  } else if (m.agg === 'sleep') {
    // Average total sleep hours, deep, rem, awake
    const bodies = b.values.map(x => x?.sleep).filter(Boolean);
    const avgOf = (k) => bodies.length ? bodies.reduce((a, s) => a + (s[k] || 0), 0) / bodies.length : 0;
    stats.push(['平均睡眠', fmtNum(avgOf('core') + avgOf('deep') + avgOf('rem') + avgOf('asleep'), 1), '時間']);
    stats.push(['深い', fmtNum(avgOf('deep'), 1), '時間']);
    stats.push(['レム', fmtNum(avgOf('rem'), 1), '時間']);
    stats.push(['覚醒', fmtNum(avgOf('awake'), 1), '時間']);
  } else {
    stats.push(['平均', fmtNum(avg, avg < 10 ? 2 : 0), m.unit]);
    stats.push(['最大', fmtNum(max, max < 10 ? 2 : 0), m.unit]);
    stats.push(['最小', fmtNum(min, min < 10 ? 2 : 0), m.unit]);
    stats.push(['件数', fmtNum(nonZero.length, 0), '']);
  }
  for (const [l, v, u] of stats) {
    el.appendChild(h('div', { class: 's' },
      h('div', { class: 'l' }, l),
      h('div', { class: 'v' }, v + (u ? ` ${u}` : ''))
    ));
  }
}

// ---------------- Chart rendering ----------------
function renderChart(canvas, m, prefs, b) {
  const labels = b.labels.map(formatLabel);
  const color = m.color || '#0a84ff';
  const fmtY = (v) => v.toLocaleString('ja-JP');

  if (prefs.chart === 'pie') {
    const colors = paletteFor(b.labels.length);
    const vals = b.values.map(x => x?.v || 0);
    renderPie(canvas, { labels, values: vals, colors });
    return;
  }

  if (m.agg === 'sleep') {
    const core = b.values.map(x => x?.sleep?.core  || 0);
    const deep = b.values.map(x => x?.sleep?.deep  || 0);
    const rem  = b.values.map(x => x?.sleep?.rem   || 0);
    const awake= b.values.map(x => x?.sleep?.awake || 0);
    const asleep=b.values.map(x => x?.sleep?.asleep|| 0);
    const datasets = [
      { label: '深い', data: deep,   backgroundColor: '#0a84ff', borderColor: '#0a84ff' },
      { label: 'コア', data: core,   backgroundColor: '#5ac8fa', borderColor: '#5ac8fa' },
      { label: 'レム', data: rem,    backgroundColor: '#bf5af2', borderColor: '#bf5af2' },
      { label: '未区分睡眠', data: asleep, backgroundColor: '#5856d6', borderColor: '#5856d6' },
      { label: '覚醒', data: awake,  backgroundColor: '#ff9500', borderColor: '#ff9500' },
    ];
    if (prefs.chart === 'line') {
      const total = b.values.map(x => (x?.sleep?.core||0)+(x?.sleep?.deep||0)+(x?.sleep?.rem||0)+(x?.sleep?.asleep||0));
      renderLine(canvas, {
        labels,
        datasets: [{ label: '合計睡眠(h)', data: total, borderColor: color, backgroundColor: color + '33', fill: true }],
        fmtY,
      });
    } else if (prefs.chart === 'pie') {
      // average slice sizes
      const n = b.values.length || 1;
      const avg = (arr) => arr.reduce((a, v) => a + v, 0) / n;
      renderPie(canvas, {
        labels: ['深い', 'コア', 'レム', '未区分睡眠', '覚醒'],
        values: [avg(deep), avg(core), avg(rem), avg(asleep), avg(awake)],
        colors: ['#0a84ff','#5ac8fa','#bf5af2','#5856d6','#ff9500'],
      });
    } else {
      renderStacked(canvas, { labels, datasets, fmtY });
    }
    return;
  }

  if (prefs.chart === 'range' && m.agg === 'minmax') {
    const avg = b.values.map(x => x?.v || 0);
    const mn  = b.values.map(x => x?.min != null ? x.min : null);
    const mx  = b.values.map(x => x?.max != null ? x.max : null);
    renderRangeLine(canvas, { labels, avg, min: mn, max: mx, color, fmtY });
    return;
  }

  const data = b.values.map(x => x?.v || 0);

  if (prefs.chart === 'line') {
    renderLine(canvas, {
      labels,
      datasets: [{ label: m.name, data, borderColor: color, backgroundColor: color + '33' }],
      fmtY, fill: true,
    });
    return;
  }

  // default: bar
  renderBar(canvas, {
    labels,
    datasets: [{ label: m.name, data, backgroundColor: color }],
    fmtY,
  });
}

function formatLabel(s) {
  // Day: YYYY-MM-DD → M/D; Hour: keep hh; Month: YYYY/M → YYYY/M; Weekday: already jp
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
  }
  return s;
}

function paletteFor(n) {
  const base = ['#ff3b30','#ff9500','#ffcc00','#30d158','#0a84ff','#5e5ce6','#bf5af2','#5ac8fa','#ff6b82','#8e8e93'];
  const out = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return out;
}

// ---------------- Comparison card ----------------
function renderCompare(el, m, cur, prev, curRange, prevRange) {
  clear(el);
  el.appendChild(h('h2', null, '前期間との比較'));
  const sum = (vals) => vals.reduce((a, x) => a + (x?.v || 0), 0);
  const avg = (vals) => {
    const nonZero = vals.filter(x => (x?.v || 0) > 0);
    return nonZero.length ? nonZero.reduce((a, x) => a + x.v, 0) / nonZero.length : 0;
  };
  const curSum = sum(cur.values);
  const prevSum = sum(prev.values);
  const curAvg = avg(cur.values);
  const prevAvg = avg(prev.values);
  const diff = (a, b) => {
    if (!b) return '—';
    const pct = ((a - b) / b) * 100;
    const sign = pct >= 0 ? '+' : '';
    const color = pct >= 0 ? 'var(--c-green)' : 'var(--c-danger)';
    return h('span', { style: { color } }, `${sign}${pct.toFixed(1)}%`);
  };

  const fmt = (v) => fmtNum(v, v < 10 ? 2 : 0);
  const row = (label, a, b, dEl) => h('div', { class: 'row between', style: { padding: '6px 0', borderTop: '0.5px solid var(--c-border)' } },
    h('div', null, label),
    h('div', { class: 'row', style: { gap: '8px' } },
      h('span', { class: 'tiny' }, `前: ${fmt(b)}${m.unit || ''}`),
      h('span', null, `今: ${fmt(a)}${m.unit || ''}`),
      dEl,
    )
  );

  el.appendChild(h('div', { class: 'tiny' },
    `今: ${fmtDay(curRange.start)} 〜 ${fmtDay(curRange.end)} ／ 前: ${fmtDay(prevRange.start)} 〜 ${fmtDay(prevRange.end)}`
  ));
  if (m.agg === 'sum' || m.agg === 'count' || m.agg === 'duration') {
    el.appendChild(row('合計', curSum, prevSum, diff(curSum, prevSum)));
    el.appendChild(row('平均', curAvg, prevAvg, diff(curAvg, prevAvg)));
  } else {
    el.appendChild(row('平均', curAvg, prevAvg, diff(curAvg, prevAvg)));
    const maxCur  = Math.max(...cur.values.map(x => x?.v || 0), 0);
    const maxPrev = Math.max(...prev.values.map(x => x?.v || 0), 0);
    el.appendChild(row('最大', maxCur, maxPrev, diff(maxCur, maxPrev)));
  }
}
