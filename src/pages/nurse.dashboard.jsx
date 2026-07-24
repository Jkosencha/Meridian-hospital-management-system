import { useState } from 'react'

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

function PatientsTable({ rows, triageRecords, onView, onTriage }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="text-left uppercase tracking-wide text-slate-500 bg-slate-100">
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">ID</th>
            <th className="px-3 py-2 font-medium">Gender</th>
            <th className="px-3 py-2 font-medium">Contact</th>
            <th className="px-3 py-2 font-medium">Age</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-3 py-6 text-center text-slate-500">
                No patients available
              </td>
            </tr>
          ) : (
            rows.map((patient) => (
              <tr key={patient.id} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-900">{patient.name}</td>
                <td className="px-3 py-2 text-slate-600">{patient.date}</td>
                <td className="px-3 py-2 text-slate-600">{patient.id}</td>
                <td className="px-3 py-2 text-slate-600">{patient.gender}</td>
                <td className="px-3 py-2 text-slate-600">{patient.contact}</td>
                <td className="px-3 py-2 text-slate-600">{patient.age}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 text-xs font-medium ${triageRecords[patient.id] ? 'text-green-700' : 'text-amber-700'}`}>
                    {triageRecords[patient.id] ? 'Triaged' : 'Awaiting triage'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onView(patient)}
                      className="rounded border border-slate-300 px-2 py-1 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onTriage(patient)}
                      className="rounded bg-sky-600 px-2 py-1 text-sm font-medium text-white hover:bg-sky-700"
                    >
                      Triage
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function NurseDashboard() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [triagePatient, setTriagePatient] = useState(null)
  const [triageRecords, setTriageRecords] = useState({})
  const [triageForm, setTriageForm] = useState(emptyTriageForm)

  const handleView = (patient) => setSelectedPatient(patient)

  const handleTriage = (patient) => {
    setTriagePatient(patient)
    setTriageForm(triageRecords[patient.id] || emptyTriageForm)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setTriageForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    if (!triagePatient) return
    setTriageRecords((prev) => ({ ...prev, [triagePatient.id]: triageForm }))
    setTriagePatient(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Nurse Dashboard</h1>
              <p className="text-sm text-slate-600">Manage patient triage and review vital notes.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-slate-500">
              <span>{Object.keys(triageRecords).length} triaged</span>
              <span className="hidden sm:inline">•</span>
              <span>{patients.length} patients</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <PatientsTable rows={patients} triageRecords={triageRecords} onView={handleView} onTriage={handleTriage} />
        </div>

        {triagePatient && (
          <Modal title={`Triage: ${triagePatient.name}`} onClose={() => setTriagePatient(null)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Weight (kg)</span>
                <input
                  type="text"
                  name="weight"
                  value={triageForm.weight}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Height (cm)</span>
                <input
                  type="text"
                  name="height"
                  value={triageForm.height}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Temperature (°C)</span>
                <input
                  type="text"
                  name="temperature"
                  value={triageForm.temperature}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Blood Pressure</span>
                <input
                  type="text"
                  name="bloodPressure"
                  value={triageForm.bloodPressure}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Heart Rate</span>
                <input
                  type="text"
                  name="heartRate"
                  value={triageForm.heartRate}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="sm:col-span-2 block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</span>
                <textarea
                  name="notes"
                  value={triageForm.notes}
                  onChange={handleChange}
                  rows="4"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Save Triage
              </button>
            </div>
          </Modal>
        )}

        {selectedPatient && (
          <Modal title={`Patient: ${selectedPatient.name}`} onClose={() => setSelectedPatient(null)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">ID: <span className="font-medium text-slate-900">{selectedPatient.id}</span></p>
                <p className="text-sm text-slate-600">Date: <span className="font-medium text-slate-900">{selectedPatient.date}</span></p>
                <p className="text-sm text-slate-600">Gender: <span className="font-medium text-slate-900">{selectedPatient.gender}</span></p>
                <p className="text-sm text-slate-600">Contact: <span className="font-medium text-slate-900">{selectedPatient.contact}</span></p>
                <p className="text-sm text-slate-600">Age: <span className="font-medium text-slate-900">{selectedPatient.age}</span></p>
              </div>
              <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Status: <span className="font-medium text-slate-900">{triageRecords[selectedPatient.id] ? 'Triaged' : 'Awaiting triage'}</span></p>
                <p className="text-sm text-slate-600">Weight: <span className="font-medium text-slate-900">{triageRecords[selectedPatient.id]?.weight || 'Not recorded'}</span></p>
                <p className="text-sm text-slate-600">Height: <span className="font-medium text-slate-900">{triageRecords[selectedPatient.id]?.height || 'Not recorded'}</span></p>
                <p className="text-sm text-slate-600">Temperature: <span className="font-medium text-slate-900">{triageRecords[selectedPatient.id]?.temperature || 'Not recorded'}</span></p>
                <p className="text-sm text-slate-600">Blood Pressure: <span className="font-medium text-slate-900">{triageRecords[selectedPatient.id]?.bloodPressure || 'Not recorded'}</span></p>
                <p className="text-sm text-slate-600">Heart Rate: <span className="font-medium text-slate-900">{triageRecords[selectedPatient.id]?.heartRate || 'Not recorded'}</span></p>
                <p className="text-sm text-slate-600">Notes: <span className="font-medium text-slate-900">{triageRecords[selectedPatient.id]?.notes || 'No notes yet'}</span></p>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}
