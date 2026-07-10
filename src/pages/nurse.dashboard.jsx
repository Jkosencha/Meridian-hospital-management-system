import React, { useState } from 'react'

const patients = [
  {
    id: 'P-101',
    name: 'Leo Thuku',
    date: '2006-12-01',
    gender: 'Male',
    contact: '+254700000001',
    age: 20,
  },
  {
    id: 'P-102',
    name: 'Daniel Brooks',
    date: '2026-07-10',
    gender: 'Male',
    contact: '+254700000002',
    age: 35,
  },
  {
    id: 'P-103',
    name: 'Sarah Kim',
    date: '2026-07-10',
    gender: 'Female',
    contact: '+254700000003',
    age: 41,
  },
]

const sidebarItems = ['Patients']

function NurseDashboard() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [triagePatient, setTriagePatient] = useState(null)
  const [triageRecords, setTriageRecords] = useState({})
  const [triageForm, setTriageForm] = useState({
    weight: '',
    height: '',
    temperature: '',
    bloodPressure: '',
    heartRate: '',
  })

  const openTriage = (patient) => {
    setTriagePatient(patient)
    setTriageForm(triageRecords[patient.id] || {
      weight: '',
      height: '',
      temperature: '',
      bloodPressure: '',
      heartRate: '',
    })
  }

  const handleTriageChange = (event) => {
    const { name, value } = event.target
    setTriageForm((prev) => ({ ...prev, [name]: value }))
  }

  const saveTriage = () => {
    if (!triagePatient) return

    setTriageRecords((prev) => ({
      ...prev,
      [triagePatient.id]: triageForm,
    }))
    setTriagePatient(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row">
        <aside className="min-h-[calc(100vh-2rem)] w-full border border-slate-200 bg-slate-900 p-4 text-white lg:w-64">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">Meridian</p>
            <h2 className="mt-1 text-xl font-semibold">Nurse Panel</h2>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition ${
                  index === 1 ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 border border-slate-200 bg-white p-6">
          <header className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Nurse Dashboard</h2>
            <p className="text-sm text-slate-500">Patient list, triage actions, and details</p>
          </header>

<div className="overflow-hidden border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">ID</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Gender</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Contact</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Age</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="7" className="px-3 py-6 text-center text-slate-500">
                    No patients available
                  </td>
                </tr>
              </tbody>
            </table>
        </div>

        {triagePatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-lg border border-sky-200 bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sky-900">Triage Module</h3>
                  <p className="text-sm text-sky-700">Patient: {triagePatient.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTriagePatient(null)}
                  className="bg-sky-100 px-3 py-1 text-sm text-sky-700 hover:bg-sky-200"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded border border-sky-200 bg-sky-50 p-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">Vital Signs</p>
                  <div className="mt-2 space-y-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Weight (kg)</span>
                      <input
                        type="text"
                        name="weight"
                        value={triageForm.weight}
                        onChange={handleTriageChange}
                        className="w-full rounded border border-slate-300 px-2 py-1"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Height (cm)</span>
                      <input
                        type="text"
                        name="height"
                        value={triageForm.height}
                        onChange={handleTriageChange}
                        className="w-full rounded border border-slate-300 px-2 py-1"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Temperature (°C)</span>
                      <input
                        type="text"
                        name="temperature"
                        value={triageForm.temperature}
                        onChange={handleTriageChange}
                        className="w-full rounded border border-slate-300 px-2 py-1"
                      />
                    </label>
                  </div>
                </div>
                <div className="rounded border border-sky-200 bg-sky-50 p-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">Quick Notes</p>
                  <div className="mt-2 space-y-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Blood Pressure</span>
                      <input
                        type="text"
                        name="bloodPressure"
                        value={triageForm.bloodPressure}
                        onChange={handleTriageChange}
                        className="w-full rounded border border-slate-300 px-2 py-1"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Heart Rate (bpm)</span>
                      <input
                        type="text"
                        name="heartRate"
                        value={triageForm.heartRate}
                        onChange={handleTriageChange}
                        className="w-full rounded border border-slate-300 px-2 py-1"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Nurse Notes</span>
                      <textarea
                        name="notes"
                        value={triageForm.notes || ''}
                        onChange={handleTriageChange}
                        rows="3"
                        className="w-full rounded border border-slate-300 px-2 py-1"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={saveTriage}
                  className="bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Patient Details</h3>
                  <p className="text-sm text-slate-600">{selectedPatient.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p><span className="font-medium text-slate-900">ID:</span> {selectedPatient.id}</p>
                  <p><span className="font-medium text-slate-900">Date:</span> {selectedPatient.date}</p>
                  <p><span className="font-medium text-slate-900">Gender:</span> {selectedPatient.gender}</p>
                  <p><span className="font-medium text-slate-900">Contact:</span> {selectedPatient.contact || 'N/A'}</p>
                  <p><span className="font-medium text-slate-900">Age:</span> {selectedPatient.age}</p>
                </div>
                <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p><span className="font-medium text-slate-900">Status:</span> Awaiting review</p>
                  <p><span className="font-medium text-slate-900">Weight:</span> {triageRecords[selectedPatient.id]?.weight || 'Not recorded'}</p>
                  <p><span className="font-medium text-slate-900">Height:</span> {triageRecords[selectedPatient.id]?.height || 'Not recorded'}</p>
                  <p><span className="font-medium text-slate-900">Temperature:</span> {triageRecords[selectedPatient.id]?.temperature || 'Not recorded'}</p>
                  <p><span className="font-medium text-slate-900">Blood Pressure:</span> {triageRecords[selectedPatient.id]?.bloodPressure || 'Not recorded'}</p>
                  <p><span className="font-medium text-slate-900">Heart Rate:</span> {triageRecords[selectedPatient.id]?.heartRate || 'Not recorded'}</p>
                  <p><span className="font-medium text-slate-900">Nurse Notes:</span> {triageRecords[selectedPatient.id]?.notes || 'No notes yet'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default NurseDashboard

