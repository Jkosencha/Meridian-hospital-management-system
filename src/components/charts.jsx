import { useState } from 'react'
import { formatKsh } from '../lib/currency'

export function DonutChart({ title, segments, emptyMessage, centerLabel = 'Total' }) {
  const activeSegments = segments.filter((segment) => segment.count > 0)
  const total = activeSegments.reduce((sum, segment) => sum + segment.count, 0)

  const size = 180
  const radius = 66
  const strokeWidth = 26
  const circumference = 2 * Math.PI * radius
  const gap = activeSegments.length > 1 ? 8 : 0
  const availableCircumference = Math.max(circumference - gap * activeSegments.length, 0)

  const { arcs } = activeSegments.reduce(
    (acc, segment) => {
      const dash = (segment.count / total) * availableCircumference
      acc.arcs.push({ ...segment, dash, dashOffset: -acc.cumulative })
      acc.cumulative += dash + gap
      return acc
    },
    { cumulative: 0, arcs: [] }
  )

  return (
    <div className="border border-slate-200 bg-white px-6 py-5">
      <h2 className="text-sm font-medium text-slate-900">{title}</h2>
      {total === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg
              viewBox={`0 0 ${size} ${size}`}
              width={size}
              height={size}
              className="-rotate-90"
              role="img"
              aria-label={`${title}: ${activeSegments.map((s) => `${s.label} ${s.count}`).join(', ')}`}
            >
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f0ec" strokeWidth={strokeWidth} />
              {arcs.map((arc) => (
                <circle
                  key={arc.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={arc.hex}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                  strokeDashoffset={arc.dashOffset}
                >
                  <title>{`${arc.label}: ${arc.count}`}</title>
                </circle>
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">{total}</span>
              <span className="text-xs font-medium text-slate-500">{centerLabel}</span>
            </div>
          </div>
          <ul className="w-full flex-1 space-y-2.5 text-sm">
            {activeSegments.map((segment) => (
              <li key={segment.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: segment.hex }}
                    aria-hidden="true"
                  />
                  <span className={`font-medium ${segment.textClass || 'text-slate-700'}`}>{segment.label}</span>
                </span>
                <span className="text-slate-900 font-semibold">{segment.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function buildSmoothPath(coords) {
  if (coords.length < 2) return coords.length === 1 ? `M ${coords[0].x} ${coords[0].y}` : ''
  let d = `M ${coords[0].x} ${coords[0].y}`
  for (let i = 1; i < coords.length - 1; i++) {
    const midX = (coords[i].x + coords[i + 1].x) / 2
    const midY = (coords[i].y + coords[i + 1].y) / 2
    d += ` Q ${coords[i].x} ${coords[i].y} ${midX} ${midY}`
  }
  const last = coords[coords.length - 1]
  const secondLast = coords[coords.length - 2]
  d += ` Q ${secondLast.x} ${secondLast.y} ${last.x} ${last.y}`
  return d
}

export function RevenueChart({ title = 'Revenue by month', points }) {
  const [showTable, setShowTable] = useState(false)
  const [hoverIndex, setHoverIndex] = useState(null)

  const width = 600
  const height = 180
  const padding = 24
  const max = Math.max(...points.map((p) => p.amount), 1)
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0
  const coords = points.map((p, i) => ({
    ...p,
    x: padding + i * stepX,
    y: height - padding - (p.amount / max) * (height - padding * 2),
  }))
  const pathD = buildSmoothPath(coords)
  const peakIndex = coords.reduce(
    (best, c, i) => (c.amount > coords[best].amount ? i : best),
    0
  )

  return (
    <div className="border border-slate-200 bg-white px-6 py-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-900">{title}</h2>
        {points.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTable((prev) => !prev)}
            className="text-xs font-medium text-brand-accent hover:underline"
          >
            {showTable ? 'View chart' : 'View table'}
          </button>
        )}
      </div>

      {points.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No billing activity yet</p>
      ) : showTable ? (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2 font-medium">Month</th>
              <th className="pb-2 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.label} className="border-t border-slate-100">
                <td className="py-1.5 text-slate-700">{p.label}</td>
                <td className="py-1.5 text-right font-medium text-slate-900">{formatKsh(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative mt-4">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" preserveAspectRatio="none">
            {[0.25, 0.5, 0.75, 1].map((fraction) => (
              <line
                key={fraction}
                x1={padding}
                x2={width - padding}
                y1={height - padding - fraction * (height - padding * 2)}
                y2={height - padding - fraction * (height - padding * 2)}
                stroke="#e1e0d9"
                strokeWidth="1"
              />
            ))}
            <path d={pathD} fill="none" stroke="#5b65dc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {coords.map((c, i) => (
              <g key={c.label}>
                <circle cx={c.x} cy={c.y} r={i === hoverIndex ? 6 : 4} fill="#5b65dc" stroke="#fff" strokeWidth="2" />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={12}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${c.label}: ${formatKsh(c.amount)}`}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onFocus={() => setHoverIndex(i)}
                  onBlur={() => setHoverIndex(null)}
                >
                  <title>{`${c.label}: ${formatKsh(c.amount)}`}</title>
                </circle>
              </g>
            ))}
          </svg>
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            {points.map((p) => (
              <span key={p.label}>{p.label}</span>
            ))}
          </div>
          {peakIndex !== hoverIndex && (
            <div
              className="pointer-events-none absolute text-xs font-medium whitespace-nowrap text-slate-700"
              style={{
                left: `${(coords[peakIndex].x / width) * 100}%`,
                top: `${(coords[peakIndex].y / height) * 100}%`,
                transform: 'translate(-50%, -150%)',
              }}
            >
              {formatKsh(coords[peakIndex].amount)}
            </div>
          )}
          {hoverIndex !== null && hoverIndex !== peakIndex && (
            <div
              className="pointer-events-none absolute rounded bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white"
              style={{
                left: `${(coords[hoverIndex].x / width) * 100}%`,
                top: `${(coords[hoverIndex].y / height) * 100}%`,
                transform: 'translate(-50%, -130%)',
              }}
            >
              {coords[hoverIndex].label}: {formatKsh(coords[hoverIndex].amount)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
