import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'

const navItems = [{ key: 'patients', label: 'Patients' }]

const patients = [
  {
    id: '4763462',
    name: 'Leo Thuku',
    date: '2006-12-01',
    gender: 'Male',
    contact: '+254700000001',
    age: 20,
  },
  {
    id: '7346473',
    name: 'Daniel Brooks',
    date: '2026-07-10',
    gender: 'Male',
    contact: '+254700000002',
    age: 35,
  },
  {
    id: '3764522',
    name: 'Sarah Kim',
    date: '2026-07-10',
    gender: 'Female',
    contact: '+254700000003',
    age: 41,
  },
]

const emptyTriageForm = {
  weight: '',
  height: '',
  temperature: '',
  bloodPressure: '',
  heartRate: '',
  notes: '',
}

const columnHelper = createColumnHelper()

function buildPatientColumns({ triageRecords, onView, onTriage }) {
  return [
    columnHelper.accessor('name', { header: 'Name', meta: { className: 'text-slate-900 font-medium' } }),
    columnHelper.accessor('date', { header: 'Date' }),
    columnHelper.accessor('id', { header: 'ID', enableSorting: false }),
    columnHelper.accessor('gender', { header: 'Gender' }),
    columnHelper.accessor('contact', { header: 'Contact', enableSorting: false }),
    columnHelper.accessor('age', { header: 'Age' }),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            triageRecords[row.original.id] ? 'text-green-700' : 'text-amber-700'
          }`}
        >
          {triageRecords[row.original.id] ? 'Triaged' : 'Awaiting triage'}
        </span>
      ),
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
            onClick={() => onTriage(row.original)}
            className="rounded bg-brand-accent text-white px-2.5 py-1 font-medium hover:bg-brand-accent-dark"
          >
            Triage
          </button>
        </div>
      ),
    }),
  ]
}

export default function NurseDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('patients')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [triagePatient, setTriagePatient] = useState(null)
  const [triageRecords, setTriageRecords] = useState({})
  const [triageForm, setTriageForm] = useState(emptyTriageForm)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function openTriage(patient) {
    setTriagePatient(patient)
    setTriageForm(triageRecords[patient.id] || emptyTriageForm)
  }

  function handleTriageChange(e) {
    const { name, value } = e.target
    setTriageForm((prev) => ({ ...prev, [name]: value }))
  }

  function saveTriage(e) {
    e.preventDefault()
    setTriageRecords((prev) => ({
      ...prev,
      [triagePatient.id]: triageForm,
    }))
    setTriagePatient(null)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const patientColumns = buildPatientColumns({
    triageRecords,
    onView: setSelectedPatient,
    onTriage: openTriage,
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
        {tab === 'patients' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900">Patients</h1>
            <p className="text-sm text-slate-500 mt-0.5">{today}</p>
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
      </main>

      <Modal
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title={selectedPatient ? `${selectedPatient.name}: Patient details` : ''}
        maxWidthClass="max-w-3xl"
      >
        {selectedPatient && (
          <div className="divide-y divide-slate-200 text-base">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pb-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">ID</p>
                <p className="mt-1 text-slate-900">{selectedPatient.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Date</p>
                <p className="mt-1 text-slate-900">{selectedPatient.date}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Age / Gender</p>
                <p className="mt-1 text-slate-900">
                  {selectedPatient.age} / {selectedPatient.gender}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Contact</p>
                <p className="mt-1 text-slate-900">{selectedPatient.contact || 'N/A'}</p>
              </div>
            </div>

            <div className="py-5">
              <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Vitals</p>
              <div className="mt-2 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-slate-500">Weight</p>
                  <p className="text-slate-900">{triageRecords[selectedPatient.id]?.weight || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Height</p>
                  <p className="text-slate-900">{triageRecords[selectedPatient.id]?.height || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Temperature</p>
                  <p className="text-slate-900">{triageRecords[selectedPatient.id]?.temperature || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Blood pressure</p>
                  <p className="text-slate-900">{triageRecords[selectedPatient.id]?.bloodPressure || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Heart rate</p>
                  <p className="text-slate-900">{triageRecords[selectedPatient.id]?.heartRate || 'Not recorded'}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500">Nurse notes</p>
                <p className="text-slate-900">{triageRecords[selectedPatient.id]?.notes || 'No notes yet'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!triagePatient}
        onClose={() => setTriagePatient(null)}
        title={triagePatient ? `Triage for ${triagePatient.name}` : ''}
      >
        <form onSubmit={saveTriage} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Weight (kg)</label>
              <input
                type="text"
                name="weight"
                value={triageForm.weight}
                onChange={handleTriageChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Height (cm)</label>
              <input
                type="text"
                name="height"
                value={triageForm.height}
                onChange={handleTriageChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Temperature (°C)</label>
              <input
                type="text"
                name="temperature"
                value={triageForm.temperature}
                onChange={handleTriageChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Heart rate (bpm)</label>
              <input
                type="text"
                name="heartRate"
                value={triageForm.heartRate}
                onChange={handleTriageChange}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Blood pressure</label>
            <input
              type="text"
              name="bloodPressure"
              value={triageForm.bloodPressure}
              onChange={handleTriageChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Nurse notes</label>
            <textarea
              rows={2}
              name="notes"
              value={triageForm.notes}
              onChange={handleTriageChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
          </div>
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
