import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import { getPrescriptions, updatePrescription } from '../lib/api'

const navItems = [
  { key: 'overview', label: 'Overview' },
  { key: 'prescriptions', label: 'Prescriptions' },
]

const statusTextColor = {
  Pending: 'text-amber-700',
  Dispensed: 'text-green-700',
}

const columnHelper = createColumnHelper()

function buildPrescriptionColumns({ onView, onDispense }) {
  return [
    columnHelper.accessor('name', { header: 'Patient', meta: { className: 'text-slate-900 font-medium' } }),
    columnHelper.accessor('date', { header: 'Date' }),
    columnHelper.accessor('specialty', { header: 'Specialty' }),
    columnHelper.accessor('diagnosis', { header: 'Diagnosis' }),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`font-medium ${statusTextColor[row.original.status]}`}>{row.original.status}</span>
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
          {row.original.status === 'Pending' && (
            <button
              onClick={() => onDispense(row.original)}
              className="rounded bg-brand-accent text-white px-2.5 py-1 font-medium hover:bg-brand-accent-dark"
            >
              Mark dispensed
            </button>
          )}
        </div>
      ),
    }),
  ]
}

export default function PharmacyDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  const [prescriptions, setPrescriptions] = useState([])
  const [loadError, setLoadError] = useState('')
  const [viewingPrescription, setViewingPrescription] = useState(null)

  useEffect(() => {
    getPrescriptions()
      .then(setPrescriptions)
      .catch(() => setLoadError('Could not load data from the server.'))
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  async function handleDispense(prescription) {
    try {
      const updated = await updatePrescription(prescription.id, { status: 'Dispensed' })
      setPrescriptions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err) {
      setLoadError(err.message || 'Could not update prescription. Please try again.')
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const pendingCount = prescriptions.filter((p) => p.status === 'Pending').length

  const prescriptionColumns = buildPrescriptionColumns({
    onView: setViewingPrescription,
    onDispense: handleDispense,
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
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total prescriptions</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{prescriptions.length}</p>
              </div>
              <div className="border border-slate-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Awaiting dispense</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{pendingCount}</p>
              </div>
            </div>
          </>
        )}

        {tab === 'prescriptions' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900">Prescriptions</h1>
            <p className="text-sm text-slate-500 mt-0.5">{today}</p>
            <div className="mt-6 border border-slate-200 bg-blue-200 overflow-hidden">
              <DataTable
                columns={prescriptionColumns}
                data={prescriptions}
                emptyMessage="No prescriptions yet"
                searchable
                searchPlaceholder="Search prescriptions..."
              />
            </div>
          </>
        )}
      </main>

      <Modal
        open={!!viewingPrescription}
        onClose={() => setViewingPrescription(null)}
        title={viewingPrescription ? `${viewingPrescription.name}: Prescription details` : ''}
      >
        {viewingPrescription && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Date</p>
                <p className="mt-1 text-slate-900">{viewingPrescription.date}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Specialty</p>
                <p className="mt-1 text-slate-900">{viewingPrescription.specialty}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Diagnosis</p>
              <p className="mt-1 text-slate-900">{viewingPrescription.diagnosis}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Notes</p>
              <p className="mt-1 text-slate-900">{viewingPrescription.notes}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Prescription</p>
              <p className="mt-1 text-slate-900">{viewingPrescription.prescription}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Status</p>
              <p className={`mt-1 font-medium ${statusTextColor[viewingPrescription.status]}`}>
                {viewingPrescription.status}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}