import { useState } from 'react';

const GRID = '#202739';

const linePath = (pts) =>
  pts.reduce((d, p, i) => {
    if (i === 0) return `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const [px, py] = pts[i - 1];
    const cx = ((px + p[0]) / 2).toFixed(1);
    return `${d} C ${cx} ${py.toFixed(1)}, ${cx} ${p[1].toFixed(1)}, ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }, '');

export function AreaChart({ data, series, height = 230 }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = height, P = { t: 14, r: 8, b: 26, l: 34 };
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key])));
  const x = (i) => P.l + (i * (W - P.l - P.r)) / Math.max(1, data.length - 1);
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const path = (key) => linePath(data.map((d, i) => [x(i), y(d[key])]));
  const colW = (W - P.l - P.r) / data.length;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} stroke={GRID} strokeDasharray="2 5" />
            <text x={P.l - 6} y={y(max * f) + 3} textAnchor="end" fontSize="9" className="fill-mute" fontFamily="JetBrains Mono">{Math.round(max * f)}</text>
          </g>
        ))}
        {series.map((s) => (
          <g key={s.key}>
            <path d={`${path(s.key)} L ${x(data.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`} fill={s.color} opacity="0.1" />
            <path d={path(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" />
            {hover != null && <circle cx={x(hover)} cy={y(data[hover][s.key])} r="3.5" fill={s.color} />}
          </g>
        ))}
        {data.map((d, i) =>
          i % 3 === 0 || i === data.length - 1 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" className="fill-mute" fontFamily="JetBrains Mono">{d.date.slice(5)}</text>
          ) : null
        )}
        {data.map((_, i) => (
          <rect key={i} x={x(i) - colW / 2} y="0" width={colW} height={H} fill="transparent"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }} />
        ))}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-line bg-panel2 px-2.5 py-2 font-mono text-[10px] text-ink shadow-glow-sm"
          style={{ left: `${(x(hover) / W) * 100}%` }}>
          <div className="mb-1 text-mute">{new Date(data[hover].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
              {s.label}: {data[hover][s.key]}
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex gap-5">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
            <span className="h-[3px] w-2.5 rounded-full" style={{ background: s.color }} />{s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Donut({ items, size = 160, thickness = 16, centerLabel, centerSub }) {
  const total = items.reduce((a, i) => a + i.value, 0) || 1;
  const R = (size - thickness) / 2;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#1A2030" strokeWidth={thickness} />
        {items.filter((i) => i.value > 0).map((i) => {
          const frac = i.value / total;
          const el = (
            <circle key={i.label} cx={size / 2} cy={size / 2} r={R} fill="none" stroke={i.color} strokeWidth={thickness}
              strokeDasharray={`${(frac * C).toFixed(2)} ${C.toFixed(2)}`} strokeDashoffset={(-acc * C).toFixed(2)} />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold">{centerLabel}</span>
        <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-mute">{centerSub}</span>
      </div>
    </div>
  );
}

export function Gauge({ value, max = 5, size = 150 }) {
  const cx = size / 2, cy = size / 2, R = cx - 10;
  const ang = (v) => Math.PI * (1 - Math.min(Math.max(v, 0), max) / max);
  const pt = (v, r) => [cx + r * Math.cos(ang(v)), cy - r * Math.sin(ang(v))];
  const arc = (from, to, r) => {
    const [x1, y1] = pt(from, r);
    const [x2, y2] = pt(to, r);
    const large = ang(from) - ang(to) > Math.PI ? 1 : 0;
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  return (
    <svg width={size} height={size * 0.64} viewBox={`0 0 ${size} ${size * 0.64}`}>
      <path d={arc(0, max, R)} fill="none" stroke="#1A2030" strokeWidth="9" strokeLinecap="round" />
      {value > 0 && <path d={arc(0, value, R)} fill="none" stroke="#7C6CFF" strokeWidth="9" strokeLinecap="round" />}
      {[1, 2, 3, 4].map((v) => {
        const [x1, y1] = pt(v, R - 8);
        const [x2, y2] = pt(v, R - 14);
        return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4A5468" strokeWidth="1" />;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="26" fontWeight="700" fontFamily="Sora" className="fill-ink">
        {value ? value.toFixed(2) : '—'}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" letterSpacing="2" fontFamily="JetBrains Mono" className="fill-mute">OUT OF 5</text>
    </svg>
  );
}

export function Spark({ points, w = 220, h = 34, color = '#7C6CFF' }) {
  const max = Math.max(...points, 1);
  const pts = points.map((v, i) => [(i / Math.max(1, points.length - 1)) * w, h - 2 - (v / max) * (h - 6)]);
  return (
    <svg width={w} height={h} className="max-w-full">
      <path d={linePath(pts)} fill="none" stroke={color} strokeWidth="1.5" />
      {pts.length > 0 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />}
    </svg>
  );
}