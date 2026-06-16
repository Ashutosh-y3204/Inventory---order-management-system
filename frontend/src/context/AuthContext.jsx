import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// Backend base URL only
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      axios
        .get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await axios.post(`${API}/api/auth/login`, {
      email,
      password,
    })

    localStorage.setItem('token', res.data.access_token)

    const me = await axios.get(`${API}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${res.data.access_token}`,
      },
    })

    setUser(me.data)
    return me.data
  }

  const signup = async (name, email, password) => {
    const res = await axios.post(`${API}/api/auth/signup`, {
      name,
      email,
      password,
    })

    localStorage.setItem('token', res.data.access_token)

    const me = await axios.get(`${API}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${res.data.access_token}`,
      },
    })

    setUser(me.data)
    return me.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)