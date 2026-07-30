import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import DoctorDashboard from './pages/DoctorDashboard'
import ReceptionistDashboard from './pages/ReceptionistDashboard'
import NurseDashboard from './pages/NurseDashboard'
import PharmacyDashboard from './pages/PharmacyDashboard'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/doctor"
            element={
              <RequireAuth>
                <DoctorDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/receptionist"
            element={
              <RequireAuth>
                <ReceptionistDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/nurse"
            element={
              <RequireAuth>
                <NurseDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/pharmacy"
            element={
              <RequireAuth>
                <PharmacyDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminDashboard />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
