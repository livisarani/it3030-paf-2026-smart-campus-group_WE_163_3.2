// src/components/notifications/NotificationPanel.jsx
import { useState, useRef, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '../../hooks/useNotifications.js'

const T = { primary: '#236331', secondary: '#515953', border: '#e3e6e3', bg: '#f5f6f5' }

const TYPE_META = {
  BOOKING_APPROVED:      { icon: '✅', color: '#16a34a' },
  BOOKING_REJECTED:      { icon: '❌', color: '#dc2626' },
  BOOKING_CANCELLED:     { icon: '🚫', color: '#d97706' },
  TICKET_STATUS_CHANGED: { icon: '🔄', color: '#2563eb' },
  TICKET_ASSIGNED:       { icon: '👷', color: '#7c3aed' },
  TICKET_COMMENT_ADDED:  { icon: '💬', color: '#0891b2' },
  TICKET_RESOLVED:       { icon: '🎉', color: '#16a34a' },
  SYSTEM_ANNOUNCEMENT:   { icon: '📢', color: T.secondary },
}

function NotifItem({ n, onRead }) {
  const meta = TYPE_META[n.type] || { icon: '🔔', color: T.secondary }
  return (
    <div onClick={() => !n.isRead && onRead(n.id)} style={{
      display: 'flex', gap: 12, padding: '12px 16px', cursor: n.isRead ? 'default' : 'pointer',
      background: n.isRead ? '#fff' : '#f0faf3', borderBottom: `1px solid ${T.border}`,
      transition: 'background .15s'
    }}
      onMouseOver={e => { if (!n.isRead) e.currentTarget.style.background = '#dcfce7' }}
      onMouseOut ={e => { if (!n.isRead) e.currentTarget.style.background = '#f0faf3' }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: meta.color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
      }}>{meta.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <p style={{
            margin: 0, color: n.isRead ? T.secondary : '#1a2b1e',
            fontWeight: n.isRead ? 400 : 600, fontSize: 13, lineHeight: 1.4
          }}>{n.title}</p>
          {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary, flexShrink: 0, marginTop: 5, display: 'inline-block' }} />}
        </div>
        <p style={{ margin: '3px 0 0', color: '#8a948d', fontSize: 12 }}>{n.message}</p>
        <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 11 }}>
          {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}
        </p>
      </div>
    </div>
  )
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { notifications, unreadCount, loading, hasMore, markRead, markAllRead, deleteRead, loadMore } = useNotifications()

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'relative', background: open ? '#f0faf3' : 'transparent',
        border: `1px solid ${open ? '#b6e5c4' : T.border}`,
        borderRadius: 9, width: 40, height: 40, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17, transition: 'all .15s'
      }}>
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            background: '#dc2626', color: '#fff', borderRadius: 99,
            minWidth: 16, height: 16, fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px'
          }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 48, right: 0, width: 360,
          background: '#fff', border: `1px solid ${T.border}`,
          borderRadius: 14, boxShadow: '0 12px 40px rgba(35,99,49,0.14)',
          zIndex: 1000, overflow: 'hidden', animation: 'ndSlide .15s ease'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', background: T.primary
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ background: '#fff', color: T.primary, borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{unreadCount}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {unreadCount > 0 && <button onClick={markAllRead} style={pill('rgba(255,255,255,0.18)', 'rgba(255,255,255,0.9)')}>Mark all read</button>}
              <button onClick={deleteRead} style={pill('rgba(255,255,255,0.10)', 'rgba(255,255,255,0.65)')}>Clear read</button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {notifications.length === 0 && !loading && (
              <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                You're all caught up!
              </div>
            )}
            {notifications.map(n => <NotifItem key={n.id} n={n} onRead={markRead} />)}
            {hasMore && (
              <button onClick={loadMore} disabled={loading} style={{
                width: '100%', padding: '12px', background: 'transparent', border: 'none',
                color: T.primary, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                borderTop: `1px solid ${T.border}`
              }}>{loading ? 'Loading…' : 'Load more'}</button>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes ndSlide { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}

const pill = (bg, color) => ({
  background: bg, border: 'none', borderRadius: 6, padding: '4px 10px',
  color, fontSize: 11, cursor: 'pointer', fontWeight: 500
})
