export const API_BASE_URL = 'http://localhost:8080';

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

export const TICKET_CATEGORIES = [
  'ELECTRICAL', 'PLUMBING', 'IT_EQUIPMENT', 'HVAC',
  'FURNITURE', 'SAFETY', 'NETWORK', 'CLEANING', 'OTHER'
];

export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const USER_ROLES = ['STUDENT', 'STAFF', 'TECHNICIAN', 'ADMIN'];

// ── Theme palette ─────────────────────────────────────────────────────────────
export const C = {
  green      : '#236331',
  greenHover : '#1a4d25',
  greenLight : '#2e7d40',
  greenTint  : '#e8f5eb',
  greenTint2 : '#c8e6cc',
  ash        : '#515953',
  ashHover   : '#3a3f3c',
  ashLight   : '#717870',
  ashTint    : '#f0f2f1',
  border     : '#d4d9d5',
  textPrimary: '#2a2e2b',
  textMuted  : '#717870',
};

export const STATUS_COLORS = {
  OPEN:        { bg: '#e8f5eb', text: '#236331' },
  IN_PROGRESS: { bg: '#fef3c7', text: '#92400e' },
  RESOLVED:    { bg: '#d1fae5', text: '#065f46' },
  CLOSED:      { bg: '#eaeceb', text: '#515953' },
  REJECTED:    { bg: '#fee2e2', text: '#991b1b' },
};

export const PRIORITY_COLORS = {
  LOW:      { bg: '#e8f5eb', text: '#236331' },
  MEDIUM:   { bg: '#fef3c7', text: '#92400e' },
  HIGH:     { bg: '#ffedd5', text: '#9a3412' },
  CRITICAL: { bg: '#fee2e2', text: '#991b1b' },
};
