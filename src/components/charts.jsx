import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { formatKsh } from '../lib/currency'

export function DonutChart({ title, segments, emptyMessage, centerLabel = 'Total' }) {
  const activeSegments = segments.filter((segment) => segment.count > 0)
  const total = activeSegments.reduce((sum, segment) => sum + segment.count, 0)

  return (
    <div className="border border-slate-200 bg-white px-6 py-5">
      <h2 className="text-sm font-medium text-slate-900">{title}</h2>
      {total === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative h-45 w-45 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeSegments}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={53}
                  outerRadius={79}
                  paddingAngle={activeSegments.length > 1 ? 3 : 0}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {activeSegments.map((segment) => (
                    <Cell key={segment.label} fill={segment.hex} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
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

function RevenueTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white">
      {point.label}: {formatKsh(point.amount)}
    </div>
  )
}

export function RevenueChart({ title = 'Revenue by month', points }) {
  const [showTable, setShowTable] = useState(false)

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
        <div className="mt-4 h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 12 }}>
              <CartesianGrid vertical={false} stroke="#e1e0d9" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis hide domain={[0, (max) => max * 1.15]} />
              <Tooltip content={<RevenueTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#5b65dc"
                strokeWidth={2}
                dot={{ r: 4, fill: '#5b65dc', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#5b65dc', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
