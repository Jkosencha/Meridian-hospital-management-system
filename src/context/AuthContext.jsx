import { createContext, useContext, useState } from 'react'
import { demoUsers } from '../data/demoUsers'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  function login(email, password) {
    const match = demoUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!match) {
      setError('Invalid email or password')
      return null
    }
    setError('')
    setUser(match)
    return match
  }

  function logout() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}