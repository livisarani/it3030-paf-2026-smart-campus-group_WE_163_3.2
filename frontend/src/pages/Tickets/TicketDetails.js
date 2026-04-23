import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTicket, changeStatus, assignTechnician, rejectTicket,
  addComment, updateComment, deleteComment, getAttachmentUrl, removeAttachment,
  getTicketHistory, downloadReport
} from '../../api/ticketApi';
import { useAuth } from '../../context/AuthContext';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../utils/constants';
import axios from 'axios';

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
  blueBg:     '#eff6ff',
  blueText:   '#1d4ed8',
  purpleBg:   '#ede9fe',
  purpleText: '#5b21b6',
};

// ── Timeline event metadata ────────────────────────────────────────────────────
const EVENT_ICONS = {
  TICKET_CREATED:     '🆕',
  TICKET_UPDATED:     '✏',
  STATUS_CHANGED:     '🔄',
  TECHNICIAN_ASSIGNED:'👷',
  TICKET_REJECTED:    '🚫',
  COMMENT_ADDED:      '💬',
  COMMENT_UPDATED:    '📝',
  COMMENT_DELETED:    '🗑',
  ATTACHMENT_REMOVED: '📎',
};
const EVENT_COLORS = {
  TICKET_CREATED:     '#236331',
  TICKET_UPDATED:     '#515953',
  STATUS_CHANGED:     '#2563eb',
  TECHNICIAN_ASSIGNED:'#7c3aed',
  TICKET_REJECTED:    '#dc2626',
  COMMENT_ADDED:      '#0891b2',
  COMMENT_UPDATED:    '#0d9488',
  COMMENT_DELETED:    '#9f1239',
  ATTACHMENT_REMOVED: '#b45309',
};

// ── Inline char-count helper ──────────────────────────────────────────────────
const CharCount = ({ current, max }) => (  <p style={{
    textAlign: 'right', fontSize: 11, margin: '3px 0 0',
    color: current > max ? T.red : current >= max * 0.9 ? '#d97706' : T.textLight,
  }}>
    {current} / {max}
  </p>
);

const Badge = ({ text, colors }) => (
  <span style={{
    background: colors?.bg || T.ashLight, color: colors?.text || T.ash,
    borderRadius: 20, padding: '4px 13px', fontSize: 12, fontWeight: 700,
    letterSpacing: '0.04em', textTransform: 'uppercase',
    border: `1px solid ${colors?.border || 'transparent'}`,
  }}>
    {text?.replace(/_/g, ' ')}
  </span>
);

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isTechnician } = useAuth();

  const [ticket, setTicket]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg]         = useState('');
  const [technicians, setTechnicians]     = useState([]);
  const [selectedTech, setSelectedTech]   = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason]       = useState('');
  const [rejectError, setRejectError]         = useState('');

  const [pendingStatus, setPendingStatus]         = useState(null);
  const [showResolutionBox, setShowResolutionBox] = useState(false);
  const [resolutionNotes, setResolutionNotes]     = useState('');
  const [resolutionError, setResolutionError]     = useState('');

  const [newComment, setNewComment]         = useState('');
  const [commentError, setCommentError]     = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentError, setEditCommentError] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [lightbox, setLightbox]             = useState(null);

  // ── Feature states ────────────────────────────────────────────────────────
  const [history,        setHistory]        = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory,    setShowHistory]    = useState(false);
  const [reportLoading,  setReportLoading]  = useState(false);

  const load = useCallback(() => {
    getTicket(id)
      .then(setTicket)
      .catch(() => setError('Ticket not found or you do not have access.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isAdmin) {
      axios.get('/api/tickets/technicians')
        .then(r => setTechnicians(r.data || []))
        .catch(() => setTechnicians([]));
    }
  }, [isAdmin]);

  const doAction = async fn => {
    setActionLoading(true);
    setActionMsg('');
    try { await fn(); load(); }
    catch (e) { setActionMsg(e.response?.data?.message || 'Action failed. Please try again.'); }
    finally   { setActionLoading(false); }
  };

  const canChangeStatus = () => {
    if (!ticket) return [];
    const s = ticket.status;
    if (isAdmin) {
      if (s === 'OPEN')        return ['IN_PROGRESS', 'RESOLVED', 'CLOSED'];
      if (s === 'IN_PROGRESS') return ['RESOLVED', 'CLOSED'];
      if (s === 'RESOLVED')    return ['CLOSED'];
      return [];
    }
    if (isTechnician && ticket.technicianUsername === user.username) {
      if (s === 'IN_PROGRESS') return ['RESOLVED'];
    }
    if (!isAdmin && !isTechnician && ticket.reporterUsername === user.username) {
      if (s === 'RESOLVED') return ['CLOSED'];
    }
    return [];
  };

  const handleStatusClick = newStatus => {
    if (newStatus === 'RESOLVED') {
      setPendingStatus('RESOLVED');
      setShowResolutionBox(true);
    } else {
      doAction(() => changeStatus(id, newStatus, undefined));
    }
  };

  // ── Resolve: validate resolution notes (optional but min 10 if provided) ──
  const handleConfirmResolved = () => {
    if (resolutionNotes.trim() && resolutionNotes.trim().length < 10) {
      setResolutionError('Resolution notes must be at least 10 characters if provided');
      return;
    }
    if (resolutionNotes.length > 2000) {
      setResolutionError('Resolution notes must not exceed 2000 characters');
      return;
    }
    setResolutionError('');
    doAction(() => changeStatus(id, 'RESOLVED', resolutionNotes.trim() || undefined));
    setShowResolutionBox(false);
    setResolutionNotes('');
    setPendingStatus(null);
  };

  const handleAssign = () => doAction(() => assignTechnician(id, Number(selectedTech)));

  // ── Reject: validate reason (min 10, max 500) ─────────────────────────────
  const handleReject = () => {
    if (!rejectReason.trim()) {
      setRejectError('Rejection reason is required');
      return;
    }
    if (rejectReason.trim().length < 10) {
      setRejectError('Rejection reason must be at least 10 characters');
      return;
    }
    if (rejectReason.length > 500) {
      setRejectError('Rejection reason must not exceed 500 characters');
      return;
    }
    setRejectError('');
    doAction(() => rejectTicket(id, rejectReason).then(() => setShowRejectModal(false)));
  };

  const handleRemoveAttachment = filename => {
    if (!window.confirm('Remove this attachment?')) return;
    doAction(() => removeAttachment(id, filename));
  };

  // ── Add comment: min 3, max 2000 ─────────────────────────────────────────
  const handleAddComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) { setCommentError('Comment cannot be empty'); return; }
    if (trimmed.length < 3) { setCommentError('Comment must be at least 3 characters'); return; }
    if (newComment.length > 2000) { setCommentError('Comment must not exceed 2000 characters'); return; }
    setCommentError('');
    setCommentLoading(true);
    try {
      await addComment(id, newComment);
      setNewComment('');
      load();
    } catch { setCommentError('Failed to add comment. Please try again.'); }
    finally  { setCommentLoading(false); }
  };

  // ── Edit comment: min 3, max 2000 ─────────────────────────────────────────
  const handleUpdateComment = async commentId => {
    const trimmed = editingComment?.content?.trim();
    if (!trimmed) { setEditCommentError('Comment cannot be empty'); return; }
    if (trimmed.length < 3) { setEditCommentError('Comment must be at least 3 characters'); return; }
    if ((editingComment?.content || '').length > 2000) {
      setEditCommentError('Comment must not exceed 2000 characters');
      return;
    }
    setEditCommentError('');
    setCommentLoading(true);
    try {
      await updateComment(id, commentId, editingComment.content);
      setEditingComment(null);
      load();
    } catch { setEditCommentError('Failed to update comment.'); }
    finally  { setCommentLoading(false); }
  };

  const handleDeleteComment = async commentId => {
    if (!window.confirm('Delete this comment?')) return;
    try { await deleteComment(id, commentId); load(); }
    catch { setActionMsg('Failed to delete comment'); }
  };

  // ── History ───────────────────────────────────────────────────────────────
  const handleToggleHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    setHistoryLoading(true);
    try {
      const data = await getTicketHistory(id);
      setHistory(data);
      setShowHistory(true);
    } catch { setActionMsg('Failed to load ticket history.'); }
    finally   { setHistoryLoading(false); }
  };

  // ── PDF Report ────────────────────────────────────────────────────────────
  const handleDownloadReport = async () => {
    setReportLoading(true);
    try { await downloadReport(id, ticket?.title); }
    catch { setActionMsg('Failed to generate report. Please try again.'); }
    finally { setReportLoading(false); }
  };


  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${T.greenLight}`, borderTop: `3px solid ${T.green}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ color: T.textLight, marginTop: 14, fontSize: 14 }}>Loading ticket...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (error) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
      <p style={{ color: T.red, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{error}</p>
      <button onClick={() => navigate('/tickets')} style={btnSecondary}>← Back to Tickets</button>
    </div>
  );

  const statusOptions = canChangeStatus();

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' }}>
          <img src={lightbox} alt="full" style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'fixed', top: 20, right: 24, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}

      {/* Page Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.green} 0%, ${T.ash} 100%)`, borderRadius: 18, padding: '26px 30px', marginBottom: 22, boxShadow: `0 8px 32px rgba(35,99,49,0.22)` }}>
        <button onClick={() => navigate('/tickets')}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 14, backdropFilter: 'blur(4px)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
          ← Back to Tickets
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ticket #{ticket.id}</p>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: '#fff', margin: '0 0 12px', lineHeight: 1.3 }}>{ticket.title}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge text={ticket.status}   colors={STATUS_COLORS[ticket.status]} />
              <Badge text={ticket.priority} colors={PRIORITY_COLORS[ticket.priority]} />
              <span style={{ background: T.purpleBg, color: T.purpleText, borderRadius: 20, padding: '4px 13px', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {ticket.category?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          {(isAdmin || ticket.reporterUsername === user.username) && ticket.status === 'OPEN' && (
            <button onClick={() => navigate(`/tickets/${id}/edit`)}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700, backdropFilter: 'blur(4px)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
              ✏️ Edit
            </button>
          )}
          <button onClick={handleToggleHistory} disabled={historyLoading}
            style={{ background: showHistory ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700, backdropFilter: 'blur(4px)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
            onMouseLeave={e => e.currentTarget.style.background = showHistory ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.15)'}>
            {historyLoading ? '⏳' : '🕐'} {showHistory ? 'Hide' : 'History'}
          </button>
          {(isAdmin || ticket.reporterUsername === user.username) && (
            <button onClick={handleDownloadReport} disabled={reportLoading}
              style={{ background: reportLoading ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 10, padding: '9px 20px', cursor: reportLoading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, backdropFilter: 'blur(4px)', opacity: reportLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 7 }}
              onMouseEnter={e => { if (!reportLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}>
              {reportLoading ? (
                <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Generating…</>
              ) : (
                <>📄 Download Report</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Action error message */}
      {actionMsg && (
        <div style={{ background: T.redLight, border: `1px solid #fca5a5`, borderRadius: 12, padding: '12px 18px', color: '#991b1b', fontSize: 14, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠️</span> {actionMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Description */}
          <Section title="📝 Description">
            <p style={{ color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontSize: 14 }}>{ticket.description}</p>
          </Section>

          {ticket.status === 'REJECTED' && ticket.rejectionReason && (
            <Section title="🚫 Rejection Reason">
              <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 16px', color: '#991b1b', lineHeight: 1.65 }}>
                {ticket.rejectionReason}
              </div>
            </Section>
          )}

          {ticket.resolutionNotes && (
            <Section title="✅ Resolution Notes">
              <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '14px 16px', color: '#065f46', lineHeight: 1.65 }}>
                {ticket.resolutionNotes}
              </div>
            </Section>
          )}

          {ticket.imagePaths?.length > 0 && (
            <Section title={`📎 Attachments (${ticket.imagePaths.length})`}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {ticket.imagePaths.map(img => (
                  <div key={img} style={{ position: 'relative' }}>
                    <img src={getAttachmentUrl(img)} alt="attachment"
                      onClick={() => setLightbox(getAttachmentUrl(img))}
                      style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 10, border: `2px solid #d6ddd7`, cursor: 'zoom-in', display: 'block', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(35,99,49,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = 'none'; }} />
                    {(isAdmin || ticket.reporterUsername === user.username) && ticket.status === 'OPEN' && (
                      <button onClick={() => handleRemoveAttachment(img)}
                        style={{ position: 'absolute', top: -7, right: -7, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Admin / Technician Actions */}
          {(isAdmin || isTechnician) && (
            <Section title="⚙️ Actions">
              {statusOptions.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.ash, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Status:</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {statusOptions.map(s => (
                      <button key={s} disabled={actionLoading}
                        onClick={() => handleStatusClick(s)}
                        style={{ ...btnSm(s === 'RESOLVED' ? T.green : s === 'CLOSED' ? T.ash : '#2e7d40'), padding: '9px 20px' }}>
                        {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Resolution notes box */}
                  {showResolutionBox && pendingStatus === 'RESOLVED' && (
                    <div style={{ marginTop: 14, background: T.greenLight, border: `1px solid ${T.greenMid}`, borderRadius: 14, padding: 18 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.green, marginBottom: 10 }}>
                        📋 Resolution Notes{' '}
                        <span style={{ fontWeight: 400, color: T.textLight, fontSize: 12 }}>(optional — describe how the issue was fixed)</span>
                      </p>
                      <textarea
                        value={resolutionNotes}
                        onChange={e => { setResolutionNotes(e.target.value); setResolutionError(''); }}
                        rows={3} maxLength={2000}
                        placeholder="e.g. Replaced the faulty projector lamp. Unit is now operational."
                        style={{ ...inputStyle, width: '100%', resize: 'vertical', boxSizing: 'border-box', borderColor: resolutionError ? T.red : T.border }}
                      />
                      <CharCount current={resolutionNotes.length} max={2000} />
                      {resolutionError && <p style={fieldErrStyle}>{resolutionError}</p>}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={handleConfirmResolved} disabled={actionLoading} style={btnSm(T.green)}>
                          ✓ Confirm Resolved
                        </button>
                        <button onClick={() => { setShowResolutionBox(false); setPendingStatus(null); setResolutionNotes(''); setResolutionError(''); }}
                          style={btnSm(T.ash)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Assign technician */}
              {isAdmin && !['CLOSED', 'REJECTED'].includes(ticket.status) && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.ash, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {ticket.technicianUsername ? `↻ Reassign Technician` : '👷 Assign Technician'}
                  </p>
                  {ticket.technicianUsername && (
                    <p style={{ fontSize: 12, color: T.textLight, marginBottom: 8 }}>
                      Currently: <strong style={{ color: T.green }}>{ticket.technicianUsername}</strong>
                    </p>
                  )}
                  {technicians.length === 0 ? (
                    <p style={{ fontSize: 13, color: T.textLight, fontStyle: 'italic', background: T.ashLight, padding: '10px 14px', borderRadius: 10 }}>
                      No technicians available.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={selectedTech} onChange={e => setSelectedTech(e.target.value)}
                        style={{ ...selectStyle, flexGrow: 1 }}>
                        <option value="">— Select technician —</option>
                        {technicians.map(t => (
                          <option key={t.id} value={t.id}>{t.fullName} (@{t.username})</option>
                        ))}
                      </select>
                      <button onClick={handleAssign} disabled={!selectedTech || actionLoading}
                        style={{ ...btnSm(T.green), opacity: !selectedTech ? 0.5 : 1 }}>
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Reject button */}
              {isAdmin && !['CLOSED', 'REJECTED'].includes(ticket.status) && (
                <div style={{ paddingTop: 6, borderTop: `1px dashed ${T.border}` }}>
                  <button onClick={() => setShowRejectModal(true)} disabled={actionLoading}
                    style={{ ...btnSm(T.red), padding: '9px 22px' }}>
                    🚫 Reject Ticket
                  </button>
                </div>
              )}
            </Section>
          )}

          {/* Reporter: close resolved ticket */}
          {!isAdmin && !isTechnician && ticket.reporterUsername === user.username && ticket.status === 'RESOLVED' && (
            <Section title="✅ Actions">
              <p style={{ fontSize: 13, color: T.textLight, marginBottom: 12, lineHeight: 1.6 }}>
                Your ticket has been resolved. You can close it to archive it.
              </p>
              <button onClick={() => doAction(() => changeStatus(id, 'CLOSED', undefined))}
                disabled={actionLoading} style={{ ...btnSm(T.ash), padding: '9px 22px' }}>
                Archive & Close Ticket
              </button>
            </Section>
          )}

          {/* Comments */}
          <Section title={`💬 Comments (${ticket.comments?.length || 0})`}>
            {ticket.comments?.length === 0 && (
              <p style={{ color: T.textLight, fontSize: 13, fontStyle: 'italic', marginBottom: 16 }}>No comments yet. Be the first to add one.</p>
            )}
            {ticket.comments?.map(c => (
              <div key={c.id} style={{ background: '#f8faf8', borderRadius: 14, padding: '14px 16px', marginBottom: 12, border: `1px solid ${T.border}`, transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 2px 10px rgba(35,99,49,0.10)`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${T.green}, ${T.ash})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800 }}>
                      {c.authorFullName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: T.textDark }}>{c.authorFullName}</span>
                      <span style={{ color: T.textLight, fontSize: 12, marginLeft: 6 }}>@{c.authorUsername}</span>
                      {c.edited && <span style={{ color: T.textLight, fontSize: 11, marginLeft: 6, fontStyle: 'italic' }}>(edited)</span>}
                    </div>
                  </div>
                  <span style={{ color: T.textLight, fontSize: 11 }}>{new Date(c.createdAt).toLocaleString()}</span>
                </div>

                {editingComment?.id === c.id ? (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      value={editingComment.content}
                      onChange={e => { setEditingComment({ ...editingComment, content: e.target.value }); setEditCommentError(''); }}
                      rows={3} maxLength={2000}
                      style={{ ...inputStyle, width: '100%', resize: 'vertical', boxSizing: 'border-box', borderColor: editCommentError ? T.red : T.border }}
                    />
                    <CharCount current={(editingComment.content || '').length} max={2000} />
                    {editCommentError && <p style={fieldErrStyle}>{editCommentError}</p>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => handleUpdateComment(c.id)} style={btnSm(T.green)} disabled={commentLoading}>💾 Save</button>
                      <button onClick={() => { setEditingComment(null); setEditCommentError(''); }} style={btnSm(T.ash)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: T.textMid, marginTop: 10, lineHeight: 1.65, whiteSpace: 'pre-wrap', fontSize: 14 }}>{c.content}</p>
                )}

                {!editingComment && (c.authorUsername === user.username || isAdmin) && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {c.authorUsername === user.username && (
                      <button onClick={() => { setEditingComment({ id: c.id, content: c.content }); setEditCommentError(''); }}
                        style={{ background: T.greenLight, color: T.green, border: `1px solid ${T.greenMid}`, borderRadius: 7, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                        ✏️ Edit
                      </button>
                    )}
                    <button onClick={() => handleDeleteComment(c.id)}
                      style={{ background: '#fff0f0', color: T.red, border: `1px solid #fca5a5`, borderRadius: 7, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* New comment box */}
            <div style={{ marginTop: 16, background: T.greenLight, borderRadius: 12, padding: 16, border: `1px solid ${T.greenMid}` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.green, marginBottom: 8 }}>✍️ Add a Comment</p>
              <textarea
                value={newComment}
                onChange={e => { setNewComment(e.target.value); setCommentError(''); }}
                rows={3} maxLength={2000}
                placeholder="Write a comment… (3–2000 characters)"
                style={{ ...inputStyle, width: '100%', resize: 'vertical', boxSizing: 'border-box', borderColor: commentError ? T.red : T.border }}
              />
              <CharCount current={newComment.length} max={2000} />
              {commentError && <p style={fieldErrStyle}>{commentError}</p>}
              <button onClick={handleAddComment} disabled={commentLoading}
                style={{ ...btnSm(T.green), marginTop: 10, padding: '9px 22px' }}>
                {commentLoading ? 'Posting…' : '➤ Post Comment'}
              </button>
            </div>
          </Section>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section title="📋 Details">
            <MetaRow label="Location"   value={ticket.location} />
            <MetaRow label="Reporter"   value={`${ticket.reporterFullName} (@${ticket.reporterUsername})`} />
            <MetaRow label="Technician" value={ticket.technicianFullName
              ? <span style={{ color: T.green, fontWeight: 700 }}>{ticket.technicianFullName} (@{ticket.technicianUsername})</span>
              : <span style={{ color: '#c0c8c2', fontStyle: 'italic' }}>Unassigned</span>} />
            <MetaRow label="Created"    value={new Date(ticket.createdAt).toLocaleString()} />
            <MetaRow label="Updated"    value={new Date(ticket.updatedAt).toLocaleString()} />
            {ticket.resourceName && <MetaRow label="Resource" value={ticket.resourceName} />}
          </Section>

          {(ticket.contactName || ticket.contactEmail || ticket.contactPhone) && (
            <Section title="📞 Contact">
              {ticket.contactName  && <MetaRow label="Name"  value={ticket.contactName} />}
              {ticket.contactEmail && <MetaRow label="Email" value={<a href={`mailto:${ticket.contactEmail}`} style={{ color: T.green, fontWeight: 600 }}>{ticket.contactEmail}</a>} />}
              {ticket.contactPhone && <MetaRow label="Phone" value={ticket.contactPhone} />}
            </Section>
          )}
        </div>
      </div>

      {/* ── History Timeline Modal ───────────────────────────────────────── */}
      {showHistory && (
        <div style={{ marginTop: 20 }}>
          <Section title="🕐 Activity Timeline — Full History">
            {history.length === 0 ? (
              <p style={{ color: T.textLight, fontSize: 13, fontStyle: 'italic' }}>No history recorded yet.</p>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 28 }}>
                {/* Vertical line */}
                <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 2, background: T.greenMid, borderRadius: 2 }} />
                {history.map((h, idx) => {
                  const icon = EVENT_ICONS[h.event] || '●';
                  const color = EVENT_COLORS[h.event] || T.ash;
                  return (
                    <div key={h.id} style={{ display: 'flex', gap: 12, marginBottom: idx < history.length - 1 ? 18 : 0 }}>
                      <div style={{ position: 'relative', flexShrink: 0, width: 20 }}>
                        <div style={{ position: 'absolute', left: -18, top: 2, width: 20, height: 20, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', boxShadow: `0 2px 6px ${color}66`, fontWeight: 800 }}>
                          {icon}
                        </div>
                      </div>
                      <div style={{ flex: 1, background: '#fafbfa', border: `1px solid ${T.border}`, borderRadius: 12, padding: '11px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 5 }}>
                          <span style={{ fontWeight: 800, fontSize: 12, color: color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {h.event.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: 11, color: T.textLight }}>
                            {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: T.textMid, margin: 0, lineHeight: 1.6 }}>{h.description}</p>
                        {h.actorUsername && (
                          <p style={{ fontSize: 11, color: T.textLight, margin: '5px 0 0' }}>
                            👤 by <strong style={{ color: T.ash }}>@{h.actorUsername}</strong>
                            {h.actorFullName && ` (${h.actorFullName})`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,40,22,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: T.white, borderRadius: 20, padding: 32, width: 520, maxWidth: '93vw', boxShadow: '0 24px 64px rgba(35,99,49,0.25)', border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🚫</div>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: T.textDark, margin: 0 }}>Reject Ticket #{id}</h3>
            </div>
            <p style={{ color: T.textLight, fontSize: 14, marginBottom: 14, lineHeight: 1.6 }}>
              Provide a clear reason for rejecting this ticket (10–500 characters). The reporter will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => { setRejectReason(e.target.value); setRejectError(''); }}
              rows={4} maxLength={500}
              placeholder="e.g. Duplicate report — see ticket #5 for the same issue."
              style={{ ...inputStyle, width: '100%', resize: 'vertical', boxSizing: 'border-box', borderColor: rejectError ? T.red : T.border }}
            />
            <CharCount current={rejectReason.length} max={500} />
            {rejectError && <p style={fieldErrStyle}>{rejectError}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectError(''); setActionMsg(''); }}
                style={btnSecondary}>Cancel</button>
              <button onClick={handleReject} disabled={actionLoading} style={{ ...btnSm(T.red), padding: '10px 24px' }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Layout sub-components ─────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 2px 16px rgba(35,99,49,0.09)', border: `1px solid #e4e9e5` }}>
    <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, color: '#1e2b20', borderBottom: `2px solid #e8f5eb`, paddingBottom: 10, margin: '0 0 14px' }}>{title}</h3>
    {children}
  </div>
);
const MetaRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 11, fontSize: 14, gap: 8 }}>
    <span style={{ color: '#7a8578', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
    <span style={{ color: '#1e2b20', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle    = { padding: '11px 14px', borderRadius: 10, border: `1.5px solid #d6ddd7`, fontSize: 14, outline: 'none', background: '#fafbfa', color: '#1e2b20', transition: 'border-color 0.2s' };
const fieldErrStyle = { margin: '4px 0 0', color: '#dc2626', fontSize: 12 };
const btnSecondary  = { background: '#eaeceb', color: '#515953', border: `1.5px solid #d6ddd7`, borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const selectStyle   = { padding: '10px 14px', borderRadius: 10, border: `1.5px solid #d6ddd7`, fontSize: 14, outline: 'none', background: '#fff', color: '#1e2b20' };
const btnSm         = bg => ({ background: bg, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: `0 2px 8px ${bg}44`, transition: 'opacity 0.15s, transform 0.1s' });

export default TicketDetails;




