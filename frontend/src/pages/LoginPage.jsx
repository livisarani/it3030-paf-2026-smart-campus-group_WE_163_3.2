// src/pages/LoginPage.jsx
import { useSearchParams, Navigate } from 'react-router-dom'
import useAuthStore from '../context/authStore.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const T = { primary: '#236331', primaryDark: '#1a4a25', primaryLight: '#2d7a3d', secondary: '#515953', bg: '#f5f6f5', border: '#e3e6e3' }

function OAuthButton({ provider, icon, label, bg, color = '#fff', border }) {
  const href = `${API_BASE}/oauth2/authorize/${provider}?redirect_uri=${encodeURIComponent(window.location.origin + '/oauth2/redirect')}`
  return (
    <a href={href} style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '13px 22px',
      background: bg, color, borderRadius: 10, fontWeight: 600, fontSize: 14,
      boxShadow: '0 2px 5px rgba(0,0,0,0.06)', border: border || 'none',
      transition: 'all .25s cubic-bezier(0.175, 0.885, 0.32, 1.275)', letterSpacing: 0.1
    }}
      onMouseOver={e => { e.currentTarget.style.opacity = '.9'; e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)' }}
      onMouseOut ={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.06)' }}
    >
      <span style={{ fontSize: 21 }}>{icon}</span>{label}
    </a>
  )
}

export default function LoginPage() {
  const [params]            = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const error               = params.get('error')
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Left green panel ── */}
      <div style={{
        width: '44%', background: `linear-gradient(135deg, ${T.primaryDark} 0%, ${T.primary} 50%, ${T.primaryLight} 100%)`, 
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '60px 52px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Animated Background Blobs */}
        <div style={{ position:'absolute', top:'-10%', left:'-20%', width:400, height:400, borderRadius:'50%', background:'rgba(255,255,255,0.05)', filter: 'blur(60px)', animation: 'floatSlow 8s infinite alternate' }} />
        <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:300, height:300, borderRadius:'50%', background:'rgba(35, 99, 49, 0.4)', filter: 'blur(80px)', animation: 'floatSlow 10s infinite alternate-reverse' }} />
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%', maxWidth: 320, animation: 'fadeSlideUp 0.6s ease-out forwards' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: 20, background: '#fff',
            fontSize: 36, fontWeight: 900, color: T.primary, marginBottom: 24, letterSpacing: -2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
          }}>S</div>
          <h1 style={{ margin: '0 0 10px', color: '#fff', fontSize: 30, fontWeight: 800 }}>Smart Campus</h1>
          <p style={{ margin: '0 0 40px', color: 'rgba(255,255,255,0.65)', fontSize: 14.5, lineHeight: 1.65 }}>
            Operations Hub · SLIIT IT3030<br/>Group WE_163_3.2
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
            {[
              { icon: '🏛️', text: 'Manage campus resources & bookings' },
              { icon: '🎫', text: 'Submit and track incident tickets' },
              { icon: '🛡️', text: 'Role-based access control' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.13)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0
                }}>{icon}</div>
                <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right white panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 64px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 360, animation: 'fadeSlideUp 0.6s ease-out forwards', animationDelay: '0.1s', opacity: 0 }}>
          <h2 style={{ margin: '0 0 6px', color: '#1a2b1e', fontSize: 26, fontWeight: 800 }}>Welcome back</h2>
          <p style={{ margin: '0 0 34px', color: T.secondary, fontSize: 14 }}>Sign in with your university account</p>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9,
              padding: '11px 15px', marginBottom: 22, color: '#dc2626', fontSize: 13
            }}>⚠️ {decodeURIComponent(error)}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OAuthButton provider="google" icon="🔵" label="Continue with Google" bg="#fff" color="#374151" border={`1px solid ${T.border}`} />
            <OAuthButton provider="github" icon="⚫" label="Continue with GitHub"  bg="#24292e" />
          </div>

          <div style={{ margin: '28px 0 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ color: T.secondary, fontSize: 12 }}>Powered by OAuth 2.0</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          <p style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 1.65 }}>
            By signing in you agree to the university's acceptable use policy.
          </p>
        </div>
      </div>
    </div>
  )
}
