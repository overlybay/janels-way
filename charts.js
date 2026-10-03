/* Janel's Way — tiny canvas line-chart helper for progress graphs. No dependencies. */
(function () {
  // rows: [{ label: "Oct 1", value: 3 }, ...] — draws a simple line chart.
  function drawLineChart(canvas, rows, color) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    if (!rows.length) {
      ctx.fillStyle = "#6B6580"; ctx.font = "14px sans-serif";
      ctx.fillText("No data yet — record behavior data to see the graph.", 16, H / 2);
      return;
    }
    const pad = 34;
    const max = Math.max(...rows.map(r => r.value), 1);
    const stepX = rows.length > 1 ? (W - pad * 2) / (rows.length - 1) : 0;
    const y = v => H - pad - (v / max) * (H - pad * 2);

    // gridlines
    ctx.strokeStyle = "#EDE9FE"; ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const gy = pad + (g / 4) * (H - pad * 2);
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - 10, gy); ctx.stroke();
    }
    // line
    ctx.strokeStyle = color || "#7C3AED"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    rows.forEach((r, i) => {
      const x = pad + i * stepX;
      i ? ctx.lineTo(x, y(r.value)) : ctx.moveTo(x, y(r.value));
    });
    ctx.stroke();
    // dots + labels
    ctx.fillStyle = color || "#7C3AED";
    rows.forEach((r, i) => {
      const x = pad + i * stepX;
      ctx.beginPath(); ctx.arc(x, y(r.value), 4, 0, Math.PI * 2); ctx.fill();
      if (rows.length <= 14 || i % Math.ceil(rows.length / 14) === 0) {
        ctx.fillStyle = "#6B6580"; ctx.font = "10px sans-serif";
        ctx.fillText(r.label, x - 12, H - 12);
        ctx.fillStyle = color || "#7C3AED";
      }
    });
  }

  // Aggregate behavior_data rows into per-day totals for the last N days.
  function dailyTotals(behaviorRows, behaviorName, days) {
    const out = [];
    const byDay = {};
    behaviorRows
      .filter(r => !behaviorName || r.behavior === behaviorName)
      .forEach(r => {
        const d = new Date(r.recorded_at).toISOString().slice(0, 10);
        byDay[d] = (byDay[d] || 0) + Number(r.count || 0);
      });
    for (let i = (days || 14) - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({
        label: d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
        value: byDay[key] || 0
      });
    }
    return out;
  }

  window.JWCharts = { drawLineChart, dailyTotals };
})();
