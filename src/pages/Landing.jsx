import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Baby,
  CheckCircle2,
  Clock,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Smile,
  Stethoscope,
  Users,
  Venus,
} from 'lucide-react'
import { createAppointment } from '../lib/api'
import { specialties } from '../data/specialties'
import { countDigits } from '../lib/validators'

const specialtyDetails = [
  { name: 'General Practitioner', icon: Stethoscope, description: 'Everyday checkups, referrals, and ongoing care.' },
  { name: 'Cardiologist', icon: HeartPulse, description: 'Heart health screening and treatment.' },
  { name: 'Gynecologist', icon: Venus, description: "Women's health and reproductive care." },
  { name: 'Dentist', icon: Smile, description: 'Oral health, cleanings, and dental procedures.' },
  { name: 'Endocrinologist', icon: Activity, description: 'Hormonal and metabolic condition management.' },
  { name: 'Pediatrician', icon: Baby, description: 'Care for infants, children, and teens.' },
]

const features = [
  { icon: Clock, title: '24/7 Emergency Care', description: 'Our emergency team is on call around the clock.' },
  { icon: ShieldCheck, title: 'Certified Specialists', description: 'Licensed, experienced doctors across every department.' },
  { icon: Users, title: 'Patient-First Approach', description: 'Personalized care plans built around you.' },
]

const bookingChecklist = [
  'No paperwork at the front desk',
  'Choose the specialist you need',
  'Get confirmation from our reception team',
]

function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-brand-navy" aria-hidden="true">
      <img src="/bg3.jpg" alt="" className="h-full w-full object-cover opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/80 via-brand-navy/60 to-brand-navy/90" />
    </div>
  )
}

const emptyBookingForm = {
  name: '',
  contact: '',
  age: '',
  gender: 'Male',
  date: '',
  time: '',
  specialty: specialties[0],
}

const fieldClass =
  'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent'
const labelClass = 'text-sm font-medium text-slate-700'

function AppointmentBookingForm() {
  const [form, setForm] = useState(emptyBookingForm)
  const [contactError, setContactError] = useState('')
  const [status, setStatus] = useState('idle')
  const [submittedName, setSubmittedName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'contact') setContactError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (countDigits(form.contact) > 10) {
      setContactError('Phone number cannot be more than 10 digits')
      return
    }
    setStatus('submitting')
    try {
      await createAppointment({
        name: form.name,
        date: form.date,
        time: form.time,
        number: form.contact,
        gender: form.gender,
        age: Number(form.age),
        specialty: form.specialty,
      })
      setSubmittedName(form.name)
      setForm(emptyBookingForm)
      setStatus('success')
    } catch (err) {
      console.error('Failed to book appointment:', err)
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-brand-accent" />
        <h3 className="mt-4 text-lg font-semibold text-slate-900">Appointment requested</h3>
        <p className="mt-2 text-sm text-slate-600">
          Thanks, {submittedName}. Our reception team will confirm your appointment shortly.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-sm font-medium text-brand-accent hover:text-brand-accent-dark"
        >
          Book another appointment
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded bg-white p-6 sm:p-8 space-y-4">
      <div>
        <label className={labelClass}>Full name</label>
        <input required name="name" value={form.name} onChange={handleChange} className={fieldClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Contact</label>
          <input required name="contact" value={form.contact} onChange={handleChange} className={fieldClass} />
          {contactError && <p className="mt-1 text-xs text-red-600">{contactError}</p>}
        </div>
        <div>
          <label className={labelClass}>Age</label>
          <input required type="number" min="0" name="age" value={form.age} onChange={handleChange} className={fieldClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} className={fieldClass}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Specialty</label>
          <select name="specialty" value={form.specialty} onChange={handleChange} className={fieldClass}>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Date</label>
          <input required type="date" name="date" value={form.date} onChange={handleChange} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Time</label>
          <input required type="time" name="time" value={form.time} onChange={handleChange} className={fieldClass} />
        </div>
      </div>
      {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded bg-brand-accent py-2.5 text-sm font-medium text-white hover:bg-brand-accent-dark disabled:opacity-60"
      >
        {status === 'submitting' ? 'Booking…' : 'Request appointment'}
      </button>
    </form>
  )
}

export default function Landing() {
  return (
    <div>
      <header className="sticky top-0 z-10 bg-brand-navy">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
          <span className="text-lg font-bold text-white">Meridian Hospital</span>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#specialties" className="hover:text-white transition-colors">
              Specialties
            </a>
            <a href="#book-appointment" className="hover:text-white transition-colors">
              Book Appointment
            </a>
          </nav>
          <Link
            to="/login"
            className="rounded bg-brand-accent text-white text-sm font-medium px-6 py-2 transition-colors hover:bg-brand-accent-dark"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="relative min-h-screen flex items-center">
        <HeroBackground />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold uppercase tracking-tight text-white leading-tight">
            Meridian Hospital
          </h1>
          <p className="mt-5 text-2xl md:text-3xl font-semibold text-brand-lavender">
            You're welcome here, whenever you need us.
          </p>
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-slate-200 max-w-2xl mx-auto">
            From your first visit to your ongoing care, our doctors, nurses, and specialists
            are here for you and your loved ones, day or night, with the warmth of a team that
            knows your name.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#book-appointment"
              className="inline-block rounded bg-brand-accent text-white px-8 py-3 text-base font-medium transition-colors hover:bg-brand-accent-dark"
            >
              Book an appointment
            </a>
            <Link
              to="/login"
              className="inline-block rounded border border-white/30 text-white px-8 py-3 text-base font-medium transition-colors hover:bg-white/10"
            >
              Staff sign in
            </Link>
          </div>
        </div>
      </section>

      <section id="book-appointment" className="bg-brand-sky py-20">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-brand-accent">Book a visit</p>
            <h2 className="mt-2 text-lg md:text-xl font-bold text-slate-900">
              Book your appointment in minutes
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Tell us a bit about yourself and pick a specialty. Our reception team will confirm your slot.
            </p>
            <ul className="mt-6 space-y-3">
              {bookingChecklist.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <img
              src="/bg2.jpg"
              alt="Illustration of a family and a stethoscope"
              className="mt-8 hidden lg:block rounded-lg w-full max-w-md object-cover"
            />
          </div>
          <AppointmentBookingForm />
        </div>
      </section>

      <section id="specialties" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-brand-accent">What we treat</p>
            <h2 className="mt-2 text-lg md:text-xl font-bold text-slate-900">Our specialties</h2>
            <p className="mt-4 text-slate-600">Every specialty below is available to book above.</p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialtyDetails.map(({ name, icon: Icon, description }) => (
              <div
                key={name}
                className="rounded border border-slate-200 p-6 transition-colors hover:border-brand-accent"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded bg-brand-lavender">
                  <Icon className="h-5 w-5 text-brand-accent" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{name}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-sky py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-brand-accent">Why Meridian</p>
            <h2 className="mt-2 text-lg md:text-xl font-bold text-slate-900">Care built around you</h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white">
                  <Icon className="h-6 w-6 text-brand-accent" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <img src="/bg6.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-brand-navy/80" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready when you are</h2>
          <p className="mt-4 text-slate-200">Book your visit today and our team will take it from there.</p>
          <a
            href="#book-appointment"
            className="inline-block mt-8 rounded bg-brand-accent text-white px-8 py-3 text-base font-medium transition-colors hover:bg-brand-accent-dark"
          >
            Book an appointment
          </a>
        </div>
      </section>

      <footer className="bg-brand-navy border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-brand-accent" />
              <span className="text-base font-bold text-white">Meridian Hospital</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              A full-service hospital system connecting patients, doctors, nurses and
              administrators under one platform.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#specialties" className="text-slate-300 hover:text-white transition-colors">
                  Specialties
                </a>
              </li>
              <li>
                <a href="#book-appointment" className="text-slate-300 hover:text-white transition-colors">
                  Book Appointment
                </a>
              </li>
              <li>
                <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-brand-accent" />
                <span>Kimathi Street, Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-brand-accent" />
                <span>+254 700 123 456</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-brand-accent" />
                <span>info@meridianhospital.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-slate-400 text-center">
            © {new Date().getFullYear()} Meridian Hospital System
          </div>
        </div>
      </footer>
    </div>
  )
}
