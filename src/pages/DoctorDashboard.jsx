import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useAuth } from '../context/useAuth'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import { statusOptions } from '../data/appointments'
import { getAppointments, updateAppointment, createPrescription, deletePrescription } from '../lib/api'
import { usePolling } from '../lib/usePolling'
import { useTabParam } from '../lib/useTabParam'
import StatCard from '../components/StatCard'

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
    columnHelper.accessor('id', { header: 'ID', enableSorting: false }),
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
  const [tab, setTab] = useTabParam('overview')
  const [appointments, setAppointments] = useState([])
  const [loadError, setLoadError] = useState('')
  const [viewingAppointment, setViewingAppointment] = useState(null)
  const [prescribingAppointment, setPrescribingAppointment] = useState(null)
  const [prescriptionForm, setPrescriptionForm] = useState(emptyPrescription)
  const [prescriptionError, setPrescriptionError] = useState('')
  const [deletingPrescriptionId, setDeletingPrescriptionId] = useState(null)
  const [prescriptionListError, setPrescriptionListError] = useState('')

  function loadData() {
    return getAppointments()
      .then(setAppointments)
      .catch(() => setLoadError('Could not load data from the server.'))
  }

  useEffect(() => {
    loadData()
  }, [])

  usePolling(loadData)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  async function handleStatusChange(id, status) {
    try {
      const updated = await updateAppointment(id, { status })
      setAppointments((prev) => prev.map((appt) => (appt.id === id ? updated : appt)))
    } catch (err) {
      setLoadError(err.message || 'Could not update status. Please try again.')
    }
  }

  function openPrescribe(appointment) {
    setPrescriptionForm(emptyPrescription)
    setPrescriptionError('')
    setPrescribingAppointment(appointment)
  }

  async function handlePrescriptionSubmit(e) {
    e.preventDefault()
    try {
      const created = await createPrescription({
        appointmentId: prescribingAppointment.id,
        ...prescriptionForm,
      })
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === prescribingAppointment.id
            ? {
                ...appt,
                prescriptions: [
                  ...appt.prescriptions,
                  {
                    id: created.id,
                    diagnosis: created.diagnosis,
                    notes: created.notes,
                    prescription: created.prescription,
                    status: created.status,
                  },
                ],
              }
            : appt
        )
      )
      setPrescribingAppointment(null)
    } catch (err) {
      setPrescriptionError(err.message || 'Could not save prescription. Please try again.')
    }
  }

  async function handleDeletePrescription(appointmentId, prescriptionId) {
    try {
      await deletePrescription(prescriptionId)
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointmentId
            ? { ...appt, prescriptions: appt.prescriptions.filter((p) => p.id !== prescriptionId) }
            : appt
        )
      )
      setViewingAppointment((prev) =>
        prev && prev.id === appointmentId
          ? { ...prev, prescriptions: prev.prescriptions.filter((p) => p.id !== prescriptionId) }
          : prev
      )
      setDeletingPrescriptionId(null)
    } catch (err) {
      setPrescriptionListError(err.message || 'Could not delete prescription. Please try again.')
    }
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
    <div className="min-h-screen flex bg-brand-sky">
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
              <StatCard label="Today's appointments" value={appointments.length} />
              <StatCard label="Pending" value={pendingCount} />
            </div>

            <div className="mt-8 border border-slate-200 bg-white overflow-hidden">
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
            <div className="mt-6 border border-slate-200 bg-white overflow-hidden">
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
        onClose={() => {
          setViewingAppointment(null)
          setDeletingPrescriptionId(null)
          setPrescriptionListError('')
        }}
        title={viewingAppointment ? `${viewingAppointment.name}: Triage details` : ''}
        maxWidthClass="max-w-3xl"
      >
        {viewingAppointment && (
          <div className="divide-y divide-slate-200 text-base">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pb-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">ID</p>
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
                    <p className="text-xs text-slate-500">Triage notes</p>
                    <p className="text-slate-900">{viewingAppointment.triage.notes}</p>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-500">No triage recorded yet.</p>
              )}
            </div>

            {viewingAppointment.prescriptions.length > 0 && (
              <div className="pt-5">
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Prescriptions</p>
                {prescriptionListError && (
                  <p className="mt-2 text-sm text-red-600">{prescriptionListError}</p>
                )}
                <ul className="mt-2 space-y-3">
                  {viewingAppointment.prescriptions.map((p) => (
                    <li key={p.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-slate-900 font-medium">{p.diagnosis}</p>
                        <p className="text-slate-700">{p.notes}</p>
                        <p className="text-slate-700 italic">{p.prescription}</p>
                      </div>
                      {deletingPrescriptionId === p.id ? (
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            onClick={() => setDeletingPrescriptionId(null)}
                            className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeletePrescription(viewingAppointment.id, p.id)}
                            className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Confirm
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingPrescriptionId(p.id)}
                          className="shrink-0 rounded border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
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
          {prescriptionError && <p className="text-sm text-red-600">{prescriptionError}</p>}
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
