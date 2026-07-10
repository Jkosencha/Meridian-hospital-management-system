import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
  import NurseDashboard from './pages/nurse.dashboard.jsx'

const features = [
  {
    title: 'Real-time patient visibility',
    description: 'Track admissions, triage status, and care updates without switching between systems.',
  },
  {
    title: 'Secure collaboration',
    description: 'Keep doctors, nurses, receptionists, and pharmacy teams aligned around one source of truth.',
  },
  {
    title: 'Faster operations',
    description: 'Reduce delays with a straightforward flow for appointments, diagnostics, and discharge planning.',
  },
]

const quickLinks = [
  { label: 'Doctor Dashboard', path: '/doctor' },
  { label: 'Nurse Dashboard', path: '/nurse' },
  { label: 'Reception Desk', path: '/receptionist' },
  { label: 'Pharmacy', path: '/pharmacy' },
  { label: 'Admin Center', path: '/admin' },
]

function Landing() {
  return (
    <div className="min-h-screen bg-sky-50 text-slate-800">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white shadow-sm">
            MH
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Meridian Hospital</p>
            <p className="text-sm text-slate-500">Management System</p>
          </div>
        </div>

        <Link
          to="/login"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          Staff Login
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-4 lg:px-8">
        <section className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-[1.2fr_0.8fr] md:p-10">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
              Simple tools for better care
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              Care coordination made simple for every hospital team.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              Meridian helps staff manage patients, triage tasks, and daily operations in one calm and organized dashboard.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Access Portal
              </Link>
              <Link
                to="/doctor"
                className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                View Dashboards
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-emerald-50 p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Today at a glance
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Patients in triage</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">18</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Appointments confirmed</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">42</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">
                Built for every role
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Choose the workspace that fits your team.
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function Login() {
  return <div className="p-10 text-xl text-slate-600">Login page, coming soon</div>
}

function DoctorDashboard() {
  return <div className="p-10 text-xl text-slate-600">Doctor dashboard, coming soon</div>
}

function Placeholder({ label }) {
  return <div className="p-10 text-xl text-slate-600">{label} dashboard, coming soon</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/receptionist" element={<Placeholder label="Receptionist" />} />
        <Route path="/nurse" element={<NurseDashboard />} />
        <Route path="/pharmacy" element={<Placeholder label="Pharmacy" />} />
        <Route path="/admin" element={<Placeholder label="Admin" />} />
      </Routes>
    </BrowserRouter>
  )
}