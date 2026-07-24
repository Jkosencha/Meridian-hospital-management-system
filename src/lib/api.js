const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error || `Request to ${path} failed with status ${res.status}`)
  }
  return data
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

export function getAppointments() {
  return request('/api/appointments')
}

export function createAppointment(appointment) {
  return request('/api/appointments', { method: 'POST', body: JSON.stringify(appointment) })
}

export function updateAppointment(id, appointment) {
  return request(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(appointment) })
}
