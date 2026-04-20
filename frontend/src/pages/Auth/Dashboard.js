import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTickets } from '../../api/ticketApi';

const Dashboard = () => {
  const { user, isAdmin, isTechnician } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]           = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, rejected: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    getTickets()
      .then(tickets => setStats({
        total:      tickets.length,
        open:       tickets.filter(t => t.status === 'OPEN').length,
        inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        resolved:   tickets.filter(t => t.status === 'RESOLVED').length,
        closed:     tickets.filter(t => t.status === 'CLOSED').length,
        rejected:   tickets.filter(t => t.status === 'REJECTED').length,
      }))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const statCards = [
    { label: 'Total',       value: stats.total,      icon: '📋', accent: '#236331', bg: '#e8f5eb' },
    { label: 'Open',        value: stats.open,       icon: '🔓', accent: '#236331', bg: '#c8e6cc' },
    { label: 'In Progress', value: stats.inProgress, icon: '⚙️', accent: '#92400e', bg: '#fef3c7' },
    { label: 'Resolved',    value: stats.resolved,   icon: '✅', accent: '#065f46', bg: '#d1fae5' },
    { label: 'Closed',      value: stats.closed,     icon: '🔒', accent: '#515953', bg: '#eaeceb' },
    { label: 'Rejected',    value: stats.rejected,   icon: '❌', accent: '#991b1b', bg: '#fee2e2' },
  ];

  const quickCards = [
    { icon: '🎫', title: 'Incident Tickets',  desc: 'View and manage campus incident tickets',  action: () => navigate('/tickets'),       color: '#236331' },
    { icon: '➕', title: 'Report Incident',   desc: 'Submit a new incident report',              action: () => navigate('/tickets/new'),   color: '#515953' },
    { icon: '🔔', title: 'Notifications',     desc: 'View your system alerts and updates',       action: () => navigate('/notifications'), color: '#236331' },
  ];

  const firstName = user?.fullName?.split(' ')[0] || user?.username;

  return (
    <div>
      {/* Welcome banner */}
      <div style={welcomeBanner}>
        <div style={welcomeLeft}>
          <div style={avatarCircle}>{firstName[0].toUpperCase()}</div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
              Welcome back, {firstName}! 👋
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 4, fontSize: 14 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              &nbsp;·&nbsp;
              <span style={rolePill}>{user?.role}</span>
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/tickets/new')} style={bannerBtn}>
          + New Ticket
        </button>
      </div>

      {/* Stats */}
      <SectionTitle icon="📊" title={isAdmin ? 'All Tickets Overview' : isTechnician ? 'Assigned Tickets' : 'My Tickets'} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14, marginBottom: 32 }}>
        {statCards.map(s => (
          <div key={s.label} onClick={() => navigate('/tickets')}
            style={{ background: s.bg, borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
              border: `1px solid ${s.accent}22`, transition: 'transform 0.18s, box-shadow 0.18s',
              boxShadow: '0 2px 8px rgba(35,99,49,0.07)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(35,99,49,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(35,99,49,0.07)'; }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <p style={{ fontSize: 30, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-1px' }}>
              {loadingStats ? '—' : s.value}
            </p>
            <p style={{ fontSize: 12, color: s.accent, marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <SectionTitle icon="⚡" title="Quick Actions" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18, marginBottom: 32 }}>
        {quickCards.map(c => (
          <div key={c.title} onClick={c.action}
            style={{ ...qCard, borderTop: `4px solid ${c.color}` }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(35,99,49,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(35,99,49,0.08)'; }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>{c.icon}</div>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: '#2a2e2b' }}>{c.title}</h3>
            <p style={{ color: '#717870', fontSize: 14, marginTop: 6 }}>{c.desc}</p>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, color: c.color, fontSize: 13, fontWeight: 700 }}>
              Open &rarr;
            </div>
          </div>
        ))}
      </div>

      {/* Info banners */}
      {isAdmin && (
        <div style={{ ...infoBanner, borderLeft: '4px solid #236331' }}>
          <h2 style={{ fontWeight: 700, marginBottom: 6, fontSize: 15, color: '#236331' }}>🛠 Admin Capabilities</h2>
          <p style={{ color: '#717870', fontSize: 14, lineHeight: 1.7 }}>
            View <strong>all</strong> tickets · assign technicians · reject invalid reports · update statuses · manage resources.
          </p>
        </div>
      )}
      {isTechnician && !isAdmin && (
        <div style={{ ...infoBanner, borderLeft: '4px solid #515953' }}>
          <h2 style={{ fontWeight: 700, marginBottom: 6, fontSize: 15, color: '#515953' }}>🔧 Technician Dashboard</h2>
          <p style={{ color: '#717870', fontSize: 14, lineHeight: 1.7 }}>
            View tickets assigned to you · update status to <strong>RESOLVED</strong> · add resolution notes · communicate via comments.
          </p>
        </div>
      )}
    </div>
  );
};

const SectionTitle = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
    <span style={{ fontSize: 18 }}>{icon}</span>
    <h2 style={{ fontWeight: 800, fontSize: 17, color: '#2a2e2b', margin: 0 }}>{title}</h2>
    <div style={{ flex: 1, height: 1, background: '#d4d9d5', marginLeft: 8 }} />
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const welcomeBanner = {
  background: 'linear-gradient(135deg, #236331 0%, #515953 100%)',
  borderRadius: 18, padding: '26px 30px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: 32, gap: 16, flexWrap: 'wrap',
  boxShadow: '0 4px 24px rgba(35,99,49,0.25)',
};
const welcomeLeft = { display: 'flex', alignItems: 'center', gap: 18 };
const avatarCircle = {
  width: 54, height: 54, borderRadius: '50%',
  background: 'rgba(255,255,255,0.22)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 24, fontWeight: 800, color: '#fff', border: '2px solid rgba(255,255,255,0.35)',
};
const rolePill = {
  background: 'rgba(255,255,255,0.18)', color: '#fff',
  borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700,
};
const bannerBtn = {
  background: '#fff', color: '#236331', border: 'none',
  borderRadius: 10, padding: '10px 22px', cursor: 'pointer',
  fontWeight: 700, fontSize: 14,
  boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
};
const qCard = {
  background: '#fff', borderRadius: 16, padding: 24, cursor: 'pointer',
  boxShadow: '0 2px 12px rgba(35,99,49,0.08)',
  border: '1px solid #e4e9e5', transition: 'transform 0.18s, box-shadow 0.18s',
};
const infoBanner = {
  background: '#fff', borderRadius: 14, padding: '18px 22px',
  boxShadow: '0 2px 10px rgba(35,99,49,0.07)',
  border: '1px solid #e4e9e5', marginBottom: 16,
};

export default Dashboard;

