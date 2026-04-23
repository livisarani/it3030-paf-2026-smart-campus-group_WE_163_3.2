import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getTickets, deleteTicket } from '../../api/ticketApi';
import { useAuth } from '../../context/AuthContext';
import { STATUS_COLORS, PRIORITY_COLORS, TICKET_STATUSES, TICKET_PRIORITIES } from '../../utils/constants';

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  green:      '#236331',
  greenDark:  '#1a4a25',
  greenLight: '#e8f5eb',
  ash:        '#515953',
  ashLight:   '#eaeceb',
  ashDark:    '#3a3d3b',
  bg:         '#f4f6f4',
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
  }}>{text}</span>
);

const TicketList = () => {
  const [tickets,        setTickets]        = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [statusFilter,   setStatusFilter]   = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm,     setSearchTerm]     = useState('');
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getTickets()
      .then(data => { setTickets(data); setFiltered(data); })
      .catch(() => setError('Failed to load tickets.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    let r = tickets;
    if (statusFilter   !== 'ALL') r = r.filter(t => t.status   === statusFilter);
    if (priorityFilter !== 'ALL') r = r.filter(t => t.priority === priorityFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      r = r.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.reporterUsername?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }
    setFiltered(r);
  }, [statusFilter, priorityFilter, searchTerm, tickets]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    try { await deleteTicket(id); toast.success('Ticket deleted.'); load(); }
    catch { toast.error('Failed to delete ticket.'); }
  };

  const statsMap = tickets.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${T.greenLight}`, borderTop: `3px solid ${T.green}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ color: T.textLight, marginTop: 14, fontSize: 14 }}>Loading tickets…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (error) return <div style={{ textAlign: 'center', padding: 60, color: T.red }}>{error}</div>;

  return (
    <div>
      {/* Page Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.green} 0%, ${T.ash} 100%)`, borderRadius: 18, padding: '28px 32px 22px', marginBottom: 24, boxShadow: `0 8px 32px rgba(35,99,49,0.22)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, background: 'rgba(255,255,255,0.18)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎫</div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Incident Tickets</h1>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, margin: '3px 0 0' }}>Smart Campus Maintenance & Incident Management</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/tickets/new')}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.45)', borderRadius: 10, padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'background 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = T.green; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}>
              + New Ticket
            </button>
          </div>
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',       count: tickets.length,               color: '#fff' },
            { label: 'Open',        count: statsMap['OPEN']        || 0, color: '#fcd34d' },
            { label: 'In Progress', count: statsMap['IN_PROGRESS'] || 0, color: '#60a5fa' },
            { label: 'Resolved',    count: statsMap['RESOLVED']    || 0, color: '#86efac' },
            { label: 'Closed',      count: statsMap['CLOSED']      || 0, color: 'rgba(255,255,255,0.55)' },
            { label: 'Rejected',    count: statsMap['REJECTED']    || 0, color: '#fca5a5' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 18px', border: '1px solid rgba(255,255,255,0.15)', minWidth: 68 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{count}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.68)', marginTop: 3 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: 240 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
          <input placeholder="Search title, location, category or reporter…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, outline: 'none', background: T.white, boxSizing: 'border-box', color: T.textDark, transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onFocus={e => { e.target.style.borderColor = T.green; e.target.style.boxShadow = `0 0 0 3px rgba(35,99,49,0.12)`; }}
            onBlur={e  => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }} />
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

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 30px', background: T.white, borderRadius: 18, border: `1px solid ${T.border}`, boxShadow: `0 4px 20px rgba(35,99,49,0.07)` }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>📭</div>
          <h3 style={{ color: T.ash, fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>No tickets found</h3>
          <p style={{ color: T.textLight, fontSize: 14, margin: 0 }}>Try adjusting your filters or create a new ticket.</p>
          <button onClick={() => navigate('/tickets/new')}
            style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 26px', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: `0 3px 12px rgba(35,99,49,0.3)`, marginTop: 24 }}
            onMouseEnter={e => e.currentTarget.style.background = T.greenDark}
            onMouseLeave={e => e.currentTarget.style.background = T.green}>
            + New Ticket
          </button>
        </div>
      ) : (
        <div style={{ background: T.white, borderRadius: 18, overflow: 'hidden', boxShadow: `0 4px 24px rgba(35,99,49,0.10)`, border: `1px solid ${T.border}` }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${T.green} 0%, ${T.ash} 100%)` }}>
                  {['#', 'Title', 'Category', 'Priority', 'Status', 'Location', 'Reporter', 'Technician', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)}
                    style={{ cursor: 'pointer', background: i % 2 === 0 ? T.white : '#fafbfa', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.greenLight}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? T.white : '#fafbfa'}>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: T.textLight, fontWeight: 600, borderBottom: `1px solid #f0f3f1` }}>#{t.id}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, color: T.textDark, borderBottom: `1px solid #f0f3f1` }}>{t.title}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, borderBottom: `1px solid #f0f3f1` }}>
                      <span style={{ background: '#f0f4f1', color: T.ash, borderRadius: 8, padding: '3px 9px', fontWeight: 600, fontSize: 11 }}>{t.category?.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, borderBottom: `1px solid #f0f3f1` }}><Badge text={t.priority} colors={PRIORITY_COLORS[t.priority]} /></td>
                    <td style={{ padding: '13px 16px', fontSize: 13, borderBottom: `1px solid #f0f3f1` }}><Badge text={t.status?.replace(/_/g, ' ')} colors={STATUS_COLORS[t.status]} /></td>
                    <td style={{ padding: '13px 16px', fontSize: 13, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: T.textMid, borderBottom: `1px solid #f0f3f1` }}>{t.location}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: T.ash, fontWeight: 600, borderBottom: `1px solid #f0f3f1` }}>{t.reporterUsername}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, borderBottom: `1px solid #f0f3f1` }}>
                      {t.technicianUsername
                        ? <span style={{ color: T.green, fontWeight: 600 }}>{t.technicianUsername}</span>
                        : <span style={{ color: '#c0c8c2', fontStyle: 'italic', fontSize: 12 }}>Unassigned</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: T.textLight, whiteSpace: 'nowrap', borderBottom: `1px solid #f0f3f1` }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, borderBottom: `1px solid #f0f3f1` }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <Btn color={T.green} label="View" onClick={() => navigate(`/tickets/${t.id}`)} />
                        {(isAdmin || t.status === 'OPEN') && <Btn color={T.ash} label="Edit" onClick={() => navigate(`/tickets/${t.id}/edit`)} />}
                        {isAdmin && <Btn color={T.red} label="Del" onClick={e => handleDelete(e, t.id)} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const Btn = ({ color, label, onClick }) => (
  <button onClick={onClick}
    style={{ background: color, color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'opacity 0.15s, transform 0.1s' }}
    onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)'; }}>
    {label}
  </button>
);


export default TicketList;

