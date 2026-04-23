import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';

// ── Theme ──────────────────────────────────────────────────────────────────────
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

// Common campus locations / equipment – editable presets
const PRESETS = [
  { label: 'Projector – Block A, Room 101', location: 'Engineering Block A, Room 101', resource: 'Projector' },
  { label: 'Projector – Block B, Room 203', location: 'Science Block B, Room 203',     resource: 'Projector' },
  { label: 'Air Conditioner – Admin Wing',   location: 'Admin Wing, Level 2',            resource: 'Air Conditioner' },
  { label: 'Computer Lab – IT Block',        location: 'IT Block, Computer Lab 3',       resource: 'Workstation' },
  { label: 'Printer – Library',              location: 'Main Library, Ground Floor',     resource: 'Printer' },
  { label: 'Elevator – Block C',             location: 'Block C, Main Elevator',         resource: 'Elevator' },
  { label: 'Restroom – Block D, Floor 1',   location: 'Block D, Floor 1 Restroom',     resource: 'Plumbing' },
  { label: 'Whiteboard – Seminar Hall 1',    location: 'Seminar Hall 1',                 resource: 'Whiteboard' },
];

const QRCodePage = () => {
  const navigate = useNavigate();
  const [location,     setLocation]     = useState('');
  const [resourceName, setResourceName] = useState('');
  const [generated,    setGenerated]    = useState(false);
  const [locError,     setLocError]     = useState('');

  const validate = () => {
    if (!location.trim()) { setLocError('Location is required'); return false; }
    if (location.trim().length < 3) { setLocError('Location must be at least 3 characters'); return false; }
    setLocError('');
    return true;
  };

  const handleGenerate = () => {
    if (validate()) setGenerated(true);
  };

  const handlePreset = (p) => {
    setLocation(p.location);
    setResourceName(p.resource);
    setLocError('');
    setGenerated(true);
  };

  const qrUrl = getQrCodeUrl({ location: location.trim(), resourceName: resourceName.trim() });
  const fileName = `qr-${(location || 'campus').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${T.green} 0%, ${T.ash} 100%)`, borderRadius: 18, padding: '26px 32px', marginBottom: 24, boxShadow: `0 8px 32px rgba(35,99,49,0.22)` }}>
        <button onClick={() => navigate('/tickets')}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 14 }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
          ← Back to Tickets
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.18)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
            📱
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>QR Code Issue Reporting</h1>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, margin: '3px 0 0' }}>
              Generate QR codes for campus locations &amp; equipment — scan to instantly report an incident
            </p>
          </div>
        </div>
      </div>

      {/* ── How it works banner ───────────────────────────────────────────── */}
      <div style={{ background: T.greenLight, border: `1px solid ${T.greenMid}`, borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { icon: '📍', text: 'Enter a location or pick a preset' },
          { icon: '🔲', text: 'Generate the QR code' },
          { icon: '🖨',  text: 'Print or display on the equipment' },
          { icon: '📲', text: 'Staff scan → form pre-filled instantly' },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 160px' }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ fontSize: 13, color: T.textMid, fontWeight: 600 }}>{text}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22, alignItems: 'start' }}>

        {/* ── Left: Generator form ─────────────────────────────────────── */}
        <div style={{ background: T.white, borderRadius: 18, padding: 26, boxShadow: '0 4px 24px rgba(35,99,49,0.10)', border: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.textDark, margin: '0 0 18px', paddingBottom: 12, borderBottom: `2px solid ${T.greenLight}` }}>
            ⚙️ Configure QR Code
          </h2>

          {/* Location input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.textDark, marginBottom: 6 }}>
              Location / Area <span style={{ color: T.red }}>*</span>
              <span style={{ fontWeight: 400, color: T.textLight, marginLeft: 6, fontSize: 11 }}>(3–300 chars)</span>
            </label>
            <input
              value={location}
              onChange={e => { setLocation(e.target.value); setLocError(''); setGenerated(false); }}
              maxLength={300}
              placeholder="e.g. Engineering Block A, Room 101"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${locError ? T.red : T.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafbfa', color: T.textDark }}
            />
            {locError && <p style={{ margin: '4px 0 0', color: T.red, fontSize: 12 }}>{locError}</p>}
          </div>

          {/* Resource name (optional) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.textDark, marginBottom: 6 }}>
              Equipment / Resource Name
              <span style={{ fontWeight: 400, color: T.textLight, marginLeft: 6, fontSize: 11 }}>(optional)</span>
            </label>
            <input
              value={resourceName}
              onChange={e => { setResourceName(e.target.value); setGenerated(false); }}
              maxLength={100}
              placeholder="e.g. Projector, Printer, A/C Unit"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafbfa', color: T.textDark }}
            />
          </div>

          <button onClick={handleGenerate}
            style={{ width: '100%', background: `linear-gradient(135deg, ${T.green}, #2e7d40)`, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', cursor: 'pointer', fontWeight: 800, fontSize: 15, boxShadow: `0 4px 16px rgba(35,99,49,0.35)` }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            🔲 Generate QR Code
          </button>

          {/* Presets */}
          <div style={{ marginTop: 22 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Quick Presets
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => handlePreset(p)}
                  style={{ textAlign: 'left', background: T.ashLight, color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 13px', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.greenLight; e.currentTarget.style.color = T.green; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.ashLight;   e.currentTarget.style.color = T.textMid; }}>
                  📍 {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: QR Preview ────────────────────────────────────────── */}
        <div style={{ background: T.white, borderRadius: 18, padding: 26, boxShadow: '0 4px 24px rgba(35,99,49,0.10)', border: `1px solid ${T.border}`, textAlign: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.textDark, margin: '0 0 18px', paddingBottom: 12, borderBottom: `2px solid ${T.greenLight}` }}>
            🔲 QR Code Preview
          </h2>

          {generated ? (
            <>
              {/* QR image */}
              <div style={{ background: T.greenLight, borderRadius: 16, padding: 20, marginBottom: 18, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${T.greenMid}` }}>
                <img src={qrUrl} alt="QR Code" key={qrUrl}
                  style={{ width: 220, height: 220, imageRendering: 'pixelated', borderRadius: 10, border: `3px solid ${T.white}`, boxShadow: '0 4px 18px rgba(35,99,49,0.18)' }} />
              </div>

              {/* Location label */}
              <div style={{ background: T.ashLight, borderRadius: 10, padding: '10px 16px', marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.ash }}>📍 {location}</p>
                {resourceName && <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textLight }}>🔧 {resourceName}</p>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href={qrUrl} download={fileName}
                  style={{ background: `linear-gradient(135deg, ${T.green}, #2e7d40)`, color: '#fff', borderRadius: 10, padding: '10px 20px', textDecoration: 'none', fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: `0 3px 12px rgba(35,99,49,0.30)` }}>
                  ⬇ Download PNG
                </a>
                <button onClick={() => window.print()}
                  style={{ background: T.ashLight, color: T.ash, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.background = T.border}
                  onMouseLeave={e => e.currentTarget.style.background = T.ashLight}>
                  🖨 Print
                </button>
              </div>

              {/* Tip */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginTop: 16, textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
                  💡 <strong>Tip:</strong> Attach this QR code label to the physical equipment. When a staff member
                  scans it with their phone, the ticket form will open with the location already filled in — saving time!
                </p>
              </div>
            </>
          ) : (
            <div style={{ padding: '60px 20px', color: T.textLight }}>
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.4 }}>🔲</div>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                Enter a location and click<br /><strong style={{ color: T.green }}>Generate QR Code</strong>
              </p>
              <p style={{ fontSize: 12, marginTop: 8, color: T.textLight }}>
                Or select a quick preset from the left
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;


