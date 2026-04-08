import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiClock, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { bookingApi } from '../../api/bookingApi';
import BookingStatusBadge from './BookingStatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import Modal from '../../components/common/Modal';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState({ bookingId: null, action: null });
  const [cancelingBookingId, setCancelingBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmittingId, setCancelSubmittingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const { isAdmin } = useAuth();
  const adminView = isAdmin();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      let data;
      if (adminView) {
        data = await bookingApi.getAllBookings({});
      } else {
        data = await bookingApi.getUserBookings(1); // In real app, get userId from user object
      }
      setBookings(data);
      setError(null);
    } catch (err) {
      setError('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startCancel = (bookingId) => {
    setCancelingBookingId(bookingId);
    setCancelReason('');
    setError(null);
  };

  const submitCancel = async (bookingId) => {
    const trimmed = cancelReason.trim();
    if (!trimmed) {
      setError('Please provide a reason for cancellation');
      return;
    }

    try {
      setCancelSubmittingId(bookingId);
      const updated = await bookingApi.cancelBooking(bookingId, trimmed);
      setBookings((prev) =>
        prev.map((item) =>
          item.id === bookingId
            ? {
                ...item,
                ...(updated || {}),
                status: (updated && updated.status) || 'CANCELLED',
                cancelReason: (updated && updated.cancelReason) || trimmed,
              }
            : item
        )
      );
      setCancelingBookingId(null);
      setCancelReason('');
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Failed to cancel booking');
    } finally {
      setCancelSubmittingId(null);
    }
  };

  const handleAdminApprove = async (booking) => {
    try {
      setSubmitting({ bookingId: booking.id, action: 'approve' });
      await bookingApi.approveBooking(booking.id, '');
      await loadBookings();
    } catch (err) {
      setError('Failed to approve booking');
    } finally {
      setSubmitting({ bookingId: null, action: null });
    }
  };

  const startReject = (booking) => {
    setSelectedBooking(booking);
    setRejectReason('');
    setShowRejectModal(true);
    setError(null);
  };

  const submitReject = async () => {
    const trimmedReason = rejectReason.trim();
    if (!selectedBooking) return;
    if (!trimmedReason) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting({ bookingId: selectedBooking.id, action: 'reject' });
      await bookingApi.rejectBooking(selectedBooking.id, trimmedReason);
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectReason('');
      await loadBookings();
    } catch (err) {
      setError('Failed to reject booking');
    } finally {
      setSubmitting({ bookingId: null, action: null });
    }
  };

  const filteredBookings = useMemo(() => {
    if (activeTab === 'ALL') return bookings;
    return bookings.filter((b) => b.status === activeTab);
  }, [bookings, activeTab]);

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="booking-page">
      <div className="booking-page-header">
        <div>
          <h1>{adminView ? 'Bookings' : 'My Bookings'}</h1>
          <p>Manage your scheduled spaces, review approval statuses, and coordinate campus resource utilization.</p>
        </div>
        {!adminView && (
          <Link to="/bookings/new" className="new-booking-btn">
            + New Booking
          </Link>
        )}
      </div>

      <div className="booking-tabs booking-tabs-grid" role="tablist" aria-label="Bookings">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ALL'}
          className={`booking-tab ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          All Bookings
        </button>
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

      {error ? <ErrorAlert message={error} /> : null}

      {filteredBookings.length === 0 ? (
        <p className="no-data">No bookings found.</p>
      ) : (
        <section className="queue-list">
          {filteredBookings.map((booking) => (
            <article key={booking.id} className="queue-row">
              <div className="queue-card-header">
                <div className="queue-user">
                  <div className="queue-avatar" aria-hidden="true">
                    {(booking.resourceName || 'R')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 1)
                      .map((p) => p[0]?.toUpperCase())
                      .join('')}
                  </div>
                  <div className="queue-user-meta">
                    <p className="queue-user-name">{booking.resourceName || 'Campus Space'}</p>
                  </div>
                </div>

                <div className="queue-status">
                  <BookingStatusBadge status={booking.status} />
                </div>
              </div>

              <div className="queue-details">
                <div className="queue-details-card queue-details-simple">
                  <div className="queue-detail-line">
                    <span className="queue-detail-key">Time</span>
                    <span className="queue-detail-sep">-</span>
                    <span className="queue-detail-val">
                      <FiClock className="queue-detail-icon" aria-hidden="true" />
                      {formatDate(booking.startTime)} · {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </span>
                  </div>

                  <div className="queue-detail-line">
                    <span className="queue-detail-key">Location</span>
                    <span className="queue-detail-sep">-</span>
                    <span className="queue-detail-val">{booking.resourceName || '—'}</span>
                  </div>

                    {adminView ? (
                      <div className="queue-detail-line">
                        <span className="queue-detail-key">Booked By</span>
                        <span className="queue-detail-sep">-</span>
                        <span className="queue-detail-val">{booking.userName || booking.userEmail || '—'}</span>
                      </div>
                    ) : null}

                  <div className="queue-detail-line">
                    <span className="queue-detail-key">Purpose</span>
                    <span className="queue-detail-sep">-</span>
                    <span className="queue-detail-val">{booking.purpose || '—'}</span>
                  </div>

                  {!adminView && booking.status === 'PENDING' && cancelingBookingId === booking.id ? (
                    <input
                      className="cancel-reason-input"
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Reason for cancel..."
                      disabled={cancelSubmittingId === booking.id}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          submitCancel(booking.id);
                        }
                      }}
                    />
                  ) : null}
                </div>
              </div>

              <div className="queue-card-footer">
                <div className="queue-footer-right">
                  <Link to={`/bookings/${booking.id}`} state={{ booking }} className="action-pill action-pill-detail">
                    Detail
                  </Link>

                  {adminView && booking.status === 'PENDING' ? (
                    <>
                      <button
                        type="button"
                        className="action-pill action-pill-approve"
                        onClick={() => handleAdminApprove(booking)}
                        disabled={submitting.bookingId === booking.id}
                      >
                        <FiCheck /> Accept
                      </button>
                      <button
                        type="button"
                        className="action-pill action-pill-reject"
                        onClick={() => startReject(booking)}
                        disabled={submitting.bookingId === booking.id}
                      >
                        <FiX /> Reject
                      </button>
                    </>
                  ) : null}

                  {!adminView && booking.status === 'PENDING' ? (
                    <button
                      type="button"
                      className="action-pill action-pill-cancel"
                      onClick={() =>
                        cancelingBookingId === booking.id ? submitCancel(booking.id) : startCancel(booking.id)
                      }
                      disabled={cancelSubmittingId === booking.id}
                    >
                      {cancelSubmittingId === booking.id ? 'Canceling...' : 'Cancel'}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Booking"
      >
        <div className="modal-form">
          <p>
            Provide a reason to reject booking for <strong>{selectedBooking?.resourceName}</strong>.
          </p>
          <div className="form-group">
            <label>Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows="3"
            />
          </div>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>
              Cancel
            </button>
            <button className="btn-reject" onClick={submitReject}>
              Confirm Reject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingList;