export default function StatCard({ label, value }) {
  return (
    <div className="border border-slate-200 bg-white px-6 py-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
