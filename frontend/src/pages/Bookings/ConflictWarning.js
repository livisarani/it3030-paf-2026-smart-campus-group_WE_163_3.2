import React from 'react';

const formatDateTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const ConflictWarning = ({ checked, hasConflict, message, resourceName, startTime, endTime }) => {
  if (!checked) return null;

  const timeRange = `${formatDateTime(startTime)} - ${formatDateTime(endTime)}`;

  if (!hasConflict) {
    return (
      <div className="conflict-status-card conflict-success" role="status" aria-live="polite">
        <div className="conflict-status-icon conflict-success-icon" aria-hidden="true">
          ✓
        </div>
        <div className="conflict-status-content">
          <div className="conflict-status-top">
            <div>
              <p className="conflict-status-eyebrow">Availability check complete</p>
              <strong>Resource Available</strong>
            </div>
            <span className="conflict-status-badge success">Available</span>
          </div>
          <p className="conflict-status-message">
            {message || `${resourceName || 'Selected resource'} is open for this slot.`}
          </p>
          <div className="conflict-status-meta">
            <span className="conflict-status-chip">{resourceName || 'Selected resource'}</span>
            {timeRange && <span className="conflict-status-chip">{timeRange}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="conflict-status-card conflict-warning" role="alert" aria-live="assertive">
      <div className="conflict-status-icon conflict-warning-icon" aria-hidden="true">
        !
      </div>
      <div className="conflict-status-content">
        <div className="conflict-status-top">
          <div>
            <p className="conflict-status-eyebrow">Availability check complete</p>
            <strong>Time Slot Conflict</strong>
          </div>
          <span className="conflict-status-badge warning">Conflict</span>
        </div>
        <p className="conflict-status-message">
          {message ||
            `${resourceName || 'Selected resource'} is already booked for this time range.`}
        </p>
        <div className="conflict-status-meta">
          <span className="conflict-status-chip">{resourceName || 'Selected resource'}</span>
          {timeRange && <span className="conflict-status-chip">{timeRange}</span>}
        </div>
      </div>
    </div>
  );
};

export default ConflictWarning;