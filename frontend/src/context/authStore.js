// src/context/authStore.js
import { create } from 'zustand'
import { authApi } from '../api/index.js'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  initAuth: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) { set({ loading: false }); return }
    try {
      const { data } = await authApi.getMe()
      set({ user: data, isAuthenticated: true, loading: false })
    } catch {
      localStorage.clear()
      set({ user: null, isAuthenticated: false, loading: false })
    }
  },

  setTokensAndUser: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ user, isAuthenticated: true })
  },

  logout: async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    localStorage.clear()
    set({ user: null, isAuthenticated: false })
  },

  hasRole: (role) => {
    const { user } = get()
    return user?.roles?.includes(role) ?? false
  },

  isAdmin: () => get().hasRole('ADMIN'),
}))

export default useAuthStore
