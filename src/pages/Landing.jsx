import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-blue-300 flex flex-col">
      <header className="sticky top-0 z-10 bg-brand-navy">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
          <span className="text-lg font-bold text-white">Meridian Hospital</span>
          <Link
            to="/login"
            className="rounded bg-brand-accent text-white text-sm font-medium px-6 py-2 transition-colors hover:bg-brand-accent-dark"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="flex-1 flex items-center">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
            Meridian Hospital
          </h1>
          <p className="mt-5 text-2xl md:text-3xl font-semibold text-brand-accent">
            Compassionate care, whenever you need it.
          </p>
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-slate-700 max-w-2xl mx-auto">
            Our doctors, nurses, and specialists are here around the clock for emergencies,
            specialist consultations, maternity care, surgery, and laboratory services, all under one roof.
          </p>
          <Link
            to="/login"
            className="inline-block mt-8 rounded bg-brand-accent text-white px-8 py-3 text-base font-medium transition-colors hover:bg-brand-accent-dark"
          >
            Enter the system
          </Link>
        </div>
      </section>

      <footer className="bg-brand-navy">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-slate-400 text-center">
          © {new Date().getFullYear()} Meridian Hospital System
        </div>
      </footer>
    </div>
  )
}
