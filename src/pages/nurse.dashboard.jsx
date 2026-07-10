import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'

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

function PatientsTable({ rows, triageRecords, onView, onTriage }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs whitespace-nowrap">
        <thead>
          <tr className="text-left uppercase tracking-wide text-slate-500 bg-slate-50">
            <th className="px-3 py-2.5 font-medium">Name</th>
            <th className="px-3 py-2.5 font-medium">Date</th>
            <th className="px-3 py-2.5 font-medium">ID</th>
            <th className="px-3 py-2.5 font-medium">Gender</th>
            <th className="px-3 py-2.5 font-medium">Contact</th>
            <th className="px-3 py-2.5 font-medium">Age</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">Actions</th>
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
                <td className="px-3 py-2.5 text-slate-900 font-medium">{patient.name}</td>
                <td className="px-3 py-2.5 text-slate-600">{patient.date}</td>
                <td className="px-3 py-2.5 text-slate-600">{patient.id}</td>
                <td className="px-3 py-2.5 text-slate-600">{patient.gender}</td>
                <td className="px-3 py-2.5 text-slate-600">{patient.contact}</td>
                <td className="px-3 py-2.5 text-slate-600">{patient.age}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      triageRecords[patient.id] ? 'text-green-700' : 'text-amber-700'
                    }`}
                  >
                    {triageRecords[patient.id] ? 'Triaged' : 'Awaiting triage'}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1 items-stretch">
                    <button
                      onClick={() => onView(patient)}
                      className="rounded border border-brand-accent text-brand-accent px-2.5 py-1 font-medium hover:bg-brand-lavender"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onTriage(patient)}
                      className="rounded bg-brand-accent text-white px-2.5 py-1 font-medium hover:bg-brand-accent-dark"
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

export default function NurseDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()