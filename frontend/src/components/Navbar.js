import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Navbar = () => {
  const { user, logout, isAdmin, isTechnician } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen,    setMenuOpen]    = useState(false);

  useEffect(() => {
    if (user) {
      axios.get('/api/notifications')
        .then(r => setUnreadCount(r.data.length))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = path => {
    const p = location.pathname;
    // "/tickets/my" should only highlight the My Tickets link, not the Tickets link
    if (path === '/tickets' && p.startsWith('/tickets/my')) return {};
    if (p === path || p.startsWith(path + '/'))
      return { borderBottom: '2px solid #a7f3b8', color: '#fff', fontWeight: 700 };
    return {};
  };

  return (
    <nav style={navStyle}>
      {/* Brand */}
      <Link to="/dashboard" style={brandStyle}>
        <span style={logoBox}>🏫</span>
        <span>Smart Campus Hub</span>
      </Link>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavLink to="/dashboard"     label="Dashboard"     extraStyle={isActive('/dashboard')} />
          <NavLink to="/tickets"       label="🎫 Tickets"    extraStyle={isActive('/tickets')} />
          <NavLink to="/tickets/my"    label="📋 My Tickets" extraStyle={isActive('/tickets/my')} />
          <NavLink to="/notifications"
            label={unreadCount > 0 ? `🔔 (${unreadCount})` : '🔔'}
            extraStyle={{
              ...isActive('/notifications'),
              ...(unreadCount > 0 ? { background: 'rgba(167,243,184,0.15)' } : {}),
            }} />

          {/* User menu */}
          <div style={{ position: 'relative', marginLeft: 8 }}>
            <button onClick={() => setMenuOpen(o => !o)} style={userBtnStyle}>
              <span style={avatarDot}>{(user.fullName || user.username)[0].toUpperCase()}</span>
              {user.username}
              <span style={{ fontSize: 10, opacity: 0.8 }}>▾</span>
            </button>

            {menuOpen && (
              <div style={dropdownStyle} onClick={() => setMenuOpen(false)}>
                <div style={dropdownHeader}>
                  <strong style={{ fontSize: 14, color: '#2a2e2b' }}>{user.fullName}</strong>
                  <br />
                  <span style={roleBadge}>{user.role}</span>
                </div>
                <button onClick={handleLogout} style={logoutBtnStyle}>
                  🚪 &nbsp;Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ to, label, extraStyle }) => (
  <Link to={to} style={{ color: 'rgba(255,255,255,0.82)', textDecoration: 'none',
    padding: '6px 14px', borderRadius: 8, fontSize: 14, transition: 'all 0.2s',
    ...extraStyle }}>
    {label}
  </Link>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const navStyle = {
  background: 'linear-gradient(135deg, #236331 0%, #515953 100%)',
  padding: '0 28px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  height: 64,
  boxShadow: '0 2px 16px rgba(35,99,49,0.35)',
  position: 'sticky', top: 0, zIndex: 100,
};
const brandStyle = {
  color: '#fff', textDecoration: 'none', fontWeight: 800,
  fontSize: 20, display: 'flex', alignItems: 'center', gap: 10,
  letterSpacing: '-0.3px',
};
const logoBox = {
  background: 'rgba(255,255,255,0.18)', borderRadius: 8,
  padding: '2px 6px', fontSize: 22,
};
const userBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: 'rgba(255,255,255,0.13)',
  border: '1px solid rgba(255,255,255,0.22)',
  color: '#fff', padding: '7px 16px', borderRadius: 24,
  cursor: 'pointer', fontSize: 14, fontWeight: 600,
};
const avatarDot = {
  background: '#a7f3b8', color: '#236331',
  borderRadius: '50%', width: 24, height: 24,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, fontWeight: 800,
};
const dropdownStyle = {
  position: 'absolute', right: 0, top: 50,
  background: '#fff', borderRadius: 14,
  boxShadow: '0 8px 32px rgba(35,99,49,0.18)',
  minWidth: 200, zIndex: 200,
  border: '1px solid #d4d9d5', overflow: 'hidden',
};
const dropdownHeader = {
  padding: '14px 18px', borderBottom: '1px solid #e8f5eb',
  background: '#f8faf8',
};
const roleBadge = {
  display: 'inline-block', marginTop: 5,
  background: '#e8f5eb', color: '#236331',
  borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700,
};
const logoutBtnStyle = {
  width: '100%', textAlign: 'left', padding: '12px 18px',
  border: 'none', background: 'none', cursor: 'pointer',
  fontSize: 14, color: '#dc2626', fontWeight: 600,
};

export default Navbar;

