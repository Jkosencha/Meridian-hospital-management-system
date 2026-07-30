const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const TOKEN_KEY = 'meridian_token'

let authToken = localStorage.getItem(TOKEN_KEY)
let onUnauthorized = () => {}

export function setAuthToken(token) {
  authToken = token
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401) onUnauthorized()
    throw new Error(data?.error || `Request to ${path} failed with status ${res.status}`)
  }
  return data
}

export function login(email, password) {
  return request('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function getPatients() {
  return request('/api/patients')
}

export function createPatient(patient) {
  return request('/api/patients', { method: 'POST', body: JSON.stringify(patient) })
}

export function updatePatient(id, patient) {
  return request(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(patient) })
}

export function deletePatient(id) {
  return request(`/api/patients/${id}`, { method: 'DELETE' })
}

export function getAppointments() {
  return request('/api/appointments')
}

export function createAppointment(appointment) {
  return request('/api/appointments', { method: 'POST', body: JSON.stringify(appointment) })
}

export function updateAppointment(id, appointment) {
  return request(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(appointment) })
}

export function deleteAppointment(id) {
  return request(`/api/appointments/${id}`, { method: 'DELETE' })
}

export function saveTriage(triage) {
  return request('/api/triage', { method: 'POST', body: JSON.stringify(triage) })
}

export function deleteTriage(appointmentId) {
  return request(`/api/triage/${appointmentId}`, { method: 'DELETE' })
}

export function getPrescriptions() {
  return request('/api/prescriptions')
}

export function createPrescription(prescription) {
  return request('/api/prescriptions', { method: 'POST', body: JSON.stringify(prescription) })
}

export function updatePrescription(id, prescription) {
  return request(`/api/prescriptions/${id}`, { method: 'PUT', body: JSON.stringify(prescription) })
}

export function deletePrescription(id) {
  return request(`/api/prescriptions/${id}`, { method: 'DELETE' })
}

export function getBilling() {
  return request('/api/billing')
}

export function updateBilling(id, billing) {
  return request(`/api/billing/${id}`, { method: 'PUT', body: JSON.stringify(billing) })
}

export function getFeeRates() {
  return request('/api/fee-rates')
}

export function createFeeRate(feeRate) {
  return request('/api/fee-rates', { method: 'POST', body: JSON.stringify(feeRate) })
}

export function deleteFeeRate(id) {
  return request(`/api/fee-rates/${id}`, { method: 'DELETE' })
}

export function updateFeeRate(id, feeRate) {
  return request(`/api/fee-rates/${id}`, { method: 'PUT', body: JSON.stringify(feeRate) })
}

export function getUsers() {
  return request('/api/users')
}

export function createUser(user) {
  return request('/api/users', { method: 'POST', body: JSON.stringify(user) })
}

export function updateUser(id, user) {
  return request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(user) })
}

export function deleteUser(id) {
  return request(`/api/users/${id}`, { method: 'DELETE' })
}
