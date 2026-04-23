// src/components/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../../context/authStore.js'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuthStore()
  if (loading) return <div style={{ minHeight:'100vh', background:'#3f4541' }} />
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export function AdminRoute() {
  const { isAuthenticated, loading, isAdmin } = useAuthStore()
  if (loading) return <div style={{ minHeight:'100vh', background:'#3f4541' }} />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
