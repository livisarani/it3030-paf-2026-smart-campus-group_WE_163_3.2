// src/pages/RoleManagerPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { rolesApi } from '../api/index.js'

const T = { primary: '#236331', secondary: '#6b7570', bg: '#f5f6f5', surface: '#fff', border: '#e3e6e3', text: '#1a2b1e', muted: '#515953', faint: '#8a948d' }
const ALL_ROLES = ['USER', 'ADMIN', 'TECHNICIAN', 'MANAGER']

const ROLE_STYLES = {
  ADMIN:      { bg: '#dcfce7', color: '#15803d' },
  MANAGER:    { bg: '#fef3c7', color: '#d97706' },
  TECHNICIAN: { bg: '#dbeafe', color: '#1d4ed8' },
  USER:       { bg: '#f0f1f0', color: T.secondary },
}

function RoleBadge({ role }) {
  const c = ROLE_STYLES[role] || { bg: '#f0f1f0', color: T.secondary }
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 0.2 }}>
      {role}
    </span>
  )
}

function UserRow({ user, onUpdate, isEven }) {
  const [editing, setEditing]   = useState(false)
  const [selected, setSelected] = useState(new Set(user.roles))
  const [saving, setSaving]     = useState(false)

  const toggle = r => setSelected(prev => { const n = new Set(prev); n.has(r) ? n.delete(r) : n.add(r); return n })

  const save = async () => {
    setSaving(true)
    try { await onUpdate(user.id, [...selected]); setEditing(false) }
    finally { setSaving(false) }
  }

  return (
    <tr style={{ borderBottom: `1px solid ${T.border}`, background: isEven ? T.surface : '#fafbfa' }}>
      {/* User */}
      <td style={{ padding: '13px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: T.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden'
          }}>
            {user.imageUrl
              ? <img src={user.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, color: T.text, fontSize: 13, fontWeight: 600 }}>{user.name}</p>
            <p style={{ margin: 0, color: T.faint, fontSize: 11 }}>{user.email}</p>
          </div>
        </div>
      </td>

      {/* Provider */}
      <td style={{ padding: '13px 16px', color: T.muted, fontSize: 12 }}>{user.provider}</td>

      {/* Roles */}
      <td style={{ padding: '13px 16px' }}>
        {editing ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {ALL_ROLES.map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.has(r)} onChange={() => toggle(r)} style={{ accentColor: T.primary, width: 14, height: 14 }} />
                <span style={{ color: T.text, fontSize: 12.5, fontWeight: 500 }}>{r}</span>
              </label>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {user.roles?.map(r => <RoleBadge key={r} role={r} />)}
          </div>
        )}
      </td>

      {/* Actions */}
      <td style={{ padding: '13px 20px', textAlign: 'right' }}>
        {editing ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} style={btnSecondary}>Cancel</button>
            <button onClick={save} disabled={saving || selected.size === 0} style={btnPrimary}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} style={btnSecondary}>Edit roles</button>
        )}
      </td>
    </tr>
  )
}

export default function RoleManagerPage() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await rolesApi.getAllUsers({ page: 0, size: 100 })
      setUsers(data)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleUpdate = async (userId, roles) => {
    await rolesApi.updateRoles(userId, roles)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles } : u))
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px 36px', background: T.bg, minHeight: 'calc(100vh - 62px)' }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', color: T.text, fontSize: 22, fontWeight: 800 }}>Role Management</h1>
        <p style={{ margin: 0, color: T.muted, fontSize: 14 }}>Manage user roles and permissions across the platform.</p>
      </div>

      {/* Card */}
      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 2px 10px rgba(35,99,49,0.07)' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9, flex: 1, maxWidth: 320,
            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 9, padding: '8px 14px'
          }}>
            <span style={{ color: T.faint, fontSize: 13 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13, width: '100%' }}
            />
          </div>
          <span style={{ color: T.faint, fontSize: 13 }}>
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: T.faint, fontSize: 14 }}>Loading users…</div>
        ) : error ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#dc2626', fontSize: 14 }}>{error}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.primary }}>
                {['User', 'Provider', 'Roles', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 20px', textAlign: h === 'Actions' ? 'right' : 'left',
                    color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 700,
                    letterSpacing: 1, textTransform: 'uppercase'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <UserRow key={u.id} user={u} onUpdate={handleUpdate} isEven={i % 2 === 0} />
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 48, textAlign: 'center', color: T.faint, fontSize: 14 }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const btnPrimary = {
  background: T.primary, border: 'none', borderRadius: 8, padding: '7px 17px',
  color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
}

const btnSecondary = {
  background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 15px',
  color: T.secondary, fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
}
