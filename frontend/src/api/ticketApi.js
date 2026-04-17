import axios from 'axios';

const BASE = '/api/tickets';

// Helper: extract a readable error message from an axios error
export const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  (err?.response?.data?.errors
    ? Object.values(err.response.data.errors).join('; ')
    : null) ||
  err?.message ||
  'An unexpected error occurred';

// GET all tickets (role-filtered server-side)
export const getTickets = () => axios.get(BASE).then(r => r.data);

// GET single ticket
export const getTicket = (id) => axios.get(`${BASE}/${id}`).then(r => r.data);

// POST create ticket (multipart/form-data)
export const createTicket = (ticketData, imageFiles) => {
  const form = new FormData();
  form.append('ticket', new Blob([JSON.stringify(ticketData)], { type: 'application/json' }));
  if (imageFiles) {
    Array.from(imageFiles).forEach(f => form.append('images', f));
  }
  return axios.post(BASE, form).then(r => r.data);
};

// PUT update ticket (multipart/form-data)
export const updateTicket = (id, ticketData, imageFiles) => {
  const form = new FormData();
  form.append('ticket', new Blob([JSON.stringify(ticketData)], { type: 'application/json' }));
  if (imageFiles) {
    Array.from(imageFiles).forEach(f => form.append('images', f));
  }
  return axios.put(`${BASE}/${id}`, form).then(r => r.data);
};

// DELETE ticket
export const deleteTicket = (id) => axios.delete(`${BASE}/${id}`).then(r => r.data);

// PATCH change status (workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED)
export const changeStatus = (id, status, resolutionNotes) =>
  axios.patch(`${BASE}/${id}/status`, { status, resolutionNotes }).then(r => r.data);

// PATCH assign technician (admin only)
export const assignTechnician = (id, technicianId) =>
  axios.patch(`${BASE}/${id}/assign`, { technicianId }).then(r => r.data);

// PATCH reject ticket with reason (admin only)
export const rejectTicket = (id, reason) =>
  axios.patch(`${BASE}/${id}/reject`, { reason }).then(r => r.data);

// DELETE remove attachment from a ticket
export const removeAttachment = (ticketId, filename) =>
  axios.delete(`${BASE}/${ticketId}/attachments/${filename}`).then(r => r.data);

// POST add comment to ticket
export const addComment = (ticketId, content) =>
  axios.post(`${BASE}/${ticketId}/comments`, { content }).then(r => r.data);

// PUT update an existing comment (author only)
export const updateComment = (ticketId, commentId, content) =>
  axios.put(`${BASE}/${ticketId}/comments/${commentId}`, { content }).then(r => r.data);

// DELETE comment (author or admin)
export const deleteComment = (ticketId, commentId) =>
  axios.delete(`${BASE}/${ticketId}/comments/${commentId}`).then(r => r.data);

// Build URL to serve an uploaded attachment image
export const getAttachmentUrl = (filename) => `/api/tickets/attachments/${filename}`;

// ── Feature: Ticket History Timeline ─────────────────────────────────────────
// GET activity history for a ticket
export const getTicketHistory = (ticketId) =>
  axios.get(`${BASE}/${ticketId}/history`).then(r => r.data);

// ── Feature: My Tickets (current user's reported tickets, all roles) ─────────
// GET /api/tickets/my – always returns tickets reported by the logged-in user
export const getMyTickets = () => axios.get(`${BASE}/my`).then(r => r.data);

// ── Feature: PDF Resolution Report ───────────────────────────────────────────
// Downloads the styled HTML report as a file.
// Opening the downloaded file in a browser triggers auto-print → Save as PDF.
export const downloadReport = async (ticketId, ticketTitle) => {
  const response = await axios.get(`${BASE}/${ticketId}/report`, {
    responseType: 'blob',
  });
  const blob     = new Blob([response.data], { type: 'text/html' });
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement('a');
  const safeName = (ticketTitle || `ticket-${ticketId}`)
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .slice(0, 60);
  anchor.href     = url;
  anchor.download = `ticket-${ticketId}-${safeName}-report.html`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoke after 30 s so memory is freed
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

