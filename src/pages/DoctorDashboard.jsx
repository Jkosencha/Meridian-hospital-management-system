import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import { initialAppointments, statusOptions } from '../data/appointments'

const navItems = [
  { key: 'overview', label: 'Overview' },
  { key: 'appointments', label: 'Appointments' },
]

const statusTextColor = {
  Pending: 'text-amber-700',
  Completed: 'text-green-700',
  Cancelled: 'text-slate-500',
}

function StatusSelect({ appointment, onChange }) {
  return (
    <select
      value={appointment.status}
      onChange={(e) => onChange(appointment.id, e.target.value)}
      className={`rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium outline-none focus:border-brand-accent ${statusTextColor[appointment.status]}`}
    >
      {statusOptions.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

const columnHelper = createColumnHelper()

function buildAppointmentColumns({ onStatusChange, onView, onPrescribe }) {
  return [
    columnHelper.accessor('name', { header: 'Name', meta: { className: 'text-slate-900 font-medium' } }),
    columnHelper.accessor('date', { header: 'Date' }),
    columnHelper.accessor('time', { header: 'Time' }),
    columnHelper.accessor('id', { header: 'National ID', enableSorting: false }),
    columnHelper.accessor('number', { header: 'Contact', enableSorting: false }),
    columnHelper.accessor('gender', { header: 'Gender' }),
    columnHelper.accessor('age', { header: 'Age' }),
    columnHelper.accessor('specialty', { header: 'Specialty' }),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusSelect appointment={row.original} onChange={onStatusChange} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 items-stretch">
          <button
            onClick={() => onView(row.original)}
            className="rounded border border-brand-accent text-brand-accent px-2.5 py-1 font-medium hover:bg-brand-lavender"
          >
            View
          </button>
          <button
            onClick={() => onPrescribe(row.original)}
            className="rounded bg-brand-accent text-white px-2.5 py-1 font-medium hover:bg-brand-accent-dark"
          >
            Prescribe
          </button>
        </div>
      ),
    }),
  ]
}

const emptyPrescription = { diagnosis: '', notes: '', prescription: '' }

export default function DoctorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [appointments, setAppointments] = useState(initialAppointments)
  const [viewingAppointment, setViewingAppointment] = useState(null)
  const [prescribingAppointment, setPrescribingAppointment] = useState(null)
  const [prescriptionForm, setPrescriptionForm] = useState(emptyPrescription)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleStatusChange(id, status) {
    setAppointments((prev) => prev.map((appt) => (appt.id === id ? { ...appt, status } : appt)))
  }

  function openPrescribe(appointment) {
    setPrescriptionForm(emptyPrescription)
    setPrescribingAppointment(appointment)
  }

  function handlePrescriptionSubmit(e) {
    e.preventDefault()
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === prescribingAppointment.id
          ? { ...appt, prescriptions: [...appt.prescriptions, prescriptionForm] }
          : appt
      )
    )
    setPrescribingAppointment(null)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const pendingCount = appointments.filter((appt) => appt.status === 'Pending').length

  const appointmentColumns = buildAppointmentColumns({
    onStatusChange: handleStatusChange,
    onView: setViewingAppointment,
    onPrescribe: openPrescribe,
  })

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
        {tab === 'overview' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900">Overview</h1>
            <p className="text-sm text-slate-500 mt-0.5">{today}</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="border border-slate-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Today's appointments</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{appointments.length}</p>
              </div>
              <div className="border border-slate-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{pendingCount}</p>
              </div>
            </div>

            <div className="mt-8 border border-slate-200 bg-blue-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200">
                <h2 className="text-sm font-medium text-slate-900">Next up</h2>
              </div>
              <DataTable
                columns={appointmentColumns}
                data={appointments.slice(0, 3)}
                emptyMessage="No appointments today"
              />
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
        title={viewingAppointment ? `${viewingAppointment.name}: Triage details` : ''}
        maxWidthClass="max-w-3xl"
      >
        {viewingAppointment && (
          <div className="divide-y divide-slate-200 text-base">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pb-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">National ID</p>
                <p className="mt-1 text-slate-900">{viewingAppointment.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Specialty</p>
                <p className="mt-1 text-slate-900">{viewingAppointment.specialty}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Age / Gender</p>
                <p className="mt-1 text-slate-900">
                  {viewingAppointment.age} / {viewingAppointment.gender}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Date &amp; time</p>
                <p className="mt-1 text-slate-900">
                  {viewingAppointment.date}, {viewingAppointment.time}
                </p>
              </div>
            </div>

            <div className="py-5">
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Contact</p>
              <p className="mt-1 text-slate-900">{viewingAppointment.number}</p>
            </div>

            <div className="py-5">
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Vitals</p>
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
                <p className="text-xs text-slate-500">Triage notes</p>
                <p className="text-slate-900">{viewingAppointment.triage.notes}</p>
              </div>
            </div>

            {viewingAppointment.prescriptions.length > 0 && (
              <div className="pt-5">
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Prescriptions</p>
                <ul className="mt-2 space-y-3">
                  {viewingAppointment.prescriptions.map((p, i) => (
                    <li key={i}>
                      <p className="text-slate-900 font-medium">{p.diagnosis}</p>
                      <p className="text-slate-700">{p.notes}</p>
                      <p className="text-slate-700 italic">{p.prescription}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!prescribingAppointment}
        onClose={() => setPrescribingAppointment(null)}
        title={prescribingAppointment ? `Add prescription for ${prescribingAppointment.name}` : ''}
      >
        <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Diagnosis</label>
            <textarea
              required
              rows={2}
              value={prescriptionForm.diagnosis}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              required
              rows={2}
              value={prescriptionForm.notes}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Prescription</label>
            <textarea
              required
              rows={2}
              value={prescriptionForm.prescription}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, prescription: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-brand-accent py-2.5 text-sm font-medium text-white hover:bg-brand-accent-dark"
          >
            Save prescription
          </button>
        </form>
      </Modal>
    </div>
  )
}
