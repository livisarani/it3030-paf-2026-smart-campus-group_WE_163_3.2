// src/App.jsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import useAuthStore from './context/authStore.js'
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute.jsx'
import NotificationPanel from './components/notifications/NotificationPanel.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler.jsx'
import RoleManagerPage from './pages/RoleManagerPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

// ─── Theme Tokens ─────────────────────────────────────────────────────────────
const T = {
  primary: '#236331',
  primaryDark: '#1a4a25',
  primaryLight: '#2d7a3d',
  secondary: '#515953',
  secondaryLight: '#6b7570',
  bg: '#f5f6f5',
  surface: '#ffffff',
  border: '#e3e6e3',
  textPrimary: '#1a2b1e',
  textSecondary: '#515953',
  textMuted: '#8a948d',
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Nav style ────────────────────────────────────────────────────────────────
const navStyle = (isActive) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 14px', borderRadius: 10, 
  color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
  background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
  fontSize: 13.5, fontWeight: isActive ? 600 : 500,
  marginBottom: 4, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: isActive ? 'translateX(4px)' : 'none',
})

// ─── Inline SVG-style icon components ────────────────────────────────────────
const iconStyle = { width: 17, height: 17, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', flexShrink: 0 }
const DashIcon = () => <svg style={iconStyle} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
const BookIcon = () => <svg style={iconStyle} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
const TickIcon = () => <svg style={iconStyle} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
const RoomIcon = () => <svg style={iconStyle} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const RoleIcon = () => <svg style={iconStyle} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
const SettingsIcon = () => <svg style={iconStyle} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
const SearchIcon = () => <svg style={{ ...iconStyle, width: 14, height: 14, color: '#8a948d' }} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>

const Placeholder = ({ title }) => (
  <div style={{ padding: 40 }}>
    <h2 style={{ color: T.textPrimary, fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>{title}</h2>
    <p style={{ color: T.textSecondary, fontSize: 14, margin: 0 }}>This module is under development.</p>
  </div>
)

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: DashIcon },
  { to: '/resources', label: 'Resources', icon: RoomIcon },
  { to: '/bookings', label: 'Bookings', icon: BookIcon },
  { to: '/tickets', label: 'Tickets', icon: TickIcon },
]
const ADMIN_NAV = [
  { to: '/admin/roles', label: 'Roles', icon: RoleIcon },
]

function Sidebar({ user, onLogout }) {
  return (
    <nav style={{
      width: 250, 
      background: `linear-gradient(180deg, ${T.primaryDark} 0%, ${T.primary} 100%)`, 
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'fixed', zIndex: 200,
      boxShadow: '4px 0 24px rgba(26,74,37,0.25)',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid rgba(255,255,255,0.12)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 19, color: T.primary, flexShrink: 0, letterSpacing: -1
          }}>S</div>
          <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 15.5, letterSpacing: 0.1 }}>Smart Campus</p>
        </div>
      </div>

      {/* MAIN MENU label */}
      <div style={{ padding: '18px 18px 5px' }}>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Main Menu</p>
      </div>

      {/* Nav links */}
      <div style={{ flex: 1, padding: '4px 10px', overflowY: 'auto' }}>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => navStyle(isActive)}
            onMouseOver={e => { if(!window.location.pathname.startsWith(to)) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseOut ={e => { if(!window.location.pathname.startsWith(to)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' } }}
          >
            <Icon active={false} /> {label}
          </NavLink>
        ))}

        {user?.roles?.includes('ADMIN') && (
          <>
            <p style={{ margin: '18px 8px 5px', color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Admin</p>
            {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} style={({ isActive }) => navStyle(isActive)}
                onMouseOver={e => { if(!window.location.pathname.startsWith(to)) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
                onMouseOut ={e => { if(!window.location.pathname.startsWith(to)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' } }}
              >
                <Icon /> {label}
              </NavLink>
            ))}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ padding: '4px 10px 8px', borderTop: `1px solid rgba(255,255,255,0.10)` }}>
        <NavLink to="/settings" style={({ isActive }) => navStyle(isActive)}>
          <SettingsIcon /> Settings
        </NavLink>
      </div>

      {/* User footer */}
      <div style={{ padding: '12px 14px 18px', borderTop: `1px solid rgba(255,255,255,0.10)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.18)',
            overflow: 'hidden', flexShrink: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700
          }}>
            {user?.imageUrl
              ? <img src={user.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, color: '#fff', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 10.5 }}>
              {user?.roles?.[0] || user?.provider}
            </p>
          </div>
        </div>
        <button onClick={onLogout} style={{
          width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 7, padding: '7px', color: 'rgba(255,255,255,0.7)', fontSize: 12,
          cursor: 'pointer', fontWeight: 500, transition: 'all .15s'
        }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >Sign out</button>
      </div>
    </nav>
  )
}

function AppLayout() {
  const { user, logout } = useAuthStore()
  return (
    <div style={{ display: 'flex', background: '#f5f6f5', minHeight: '100vh' }}>
      <Sidebar user={user} onLogout={logout} />
      <div style={{ flex: 1, marginLeft: 250, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{
          height: 62, background: T.surface, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', padding: '0 28px',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 1px 4px rgba(35,99,49,0.06)'
        }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: T.bg, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: '8px 14px', maxWidth: 300, flex: 1
          }}>
            <SearchIcon />
            <span style={{ color: T.textMuted, fontSize: 13 }}>Search...</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationPanel />
            {/* User chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 14px', border: `1px solid ${T.border}`,
              borderRadius: 9, background: T.surface, cursor: 'default'
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', background: T.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11, fontWeight: 700, overflow: 'hidden', flexShrink: 0
              }}>
                {user?.imageUrl
                  ? <img src={user.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user?.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary }}>
                {user?.roles?.includes('ADMIN') ? 'Admin User' : (user?.name?.split(' ')[0] || 'User')}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/resources" element={<Placeholder title="Resources" />} />
            <Route path="/bookings" element={<Placeholder title="Bookings" />} />
            <Route path="/tickets" element={<Placeholder title="Tickets" />} />
            <Route path="/settings" element={<Placeholder title="Settings" />} />
            <Route path="/admin/roles" element={<AdminRoute />}>
              <Route index element={<RoleManagerPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { initAuth } = useAuthStore()
  useEffect(() => { initAuth() }, [initAuth])
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppLayout />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
