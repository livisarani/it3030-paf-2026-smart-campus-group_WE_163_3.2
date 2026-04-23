import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createTicket, updateTicket, getTicket, getAttachmentUrl, getErrorMessage } from '../../api/ticketApi';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../../utils/constants';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_BYTES     = 5 * 1024 * 1024;

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

const TicketForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // QR-code pre-fill: ?qr=true&location=...&resourceId=...&resourceName=...
  const fromQr       = searchParams.get('qr') === 'true';
  const qrLocation   = searchParams.get('location')     || '';
  const qrResourceId = searchParams.get('resourceId')   || '';
  const qrResName    = searchParams.get('resourceName') || '';

  const [form, setForm] = useState({
    title: '', description: '', category: 'IT_EQUIPMENT', priority: 'MEDIUM',
    location: fromQr ? qrLocation : '',
    contactName: '', contactEmail: '', contactPhone: '',
    resourceId: fromQr && qrResourceId ? qrResourceId : '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles]   = useState([]);
  const [previews, setPreviews]   = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]     = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      getTicket(id)
        .then(t => {
          setForm({
            title: t.title, description: t.description, category: t.category,
            priority: t.priority, location: t.location,
            contactName: t.contactName || '', contactEmail: t.contactEmail || '',
            contactPhone: t.contactPhone || '', resourceId: t.resourceId || '',
          });
          setExistingImages(t.imagePaths || []);
          setLoading(false);
        })
        .catch(() => { setServerError('Failed to load ticket.'); setLoading(false); });
    }
  }, [id, isEdit]);

  // Clear the error for a field as soon as the user types
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ── Client-side validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {};

    if (!form.title.trim())
      errs.title = 'Title is required';
    else if (form.title.trim().length < 5)
      errs.title = 'Title must be at least 5 characters';
    else if (form.title.length > 200)
      errs.title = 'Title must not exceed 200 characters';

    if (!form.description.trim())
      errs.description = 'Description is required';
    else if (form.description.trim().length < 10)
      errs.description = 'Description must be at least 10 characters';
    else if (form.description.length > 5000)
      errs.description = 'Description must not exceed 5000 characters';

    if (!form.location.trim())
      errs.location = 'Location is required';
    else if (form.location.trim().length < 3)
      errs.location = 'Location must be at least 3 characters';
    else if (form.location.length > 300)
      errs.location = 'Location must not exceed 300 characters';

    if (form.contactName && form.contactName.trim().length > 0 && form.contactName.trim().length < 2)
      errs.contactName = 'Contact name must be at least 2 characters';

    if (form.contactEmail && form.contactEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim()))
        errs.contactEmail = 'Please enter a valid email address';
    }

    if (form.contactPhone && form.contactPhone.trim()) {
      if (!/^[+\d\s\-() ]{7,20}$/.test(form.contactPhone.trim()))
        errs.contactPhone = 'Phone must be 7–20 characters (digits, spaces, +, -, (, ) only)';
    }

    return errs;
  };

  // ── File picker: validate type & size before adding ───────────────────────
  const handleFileChange = e => {
    const files = Array.from(e.target.files);
    const fileErrs = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type))
        fileErrs.push(`"${file.name}": not an allowed type (jpg, png, gif, webp only)`);
      else if (file.size > MAX_BYTES)
        fileErrs.push(`"${file.name}": exceeds 5 MB size limit`);
    }

    if (fileErrs.length > 0) {
      setFieldErrors(prev => ({ ...prev, images: fileErrs.join(' | ') }));
      e.target.value = '';
      return;
    }

    const total = existingImages.length + newFiles.length + files.length;
    if (total > 3) {
      setFieldErrors(prev => ({ ...prev, images: 'Maximum 3 images allowed per ticket' }));
      e.target.value = '';
      return;
    }

    setFieldErrors(prev => ({ ...prev, images: '' }));
    setNewFiles(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeNewFile = idx => {
    setNewFiles(f => f.filter((_, i) => i !== idx));
    setPreviews(p => p.filter((_, i) => i !== idx));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setServerError('Please fix the highlighted errors before submitting.');
      return;
    }

    setSubmitting(true);
    setServerError('');
    const payload = { ...form, resourceId: form.resourceId || null };
    try {
      if (isEdit) {
        await updateTicket(id, payload, newFiles.length > 0 ? newFiles : null);
        toast.success('Ticket updated successfully!');
      } else {
        await createTicket(payload, newFiles.length > 0 ? newFiles : null);
        toast.success('Ticket submitted successfully!');
      }
      navigate('/tickets');
    } catch (err) {
      const msg = getErrorMessage(err);
      setServerError(msg);
      toast.error(msg);
      // Surface server-returned field errors (from @Valid on DTO)
      const serverErrs = err?.response?.data?.errors;
      if (serverErrs) setFieldErrors(serverErrs);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${T.greenLight}`, borderTop: `3px solid ${T.green}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ color: T.textLight, marginTop: 14, fontSize: 14 }}>Loading…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const totalImages = existingImages.length + newFiles.length;
  const fe = fieldErrors;

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      {/* QR scan banner */}
      {fromQr && !isEdit && (
        <div style={{ background: `linear-gradient(135deg, ${T.green}, #2e7d40)`, borderRadius: 14, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, boxShadow: `0 4px 18px rgba(35,99,49,0.28)` }}>
          <span style={{ fontSize: 26 }}>📱</span>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>Quick Report via QR Code</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '2px 0 0' }}>
              Location pre-filled: <strong>{qrLocation || 'N/A'}</strong>
              {qrResName ? ` · Resource: ${qrResName}` : ''}
            </p>
          </div>
        </div>
      )}
      {/* Page Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.green} 0%, ${T.ash} 100%)`, borderRadius: 18, padding: '24px 30px', marginBottom: 24, boxShadow: `0 8px 32px rgba(35,99,49,0.22)` }}>
        <button onClick={() => navigate(-1)}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 14 }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.18)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {isEdit ? '✏️' : fromQr ? '📱' : '🆕'}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
              {isEdit ? 'Edit Ticket' : fromQr ? 'Quick Incident Report' : 'Report New Incident'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, margin: '3px 0 0' }}>
              {isEdit ? 'Update the details of your incident report'
                : fromQr ? 'Scanned via QR code — location pre-filled below'
                : 'Fill in the details to submit a new incident report'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ background: T.white, borderRadius: 18, padding: 32, boxShadow: `0 4px 24px rgba(35,99,49,0.10)`, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {serverError && (
          <div style={{ background: T.redLight, border: '1px solid #fca5a5', borderRadius: 12, padding: '13px 18px', color: '#991b1b', fontSize: 14, display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
            <span>⚠️</span><span>{serverError}</span>
          </div>
        )}

        {/* Title */}
        <FormField label="Title *" hint="5–200 characters" error={fe.title}>
          <input name="title" value={form.title} onChange={handleChange}
            maxLength={200} placeholder="e.g. Projector not working in Room 101"
            style={{ ...inputStyle, borderColor: fe.title ? '#dc2626' : '#d1d5db' }} />
          <CharCount current={form.title.length} max={200} />
        </FormField>

        {/* Description */}
        <FormField label="Description *" hint="10–5000 characters" error={fe.description}>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={4} maxLength={5000}
            placeholder="Describe the incident in detail — when it started, scope of impact…"
            style={{ ...inputStyle, resize: 'vertical', borderColor: fe.description ? '#dc2626' : '#d1d5db' }} />
          <CharCount current={form.description.length} max={5000} />
        </FormField>

        {/* Row: Category + Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Category *">
            <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
              {TICKET_CATEGORIES.map(c => <option key={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Priority *">
            <select name="priority" value={form.priority} onChange={handleChange} style={inputStyle}>
              {TICKET_PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </FormField>
        </div>

        {/* Location */}
        <FormField label="Location / Resource *" hint="Building, room number, or area (3–300 chars)" error={fe.location}>
          <input name="location" value={form.location} onChange={handleChange}
            maxLength={300} placeholder="e.g. Engineering Block A, Room 203"
            style={{ ...inputStyle, borderColor: fe.location ? '#dc2626' : '#d1d5db' }} />
        </FormField>

        {/* Contact Details */}
        <div style={{ borderTop: `2px solid ${T.greenLight}`, paddingTop: 18, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>📞</span>
            <p style={{ fontWeight: 700, color: T.textDark, margin: 0, fontSize: 15 }}>
              Contact Details
            </p>
            <span style={{ fontWeight: 400, fontSize: 12, color: T.textLight }}>(all optional)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <FormField label="Contact Name" error={fe.contactName}>
              <input name="contactName" value={form.contactName} onChange={handleChange}
                maxLength={100} placeholder="Your name"
                style={{ ...inputStyle, borderColor: fe.contactName ? '#dc2626' : '#d1d5db' }} />
            </FormField>
            <FormField label="Contact Email" error={fe.contactEmail}>
              <input name="contactEmail" value={form.contactEmail} onChange={handleChange}
                type="email" maxLength={100} placeholder="your@email.com"
                style={{ ...inputStyle, borderColor: fe.contactEmail ? '#dc2626' : '#d1d5db' }} />
            </FormField>
            <FormField label="Contact Phone" error={fe.contactPhone}>
              <input name="contactPhone" value={form.contactPhone} onChange={handleChange}
                maxLength={20} placeholder="+94 77 000 0000"
                style={{ ...inputStyle, borderColor: fe.contactPhone ? '#dc2626' : '#d1d5db' }} />
            </FormField>
          </div>
        </div>

        {/* Image Attachments */}
        <div style={{ borderTop: `2px solid ${T.greenLight}`, paddingTop: 18, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>📎</span>
            <p style={{ fontWeight: 700, color: T.textDark, margin: 0, fontSize: 15 }}>Image Attachments</p>
            <span style={{ color: T.textLight, fontWeight: 400, fontSize: 12 }}>(up to 3 · max 5 MB each · jpg, png, gif, webp)</span>
          </div>
          {fe.images && <p style={fieldErrStyle}>{fe.images}</p>}

          {existingImages.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              {existingImages.map(img => (
                <div key={img} style={thumbContainer}>
                  <img src={getAttachmentUrl(img)} alt="attachment" style={thumbImg} />
                  <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Existing</span>
                </div>
              ))}
            </div>
          )}

          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              {previews.map((url, idx) => (
                <div key={idx} style={thumbContainer}>
                  <img src={url} alt={`preview-${idx}`} style={thumbImg} />
                  <button type="button" onClick={() => removeNewFile(idx)} style={removeBtn}>✕</button>
                </div>
              ))}
            </div>
          )}

          {totalImages < 3 ? (
            <label style={uploadLabel}>
              <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp" multiple
                onChange={handleFileChange} style={{ display: 'none' }} />
              <span>📤 Add Images ({3 - totalImages} remaining)</span>
            </label>
          ) : (
            <p style={{ color: '#6b7280', fontSize: 13 }}>Maximum 3 images attached.</p>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10, paddingTop: 18, borderTop: `2px solid ${T.greenLight}` }}>
          <button type="button" onClick={() => navigate(-1)} style={btnSecondary} disabled={submitting}
            onMouseEnter={e => e.currentTarget.style.background = T.border}
            onMouseLeave={e => e.currentTarget.style.background = T.ashLight}>
            Cancel
          </button>
          <button type="submit" style={btnPrimary} disabled={submitting}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            {submitting ? '⏳ Saving…' : isEdit ? '💾 Update Ticket' : '📤 Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const FormField = ({ label, hint, error, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 7, color: T.textDark, letterSpacing: '0.01em' }}>
      {label}
      {hint && <span style={{ fontWeight: 400, color: T.textLight, marginLeft: 7, fontSize: 12 }}>{hint}</span>}
    </label>
    {children}
    {error && <p style={fieldErrStyle}>{error}</p>}
  </div>
);

const CharCount = ({ current, max }) => (
  <p style={{
    textAlign: 'right', fontSize: 11, margin: '3px 0 0',
    color: current >= max ? T.red : current >= max * 0.9 ? '#d97706' : T.textLight,
  }}>
    {current} / {max}
  </p>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle     = { width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fafbfa', color: T.textDark, transition: 'border-color 0.2s, box-shadow 0.2s' };
const fieldErrStyle  = { margin: '4px 0 0', color: T.red, fontSize: 12 };
const btnPrimary     = { background: `linear-gradient(135deg, ${T.green}, #2e7d40)`, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: `0 4px 14px rgba(35,99,49,0.35)`, transition: 'opacity 0.2s' };
const btnSecondary   = { background: T.ashLight, color: T.ash, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '12px 26px', cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const thumbContainer = { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' };
const thumbImg       = { width: 88, height: 88, objectFit: 'cover', borderRadius: 12, border: `2px solid ${T.border}`, boxShadow: `0 2px 8px rgba(35,99,49,0.12)` };
const removeBtn      = { position: 'absolute', top: -8, right: -8, background: T.red, color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' };
const uploadLabel    = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: T.greenLight, border: `2px dashed ${T.green}`, borderRadius: 12, cursor: 'pointer', fontSize: 14, color: T.green, fontWeight: 700, transition: 'background 0.15s' };

export default TicketForm;

