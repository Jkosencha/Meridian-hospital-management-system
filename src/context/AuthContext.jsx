import { useEffect, useState } from 'react'
import { login as apiLogin, setAuthToken, setUnauthorizedHandler } from '../lib/api'
import { AuthContext } from './authContextValue'

const USER_KEY = 'meridian_user'

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser)
  const [error, setError] = useState('')

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      localStorage.removeItem(USER_KEY)
      setAuthToken(null)
    })
  }, [])

  async function login(email, password) {
    try {
      const { token, user: loggedInUser } = await apiLogin(email, password)
      setAuthToken(token)
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser))
      setUser(loggedInUser)
      setError('')
      return loggedInUser
    } catch (err) {
      setError(err.message || 'Invalid email or password')
      return null
    }
  }

  function logout() {
    setUser(null)
    setAuthToken(null)
    localStorage.removeItem(USER_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  )
}
