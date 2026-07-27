import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import DataTable from '../components/DataTable'
import { getPatients, getAppointments, getPrescriptions } from '../lib/api'

const navItems = [
  { key: 'overview', label: 'Overview' },
  { key: 'patients', label: 'Patients' },
  { key: 'appointments', label: 'Appointments' },
]

const statusTextColor = {
  Pending: 'text-amber-700',
  Completed: 'text-green-700',
  Cancelled: 'text-slate-500',
  Dispensed: 'text-green-700',
}

const patientColumnHelper = createColumnHelper()
const patientColumns = [
  patientColumnHelper.accessor('name', { header: 'Name', meta: { className: 'text-slate-900 font-medium' } }),
  patientColumnHelper.accessor('date', { header: 'Registered' }),
  patientColumnHelper.accessor('gender', { header: 'Gender' }),
  patientColumnHelper.accessor('contact', { header: 'Contact', enableSorting: false }),
  patientColumnHelper.accessor('age', { header: 'Age' }),
]

const appointmentColumnHelper = createColumnHelper()
const appointmentColumns = [
  appointmentColumnHelper.accessor('name', { header: 'Name', meta: { className: 'text-slate-900 font-medium' } }),
  appointmentColumnHelper.accessor('date', { header: 'Date' }),
  appointmentColumnHelper.accessor('time', { header: 'Time' }),
  appointmentColumnHelper.accessor('specialty', { header: 'Specialty' }),
  appointmentColumnHelper.display({
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span className={`font-medium ${statusTextColor[row.original.status]}`}>{row.original.status}</span>
    ),
  }),
]

function countByStatus(items) {
  return items.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1
    return counts
  }, {})
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    Promise.all([getPatients(), getAppointments(), getPrescriptions()])
      .then(([patientData, appointmentData, prescriptionData]) => {
        setPatients(patientData)
        setAppointments(appointmentData)
        setPrescriptions(prescriptionData)
      })
      .catch(() => setLoadError('Could not load data from the server.'))
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const appointmentsByStatus = countByStatus(appointments)
  const prescriptionsByStatus = countByStatus(prescriptions)

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

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="border border-slate-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total patients</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{patients.length}</p>
              </div>
              <div className="border border-slate-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total appointments</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{appointments.length}</p>
              </div>
              <div className="border border-slate-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total prescriptions</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{prescriptions.length}</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="border border-slate-200 bg-white px-6 py-5">
                <h2 className="text-sm font-medium text-slate-900">Appointments by status</h2>
                <ul className="mt-4 space-y-2 text-sm">
                  {Object.entries(appointmentsByStatus).map(([status, count]) => (
                    <li key={status} className="flex items-center justify-between">
                      <span className={`font-medium ${statusTextColor[status]}`}>{status}</span>
                      <span className="text-slate-900 font-semibold">{count}</span>
                    </li>
                  ))}
                  {appointments.length === 0 && <li className="text-slate-500">No appointments yet</li>}
                </ul>
              </div>
              <div className="border border-slate-200 bg-white px-6 py-5">
                <h2 className="text-sm font-medium text-slate-900">Prescriptions by status</h2>
                <ul className="mt-4 space-y-2 text-sm">
                  {Object.entries(prescriptionsByStatus).map(([status, count]) => (
                    <li key={status} className="flex items-center justify-between">
                      <span className={`font-medium ${statusTextColor[status]}`}>{status}</span>
                      <span className="text-slate-900 font-semibold">{count}</span>
                    </li>
                  ))}
                  {prescriptions.length === 0 && <li className="text-slate-500">No prescriptions yet</li>}
                </ul>
              </div>
            </div>
          </>
        )}

        {tab === 'patients' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900">Patients</h1>
            <p className="text-sm text-slate-500 mt-0.5">{today}</p>
            <div className="mt-6 border border-slate-200 bg-blue-200 overflow-hidden">
              <DataTable
                columns={patientColumns}
                data={patients}
                emptyMessage="No patients registered"
                searchable
                searchPlaceholder="Search patients..."
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
    </div>
  )
}
