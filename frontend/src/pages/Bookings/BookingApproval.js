import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiCheck, FiClock, FiDownload, FiX, FiTrash2 } from 'react-icons/fi';
import { bookingApi } from '../../api/bookingApi';
import BookingStatusBadge from './BookingStatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const buildLocalDateTimeInputValue = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
};

const createDefaultReportFilters = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  start.setSeconds(0, 0);
  now.setSeconds(0, 0);

  return {
    startDate: buildLocalDateTimeInputValue(start),
    endDate: buildLocalDateTimeInputValue(now),
    status: 'ALL',
  };
};

const REPORT_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const BookingApproval = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFilters, setReportFilters] = useState(createDefaultReportFilters);

  const getErrorText = (err, fallback) => {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    if (typeof err === 'object') {
      if (typeof err.message === 'string' && err.message.trim()) return err.message;
      if (typeof err.error === 'string' && err.error.trim()) return err.error;
    }
    return fallback;
  };

  useEffect(() => {
    loadBookingsByStatus(activeTab);
  }, [activeTab]);

  const loadBookingsByStatus = async (tab) => {
    try {
      setLoading(true);
      const data = await bookingApi.getAllBookings({ status: tab });
      setBookings(data);
      setError(null);
    } catch (err) {
      setError(getErrorText(err, 'Failed to load bookings'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (booking) => {
    setSelectedBooking(booking);
    setAction('approve');
    setShowModal(true);
  };

  const handleReject = (booking) => {
    setSelectedBooking(booking);
    setAction('reject');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (action === 'approve') {
        await bookingApi.approveBooking(selectedBooking.id, reason);
      } else {
        await bookingApi.rejectBooking(selectedBooking.id, reason);
      }
      setShowModal(false);
      setReason('');
      loadBookingsByStatus(activeTab);
    } catch (err) {
      setError(getErrorText(err, 'Failed to process booking action'));
    }
  };

  const handleDelete = (booking) => {
    setDeleteTarget(booking);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!deleteTarget) return;
      await bookingApi.deleteBooking(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setError(null);
      loadBookingsByStatus(activeTab);
    } catch (err) {
      setError(getErrorText(err, 'Failed to delete booking request'));
    }
  };

  const handleDetails = (booking) => {
    navigate(`/bookings/${booking.id}`, { state: { booking } });
  };

  const handleOpenReportModal = () => {
    setReportFilters(createDefaultReportFilters());
    setShowReportModal(true);
    setError(null);
  };

  const handleGenerateReport = async () => {
    try {
      if (!reportFilters.startDate || !reportFilters.endDate) {
        setError('Please select both a start date/time and an end date/time.');
        return;
      }

      if (new Date(reportFilters.endDate) < new Date(reportFilters.startDate)) {
        setError('End date/time must be after the start date/time.');
        return;
      }

      const reportParams = {
        startDate: reportFilters.startDate,
        endDate: reportFilters.endDate,
      };

      if (reportFilters.status !== 'ALL') {
        reportParams.status = reportFilters.status;
      }

      const blob = await bookingApi.generateReport(reportParams);

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `booking-requests-report-${reportFilters.status || 'ALL'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setShowReportModal(false);
    } catch (err) {
      setError(getErrorText(err, 'Failed to generate report'));
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

  const isPastBooking = (booking) => {
    if (!booking) return false;
    const end = booking.endTime ? new Date(booking.endTime) : booking.startTime ? new Date(booking.startTime) : null;
    if (!end || Number.isNaN(end.getTime())) return false;
    return end.getTime() < Date.now();
  };

  const canDeleteBooking = (booking) => {
    if (!booking) return false;
    if (booking.status === 'REJECTED' || booking.status === 'CANCELLED') return true;
    if (booking.status === 'APPROVED') return isPastBooking(booking);
    return false;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="booking-approval-page">
      <div className="booking-page-header">
        <div>
          <h1>Request Management</h1>
          <p>Oversee and manage space allocation requests across the campus ecosystem.</p>
        </div>
        <button type="button" className="report-generate-btn" onClick={handleOpenReportModal}>
          <FiDownload /> Generate Report
        </button>
      </div>

      <div className="booking-tabs booking-tabs-grid" role="tablist" aria-label="Bookings">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'PENDING'}
          className={`booking-tab ${activeTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => setActiveTab('PENDING')}
        >
          Pending
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'APPROVED'}
          className={`booking-tab ${activeTab === 'APPROVED' ? 'active' : ''}`}
          onClick={() => setActiveTab('APPROVED')}
        >
          Approved
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'REJECTED'}
          className={`booking-tab ${activeTab === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setActiveTab('REJECTED')}
        >
          Rejected
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'CANCELLED'}
          className={`booking-tab ${activeTab === 'CANCELLED' ? 'active' : ''}`}
          onClick={() => setActiveTab('CANCELLED')}
        >
          Cancelled
        </button>
      </div>

      {error && <ErrorAlert message={error} />}

      {bookings.length === 0 ? (
        <p className="no-data">No bookings found.</p>
      ) : (
        <>
          <div className="queue-header">
            <div className="queue-title">
              Current Queue <span className="queue-pill">{activeTab === 'PENDING' ? 'Active' : activeTab.toLowerCase()}</span>
            </div>
            <div className="queue-sort">Newest First</div>
          </div>

          <div className="queue-list">
            {bookings.map((booking) => (
              <article key={booking.id} className="queue-row">
                <div className="queue-card-header">
                  <div className="queue-user">
                    <div className="queue-avatar" aria-hidden="true">
                      {(booking.userName || 'U').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="queue-user-meta">
                      <p className="queue-user-name">{booking.userName || 'Campus User'}</p>
                    </div>
                  </div>
                </div>

                <div className="queue-details">
                  <div className="queue-details-card queue-details-simple">
                    <div className="queue-detail-line">
                      <span className="queue-detail-key">Time</span>
                      <span className="queue-detail-sep">-</span>
                      <span className="queue-detail-val">
                        {formatDate(booking.startTime)} · {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </span>
                    </div>

                    <div className="queue-detail-line">
                      <span className="queue-detail-key">Booked By</span>
                      <span className="queue-detail-sep">-</span>
                      <span className="queue-detail-val">{booking.userName || booking.userEmail || '—'}</span>
                    </div>

                    <div className="queue-detail-line">
                      <span className="queue-detail-key">Location</span>
                      <span className="queue-detail-sep">-</span>
                      <span className="queue-detail-val">{booking.resourceName || '—'}</span>
                    </div>

                    <div className="queue-detail-line">
                      <span className="queue-detail-key">Purpose</span>
                      <span className="queue-detail-sep">-</span>
                      <span className="queue-detail-val">{booking.purpose || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="queue-card-footer">
                  <div className="queue-footer-right">
                    <button
                      className="action-pill action-pill-detail"
                      type="button"
                      onClick={() => handleDetails(booking)}
                      aria-label="Details"
                      title={`Request #REQ-${2000 + booking.id}`}
                    >
                      Detail
                    </button>

                    {activeTab === 'PENDING' ? (
                      <>
                        <button
                          type="button"
                          className="action-pill action-pill-approve"
                          onClick={() => handleApprove(booking)}
                        >
                          <FiCheck /> Accept
                        </button>
                        <button
                          type="button"
                          className="action-pill action-pill-reject"
                          onClick={() => handleReject(booking)}
                        >
                          <FiX /> Reject
                        </button>
                      </>
                    ) : (activeTab === 'APPROVED' || activeTab === 'REJECTED' || activeTab === 'CANCELLED') &&
                      (booking.status === 'APPROVED' || booking.status === 'REJECTED' || booking.status === 'CANCELLED') ? (
                      <button
                        type="button"
                        className="action-pill action-pill-delete"
                        disabled={!canDeleteBooking(booking)}
                        title={
                          !canDeleteBooking(booking)
                            ? 'Approved future bookings cannot be deleted'
                            : 'Delete'
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canDeleteBooking(booking)) return;
                          handleDelete(booking);
                        }}
                      >
                        <FiTrash2 /> Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={action === 'approve' ? 'Approve Booking' : 'Reject Booking'}
      >
        <div className="modal-form">
          <p>
            Are you sure you want to {action} this booking for <strong>{selectedBooking?.resourceName}</strong>?
          </p>
          <div className="form-group">
            <label>Reason:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={action === 'approve' ? 'Optional reason for approval...' : 'Required reason for rejection...'}
              rows="3"
            />
          </div>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button 
              className={action === 'approve' ? 'btn-approve' : 'btn-reject'}
              onClick={handleSubmit}
            >
              Confirm {action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title=""
      >
        <div className="modal-form delete-request-modal">
          <div className="delete-request-icon" aria-hidden="true">
            <FiAlertTriangle />
          </div>
          <p className="delete-request-title">Delete Request</p>
          <p className="delete-request-subtitle">
            Are you sure you want to delete the request for <strong>{deleteTarget?.resourceName}</strong>? This action is
            permanent and cannot be undone.
          </p>

          {deleteTarget ? (
            <div className="delete-request-preview" aria-label="Request preview">
              <div className="delete-request-thumb" aria-hidden="true" />
              <div className="delete-request-preview-meta">
                <p className="delete-request-preview-title">{deleteTarget.resourceName || 'Campus Space'}</p>
                <p className="delete-request-preview-sub">
                  {formatDate(deleteTarget.startTime)} · {formatTime(deleteTarget.startTime)} - {formatTime(deleteTarget.endTime)}
                </p>
                <div className="delete-request-preview-badges">
                  <span className="delete-request-badge">{(deleteTarget.purpose || 'Request').toUpperCase()}</span>
                  <BookingStatusBadge status={deleteTarget.status} />
                </div>
              </div>
            </div>
          ) : null}

          <div className="modal-actions delete-request-actions">
            <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </button>
            <button className="btn-reject" onClick={handleConfirmDelete}>
              Delete Request
            </button>
          </div>

          <p className="delete-request-footnote">This will release the reserved time slot immediately.</p>
        </div>
      </Modal>

      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Generate PDF Report">
        <div className="modal-form report-modal">
          <p className="report-modal-intro">
            Select a date range and status to export booking requests as a PDF report.
          </p>

          <div className="report-grid">
            <div className="form-group">
              <label>Start Date &amp; Time</label>
              <input
                type="datetime-local"
                value={reportFilters.startDate}
                onChange={(e) => setReportFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>End Date &amp; Time</label>
              <input
                type="datetime-local"
                value={reportFilters.endDate}
                onChange={(e) => setReportFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="form-group report-status-field">
              <label>Status</label>
              <select
                value={reportFilters.status}
                onChange={(e) => setReportFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                {REPORT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions report-actions">
            <button className="btn-cancel" onClick={() => setShowReportModal(false)}>
              Cancel
            </button>
            <button className="btn-submit report-submit" onClick={handleGenerateReport}>
              Generate PDF
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingApproval;