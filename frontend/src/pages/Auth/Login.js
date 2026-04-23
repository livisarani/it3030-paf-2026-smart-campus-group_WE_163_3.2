import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, register as apiRegister } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [mode, setMode]   = useState('login');
  const [form, setForm]   = useState({ username: '', password: '', email: '', fullName: '', role: 'STUDENT', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = mode === 'login'
        ? await apiLogin(form.username, form.password)
        : await apiRegister(form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={pageStyle}>
      {/* Decorative circles */}
      <div style={circle1} />
      <div style={circle2} />

      <div style={cardStyle}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={iconWrap}>🏫</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2a2e2b', marginTop: 12, letterSpacing: '-0.4px' }}>
            Smart Campus Hub
          </h1>
          <p style={{ color: '#717870', fontSize: 14, marginTop: 4 }}>Operations Management System</p>
        </div>

        {/* Mode toggle */}
        <div style={toggleWrap}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                background: mode === m ? '#236331' : 'transparent',
                color:      mode === m ? '#fff'    : '#717870',
                boxShadow:  mode === m ? '0 2px 8px rgba(35,99,49,0.30)' : 'none',
              }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div style={errorBox}>{error}</div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <InputField name="fullName" placeholder="Full Name *" value={form.fullName} onChange={handle} />
          )}
          <InputField name="username" placeholder="Username *" value={form.username} onChange={handle} autoComplete="username" />
          {mode === 'register' && (
            <InputField name="email" type="email" placeholder="Email *" value={form.email} onChange={handle} />
          )}
          <InputField name="password" type="password" placeholder="Password *" value={form.password} onChange={handle} autoComplete="current-password" />
          {mode === 'register' && (
            <>
              <select name="role" value={form.role} onChange={handle} style={inp}>
                <option value="STUDENT">Student</option>
                <option value="STAFF">Staff</option>
                <option value="TECHNICIAN">Technician</option>
              </select>
              <InputField name="phone" placeholder="Phone (optional)" value={form.phone} onChange={handle} />
            </>
          )}

          <button type="submit" disabled={loading} style={submitBtn}>
            {loading ? '…' : mode === 'login' ? '→  Sign In' : '✓  Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#717870', fontSize: 12, marginTop: 20 }}>
          Smart Campus Operations Hub · 2026
        </p>
      </div>
    </div>
  );
};

const InputField = ({ name, placeholder, value, onChange, type = 'text', autoComplete }) => (
  <input name={name} type={type} placeholder={placeholder} value={value}
    onChange={onChange} required autoComplete={autoComplete}
    style={inp}
    onFocus={e => { e.target.style.borderColor = '#236331'; e.target.style.boxShadow = '0 0 0 3px rgba(35,99,49,0.12)'; }}
    onBlur={e  => { e.target.style.borderColor = '#d4d9d5'; e.target.style.boxShadow = 'none'; }}
  />
);

// ── Styles ────────────────────────────────────────────────────────────────────
const pageStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(145deg, #236331 0%, #3a3f3c 100%)',
  position: 'relative', overflow: 'hidden',
};
const circle1 = {
  position: 'absolute', width: 400, height: 400, borderRadius: '50%',
  background: 'rgba(255,255,255,0.04)', top: -100, right: -80, pointerEvents: 'none',
};
const circle2 = {
  position: 'absolute', width: 300, height: 300, borderRadius: '50%',
  background: 'rgba(255,255,255,0.04)', bottom: -60, left: -80, pointerEvents: 'none',
};
const cardStyle = {
  background: '#fff', borderRadius: 20, padding: '40px 36px',
  width: 420, maxWidth: '92vw',
  boxShadow: '0 24px 64px rgba(35,99,49,0.25)',
  position: 'relative', zIndex: 1,
  border: '1px solid rgba(255,255,255,0.6)',
};
const iconWrap = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 68, height: 68, borderRadius: 18,
  background: 'linear-gradient(135deg, #236331, #515953)',
  fontSize: 34, boxShadow: '0 6px 20px rgba(35,99,49,0.35)',
};
const toggleWrap = {
  display: 'flex', background: '#f0f2f1', borderRadius: 10,
  marginBottom: 22, padding: 4, gap: 4,
};
const errorBox = {
  background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10,
  padding: '10px 14px', color: '#991b1b', fontSize: 13, marginBottom: 14,
};
const inp = {
  padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #d4d9d5', fontSize: 14, outline: 'none',
  width: '100%', boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  background: '#fafbfa', color: '#2a2e2b',
};
const submitBtn = {
  background: 'linear-gradient(135deg, #236331, #2e7d40)',
  color: '#fff', border: 'none', borderRadius: 10,
  padding: '13px', cursor: 'pointer', fontWeight: 700, fontSize: 15,
  marginTop: 6, letterSpacing: '0.3px',
  boxShadow: '0 4px 14px rgba(35,99,49,0.40)',
  transition: 'opacity 0.2s',
};

export default Login;

