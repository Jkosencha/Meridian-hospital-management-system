import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper } from '@tanstack/react-table'
import { useAuth } from '../context/useAuth'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import { getPrescriptions, updatePrescription, getFeeRates, updateBilling } from '../lib/api'
import { usePolling } from '../lib/usePolling'
import { useTabParam } from '../lib/useTabParam'
import StatCard from '../components/StatCard'
import { formatKsh } from '../lib/currency'

const navItems = [
  { key: 'overview', label: 'Overview' },
  { key: 'prescriptions', label: 'Prescriptions' },
]

const statusTextColor = {
  Pending: 'text-amber-700',
  Dispensed: 'text-green-700',
}

const billingStatusColor = {
  Pending: 'text-amber-700',
  Paid: 'text-green-700',
}

const emptyBillForm = { amount: '', status: 'Pending' }

const columnHelper = createColumnHelper()

function buildPrescriptionColumns({ onView, onEdit, onDispense, onEditBill }) {
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
      id: 'bill',
      header: 'Bill',
      cell: ({ row }) =>
        row.original.billId ? (
          <span className="flex items-center gap-2">
            <span className="font-medium text-slate-900">{formatKsh(row.original.billAmount)}</span>
            <span className={`text-xs font-medium ${billingStatusColor[row.original.billStatus]}`}>
              {row.original.billStatus}
            </span>
          </span>
        ) : (
          <span className="text-slate-400">N/A</span>
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
            className="rounded border border-brand-accent text-brand-accent px-2.5 py-1 font-medium hover:bg-brand-lavender"
          >
            Edit
          </button>
          {row.original.status === 'Pending' && (
            <button
              onClick={() => onDispense(row.original)}
              className="rounded bg-brand-accent text-white px-2.5 py-1 font-medium hover:bg-brand-accent-dark"
            >
              Mark dispensed
            </button>
          )}
          {row.original.billId && (
            <button
              onClick={() => onEditBill(row.original)}
              className="rounded bg-brand-accent text-white px-2.5 py-1 font-medium hover:bg-brand-accent-dark"
            >
              Edit bill
            </button>
          )}
        </div>
      ),
    }),
  ]
}

const emptyPrescriptionForm = { diagnosis: '', notes: '', prescription: '' }

export default function PharmacyDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useTabParam('overview')

  const [prescriptions, setPrescriptions] = useState([])
  const [feeRates, setFeeRates] = useState([])
  const [loadError, setLoadError] = useState('')
  const [viewingPrescription, setViewingPrescription] = useState(null)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingPrescriptionId, setEditingPrescriptionId] = useState(null)
  const [prescriptionForm, setPrescriptionForm] = useState(emptyPrescriptionForm)
  const [prescriptionFormError, setPrescriptionFormError] = useState('')

  const [dispensingPrescription, setDispensingPrescription] = useState(null)
  const [dispenseAmount, setDispenseAmount] = useState('')
  const [dispenseError, setDispenseError] = useState('')

  const [billModalOpen, setBillModalOpen] = useState(false)
  const [editingBillId, setEditingBillId] = useState(null)
  const [billForm, setBillForm] = useState(emptyBillForm)
  const [billFormError, setBillFormError] = useState('')

  function loadData() {
    return Promise.all([getPrescriptions(), getFeeRates()])
      .then(([prescriptionData, feeRateData]) => {
        setPrescriptions(prescriptionData)
        setFeeRates(feeRateData)
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

  function openDispense(prescription) {
    const defaultRate = feeRates.find((r) => r.key === '__medication__')
    setDispensingPrescription(prescription)
    setDispenseAmount(defaultRate ? String(defaultRate.amount) : '')
    setDispenseError('')
  }

  async function handleConfirmDispense(e) {
    e.preventDefault()
    try {
      const updated = await updatePrescription(dispensingPrescription.id, {
        status: 'Dispensed',
        billAmount: Number(dispenseAmount),
      })
      setPrescriptions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setDispensingPrescription(null)
    } catch (err) {
      setDispenseError(err.message || 'Could not dispense prescription. Please try again.')
    }
  }

  function openEditPrescription(prescription) {
    setEditingPrescriptionId(prescription.id)
    setPrescriptionForm({
      diagnosis: prescription.diagnosis,
      notes: prescription.notes,
      prescription: prescription.prescription,
    })
    setPrescriptionFormError('')
    setEditModalOpen(true)
  }

  function handlePrescriptionFormChange(e) {
    const { name, value } = e.target
    setPrescriptionForm((prev) => ({ ...prev, [name]: value }))
  }

  async function saveEditedPrescription(e) {
    e.preventDefault()
    try {
      const updated = await updatePrescription(editingPrescriptionId, prescriptionForm)
      setPrescriptions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setEditModalOpen(false)
    } catch (err) {
      setPrescriptionFormError(err.message || 'Could not update prescription. Please try again.')
    }
  }

  function openEditBill(prescription) {
    setEditingBillId(prescription.billId)
    setBillForm({ amount: prescription.billAmount, status: prescription.billStatus })
    setBillFormError('')
    setBillModalOpen(true)
  }

  function handleBillFormChange(e) {
    const { name, value } = e.target
    setBillForm((prev) => ({ ...prev, [name]: value }))
  }

  async function saveBill(e) {
    e.preventDefault()
    try {
      await updateBilling(editingBillId, {
        amount: Number(billForm.amount),
        status: billForm.status,
      })
      await loadData()
      setBillModalOpen(false)
    } catch (err) {
      setBillFormError(err.message || 'Could not update billing record. Please try again.')
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const pendingCount = prescriptions.filter((p) => p.status === 'Pending').length
  const nextUpPrescriptions = prescriptions.filter((p) => p.status === 'Pending').slice(0, 3)

  const prescriptionColumns = buildPrescriptionColumns({
    onView: setViewingPrescription,
    onEdit: openEditPrescription,
    onDispense: openDispense,
    onEditBill: openEditBill,
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
              <StatCard label="Total prescriptions" value={prescriptions.length} />
              <StatCard label="Awaiting dispense" value={pendingCount} />
            </div>

            <div className="mt-8 border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200">
                <h2 className="text-sm font-medium text-slate-900">Next up</h2>
              </div>
              <DataTable
                columns={prescriptionColumns}
                data={nextUpPrescriptions}
                emptyMessage="No prescriptions awaiting dispense"
              />
            </div>
          </>
        )}

        {tab === 'prescriptions' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900">Prescriptions</h1>
            <p className="text-sm text-slate-500 mt-0.5">{today}</p>
            <div className="mt-6 border border-slate-200 bg-white overflow-hidden">
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
            {viewingPrescription.billId && (
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent font-semibold">Bill</p>
                <p className="mt-1 text-slate-900">
                  {formatKsh(viewingPrescription.billAmount)}{' '}
                  <span className={`font-medium ${billingStatusColor[viewingPrescription.billStatus]}`}>
                    ({viewingPrescription.billStatus})
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Prescription">
        <form onSubmit={saveEditedPrescription} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Diagnosis</label>
            <textarea
              required
              rows={2}
              name="diagnosis"
              value={prescriptionForm.diagnosis}
              onChange={handlePrescriptionFormChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              required
              rows={2}
              name="notes"
              value={prescriptionForm.notes}
              onChange={handlePrescriptionFormChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Prescription</label>
            <textarea
              required
              rows={2}
              name="prescription"
              value={prescriptionForm.prescription}
              onChange={handlePrescriptionFormChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          {prescriptionFormError && <p className="text-sm text-red-600">{prescriptionFormError}</p>}
          <button
            type="submit"
            className="w-full rounded bg-brand-accent py-2.5 text-sm font-medium text-white hover:bg-brand-accent-dark"
          >
            Save changes
          </button>
        </form>
      </Modal>

      <Modal
        open={!!dispensingPrescription}
        onClose={() => setDispensingPrescription(null)}
        title={dispensingPrescription ? `Dispense for ${dispensingPrescription.name}` : ''}
      >
        <form onSubmit={handleConfirmDispense} className="space-y-4">
          <p className="text-sm text-slate-600">
            Enter the amount to bill for this prescription. This becomes the patient's medication charge.
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700">Amount (KSh)</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={dispenseAmount}
              onChange={(e) => setDispenseAmount(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
            {dispenseAmount !== '' && (
              <p className="mt-1 text-xs text-slate-500">{formatKsh(Number(dispenseAmount) || 0)}</p>
            )}
          </div>
          {dispenseError && <p className="text-sm text-red-600">{dispenseError}</p>}
          <button
            type="submit"
            className="w-full rounded bg-brand-accent py-2.5 text-sm font-medium text-white hover:bg-brand-accent-dark"
          >
            Confirm dispense
          </button>
        </form>
      </Modal>

      <Modal open={billModalOpen} onClose={() => setBillModalOpen(false)} title="Edit Bill">
        <form onSubmit={saveBill} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Amount (KSh)</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              name="amount"
              value={billForm.amount}
              onChange={handleBillFormChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              name="status"
              value={billForm.status}
              onChange={handleBillFormChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-accent"
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          {billFormError && <p className="text-sm text-red-600">{billFormError}</p>}
          <button
            type="submit"
            className="w-full rounded bg-brand-accent py-2.5 text-sm font-medium text-white hover:bg-brand-accent-dark"
          >
            Save changes
          </button>
        </form>
      </Modal>
    </div>
  )
}