// src/pages/OAuth2RedirectHandler.jsx
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/index.js'
import useAuthStore from '../context/authStore.js'

export default function OAuth2RedirectHandler() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const { setTokensAndUser } = useAuthStore()

  useEffect(() => {
    const token        = params.get('token')
    const refreshToken = params.get('refreshToken')
    const error        = params.get('error')

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    if (!token || !refreshToken) {
      navigate('/login?error=Missing+tokens', { replace: true })
      return
    }

    // Store tokens then fetch user profile
    localStorage.setItem('accessToken', token)
    localStorage.setItem('refreshToken', refreshToken)

    authApi.getMe()
      .then(({ data }) => {
        setTokensAndUser(token, refreshToken, data)
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        localStorage.clear()
        navigate('/login?error=Authentication+failed', { replace: true })
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#3f4541', color: '#94a3b8', fontFamily: 'sans-serif'
    }}>
      <div style={{
        width: 48, height: 48, border: '3px solid #6f7a72',
        borderTopColor: '#236331', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', marginBottom: 20
      }} />
      <p style={{ margin: 0, fontSize: 15 }}>Completing sign-in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
