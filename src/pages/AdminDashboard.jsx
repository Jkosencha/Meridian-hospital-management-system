import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useAuth } from '../context/useAuth'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import {
  getPatients,
  getAppointments,
  getPrescriptions,
  getBilling,
  updateBilling,
  getFeeRates,
  createFeeRate,
  updateFeeRate,
  deleteFeeRate,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../lib/api'
import { usePolling } from '../lib/usePolling'
import { useTabParam } from '../lib/useTabParam'
import { DonutChart, RevenueChart } from '../components/charts'
import StatCard from '../components/StatCard'
import { formatKsh } from '../lib/currency'

const navItems = [
  { key: 'overview', label: 'Overview' },
  { key: 'patients', label: 'Patients' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'billing', label: 'Billing' },
  { key: 'users', label: 'Users' },
]

const roleOptions = ['doctor', 'receptionist', 'nurse', 'pharmacy', 'admin']
const roleLabels = {
  doctor: 'Doctor',
  receptionist: 'Receptionist',
  nurse: 'Nurse',
  pharmacy: 'Pharmacy',
  admin: 'Admin',
}

const emptyUserForm = { name: '', email: '', password: '', role: roleOptions[0] }
const emptyBillForm = { amount: '', status: 'Pending' }
const emptyRateForm = { label: '', amount: '' }

const fieldClass =
  'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent'
const labelClass = 'text-sm font-medium text-slate-700'

const statusTextColor = {
  Pending: 'text-amber-700',
  Completed: 'text-green-700',
  Cancelled: 'text-slate-500',
  Dispensed: 'text-green-700',
}

const statusChartColor = {
  Pending: { hex: '#f472b6', textClass: 'text-pink-700' },
  Completed: { hex: '#22c55e', textClass: 'text-green-700' },
  Cancelled: { hex: '#cbd5e1', textClass: 'text-slate-500' },
  Dispensed: { hex: '#22c55e', textClass: 'text-green-700' },
}

const specialtyChartColors = ['#2a78d6', '#8b5cf6', '#1baf7a', '#eda100', '#e87ba4', '#008300']

const billingStatusColor = {
  Pending: 'text-amber-700',
  Paid: 'text-green-700',
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

const userColumnHelper = createColumnHelper()

function buildUserColumns({ onEdit }) {
  return [
    userColumnHelper.accessor('name', { header: 'Name', meta: { className: 'text-slate-900 font-medium' } }),
    userColumnHelper.accessor('email', { header: 'Email', enableSorting: false }),
    userColumnHelper.display({
      id: 'role',
      header: 'Role',
      cell: ({ row }) => roleLabels[row.original.role] || row.original.role,
    }),
    userColumnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={() => onEdit(row.original)}
          className="rounded bg-brand-accent px-2.5 py-1 font-medium text-white hover:bg-brand-accent-dark"
        >
          Edit
        </button>
      ),
    }),
  ]
}

function countByStatus(items) {
  return items.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1
    return counts
  }, {})
}

function countBySpecialty(appointments) {
  return appointments.reduce((counts, appt) => {
    counts[appt.specialty] = (counts[appt.specialty] || 0) + 1
    return counts
  }, {})
}

function revenueByMonth(bills) {
  const totals = {}
  bills.forEach((bill) => {
    const key = bill.date.slice(0, 7)
    if (!totals[key]) {
      const label = new Date(`${key}-01T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
      totals[key] = { key, label, amount: 0 }
    }
    totals[key].amount += bill.amount
  })
  return Object.values(totals).sort((a, b) => a.key.localeCompare(b.key))
}

function groupBillingByVisit(bills) {
  const groups = {}
  const rows = []

  bills.forEach((bill) => {
    if (!bill.visitId) {
      rows.push({
        key: `bill-${bill.id}`,
        patientName: bill.patientName,
        specialty: bill.specialty,
        date: bill.date,
        description: bill.description,
        amount: bill.amount,
        status: bill.status,
        items: [bill],
      })
      return
    }
    if (!groups[bill.visitId]) {
      const row = {
        key: `visit-${bill.visitId}`,
        patientName: bill.patientName,
        specialty: bill.specialty,
        date: bill.date,
        description: bill.description,
        amount: 0,
        status: 'Paid',
        items: [],
      }
      groups[bill.visitId] = row
      rows.push(row)
    }
    const row = groups[bill.visitId]
    row.items.push(bill)
    row.amount += bill.amount
    row.date = row.date < bill.date ? row.date : bill.date
    row.description = row.items.map((item) => item.description).join(' + ')
    if (bill.status !== 'Paid') row.status = 'Pending'
  })

  return rows.sort((a, b) => a.date.localeCompare(b.date))
}

const billingColumnHelper = createColumnHelper()

function buildBillingColumns({ onEdit }) {
  return [
    billingColumnHelper.accessor('patientName', {
      header: 'Patient',
      meta: { className: 'text-slate-900 font-medium' },
    }),
    billingColumnHelper.accessor('description', { header: 'Description', enableSorting: false }),
    billingColumnHelper.accessor('specialty', {
      header: 'Specialty',
      cell: ({ row }) => row.original.specialty || 'N/A',
    }),
    billingColumnHelper.accessor('date', { header: 'Date' }),
    billingColumnHelper.display({
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) => formatKsh(row.original.amount),
    }),
    billingColumnHelper.display({
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`font-medium ${billingStatusColor[row.original.status]}`}>{row.original.status}</span>
      ),
    }),
    billingColumnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={() => onEdit(row.original)}
          className="rounded bg-brand-accent px-2.5 py-1 font-medium text-white hover:bg-brand-accent-dark"
        >
          Edit
        </button>
      ),
    }),
  ]
}

const feeRateColumnHelper = createColumnHelper()

function buildFeeRateColumns({ onEdit }) {
  return [
    feeRateColumnHelper.accessor('label', { header: 'Item', meta: { className: 'text-slate-900 font-medium' } }),
    feeRateColumnHelper.display({
      id: 'amount',
      header: 'Fee',
      cell: ({ row }) => formatKsh(row.original.amount),
    }),
    feeRateColumnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={() => onEdit(row.original)}
          className="rounded bg-brand-accent px-2.5 py-1 font-medium text-white hover:bg-brand-accent-dark"
        >
          Edit
        </button>
      ),
    }),
  ]
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useTabParam('overview')

  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [billing, setBilling] = useState([])
  const [feeRates, setFeeRates] = useState([])
  const [users, setUsers] = useState([])
  const [loadError, setLoadError] = useState('')

  const [userModalOpen, setUserModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [userFormError, setUserFormError] = useState('')
  const [userDeleteConfirming, setUserDeleteConfirming] = useState(false)

  const [billModalOpen, setBillModalOpen] = useState(false)
  const [viewingBillGroup, setViewingBillGroup] = useState(null)
  const [editingBillItemId, setEditingBillItemId] = useState(null)
  const [billForm, setBillForm] = useState(emptyBillForm)
  const [billFormError, setBillFormError] = useState('')

  const [rateModalOpen, setRateModalOpen] = useState(false)
  const [editingRateId, setEditingRateId] = useState(null)
  const [rateForm, setRateForm] = useState(emptyRateForm)
  const [rateFormError, setRateFormError] = useState('')
  const [rateDeleteConfirming, setRateDeleteConfirming] = useState(false)

  function loadData() {
    return Promise.all([
      getPatients(),
      getAppointments(),
      getPrescriptions(),
      getBilling(),
      getFeeRates(),
      getUsers(),
    ])
      .then(([patientData, appointmentData, prescriptionData, billingData, feeRateData, userData]) => {
        setPatients(patientData)
        setAppointments(appointmentData)
        setPrescriptions(prescriptionData)
        setBilling(billingData)
        setFeeRates(feeRateData)
        setUsers(userData)
      })
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

  function openAddUser() {
    setEditingUserId(null)
    setUserForm(emptyUserForm)
    setUserFormError('')
    setUserDeleteConfirming(false)
    setUserModalOpen(true)
  }

  function openEditUser(targetUser) {
    setEditingUserId(targetUser.id)
    setUserForm({ name: targetUser.name, email: targetUser.email, password: '', role: targetUser.role })
    setUserFormError('')
    setUserDeleteConfirming(false)
    setUserModalOpen(true)
  }

  function handleUserFormChange(e) {
    const { name, value } = e.target
    setUserForm((prev) => ({ ...prev, [name]: value }))
  }

  async function saveUser(e) {
    e.preventDefault()
    try {
      if (editingUserId) {
        const payload = { ...userForm }
        if (!payload.password) delete payload.password
        const updated = await updateUser(editingUserId, payload)
        setUsers((prev) => prev.map((u) => (u.id === editingUserId ? updated : u)))
      } else {
        const created = await createUser(userForm)
        setUsers((prev) => [...prev, created])
      }
      setUserModalOpen(false)
    } catch (err) {
      setUserFormError(err.message || 'Could not save user. Please try again.')
    }
  }

  function openBillGroup(group) {
    setViewingBillGroup(group)
    setEditingBillItemId(null)
    setBillFormError('')
    setBillModalOpen(true)
  }

  function startEditBillItem(item) {
    setEditingBillItemId(item.id)
    setBillForm({ amount: item.amount, status: item.status })
    setBillFormError('')
  }

  function handleBillFormChange(e) {
    const { name, value } = e.target
    setBillForm((prev) => ({ ...prev, [name]: value }))
  }

  async function saveBillItem(e) {
    e.preventDefault()
    try {
      const updated = await updateBilling(editingBillItemId, {
        amount: Number(billForm.amount),
        status: billForm.status,
      })
      setBilling((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
      setViewingBillGroup((prev) =>
        prev ? { ...prev, items: prev.items.map((i) => (i.id === updated.id ? updated : i)) } : prev
      )
      setEditingBillItemId(null)
    } catch (err) {
      setBillFormError(err.message || 'Could not update billing record. Please try again.')
    }
  }

  function openAddRate() {
    setEditingRateId(null)
    setRateForm(emptyRateForm)
    setRateFormError('')
    setRateDeleteConfirming(false)
    setRateModalOpen(true)
  }

  function openEditRate(rate) {
    setEditingRateId(rate.id)
    setRateForm({ label: rate.label, amount: rate.amount })
    setRateFormError('')
    setRateDeleteConfirming(false)
    setRateModalOpen(true)
  }

  function handleRateFormChange(e) {
    const { name, value } = e.target
    setRateForm((prev) => ({ ...prev, [name]: value }))
  }

  async function saveRate(e) {
    e.preventDefault()
    try {
      if (editingRateId) {
        const updated = await updateFeeRate(editingRateId, { amount: Number(rateForm.amount) })
        setFeeRates((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      } else {
        const created = await createFeeRate({ label: rateForm.label, amount: Number(rateForm.amount) })
        setFeeRates((prev) => [...prev, created])
      }
      setRateModalOpen(false)
    } catch (err) {
      setRateFormError(err.message || 'Could not save billing rate. Please try again.')
    }
  }

  async function handleDeleteRate() {
    try {
      await deleteFeeRate(editingRateId)
      setFeeRates((prev) => prev.filter((r) => r.id !== editingRateId))
      setRateModalOpen(false)
    } catch (err) {
      setRateFormError(err.message || 'Could not delete billing rate. Please try again.')
      setRateDeleteConfirming(false)
    }
  }

  async function handleDeleteUser() {
    try {
      await deleteUser(editingUserId)
      setUsers((prev) => prev.filter((u) => u.id !== editingUserId))
      setUserModalOpen(false)
    } catch (err) {
      setUserFormError(err.message || 'Could not delete user. Please try again.')
      setUserDeleteConfirming(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const appointmentsByStatus = countByStatus(appointments)
  const prescriptionsByStatus = countByStatus(prescriptions)
  const specialtyBars = Object.entries(countBySpecialty(appointments)).sort((a, b) => b[1] - a[1])
  const revenuePoints = revenueByMonth(billing)

  const appointmentStatusSegments = ['Pending', 'Completed', 'Cancelled'].map((status) => ({
    label: status,
    count: appointmentsByStatus[status] || 0,
    hex: statusChartColor[status].hex,
    textClass: statusChartColor[status].textClass,
  }))
  const prescriptionStatusSegments = ['Pending', 'Dispensed'].map((status) => ({
    label: status,
    count: prescriptionsByStatus[status] || 0,
    hex: statusChartColor[status].hex,
    textClass: statusChartColor[status].textClass,
  }))
  const specialtySegments = specialtyBars.map(([label, count], i) => ({
    label,
    count,
    hex: specialtyChartColors[i % specialtyChartColors.length],
  }))

  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const revenueThisMonth = billing
    .filter((bill) => bill.date.slice(0, 7) === currentMonthKey)
    .reduce((sum, bill) => sum + bill.amount, 0)

  const userColumns = buildUserColumns({ onEdit: openEditUser })
  const groupedBilling = groupBillingByVisit(billing)
  const billingColumns = buildBillingColumns({ onEdit: openBillGroup })
  const feeRateColumns = buildFeeRateColumns({ onEdit: openEditRate })

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

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-5">
              <StatCard label="Total patients" value={patients.length} />
              <StatCard label="Total appointments" value={appointments.length} />
              <StatCard label="Total prescriptions" value={prescriptions.length} />
              <StatCard label="Revenue this month" value={formatKsh(revenueThisMonth)} />
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <DonutChart
                title="Appointments by status"
                segments={appointmentStatusSegments}
                emptyMessage="No appointments yet"
                centerLabel="Appointments"
              />
              <DonutChart
                title="Prescriptions by status"
                segments={prescriptionStatusSegments}
                emptyMessage="No prescriptions yet"
                centerLabel="Prescriptions"
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5">
              <RevenueChart points={revenuePoints} />
              <DonutChart
                title="Appointments by specialty"
                segments={specialtySegments}
                emptyMessage="No appointments yet"
                centerLabel="Appointments"
              />
            </div>
          </>
        )}

        {tab === 'patients' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900">Patients</h1>
            <p className="text-sm text-slate-500 mt-0.5">{today}</p>
            <div className="mt-6 border border-slate-200 bg-white overflow-hidden">
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

        {tab === 'billing' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900">Billing</h1>
            <p className="text-sm text-slate-500 mt-0.5">{today}</p>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-slate-900">Billing rates</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fees applied automatically when an appointment is completed or a prescription is dispensed.
                </p>
              </div>
              <button
                onClick={openAddRate}
                className="rounded bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent-dark"
              >
                Add Rate
              </button>
            </div>
            <div className="mt-3 border border-slate-200 bg-white overflow-hidden">
              <DataTable columns={feeRateColumns} data={feeRates} emptyMessage="No billing rates configured" />
            </div>

            <h2 className="mt-8 text-sm font-medium text-slate-900">Billing records</h2>
            <div className="mt-3 border border-slate-200 bg-white overflow-hidden">
              <DataTable
                columns={billingColumns}
                data={groupedBilling}
                emptyMessage="No billing records yet"
                searchable
                searchPlaceholder="Search billing..."
              />
            </div>
          </>
        )}

        {tab === 'users' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Users</h1>
                <p className="text-sm text-slate-500 mt-0.5">{today}</p>
              </div>
              <button
                onClick={openAddUser}
                className="rounded bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent-dark"
              >
                Add User
              </button>
            </div>
            <div className="mt-6 border border-slate-200 bg-white overflow-hidden">
              <DataTable
                columns={userColumns}
                data={users}
                emptyMessage="No users yet"
                searchable
                searchPlaceholder="Search users..."
              />
            </div>
          </>
        )}
      </main>

      <Modal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUserId ? 'Edit User' : 'Add User'}
      >
        {userDeleteConfirming ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Are you sure you want to delete <span className="font-medium">{userForm.name}</span>? This cannot
              be undone.
            </p>
            {userFormError && <p className="text-sm text-red-600">{userFormError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setUserDeleteConfirming(false)}
                className="flex-1 rounded border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="flex-1 rounded bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Yes, delete
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={saveUser} className="space-y-4">
            <div>
              <label className={labelClass}>Full name</label>
              <input
                required
                type="text"
                name="name"
                value={userForm.name}
                onChange={handleUserFormChange}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                required
                type="email"
                name="email"
                value={userForm.email}
                onChange={handleUserFormChange}
                className={fieldClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Password</label>
                <input
                  required={!editingUserId}
                  type="password"
                  name="password"
                  minLength={6}
                  placeholder={editingUserId ? 'Leave blank to keep current' : ''}
                  value={userForm.password}
                  onChange={handleUserFormChange}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select name="role" value={userForm.role} onChange={handleUserFormChange} className={fieldClass}>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {userFormError && <p className="text-sm text-red-600">{userFormError}</p>}
            <button
              type="submit"
              className="w-full rounded bg-brand-accent py-2.5 text-sm font-medium text-white hover:bg-brand-accent-dark"
            >
              {editingUserId ? 'Update user' : 'Create user'}
            </button>
            {editingUserId && (
              <button
                type="button"
                onClick={() => setUserDeleteConfirming(true)}
                className="w-full rounded border border-red-300 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete user
              </button>
            )}
          </form>
        )}
      </Modal>

      <Modal
        open={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        title={viewingBillGroup ? `${viewingBillGroup.patientName}: Billing details` : ''}
      >
        {viewingBillGroup && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Specialty</p>
                <p className="mt-1 text-slate-900">{viewingBillGroup.specialty || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Date</p>
                <p className="mt-1 text-slate-900">{viewingBillGroup.date}</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-4">
              {viewingBillGroup.items.map((item) =>
                editingBillItemId === item.id ? (
                  <form
                    key={item.id}
                    onSubmit={saveBillItem}
                    className="space-y-3 rounded border border-slate-200 p-3"
                  >
                    <p className="text-sm font-medium text-slate-900">{item.description}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Amount (KSh)</label>
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          name="amount"
                          value={billForm.amount}
                          onChange={handleBillFormChange}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Status</label>
                        <select
                          name="status"
                          value={billForm.status}
                          onChange={handleBillFormChange}
                          className={fieldClass}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>
                    </div>
                    {billFormError && <p className="text-sm text-red-600">{billFormError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingBillItemId(null)}
                        className="flex-1 rounded border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded bg-brand-accent py-2 text-sm font-medium text-white hover:bg-brand-accent-dark"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded border border-slate-200 p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.description}</p>
                      <p className={`mt-0.5 font-medium ${billingStatusColor[item.status]}`}>{item.status}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">{formatKsh(item.amount)}</span>
                      <button
                        onClick={() => startEditBillItem(item)}
                        className="rounded bg-brand-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-accent-dark"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-sm font-medium text-slate-900">Total</span>
              <span className="text-lg font-bold text-slate-900">
                {formatKsh(viewingBillGroup.items.reduce((sum, i) => sum + i.amount, 0))}
              </span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        title={editingRateId ? 'Edit Billing Rate' : 'Add Billing Rate'}
      >
        {rateDeleteConfirming ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Are you sure you want to delete <span className="font-medium">{rateForm.label}</span>? This cannot be
              undone.
            </p>
            {rateFormError && <p className="text-sm text-red-600">{rateFormError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRateDeleteConfirming(false)}
                className="flex-1 rounded border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRate}
                className="flex-1 rounded bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Yes, delete
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={saveRate} className="space-y-4">
          {!editingRateId && (
            <div>
              <label className={labelClass}>Label</label>
              <input
                required
                type="text"
                name="label"
                placeholder="e.g. Lab Test, X-Ray"
                value={rateForm.label}
                onChange={handleRateFormChange}
                className={fieldClass}
              />
            </div>
          )}
          <div>
            <label className={labelClass}>Amount (KSh)</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              name="amount"
              value={rateForm.amount}
              onChange={handleRateFormChange}
              className={fieldClass}
            />
          </div>
          {rateFormError && <p className="text-sm text-red-600">{rateFormError}</p>}
          <button
            type="submit"
            className="w-full rounded bg-brand-accent py-2.5 text-sm font-medium text-white hover:bg-brand-accent-dark"
          >
            {editingRateId ? 'Save changes' : 'Add billing rate'}
          </button>
          {editingRateId && (
            <button
              type="button"
              onClick={() => setRateDeleteConfirming(true)}
              className="w-full rounded border border-red-300 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete billing rate
            </button>
          )}
        </form>
        )}
      </Modal>
    </div>
  )
}
