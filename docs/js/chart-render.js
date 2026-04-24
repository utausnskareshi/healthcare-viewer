// Chart.js rendering wrapper. Keeps one chart instance at a time per canvas.

const isDark = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

function theme() {
  const dark = isDark();
  return {
    grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    text: dark ? '#e5e5ea' : '#1c1c1e',
    sub:  dark ? '#a0a0a6' : '#6b6b70',
  };
}

export function destroyChart(canvas) {
  const c = Chart.getChart(canvas);
  if (c) c.destroy();
}

function commonOpts({ legend = true, stacked = false, fmtY } = {}) {
  const t = theme();
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: legend, labels: { color: t.text, boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'transparent',
        padding: 8,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        stacked,
        ticks: { color: t.sub, maxRotation: 0, autoSkip: true, autoSkipPadding: 6, font: { size: 10 } },
        grid: { color: t.grid, display: false },
      },
      y: {
        stacked,
        beginAtZero: true,
        ticks: {
          color: t.sub,
          font: { size: 10 },
          callback: fmtY || ((v) => v.toLocaleString('ja-JP')),
        },
        grid: { color: t.grid },
      },
    },
  };
}

export function renderBar(canvas, { labels, datasets, stacked = false, fmtY }) {
  destroyChart(canvas);
  return new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: datasets.map(d => ({
      borderRadius: 4,
      maxBarThickness: 28,
      ...d,
    })) },
    options: commonOpts({ legend: datasets.length > 1, stacked, fmtY }),
  });
}

export function renderLine(canvas, { labels, datasets, fmtY, fill = false }) {
  destroyChart(canvas);
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map(d => ({
        tension: 0.25,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: fill ? 'origin' : false,
        ...d,
      })),
    },
    options: commonOpts({ legend: datasets.length > 1, fmtY }),
  });
}

// Line with min/max band (for heart rate-like)
export function renderRangeLine(canvas, { labels, avg, min, max, color, fmtY }) {
  destroyChart(canvas);
  const t = theme();
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '最大',
          data: max,
          borderColor: 'transparent',
          backgroundColor: color + '33',
          pointRadius: 0,
          fill: '+1',
        },
        {
          label: '最小',
          data: min,
          borderColor: 'transparent',
          backgroundColor: color + '33',
          pointRadius: 0,
          fill: false,
        },
        {
          label: '平均',
          data: avg,
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false,
          tension: 0.25,
        },
      ],
    },
    options: {
      ...commonOpts({ legend: false, fmtY }),
      plugins: {
        ...commonOpts().plugins,
        legend: { display: false },
      },
    },
  });
}

export function renderPie(canvas, { labels, values, colors }) {
  destroyChart(canvas);
  const t = theme();
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: { position: 'right', labels: { color: t.text, boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total ? (ctx.parsed / total * 100).toFixed(1) : '0';
              return `${ctx.label}: ${ctx.formattedValue} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// Stacked bar (for sleep stages)
export function renderStacked(canvas, { labels, datasets, fmtY }) {
  return renderBar(canvas, { labels, datasets, stacked: true, fmtY });
}
