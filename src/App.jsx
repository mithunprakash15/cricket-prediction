import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import UserPage from './pages/UserPage'

export default function App() {
  // role: null | 'admin' | 'user'
  const [role, setRole] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)

  const handleAdminLogin = () => setRole('admin')
  const handleUserLogin = (user) => {
    setSelectedUser(user)
    setRole('user')
  }
  const handleLogout = () => {
    setRole(null)
    setSelectedUser(null)
  }

  if (role === 'admin') return <AdminPage onLogout={handleLogout} />
  if (role === 'user') return <UserPage user={selectedUser} onLogout={handleLogout} />
  return <LoginPage onAdminLogin={handleAdminLogin} onUserLogin={handleUserLogin} />
}
