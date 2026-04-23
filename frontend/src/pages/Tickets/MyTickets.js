import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTickets } from '../../api/ticketApi';
import { useAuth } from '../../context/AuthContext';
import { STATUS_COLORS, PRIORITY_COLORS, TICKET_STATUSES, TICKET_PRIORITIES } from '../../utils/constants';

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  green:      '#236331',
  greenDark:  '#1a4a25',
  greenLight: '#e8f5eb',
  greenMid:   '#c8e6cc',
  ash:        '#515953',
  ashLight:   '#eaeceb',
  white:      '#ffffff',
  border:     '#d6ddd7',
  textDark:   '#1e2b20',
  textMid:    '#4a5249',
  textLight:  '#7a8578',
  red:        '#dc2626',
  redLight:   '#fee2e2',
};

const Badge = ({ text, colors }) => (
  <span style={{
    background: colors?.bg || T.ashLight, color: colors?.text || T.ash,
    borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase',
    border: `1px solid ${colors?.border || 'transparent'}`,
  }}>{text?.replace(/_/g, ' ')}</span>
);

const MyTickets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets,        setTickets]        = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [statusFilter,   setStatusFilter]   = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm,     setSearchTerm]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getMyTickets()
      .then(data => { setTickets(data); setFiltered(data); })
      .catch(() => setError('Failed to load your tickets.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let r = tickets;
    if (statusFilter   !== 'ALL') r = r.filter(t => t.status   === statusFilter);
    if (priorityFilter !== 'ALL') r = r.filter(t => t.priority === priorityFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      r = r.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }
    setFiltered(r);
  }, [statusFilter, priorityFilter, searchTerm, tickets]);

  const statsMap = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const statItems = [
    { label: 'Total',       count: tickets.length,               color: '#fff',        icon: '🎫' },
    { label: 'Open',        count: statsMap['OPEN']        || 0, color: '#fcd34d',     icon: '🟡' },
    { label: 'In Progress', count: statsMap['IN_PROGRESS'] || 0, color: '#60a5fa',     icon: '🔵' },
    { label: 'Resolved',    count: statsMap['RESOLVED']    || 0, color: '#86efac',     icon: '🟢' },
    { label: 'Closed',      count: statsMap['CLOSED']      || 0, color: 'rgba(255,255,255,0.55)', icon: '⚫' },
    { label: 'Rejected',    count: statsMap['REJECTED']    || 0, color: '#fca5a5',     icon: '🔴' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${T.greenLight}`, borderTop: `3px solid ${T.green}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ color: T.textLight, marginTop: 14, fontSize: 14 }}>Loading your tickets…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: 60, color: T.red }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
      <p>{error}</p>
      <button onClick={load} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, marginTop: 12 }}>
        Try Again
      </button>
    </div>
  );

  return (
    <div>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${T.green} 0%, ${T.ash} 100%)`,
        borderRadius: 18, padding: '28px 32px 22px', marginBottom: 24,
        boxShadow: `0 8px 32px rgba(35,99,49,0.22)`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* User avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              border: '2.5px solid rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
            }}>
              {(user?.fullName || user?.username || '?')[0].toUpperCase()}
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                My Ticket History
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
                {user?.fullName || user?.username}
              </h1>
              <span style={{
                background: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: 20,
                padding: '2px 11px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {user?.role}
              </span>
            </div>
          </div>
          <button onClick={() => navigate('/tickets/new')}
            style={{
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.45)', borderRadius: 10,
              padding: '11px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = T.green; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}>
            + Report New Issue
          </button>
        </div>

        {/* ── Stats bar ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          {statItems.map(({ label, count, color, icon }) => (
            <div key={label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'rgba(255,255,255,0.10)', borderRadius: 12, padding: '10px 18px',
              border: '1px solid rgba(255,255,255,0.15)', minWidth: 72, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
              onClick={() => setStatusFilter(label === 'Total' ? 'ALL' : label.toUpperCase().replace(' ', '_'))}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}>
              <span style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{count}</span>
              <span style={{ fontSize: 10, marginTop: 2 }}>{icon}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.68)', marginTop: 2 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Workflow breadcrumb ───────────────────────────────────────────────── */}
      <div style={{
        background: T.greenLight, border: `1px solid ${T.greenMid}`,
        borderRadius: 12, padding: '11px 18px', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        fontSize: 12, color: T.textMid, fontWeight: 600,
      }}>
        {[
          { icon: '🔐', text: 'Logged in' },
          { icon: '📋', text: 'My Tickets' },
          { icon: '🔍', text: 'Filter & Search' },
          { icon: '👁', text: 'Select Ticket' },
          { icon: '📄', text: 'View Full Details' },
        ].map(({ icon, text }, i, arr) => (
          <React.Fragment key={text}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>{icon}</span> {text}
            </span>
            {i < arr.length - 1 && <span style={{ color: T.green, fontSize: 14, fontWeight: 800 }}>→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: 240 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
          <input
            placeholder="Search title, location or category…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
              borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, outline: 'none',
              background: T.white, boxSizing: 'border-box', color: T.textDark,
            }}
            onFocus={e => { e.target.style.borderColor = T.green; e.target.style.boxShadow = `0 0 0 3px rgba(35,99,49,0.12)`; }}
            onBlur={e  => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, outline: 'none', background: T.white, color: T.textDark, cursor: 'pointer' }}>
          <option value="ALL">All Statuses</option>
          {TICKET_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, outline: 'none', background: T.white, color: T.textDark, cursor: 'pointer' }}>
          <option value="ALL">All Priorities</option>
          {TICKET_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || searchTerm) && (
          <button onClick={() => { setStatusFilter('ALL'); setPriorityFilter('ALL'); setSearchTerm(''); }}
            style={{ padding: '10px 16px', borderRadius: 10, background: T.redLight, color: T.red, border: '1px solid #fca5a5', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
            onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
            onMouseLeave={e => e.currentTarget.style.background = T.redLight}>
            ✕ Clear
          </button>
        )}
      </div>

      <p style={{ fontSize: 13, color: T.textLight, marginBottom: 14 }}>
        Showing <strong style={{ color: T.ash }}>{filtered.length}</strong> of <strong style={{ color: T.ash }}>{tickets.length}</strong> tickets
      </p>

      {/* ── Empty State ──────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '70px 30px', background: T.white,
          borderRadius: 18, border: `1px solid ${T.border}`, boxShadow: `0 4px 20px rgba(35,99,49,0.07)`,
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>📭</div>
          <h3 style={{ color: T.ash, fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>
            {tickets.length === 0 ? "You haven't reported any tickets yet" : 'No tickets match your filters'}
          </h3>
          <p style={{ color: T.textLight, fontSize: 14, margin: '0 0 24px' }}>
            {tickets.length === 0
              ? 'Report an issue and it will appear here for tracking.'
              : 'Try adjusting your search or filters.'}
          </p>
          {tickets.length === 0 && (
            <button onClick={() => navigate('/tickets/new')}
              style={{
                background: T.green, color: '#fff', border: 'none', borderRadius: 10,
                padding: '11px 26px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                boxShadow: `0 3px 12px rgba(35,99,49,0.3)`,
              }}>
              + Report Your First Issue
            </button>
          )}
        </div>
      ) : (
        /* ── Ticket Cards ──────────────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((t) => (
            <div key={t.id}
              onClick={() => navigate(`/tickets/${t.id}`)}
              style={{
                background: T.white, borderRadius: 14, padding: '18px 22px',
                boxShadow: '0 2px 12px rgba(35,99,49,0.09)', border: `1px solid ${T.border}`,
                cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 24px rgba(35,99,49,0.16)`;
                e.currentTarget.style.borderColor = T.green;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(35,99,49,0.09)';
                e.currentTarget.style.borderColor = T.border;
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                {/* Left: Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: T.textLight, fontWeight: 600 }}>#{t.id}</span>
                    <Badge text={t.status}   colors={STATUS_COLORS[t.status]} />
                    <Badge text={t.priority} colors={PRIORITY_COLORS[t.priority]} />
                    <span style={{ background: '#ede9fe', color: '#5b21b6', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t.category?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.textDark, margin: '0 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 500 }}>
                    {t.title}
                  </h3>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: T.textLight }}>
                    <span>📍 {t.location}</span>
                    {t.technicianUsername
                      ? <span>👷 <span style={{ color: T.green, fontWeight: 600 }}>{t.technicianUsername}</span></span>
                      : <span style={{ color: '#c0c8c2' }}>👷 Unassigned</span>}
                    <span>🕐 {new Date(t.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Right: View button + status indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: STATUS_COLORS[t.status]?.text || T.ash,
                  }} />
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/tickets/${t.id}`); }}
                    style={{
                      background: T.greenLight, color: T.green, border: `1px solid ${T.greenMid}`,
                      borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    }}>
                    View Details →
                  </button>
                </div>
              </div>

              {/* Progress bar based on status */}
              <div style={{ marginTop: 12 }}>
                <ProgressBar status={t.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Ticket Progress Bar ────────────────────────────────────────────────────────
const STATUS_STEPS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const ProgressBar = ({ status }) => {
  const isRejected = status === 'REJECTED';
  const currentStep = isRejected ? -1 : STATUS_STEPS.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {STATUS_STEPS.map((s, i) => {
        const done    = !isRejected && i <= currentStep;
        const active  = !isRejected && i === currentStep;
        return (
          <React.Fragment key={s}>
            <div style={{
              height: 6, flex: 1, borderRadius: 4,
              background: isRejected ? '#fee2e2' : done ? (active ? '#236331' : '#86efac') : '#e4e9e5',
              transition: 'background 0.3s',
            }} />
            {i < STATUS_STEPS.length - 1 && (
              <div style={{ width: 0 }} />
            )}
          </React.Fragment>
        );
      })}
      <span style={{ fontSize: 10, color: isRejected ? '#dc2626' : '#7a8578', marginLeft: 6, whiteSpace: 'nowrap', fontWeight: 600 }}>
        {isRejected ? '🚫 Rejected' : status.replace(/_/g, ' ')}
      </span>
    </div>
  );
};

export default MyTickets;


