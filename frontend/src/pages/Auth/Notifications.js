import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    axios.get('/api/notifications/all')
      .then(r => setNotifications(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await axios.patch(`/api/notifications/${id}/read`).catch(() => {});
    load();
  };

  const markAll = async () => {
    await axios.patch('/api/notifications/read-all').catch(() => {});
    load();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#717870' }}>Loading…</div>;

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2a2e2b', letterSpacing: '-0.4px' }}>
            🔔 Notifications
            {unread > 0 && (
              <span style={{
                background: '#236331', color: '#fff',
                borderRadius: 20, padding: '2px 12px', fontSize: 13,
                marginLeft: 10, fontWeight: 700,
              }}>{unread} new</span>
            )}
          </h1>
          <p style={{ color: '#717870', fontSize: 14, marginTop: 4 }}>
            {notifications.length} total · {unread} unread
          </p>
        </div>

        {unread > 0 && (
          <button onClick={markAll} style={markAllBtn}
            onMouseEnter={e => e.currentTarget.style.background = '#1a4d25'}
            onMouseLeave={e => e.currentTarget.style.background = '#236331'}>
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div style={emptyBox}>
          <p style={{ fontSize: 52 }}>📭</p>
          <p style={{ color: '#515953', fontWeight: 700, fontSize: 17, marginTop: 10 }}>No notifications yet</p>
          <p style={{ color: '#717870', fontSize: 14, marginTop: 4 }}>
            You'll be notified about ticket updates, assignments and comments here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => (
            <div key={n.id}
              onClick={() => {
                if (!n.read) markRead(n.id);
                if (n.relatedTicketId) navigate(`/tickets/${n.relatedTicketId}`);
              }}
              style={{
                background  : n.read ? '#fff'     : '#e8f5eb',
                border      : n.read ? `1px solid #e4e9e5` : `1px solid #c8e6cc`,
                borderLeft  : n.read ? `3px solid #d4d9d5` : `3px solid #236331`,
                borderRadius: 12, padding: '14px 18px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                transition: 'box-shadow 0.15s',
                boxShadow: '0 1px 6px rgba(35,99,49,0.06)',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(35,99,49,0.13)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(35,99,49,0.06)'}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Unread dot */}
                {!n.read && (
                  <span style={{
                    width: 9, height: 9, borderRadius: '50%',
                    background: '#236331', flexShrink: 0, marginTop: 5,
                    boxShadow: '0 0 0 3px rgba(35,99,49,0.18)',
                  }} />
                )}
                <div>
                  <span style={{
                    fontSize: 14, color: '#2a2e2b',
                    fontWeight: n.read ? 400 : 700, lineHeight: 1.5,
                  }}>
                    {n.message}
                  </span>
                  {n.relatedTicketId && (
                    <span style={{
                      display: 'inline-block', marginLeft: 8,
                      fontSize: 12, color: '#236331', fontWeight: 700,
                    }}>
                      → Ticket #{n.relatedTicketId}
                    </span>
                  )}
                </div>
              </div>

              <span style={{ color: '#717870', fontSize: 12, marginLeft: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const markAllBtn = {
  background: '#236331', color: '#fff', border: 'none',
  borderRadius: 10, padding: '9px 20px', cursor: 'pointer',
  fontWeight: 700, fontSize: 14,
  boxShadow: '0 2px 10px rgba(35,99,49,0.28)',
  transition: 'background 0.2s',
};
const emptyBox = {
  textAlign: 'center', padding: '60px 30px',
  background: '#fff', borderRadius: 16,
  border: '1px solid #e4e9e5',
  boxShadow: '0 2px 12px rgba(35,99,49,0.07)',
};

export default Notifications;
