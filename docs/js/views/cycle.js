// Menstrual cycle view: calendar heatmap + cycle statistics + period/ovulation prediction.
//
// Approach:
//   1. Load all daily MenstrualFlow records (intensity per day) and OvulationTestResult records.
//   2. Group consecutive flow days into "periods" (cycle starts).
//   3. Compute cycle lengths (days between starts), average period length.
//   4. Predict next 3 periods using the average cycle length.
//   5. Predict ovulation as (next period start - 14 days). Fertility window = ovulation -5 to +1.
//   6. Render last 6 months as a calendar heatmap with all annotations + a stats bar chart.
import { h, clear, fmtNum, fmtDay, dayKey, addDays, startOfMonth, DAY_NAMES_JA } from '../utils.js';
import { getAllDaily, getFile } from '../db.js';
import { MENSTRUAL_FLOW, OVULATION_TEST } from '../metrics.js';
import { renderBar } from '../chart-render.js';
import { getMetricPrefs, setMetricPrefs } from '../prefs.js';

const PERIOD_GAP = 2;     // up to 2 spotting/none days within a period are tolerated
const LUTEAL_PHASE = 14;  // days from ovulation to next period

export async function renderCycleView(container, fileId) {
  clear(container);
  const file = await getFile(fileId);
  if (!file) {
    container.appendChild(h('div', { class: 'empty' }, 'ファイルが見つかりません'));
    return;
  }

  const flowRows = await getAllDaily(fileId, 'MenstrualFlow');
  const ovRows   = await getAllDaily(fileId, 'OvulationTestResult');

  if (!flowRows || !flowRows.length) {
    container.appendChild(h('div', { class: 'card' },
      h('h2', null, '月経周期予測'),
      h('div', { class: 'empty' },
        h('div', { class: 'big' }, '🌸'),
        h('div', null, '月経データがありません'),
        h('div', { class: 'tiny', style: { marginTop: '6px' } },
          'ヘルスケアアプリの「サイクル記録」で月経を記録すると、このページで周期予測ができます。'
        )
      )
    ));
    return;
  }

  // --- Derive periods (cycle starts) ---
  const periods = derivePeriods(flowRows);
  const cycles = computeCycleStats(periods);
  const ovulations = ovRows
    .filter(r => r.positive)
    .map(r => r.day);

  // --- Predictions ---
  const predictions = predictNext(periods, cycles.avgCycleLength, 3);

  // --- Header card with stats ---
  const headerCard = h('div', { class: 'card' });
  headerCard.appendChild(h('h2', null, '月経周期予測'));
  headerCard.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } },
    `記録された月経: ${periods.length}回`
  ));
  headerCard.appendChild(h('div', { class: 'stats' },
    h('div', { class: 's' },
      h('div', { class: 'l' }, '平均周期'),
      h('div', { class: 'v' }, isFinite(cycles.avgCycleLength) ? `${Math.round(cycles.avgCycleLength)}日` : '--')
    ),
    h('div', { class: 's' },
      h('div', { class: 'l' }, '平均月経期間'),
      h('div', { class: 'v' }, isFinite(cycles.avgPeriodLength) ? `${cycles.avgPeriodLength.toFixed(1)}日` : '--')
    ),
    h('div', { class: 's' },
      h('div', { class: 'l' }, '最短周期'),
      h('div', { class: 'v' }, cycles.minCycle ? `${cycles.minCycle}日` : '--')
    ),
    h('div', { class: 's' },
      h('div', { class: 'l' }, '最長周期'),
      h('div', { class: 'v' }, cycles.maxCycle ? `${cycles.maxCycle}日` : '--')
    )
  ));
  container.appendChild(headerCard);

  // --- Prediction card ---
  if (predictions.length) {
    const predCard = h('div', { class: 'card' });
    predCard.appendChild(h('h2', null, '次回の予測'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const list = h('div', { class: 'list' });
    predictions.forEach((p, i) => {
      const periodStart = new Date(p.start + 'T00:00:00');
      const periodEnd = addDays(periodStart, Math.round(cycles.avgPeriodLength || 5) - 1);
      const ov = new Date(p.ovulation + 'T00:00:00');
      const fStart = addDays(ov, -5);
      const fEnd = addDays(ov, 1);
      const daysAway = Math.round((periodStart - today) / 86400000);
      const conf = i === 0 ? '次回予測' : `${i + 1}周期後の予測`;
      list.appendChild(h('div', { class: 'list-item', style: { flexWrap: 'wrap' } },
        h('div', { class: 'ic' }, '🌸'),
        h('div', { style: { flex: 1 } },
          h('div', { class: 'ttl' }, `${conf}：${fmtDay(periodStart)} 〜 ${fmtDay(periodEnd)}`),
          h('div', { class: 'sub' },
            i === 0 ? (daysAway > 0 ? `あと${daysAway}日` : daysAway === 0 ? '本日予定' : `${-daysAway}日経過`) : ''
          ),
          h('div', { class: 'tiny' },
            `排卵日（推定）: ${fmtDay(ov)} ／ 妊娠可能期間: ${fmtDay(fStart)} 〜 ${fmtDay(fEnd)}`
          )
        )
      ));
    });
    predCard.appendChild(list);
    predCard.appendChild(h('div', { class: 'tiny', style: { marginTop: '8px' } },
      '※ 黄体期を14日と仮定した一般的な推定です。実際の周期は健康状態により変動します。'
    ));
    container.appendChild(predCard);
  }

  // --- Calendar heatmap (last N months) ---
  const calCard = h('div', { class: 'card' });
  calCard.appendChild(h('h2', null, 'カレンダー'));

  // Months selector
  const prefs = { months: 6, ...getMetricPrefs('cycle') };
  const monthsSeg = h('div', { class: 'seg', style: { marginBottom: '10px' } });
  for (const n of [3, 6, 12]) {
    const b = h('button', { class: prefs.months === n ? 'on' : '' }, `${n}ヶ月`);
    b.onclick = () => {
      prefs.months = n;
      setMetricPrefs('cycle', prefs);
      drawCalendar();
      monthsSeg.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
    };
    monthsSeg.appendChild(b);
  }
  calCard.appendChild(monthsSeg);

  // Legend
  calCard.appendChild(h('div', { class: 'row wrap', style: { gap: '8px', marginBottom: '8px', fontSize: '11px' } },
    legendDot('#c5172e', '多量'),
    legendDot('#ff5470', '中量'),
    legendDot('#ff97a8', '少量/記録'),
    legendDot('#bf5af2', '排卵陽性/LH'),
    legendDot('#ffd4a3', '妊娠可能期間（推定）', true),
    legendDot('#fff3b0', '次回予測（推定）', true),
  ));

  const calHost = h('div');
  calCard.appendChild(calHost);
  container.appendChild(calCard);

  function drawCalendar() {
    clear(calHost);
    const flowMap = Object.fromEntries(flowRows.map(r => [r.day, r]));
    const ovMap   = Object.fromEntries(ovRows.map(r => [r.day, r]));

    // Mark predicted days
    const predDays = new Set();
    const fertileDays = new Set();
    for (const p of predictions) {
      const len = Math.round(cycles.avgPeriodLength || 5);
      const start = new Date(p.start + 'T00:00:00');
      for (let i = 0; i < len; i++) {
        predDays.add(dayKey(addDays(start, i)));
      }
      const ov = new Date(p.ovulation + 'T00:00:00');
      for (let d = -5; d <= 1; d++) {
        fertileDays.add(dayKey(addDays(ov, d)));
      }
    }

    // Build month grids
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const grid = h('div', { style: { display: 'grid', gap: '12px' } });
    for (let i = prefs.months - 1; i >= 0; i--) {
      const d = startOfMonth(addDays(today, -30 * i));
      d.setDate(1);
      const m = new Date(today);
      m.setMonth(m.getMonth() - i, 1);
      grid.appendChild(monthGrid(m, flowMap, ovMap, predDays, fertileDays, today));
    }
    calHost.appendChild(grid);
  }
  drawCalendar();

  // --- Cycle history bar chart ---
  if (cycles.lengths.length) {
    const histCard = h('div', { class: 'card' });
    histCard.appendChild(h('h2', null, '周期の長さ（履歴）'));
    const wrap = h('div', { class: 'chart-wrap' });
    const canvas = h('canvas');
    wrap.appendChild(canvas);
    histCard.appendChild(wrap);
    const labels = cycles.lengths.map((_, i) => `#${i + 1}`);
    const data = cycles.lengths;
    const colors = data.map(v => {
      const a = cycles.avgCycleLength;
      if (!isFinite(a)) return '#bf5af2';
      const dev = Math.abs(v - a);
      if (dev <= 3) return '#bf5af2';
      if (dev <= 7) return '#ff9500';
      return '#ff3b30';
    });
    renderBar(canvas, {
      labels,
      datasets: [{ label: '周期日数', data, backgroundColor: colors }],
      fmtY: (v) => `${v}日`,
    });
    histCard.appendChild(h('div', { class: 'tiny', style: { marginTop: '4px' } },
      '色: 紫=平均±3日以内 ／ 橙=±7日以内 ／ 赤=それ以上のばらつき'
    ));
    container.appendChild(histCard);
  }

  // --- Period length history ---
  if (periods.length) {
    const plCard = h('div', { class: 'card' });
    plCard.appendChild(h('h2', null, '月経期間（日数）'));
    const wrap = h('div', { class: 'chart-wrap' });
    const canvas = h('canvas');
    wrap.appendChild(canvas);
    plCard.appendChild(wrap);
    const labels = periods.map(p => p.start.slice(5));
    const data = periods.map(p => p.length);
    renderBar(canvas, {
      labels,
      datasets: [{ label: '日数', data, backgroundColor: '#ff5470' }],
      fmtY: (v) => `${v}日`,
    });
    container.appendChild(plCard);
  }
}

// ----- Helpers -----

function legendDot(color, label, square = false) {
  return h('div', { class: 'row', style: { gap: '4px' } },
    h('div', {
      style: {
        width: '12px', height: '12px',
        background: color,
        borderRadius: square ? '3px' : '50%',
      },
    }),
    h('span', null, label)
  );
}

/** Group consecutive flow days into periods. Tolerates short gaps (PERIOD_GAP). */
function derivePeriods(rows) {
  const flowDays = rows
    .filter(r => (r.level || 0) > 1) // exclude 'none'/'unspecified'
    .map(r => r.day)
    .sort();
  // include unspecified+ as "any flow"
  const anyFlow = rows.filter(r => (r.level || 0) >= 1).map(r => r.day).sort();
  if (!anyFlow.length) return [];

  const periods = [];
  let curStart = anyFlow[0];
  let curEnd = anyFlow[0];
  for (let i = 1; i < anyFlow.length; i++) {
    const prev = new Date(curEnd + 'T00:00:00');
    const cur = new Date(anyFlow[i] + 'T00:00:00');
    const gap = Math.round((cur - prev) / 86400000);
    if (gap <= PERIOD_GAP + 1) {
      curEnd = anyFlow[i];
    } else {
      const len = Math.round((new Date(curEnd + 'T00:00:00') - new Date(curStart + 'T00:00:00')) / 86400000) + 1;
      periods.push({ start: curStart, end: curEnd, length: len });
      curStart = anyFlow[i];
      curEnd = anyFlow[i];
    }
  }
  const len = Math.round((new Date(curEnd + 'T00:00:00') - new Date(curStart + 'T00:00:00')) / 86400000) + 1;
  periods.push({ start: curStart, end: curEnd, length: len });
  return periods;
}

function computeCycleStats(periods) {
  if (periods.length < 2) {
    return {
      avgCycleLength: NaN,
      avgPeriodLength: periods.length ? periods[0].length : NaN,
      minCycle: null, maxCycle: null, lengths: [],
    };
  }
  const lengths = [];
  for (let i = 1; i < periods.length; i++) {
    const a = new Date(periods[i - 1].start + 'T00:00:00');
    const b = new Date(periods[i].start + 'T00:00:00');
    const d = Math.round((b - a) / 86400000);
    if (d > 10 && d < 90) lengths.push(d); // sanity filter
  }
  const sum = lengths.reduce((a, v) => a + v, 0);
  const avg = lengths.length ? sum / lengths.length : NaN;
  const periodSum = periods.reduce((a, p) => a + p.length, 0);
  return {
    avgCycleLength: avg,
    avgPeriodLength: periodSum / periods.length,
    minCycle: lengths.length ? Math.min(...lengths) : null,
    maxCycle: lengths.length ? Math.max(...lengths) : null,
    lengths,
  };
}

function predictNext(periods, avgCycle, count) {
  if (!periods.length || !isFinite(avgCycle) || avgCycle < 14) return [];
  const last = periods[periods.length - 1];
  const lastStart = new Date(last.start + 'T00:00:00');
  const out = [];
  for (let i = 1; i <= count; i++) {
    const nextStart = addDays(lastStart, Math.round(avgCycle * i));
    const ov = addDays(nextStart, -LUTEAL_PHASE);
    out.push({ start: dayKey(nextStart), ovulation: dayKey(ov) });
  }
  return out;
}

/** Build a single month grid. */
function monthGrid(monthDate, flowMap, ovMap, predDays, fertileDays, today) {
  const wrap = h('div');
  const monthLabel = `${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`;
  wrap.appendChild(h('div', { style: { fontWeight: 600, marginBottom: '6px' } }, monthLabel));

  // Header (Sun-Sat)
  const grid = h('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '4px',
    },
  });
  for (const dn of DAY_NAMES_JA) {
    grid.appendChild(h('div', {
      style: { textAlign: 'center', fontSize: '10px', color: 'var(--c-text-2)', padding: '2px' },
    }, dn));
  }

  // Empty cells before day 1
  const first = new Date(monthDate);
  first.setDate(1);
  const offset = first.getDay();
  for (let i = 0; i < offset; i++) grid.appendChild(h('div'));

  // Days
  const last = new Date(monthDate);
  last.setMonth(last.getMonth() + 1, 0);
  for (let dnum = 1; dnum <= last.getDate(); dnum++) {
    const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), dnum);
    const key = dayKey(d);
    const flow = flowMap[key];
    const ov = ovMap[key];
    const isFertile = fertileDays.has(key);
    const isPred = predDays.has(key);
    const isToday = key === dayKey(today);

    let bg = 'transparent';
    let fg = 'var(--c-text)';
    let dot = null;

    // Layered: prediction background, then fertility, then actual flow color.
    if (isFertile) bg = '#ffd4a3';
    if (isPred)    bg = '#fff3b0';

    if (flow && (flow.level || 0) > 0) {
      const m = MENSTRUAL_FLOW['HKCategoryValueMenstrualFlow' + capitalize(flow.flow)];
      bg = m ? m.color : '#ff97a8';
      fg = (flow.level >= 3) ? '#fff' : 'var(--c-text)';
    }

    if (ov && ov.result === 'pos') dot = '#bf5af2';
    if (ov && ov.result === 'lh')  dot = '#bf5af2';

    const cell = h('div', {
      style: {
        position: 'relative',
        background: bg,
        color: fg,
        textAlign: 'center',
        padding: '6px 0',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: isToday ? '700' : '500',
        border: isToday ? '1.5px solid var(--c-primary)' : '0.5px solid transparent',
      },
    }, String(dnum));

    if (dot) {
      cell.appendChild(h('div', {
        style: {
          position: 'absolute',
          bottom: '2px', left: '50%',
          transform: 'translateX(-50%)',
          width: '5px', height: '5px',
          borderRadius: '50%',
          background: dot,
        },
      }));
    }
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);
  return wrap;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
