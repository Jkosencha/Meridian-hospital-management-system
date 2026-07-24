import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import DoctorDashboard from './pages/DoctorDashboard'
import ReceptionistDashboard from './pages/ReceptionistDashboard'

function Placeholder({ label }) {
  return <div className="p-10 text-xl text-slate-600">{label} dashboard, coming soon</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/receptionist" element={<ReceptionistDashboard />} />
          <Route path="/nurse" element={<Placeholder label="Nurse" />} />
          <Route path="/pharmacy" element={<Placeholder label="Pharmacy" />} />
          <Route path="/admin" element={<Placeholder label="Admin" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
