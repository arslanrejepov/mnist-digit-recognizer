import { createContext, useContext, useState } from 'react'
import { getToken, getUser, setToken, setUser, clearToken, clearUser } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken)
  const [username, setUsername] = useState(getUser)

  const saveLogin = (accessToken, user) => {
    setToken(accessToken)
    setUser(user)
    setTokenState(accessToken)
    setUsername(user)
  }

  const logout = () => {
    clearToken()
    clearUser()
    setTokenState(null)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ token, username, saveLogin, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
