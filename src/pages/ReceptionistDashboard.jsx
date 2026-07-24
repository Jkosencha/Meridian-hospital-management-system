import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import {
  getPatients,
  createPatient,
  updatePatient,
  getAppointments,
  createAppointment,
  updateAppointment,
} from '../lib/api'
import { specialties } from '../data/specialties'
import { countDigits } from '../lib/validators'

const navItems = [
  { key: 'overview', label: 'Overview' },
  { key: 'patients', label: 'Patients' },
  { key: 'appointments', label: 'Book Appointments' },
]

const emptyPatientForm = { name: '', date: '', gender: 'Male', contact: '', age: '' }
const emptyAppointmentForm = {
  name: '',
  date: '',
  time: '',
  number: '',
  gender: 'female',
  age: '',
  specialty: specialties[0],
}

const columnHelper = createColumnHelper()

function buildPatientColumns({ onView, onEdit }) {
  return [
    columnHelper.accessor('name', { header: 'Name', meta: { className: 'text-slate-900 font-medium' } }),
    columnHelper.accessor('date', { header: 'Date' }),
    columnHelper.accessor('id', { header: 'ID', enableSorting: false }),
    columnHelper.accessor('gender', { header: 'Gender' }),
    columnHelper.accessor('contact', { header: 'Contact', enableSorting: false }),
    columnHelper.accessor('age', { header: 'Age' }),
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
            onClick={() => onEdit(row.original)}
            className="rounded bg-brand-accent text-white px-2.5 py-1 font-medium hover:bg-brand-accent-dark"
          >
            Edit
          </button>
        </div>
      ),
    }),
  ]
}

const statusTextColor = {
  Pending: 'text-amber-700',
  Completed: 'text-green-700',
  Cancelled: 'text-slate-500',
}

function buildAppointmentColumns({ onView, onEdit }) {
  return [
    columnHelper.accessor('name', { header: 'Name', meta: { className: 'text-slate-900 font-medium' } }),
    columnHelper.accessor('date', { header: 'Date' }),
    columnHelper.accessor('time', { header: 'Time' }),
    columnHelper.accessor('number', { header: 'Contact', enableSorting: false }),
    columnHelper.accessor('gender', { header: 'Gender' }),
    columnHelper.accessor('age', { header: 'Age' }),
    columnHelper.accessor('specialty', { header: 'Specialty' }),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`font-medium ${statusTextColor[row.original.status]}`}>
          {row.original.status}
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
            onClick={() => onEdit(row.original)}
            className="rounded bg-brand-accent text-white px-2.5 py-1 font-medium hover:bg-brand-accent-dark"
          >
            Edit
          </button>
        </div>
      ),
    }),
  ]
}

export default function ReceptionistDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loadError, setLoadError] = useState('')

  const [viewingPatient, setViewingPatient] = useState(null)
  const [viewingAppointment, setViewingAppointment] = useState(null)

  const [patientModalOpen, setPatientModalOpen] = useState(false)
  const [editingPatientId, setEditingPatientId] = useState(null)
  const [patientForm, setPatientForm] = useState(emptyPatientForm)
  const [patientContactError, setPatientContactError] = useState('')

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [editingAppointmentId, setEditingAppointmentId] = useState(null)
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointmentForm)
  const [appointmentContactError, setAppointmentContactError] = useState('')

  useEffect(() => {
    Promise.all([getPatients(), getAppointments()])
      .then(([patientData, appointmentData]) => {
        setPatients(patientData)
        setAppointments(appointmentData)
      })
      .catch(() => setLoadError('Could not load data from the server.'))
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function openAddPatient() {
    setEditingPatientId(null)
    setPatientForm(emptyPatientForm)
    setPatientContactError('')
    setPatientModalOpen(true)
  }

  function openEditPatient(patient) {
    setEditingPatientId(patient.id)
    setPatientForm({
      name: patient.name,
      date: patient.date,
      gender: patient.gender,
      contact: patient.contact,
      age: patient.age,
    })
    setPatientContactError('')
    setPatientModalOpen(true)
  }

  function handlePatientFormChange(e) {
    const { name, value } = e.target
    setPatientForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'contact') setPatientContactError('')
  }

  async function savePatient(e) {
    e.preventDefault()
    if (countDigits(patientForm.contact) > 10) {
      setPatientContactError('Phone number cannot be more than 10 digits')
      return
    }
    const payload = { ...patientForm, age: Number(patientForm.age) }
    try {
      if (editingPatientId) {
        const updated = await updatePatient(editingPatientId, payload)
        setPatients((prev) =>
          prev.map((patient) => (patient.id === editingPatientId ? updated : patient))
        )
      } else {
        const created = await createPatient(payload)
        setPatients((prev) => [...prev, created])
      }
      setPatientModalOpen(false)
    } catch (err) {
      setPatientContactError(err.message || 'Could not save patient. Please try again.')
    }
  }

  function openAddAppointment() {
    setEditingAppointmentId(null)
    setAppointmentForm(emptyAppointmentForm)
    setAppointmentContactError('')
    setAppointmentModalOpen(true)
  }

  function openEditAppointment(appointment) {
    setEditingAppointmentId(appointment.id)
    setAppointmentForm({
      name: appointment.name,
      date: appointment.date,
      time: appointment.time,
      number: appointment.number,
      gender: appointment.gender,
      age: appointment.age,
      specialty: appointment.specialty,
    })
    setAppointmentContactError('')
    setAppointmentModalOpen(true)
  }

  function handleAppointmentFormChange(e) {
    const { name, value } = e.target
    setAppointmentForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'number') setAppointmentContactError('')
  }

  async function saveAppointment(e) {
    e.preventDefault()
    if (countDigits(appointmentForm.number) > 10) {
      setAppointmentContactError('Phone number cannot be more than 10 digits')
      return
    }
    const payload = { ...appointmentForm, age: Number(appointmentForm.age) }
    try {
      if (editingAppointmentId) {
        const updated = await updateAppointment(editingAppointmentId, {
          ...payload,
          status: appointments.find((a) => a.id === editingAppointmentId)?.status,
        })
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === editingAppointmentId ? updated : appointment
          )
        )
      } else {
        const created = await createAppointment(payload)
        setAppointments((prev) => [...prev, created])
      }
      setAppointmentModalOpen(false)
    } catch (err) {
      setAppointmentContactError(err.message || 'Could not save appointment. Please try again.')
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const patientColumns = buildPatientColumns({ onView: setViewingPatient, onEdit: openEditPatient })
  const appointmentColumns = buildAppointmentColumns({
    onView: setViewingAppointment,
    onEdit: openEditAppointment,
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
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total patients</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{patients.length}</p>
              </div>
              <div className="border border-slate-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total appointments</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{appointments.length}</p>
              </div>
            </div>
          </>
        )}

        {tab === 'patients' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Patients</h1>
                <p className="text-sm text-slate-500 mt-0.5">{today}</p>
              </div>
              <button
                onClick={openAddPatient}
                className="rounded bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent-dark"
              >
                Add Patient
              </button>
            </div>
            <div className="mt-6 border border-slate-200 bg-blue-200 overflow-hidden">
              <DataTable
                columns={patientColumns}
                data={patients}
                emptyMessage="No patients available"
                searchable
                searchPlaceholder="Search patients..."
              />
            </div>
          </>
        )}

        {tab === 'appointments' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Book Appointments</h1>
                <p className="text-sm text-slate-500 mt-0.5">{today}</p>
              </div>
              <button
                onClick={openAddAppointment}
                className="rounded bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent-dark"
              >
                Add Appointment
              </button>
            </div>
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
        open={!!viewingPatient}
        onClose={() => setViewingPatient(null)}
        title={viewingPatient ? `${viewingPatient.name}: Patient details` : ''}
        maxWidthClass="max-w-3xl"
      >
        {viewingPatient && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-base">
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">ID</p>
              <p className="mt-1 text-slate-900">{viewingPatient.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Date</p>
              <p className="mt-1 text-slate-900">{viewingPatient.date}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Age / Gender</p>
              <p className="mt-1 text-slate-900">
                {viewingPatient.age} / {viewingPatient.gender}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Contact</p>
              <p className="mt-1 text-slate-900">{viewingPatient.contact || 'N/A'}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        title={viewingAppointment ? `${viewingAppointment.name}: Appointment details` : ''}
        maxWidthClass="max-w-3xl"
      >
        {viewingAppointment && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-base">
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
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Status</p>
              <p className={`mt-1 font-medium ${statusTextColor[viewingAppointment.status]}`}>
                {viewingAppointment.status}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        title={editingPatientId ? 'Edit Patient' : 'Add Patient'}
      >
        <form onSubmit={savePatient} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <input
              required
              type="text"
              name="name"
              value={patientForm.name}
              onChange={handlePatientFormChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Registration date</label>
              <input
                required
                type="date"
                name="date"
                value={patientForm.date}
                onChange={handlePatientFormChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Age</label>
              <input
                required
                type="number"
                min="0"
                name="age"
                value={patientForm.age}
                onChange={handlePatientFormChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Gender</label>
              <select
                name="gender"
                value={patientForm.gender}
                onChange={handlePatientFormChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Contact</label>
              <input
                required
                type="text"
                name="contact"
                value={patientForm.contact}
                onChange={handlePatientFormChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              />
              {patientContactError && (
                <p className="mt-1 text-xs text-red-600">{patientContactError}</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-brand-accent py-2.5 text-sm font-medium text-white hover:bg-brand-accent-dark"
          >
            {editingPatientId ? 'Update patient' : 'Save patient'}
          </button>
        </form>
      </Modal>

      <Modal
        open={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        title={editingAppointmentId ? 'Edit Appointment' : 'Add Appointment'}
      >
        <form onSubmit={saveAppointment} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Patient name</label>
            <input
              required
              type="text"
              name="name"
              value={appointmentForm.name}
              onChange={handleAppointmentFormChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Date</label>
              <input
                required
                type="date"
                name="date"
                value={appointmentForm.date}
                onChange={handleAppointmentFormChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Time</label>
              <input
                required
                type="time"
                name="time"
                value={appointmentForm.time}
                onChange={handleAppointmentFormChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Age</label>
              <input
                required
                type="number"
                min="0"
                name="age"
                value={appointmentForm.age}
                onChange={handleAppointmentFormChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Gender</label>
              <select
                name="gender"
                value={appointmentForm.gender}
                onChange={handleAppointmentFormChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Contact</label>
            <input
              required
              type="text"
              name="number"
              value={appointmentForm.number}
              onChange={handleAppointmentFormChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
            {appointmentContactError && (
              <p className="mt-1 text-xs text-red-600">{appointmentContactError}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Specialty</label>
            <select
              name="specialty"
              value={appointmentForm.specialty}
              onChange={handleAppointmentFormChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            >
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-brand-accent py-2.5 text-sm font-medium text-white hover:bg-brand-accent-dark"
          >
            {editingAppointmentId ? 'Update appointment' : 'Save appointment'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
