import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import { getAppointments, saveTriage } from '../lib/api'

const navItems = [
  { key: 'overview', label: 'Overview' },
  { key: 'appointments', label: 'Appointments' },
]

const emptyTriageForm = { bloodPressure: '', temperature: '', symptoms: '', notes: '' }

const fieldClass =
  'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent'
const labelClass = 'text-sm font-medium text-slate-700'

const columnHelper = createColumnHelper()

function buildAppointmentColumns({ onView, onTriage }) {
  return [
    columnHelper.accessor('name', { header: 'Name', meta: { className: 'text-slate-900 font-medium' } }),
    columnHelper.accessor('date', { header: 'Date' }),
    columnHelper.accessor('time', { header: 'Time' }),
    columnHelper.accessor('gender', { header: 'Gender' }),
    columnHelper.accessor('age', { header: 'Age' }),
    columnHelper.accessor('specialty', { header: 'Specialty' }),
    columnHelper.display({
      id: 'triageStatus',
      header: 'Triage',
      cell: ({ row }) => (
        <span className={row.original.triage ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>
          {row.original.triage ? 'Recorded' : 'Pending'}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1.5">
          <button
            onClick={() => onView(row.original)}
            className="rounded border border-brand-accent text-brand-accent px-2.5 py-1 font-medium hover:bg-brand-lavender"
          >
            View
          </button>
          <button
            onClick={() => onTriage(row.original)}
            className="rounded bg-brand-accent text-white px-2.5 py-1 font-medium hover:bg-brand-accent-dark"
          >
            {row.original.triage ? 'Edit triage' : 'Record triage'}
          </button>
        </div>
      ),
    }),
  ]
}

export default function NurseDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  const [appointments, setAppointments] = useState([])
  const [loadError, setLoadError] = useState('')

  const [viewingAppointment, setViewingAppointment] = useState(null)
  const [triagingAppointment, setTriagingAppointment] = useState(null)
  const [triageForm, setTriageForm] = useState(emptyTriageForm)
  const [triageError, setTriageError] = useState('')

  useEffect(() => {
    getAppointments()
      .then(setAppointments)
      .catch(() => setLoadError('Could not load data from the server.'))
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function openTriage(appointment) {
    setTriagingAppointment(appointment)
    setTriageForm(
      appointment.triage
        ? { ...appointment.triage }
        : emptyTriageForm
    )
    setTriageError('')
  }

  function handleTriageFormChange(e) {
    const { name, value } = e.target
    setTriageForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleTriageSubmit(e) {
    e.preventDefault()
    try {
      const updated = await saveTriage({
        appointmentId: triagingAppointment.id,
        bloodPressure: triageForm.bloodPressure,
        temperature: triageForm.temperature,
        symptoms: triageForm.symptoms,
        notes: triageForm.notes,
      })
      setAppointments((prev) =>
        prev.map((appointment) => (appointment.id === updated.id ? updated : appointment))
      )
      setTriagingAppointment(null)
    } catch (err) {
      setTriageError(err.message || 'Could not save triage. Please try again.')
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const pendingTriageCount = appointments.filter((appt) => !appt.triage).length

  const appointmentColumns = buildAppointmentColumns({ onView: setViewingAppointment, onTriage: openTriage })

  return (
    <div className="min-h-screen flex bg-blue-300">
      <Sidebar
        navItems={navItems}
        activeKey={tab}
        onSelect={setTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-w-0 px-8 py-8">
        {loadError && (
          <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {tab === 'overview' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900">Overview</h1>
            <p className="text-sm text-slate-500 mt-0.5">{today}</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="border border-slate-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total appointments</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{appointments.length}</p>
              </div>
              <div className="border border-slate-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Awaiting triage</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{pendingTriageCount}</p>
              </div>
            </div>
          </>
        )}

        {tab === 'appointments' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900">Appointments</h1>
            <p className="text-sm text-slate-500 mt-0.5">{today}</p>
            <div className="mt-6 border border-slate-200 bg-blue-200 overflow-hidden">
              <DataTable
                columns={appointmentColumns}
                data={appointments}
                emptyMessage="No appointments booked"
                searchable
                searchPlaceholder="Search appointments..."
              />
            </div>
          </>
        )}
      </main>

      <Modal
        open={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        title={viewingAppointment ? `${viewingAppointment.name}: Appointment details` : ''}
        maxWidthClass="max-w-3xl"
      >
        {viewingAppointment && (
          <div className="divide-y divide-slate-200 text-base">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pb-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Specialty</p>
                <p className="mt-1 text-slate-900">{viewingAppointment.specialty}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Date &amp; time</p>
                <p className="mt-1 text-slate-900">
                  {viewingAppointment.date}, {viewingAppointment.time}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Age / Gender</p>
                <p className="mt-1 text-slate-900">
                  {viewingAppointment.age} / {viewingAppointment.gender}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Contact</p>
                <p className="mt-1 text-slate-900">{viewingAppointment.number}</p>
              </div>
            </div>

            <div className="pt-5">
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Vitals</p>
              {viewingAppointment.triage ? (
                <>
                  <div className="mt-2 grid grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs text-slate-500">Blood pressure</p>
                      <p className="text-slate-900">{viewingAppointment.triage.bloodPressure}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Temperature</p>
                      <p className="text-slate-900">{viewingAppointment.triage.temperature}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-slate-500">Symptoms</p>
                    <p className="text-slate-900">{viewingAppointment.triage.symptoms}</p>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-slate-500">Notes</p>
                    <p className="text-slate-900">{viewingAppointment.triage.notes}</p>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-500">No triage recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!triagingAppointment}
        onClose={() => setTriagingAppointment(null)}
        title={triagingAppointment ? `Record triage for ${triagingAppointment.name}` : ''}
      >
        <form onSubmit={handleTriageSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Blood pressure</label>
              <input
                required
                name="bloodPressure"
                placeholder="120/80"
                value={triageForm.bloodPressure}
                onChange={handleTriageFormChange}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Temperature</label>
              <input
                required
                name="temperature"
                placeholder="37.0"
                value={triageForm.temperature}
                onChange={handleTriageFormChange}
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Symptoms</label>
            <textarea
              required
              rows={2}
              name="symptoms"
              value={triageForm.symptoms}
              onChange={handleTriageFormChange}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              rows={2}
              name="notes"
              value={triageForm.notes}
              onChange={handleTriageFormChange}
              className={fieldClass}
            />
          </div>
          {triageError && <p className="text-sm text-red-600">{triageError}</p>}
          <button
            type="submit"
            className="w-full rounded bg-brand-accent py-2.5 text-sm font-medium text-white hover:bg-brand-accent-dark"
          >
            Save triage
          </button>
        </form>
      </Modal>
    </div>
  )
}