// Workout view: list with grouping + detail with Leaflet route map.
import { h, clear, fmtDateTime, fmtDuration, fmtNum, segmented, toast } from '../utils.js';
import { listWorkouts, getRoute } from '../db.js';
import { workoutTypeName, WORKOUT_TYPES } from '../metrics.js';
import { renderLine, renderPie } from '../chart-render.js';

/** Render workout list view. */
export async function renderWorkoutList(container, fileId, { onWorkoutTap } = {}) {
  clear(container);
  if (!fileId) {
    container.appendChild(h('div', { class: 'empty' },
      h('div', { class: 'big' }, '🏃'),
      h('div', null, 'ファイルを選択してください')
    ));
    return;
  }
  const workouts = await listWorkouts(fileId);
  if (!workouts.length) {
    container.appendChild(h('div', { class: 'empty' },
      h('div', { class: 'big' }, '🏃'),
      h('div', null, 'ワークアウト記録はありません'),
      h('div', { class: 'tiny', style: { marginTop: '6px' } },
        'このエクスポートにはWorkout要素が含まれていません。')
    ));
    return;
  }

  // Summary by type (pie)
  const typeCount = {};
  const typeDuration = {};
  const typeEnergy = {};
  for (const w of workouts) {
    const t = w.activityType || 'HKWorkoutActivityTypeOther';
    typeCount[t] = (typeCount[t] || 0) + 1;
    typeDuration[t] = (typeDuration[t] || 0) + (w.durationSec || 0);
    typeEnergy[t] = (typeEnergy[t] || 0) + (w.energyKcal || 0);
  }
  const typeKeys = Object.keys(typeCount).sort((a, b) => typeCount[b] - typeCount[a]);

  const summaryCard = h('div', { class: 'card' });
  summaryCard.appendChild(h('h2', null, `ワークアウト合計 ${workouts.length}件`));
  const totalSec = workouts.reduce((a, w) => a + (w.durationSec || 0), 0);
  const totalKm  = workouts.reduce((a, w) => a + (w.distanceKm || 0), 0);
  const totalKcal= workouts.reduce((a, w) => a + (w.energyKcal || 0), 0);
  summaryCard.appendChild(h('div', { class: 'stats' },
    h('div', { class: 's' }, h('div', { class: 'l' }, '合計時間'), h('div', { class: 'v' }, fmtDuration(totalSec))),
    h('div', { class: 's' }, h('div', { class: 'l' }, '合計距離'), h('div', { class: 'v' }, fmtNum(totalKm, 1) + ' km')),
    h('div', { class: 's' }, h('div', { class: 'l' }, 'エネルギー'), h('div', { class: 'v' }, fmtNum(totalKcal, 0) + ' kcal')),
    h('div', { class: 's' }, h('div', { class: 'l' }, '種類'), h('div', { class: 'v' }, typeKeys.length + '種'))
  ));

  // Pie chart of activity types (by count)
  const pieWrap = h('div', { class: 'chart-wrap' });
  const pieCanvas = h('canvas');
  pieWrap.appendChild(pieCanvas);
  summaryCard.appendChild(pieWrap);
  const palette = ['#ff3b30','#ff9500','#ffcc00','#30d158','#0a84ff','#5e5ce6','#bf5af2','#5ac8fa','#ff6b82','#8e8e93'];
  renderPie(pieCanvas, {
    labels: typeKeys.map(t => workoutTypeName(t)),
    values: typeKeys.map(t => typeCount[t]),
    colors: typeKeys.map((_, i) => palette[i % palette.length]),
  });
  container.appendChild(summaryCard);

  // Filter: type segmented (up to 6 + all)
  const filterCard = h('div', { class: 'card' });
  filterCard.appendChild(h('div', { class: 'tiny', style: { marginBottom: '4px' } }, '種類でフィルタ'));
  const filterOpts = [{ value: 'all', label: `すべて (${workouts.length})` }];
  for (const t of typeKeys.slice(0, 12)) {
    filterOpts.push({ value: t, label: `${workoutTypeName(t)} (${typeCount[t]})` });
  }
  let currentFilter = 'all';
  const filterSeg = segmented(filterOpts, currentFilter, (v) => {
    currentFilter = v;
    redrawList();
  });
  filterCard.appendChild(filterSeg);
  container.appendChild(filterCard);

  // List card
  const listCard = h('div', { class: 'card' });
  listCard.appendChild(h('h2', null, '一覧（新しい順）'));
  const listEl = h('div', { class: 'list' });
  listCard.appendChild(listEl);
  container.appendChild(listCard);

  function redrawList() {
    clear(listEl);
    const sorted = [...workouts].sort((a, b) => (b.start || '').localeCompare(a.start || ''));
    const filtered = currentFilter === 'all' ? sorted : sorted.filter(w => w.activityType === currentFilter);
    if (!filtered.length) {
      listEl.appendChild(h('div', { class: 'empty' }, '該当するワークアウトはありません'));
      return;
    }
    for (const w of filtered) {
      const hasRoute = !!w.routeFile;
      const start = w.start ? new Date(w.start) : null;
      const item = h('button', { class: 'list-item', onclick: () => onWorkoutTap?.(w.idx) },
        h('div', { class: 'ic' }, activityIcon(w.activityType)),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { class: 'ttl' }, workoutTypeName(w.activityType),
            hasRoute ? h('span', { class: 'badge', style: { marginLeft: '6px' } }, '🗺️ ルート') : null),
          h('div', { class: 'sub' },
            start ? fmtDateTime(start) : '--',
            ' ・ ', fmtDuration(w.durationSec),
            w.distanceKm ? ` ・ ${fmtNum(w.distanceKm, 2)} km` : '',
            w.energyKcal ? ` ・ ${fmtNum(w.energyKcal, 0)} kcal` : ''
          ),
          w.source ? h('div', { class: 'tiny' }, w.source) : null
        ),
        h('div', { class: 'chev' }, '›')
      );
      listEl.appendChild(item);
    }
  }
  redrawList();
}

/** Render workout detail view (with map). */
export async function renderWorkoutDetail(container, fileId, idx, { onBack } = {}) {
  clear(container);
  const workouts = await listWorkouts(fileId);
  const w = workouts.find(x => x.idx === idx);
  if (!w) {
    container.appendChild(h('div', { class: 'empty' }, 'ワークアウトが見つかりません'));
    return;
  }

  const start = w.start ? new Date(w.start) : null;
  const end   = w.end   ? new Date(w.end)   : null;

  // Header
  container.appendChild(h('div', { class: 'card' },
    h('div', { class: 'row', style: { gap: '10px' } },
      h('div', { style: { fontSize: '32px' } }, activityIcon(w.activityType)),
      h('div', { style: { flex: 1 } },
        h('div', { style: { fontWeight: 700, fontSize: '18px' } }, workoutTypeName(w.activityType)),
        h('div', { class: 'muted' }, start ? fmtDateTime(start) : '--'),
        w.source ? h('div', { class: 'tiny' }, w.source) : null
      )
    )
  ));

  // Stats
  const stats = h('div', { class: 'stats' },
    h('div', { class: 's' }, h('div', { class: 'l' }, '時間'), h('div', { class: 'v' }, fmtDuration(w.durationSec))),
    h('div', { class: 's' }, h('div', { class: 'l' }, '距離'), h('div', { class: 'v' }, w.distanceKm ? `${fmtNum(w.distanceKm, 2)} km` : '--')),
    h('div', { class: 's' }, h('div', { class: 'l' }, 'カロリー'), h('div', { class: 'v' }, w.energyKcal ? `${fmtNum(w.energyKcal, 0)} kcal` : '--')),
    h('div', { class: 's' }, h('div', { class: 'l' }, '平均速度'), h('div', { class: 'v' }, avgSpeedText(w))),
  );
  container.appendChild(stats);

  // Stats breakdown card (from WorkoutStatistics)
  if (w.stats && Object.keys(w.stats).length) {
    const card = h('div', { class: 'card' });
    card.appendChild(h('h2', null, 'ワークアウト中の計測値'));
    const entries = Object.entries(w.stats);
    for (const [key, val] of entries) {
      const label = statsKeyToJa(key);
      const fields = [];
      if (val.average != null) fields.push(`平均 ${fmtNum(val.average, 1)}${val.unit || ''}`);
      if (val.minimum != null) fields.push(`最小 ${fmtNum(val.minimum, 1)}${val.unit || ''}`);
      if (val.maximum != null) fields.push(`最大 ${fmtNum(val.maximum, 1)}${val.unit || ''}`);
      if (val.sum     != null) fields.push(`合計 ${fmtNum(val.sum, 1)}${val.unit || ''}`);
      card.appendChild(h('div', { class: 'row between', style: { padding: '6px 0', borderTop: '0.5px solid var(--c-border)' } },
        h('div', null, label),
        h('div', { class: 'tiny' }, fields.join(' / '))
      ));
    }
    container.appendChild(card);
  }

  // Map (if route)
  if (w.routeFile) {
    const route = await getRoute(fileId, idx);
    if (route && route.points && route.points.length) {
      container.appendChild(h('h2', { style: { margin: '14px 4px 8px', fontSize: '13px', color: 'var(--c-text-2)' } }, '🗺️ ルート'));
      const mapDiv = h('div', { id: 'mapView' });
      container.appendChild(mapDiv);

      // Defer to next tick so layout is done
      setTimeout(() => renderMap(mapDiv, route.points), 50);

      // Elevation chart
      const pts = route.points;
      const hasEle = pts.some(p => p[3] != null);
      if (hasEle) {
        const chartWrap = h('div', { class: 'chart-wrap' });
        const canvas = h('canvas');
        chartWrap.appendChild(canvas);
        container.appendChild(h('h2', { style: { margin: '14px 4px 8px', fontSize: '13px', color: 'var(--c-text-2)' } }, '📈 標高'));
        container.appendChild(chartWrap);

        const labels = pts.map((p, i) => i);
        const data = pts.map(p => p[3] || 0);
        renderLine(canvas, {
          labels,
          datasets: [{ label: '標高 (m)', data, borderColor: '#30d158', backgroundColor: '#30d15822' }],
          fmtY: (v) => `${v.toFixed(0)} m`,
          fill: true,
        });
      }

      // Route stats
      const total = gpsDistance(pts);
      container.appendChild(h('div', { class: 'tiny', style: { textAlign: 'center', marginTop: '6px' } },
        `GPSポイント ${pts.length}点 ／ 推定距離 ${fmtNum(total, 2)} km`
      ));
    } else {
      container.appendChild(h('div', { class: 'muted', style: { textAlign: 'center', padding: '20px' } },
        '位置情報データが読み込めませんでした'
      ));
    }
  }
}

function activityIcon(t) {
  const map = {
    HKWorkoutActivityTypeRunning: '🏃',
    HKWorkoutActivityTypeWalking: '🚶',
    HKWorkoutActivityTypeHiking: '🥾',
    HKWorkoutActivityTypeCycling: '🚴',
    HKWorkoutActivityTypeSwimming: '🏊',
    HKWorkoutActivityTypeYoga: '🧘',
    HKWorkoutActivityTypeTraditionalStrengthTraining: '🏋️',
    HKWorkoutActivityTypeFunctionalStrengthTraining: '💪',
    HKWorkoutActivityTypeHighIntensityIntervalTraining: '🔥',
    HKWorkoutActivityTypeRowing: '🚣',
    HKWorkoutActivityTypeDance: '💃',
    HKWorkoutActivityTypePilates: '🤸',
    HKWorkoutActivityTypeTennis: '🎾',
    HKWorkoutActivityTypeGolf: '⛳',
    HKWorkoutActivityTypeBasketball: '🏀',
    HKWorkoutActivityTypeSoccer: '⚽',
    HKWorkoutActivityTypeBaseball: '⚾',
    HKWorkoutActivityTypeJumpRope: '🪢',
    HKWorkoutActivityTypeClimbing: '🧗',
    HKWorkoutActivityTypeStairs: '🪜',
    HKWorkoutActivityTypeStairClimbing: '🪜',
    HKWorkoutActivityTypeElliptical: '🏋️',
    HKWorkoutActivityTypeTableTennis: '🏓',
    HKWorkoutActivityTypeSkatingSports: '⛸️',
    HKWorkoutActivityTypeSnowboarding: '🏂',
    HKWorkoutActivityTypeDownhillSkiing: '⛷️',
  };
  return map[t] || '🏃';
}

function avgSpeedText(w) {
  if (!w.durationSec || !w.distanceKm) return '--';
  const hours = w.durationSec / 3600;
  if (!hours) return '--';
  const kmh = w.distanceKm / hours;
  return `${fmtNum(kmh, 2)} km/h`;
}

function statsKeyToJa(key) {
  const map = {
    HeartRate: '心拍数',
    ActiveEnergyBurned: 'アクティブエネルギー',
    BasalEnergyBurned: '安静時消費エネルギー',
    DistanceWalkingRunning: '歩行+ランニング距離',
    DistanceCycling: 'サイクリング距離',
    DistanceSwimming: '水泳距離',
    StepCount: '歩数',
    SwimmingStrokeCount: '水泳ストローク',
    FlightsClimbed: '上った階数',
    RunningSpeed: 'ランニング速度',
    RunningPower: 'ランニングパワー',
    RunningStrideLength: 'ストライド長',
    RunningVerticalOscillation: '上下動',
    RunningGroundContactTime: '接地時間',
    WalkingSpeed: '歩行速度',
    AverageMETs: '平均MET',
  };
  return map[key] || key;
}

function gpsDistance(pts) {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += haversine(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  }
  return total;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (x) => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Render Leaflet map of a route. */
function renderMap(mapDiv, points) {
  if (!points || !points.length) return;
  // fix Leaflet's default marker image paths to point at our vendored copies
  if (window.L && L.Icon && L.Icon.Default && !L.Icon.Default._hvFixed) {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: './vendor/leaflet/images/marker-icon-2x.png',
      iconUrl: './vendor/leaflet/images/marker-icon.png',
      shadowUrl: './vendor/leaflet/images/marker-shadow.png',
    });
    L.Icon.Default._hvFixed = true;
  }

  const latlngs = points.map(p => [p[0], p[1]]);
  const map = L.map(mapDiv, { zoomControl: true, attributionControl: true });

  // Fit bounds
  const bounds = L.latLngBounds(latlngs);
  map.fitBounds(bounds, { padding: [20, 20] });

  // Tile layer: OSM. Will be cached by SW when online.
  const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  });
  tile.addTo(map);

  // Tile error → fallback to offline note overlay
  let tileErrors = 0;
  tile.on('tileerror', () => {
    tileErrors++;
    if (tileErrors === 1) {
      const note = h('div', {
        style: {
          position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 10px',
          borderRadius: '8px', fontSize: '11px', zIndex: 500, pointerEvents: 'none',
        }
      }, 'オフラインのため地図タイルを表示できません');
      mapDiv.style.position = 'relative';
      mapDiv.appendChild(note);
    }
  });

  // Route polyline
  L.polyline(latlngs, { color: '#ff3b30', weight: 4, opacity: 0.9 }).addTo(map);

  // Start/end markers
  L.marker(latlngs[0], { title: 'スタート' }).addTo(map).bindPopup('スタート');
  if (latlngs.length > 1) {
    L.marker(latlngs[latlngs.length - 1], { title: 'ゴール' }).addTo(map).bindPopup('ゴール');
  }

  // Force resize after layout
  setTimeout(() => map.invalidateSize(), 150);
}
