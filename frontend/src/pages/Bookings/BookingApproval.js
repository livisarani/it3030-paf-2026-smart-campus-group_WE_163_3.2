import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiClock, FiX } from 'react-icons/fi';
import { bookingApi } from '../../api/bookingApi';
import BookingStatusBadge from './BookingStatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const BookingApproval = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPendingBookings();
  }, []);

  const loadPendingBookings = async () => {
    try {
      const data = await bookingApi.getAllBookings({ status: 'PENDING' });
      setBookings(data);
      setError(null);
    } catch (err) {
      setError('Failed to load pending bookings');
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
      loadPendingBookings();
    } catch (err) {
      setError('Failed to process booking action');
    }
  };

  const handleDetails = (booking) => {
    navigate(`/bookings/${booking.id}`, { state: { booking } });
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="booking-approval-page">
      <div className="booking-page-header">
        <div>
          <h1>Request Management</h1>
          <p>Review and process pending room booking requests.</p>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}
      
      {bookings.length === 0 ? (
        <p className="no-data">No pending bookings to review.</p>
      ) : (
        <div className="request-cards-list">
          {bookings.map((booking) => (
            <article key={booking.id} className="request-card">
              <div className="request-user-block">
                <div className="request-avatar" aria-hidden="true">
                  {(booking.userName || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div className="request-user-meta">
                  <div className="request-user-name-row">
                    <p className="request-user-name">{booking.userName || 'Campus User'}</p>
                    <span className="request-user-role">{booking.userRole || 'User'}</span>
                  </div>
                  <small className="request-user-email">{booking.userEmail || 'No email provided'}</small>
                </div>
              </div>

              <div className="request-info-block">
                <div className="request-info-row">
                  <div>
                    <p className="request-section-label">Schedule & Room</p>
                    <p className="request-info-line">
                      <FiClock /> {formatDate(booking.startTime)} {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </p>
                    <small className="request-room-line">{booking.resourceName}</small>
                  </div>

                  <div>
                    <p className="request-section-label">Purpose & Status</p>
                    <p className="request-purpose-text">{booking.purpose || 'No purpose provided'}</p>
                    <div className="request-status-row">
                      <BookingStatusBadge status={booking.status} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="request-actions-block">
                <button
                  type="button"
                  className="btn-approve-small request-action-btn"
                  onClick={() => handleApprove(booking)}
                >
                  <FiCheck /> Accept
                </button>
                <button
                  type="button"
                  className="btn-reject-small request-action-btn"
                  onClick={() => handleReject(booking)}
                >
                  <FiX /> Reject
                </button>
                <button
                  className="action-pill action-pill-detail"
                  type="button"
                  onClick={() => handleDetails(booking)}
                  aria-label="Details"
                  title={`Request #REQ-${2000 + booking.id}`}
                >
                  Detail
                </button>
              </div>
            </article>
          ))}
        </div>
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
    </div>
  );
};

export default BookingApproval;