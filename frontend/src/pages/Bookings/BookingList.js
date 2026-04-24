import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiClock, FiX } from 'react-icons/fi';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../../context/AuthContext';
import { bookingApi } from '../../api/bookingApi';
import BookingStatusBadge from './BookingStatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import Modal from '../../components/common/Modal';

const getDateKey = (value) => {
  if (!value) return '';

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return String(value).split('T')[0];
};

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pendingScrollBookingId, setPendingScrollBookingId] = useState(null);
  const [highlightBookingId, setHighlightBookingId] = useState(null);
  const bookingRefs = useRef({});
  const { isAdmin } = useAuth();
  const adminView = isAdmin;

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

  const bookingsByDate = useMemo(() => {
    const map = new Map();

    bookings.forEach((booking) => {
      if (!booking.startTime) return;
      const dayKey = getDateKey(booking.startTime);
      const existing = map.get(dayKey) || [];
      existing.push(booking);
      map.set(dayKey, existing);
    });

    return map;
  }, [bookings]);

  const activeBookingsCount = useMemo(
    () => bookings.filter((booking) => booking.status === 'PENDING' || booking.status === 'APPROVED').length,
    [bookings]
  );

  const upcomingTodayCount = useMemo(() => {
    const now = new Date();
    const todayKey = getDateKey(now);

    return bookings.filter((booking) => {
      if (!booking.startTime) return false;
      const start = new Date(booking.startTime);

      return (
        getDateKey(start) === todayKey &&
        start >= now &&
        booking.status !== 'CANCELLED' &&
        booking.status !== 'REJECTED'
      );
    }).length;
  }, [bookings]);

  const getCalendarDotClass = (date) => {
    const entries = bookingsByDate.get(getDateKey(date));
    if (!entries || entries.length === 0) return '';

    if (entries.some((booking) => booking.status === 'PENDING')) return 'status-pending';
    if (entries.some((booking) => booking.status === 'APPROVED')) return 'status-approved';
    if (entries.some((booking) => booking.status === 'REJECTED')) return 'status-rejected';
    if (entries.some((booking) => booking.status === 'CANCELLED')) return 'status-cancelled';
    return 'status-default';
  };

  const selectedDateBookings = useMemo(() => {
    const entries = bookingsByDate.get(getDateKey(selectedDate)) || [];

    return [...entries].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [bookingsByDate, selectedDate]);

  useEffect(() => {
    if (!pendingScrollBookingId) return;

    const target = bookingRefs.current[pendingScrollBookingId];
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightBookingId(pendingScrollBookingId);
    setPendingScrollBookingId(null);

    const timeoutId = setTimeout(() => {
      setHighlightBookingId(null);
    }, 1800);

    return () => clearTimeout(timeoutId);
  }, [pendingScrollBookingId, filteredBookings]);

  const handleGoToBooking = (booking) => {
    if (activeTab !== 'ALL') {
      setActiveTab('ALL');
    }
    setPendingScrollBookingId(booking.id);
  };

  const formatTime = (dateString) => {
    const [, timePart = ''] = String(dateString || '').split('T');
    const [hoursText = '00', minutesText = '00'] = timePart.split(':');
    const hours24 = Number(hoursText);
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = ((hours24 + 11) % 12) + 1;
    return `${hours12}:${minutesText.padStart(2, '0')} ${period}`;
  };

  const formatDate = (dateString) => {
    const [yearText = '1970', monthText = '01', dayText = '01'] = String(dateString || '').split('T')[0].split('-');
    const year = Number(yearText);
    const month = Number(monthText) - 1;
    const day = Number(dayText);
    return new Date(Date.UTC(year, month, day)).toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatSelectedDate = (date) =>
    date.toLocaleDateString(undefined, {
      weekday: 'short',
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

      <div className={`student-bookings-layout ${adminView ? 'admin-layout' : ''}`}>
        {!adminView ? (
          <aside className="student-bookings-sidebar" aria-label="Booking calendar and quick stats">
            <section className="student-calendar-card">
              <Calendar
                calendarType="iso8601"
                className="student-calendar"
                onChange={setSelectedDate}
                value={selectedDate}
                prev2Label={null}
                next2Label={null}
                showNeighboringMonth
                formatShortWeekday={(_, date) =>
                  date
                    .toLocaleDateString(undefined, { weekday: 'narrow' })
                    .replace('.', '')
                    .toUpperCase()
                }
                tileContent={({ date, view }) => {
                  if (view !== 'month') return null;
                  const dotClass = getCalendarDotClass(date);
                  return dotClass ? <span className={`student-calendar-dot ${dotClass}`} aria-hidden="true" /> : null;
                }}
              />
            </section>

            <section className="student-booking-stats">
              <div className="student-stat-card">
                <span>Active Bookings</span>
                <strong>{activeBookingsCount}</strong>
              </div>
              <div className="student-stat-card">
                <span>Upcoming Today</span>
                <strong>{upcomingTodayCount}</strong>
              </div>
            </section>

            <section className="selected-date-bookings" aria-live="polite">
              <div className="selected-date-bookings-head">
                <h3>{formatSelectedDate(selectedDate)}</h3>
                <span>{selectedDateBookings.length} booking(s)</span>
              </div>

              {selectedDateBookings.length === 0 ? (
                <p className="selected-date-empty">No bookings on this date.</p>
              ) : (
                <ul className="selected-date-list">
                  {selectedDateBookings.map((booking) => (
                    <li key={`date-summary-${booking.id}`} className="selected-date-item">
                      <div className="selected-date-item-meta">
                        <p className="selected-date-item-title">{booking.resourceName || 'Campus Space'}</p>
                        <p className="selected-date-item-sub">
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)} · {booking.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="selected-date-go-link"
                        onClick={() => handleGoToBooking(booking)}
                      >
                        Go to booking
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        ) : null}

        <section className="student-bookings-main">
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
            <section className={`queue-list ${!adminView ? 'student-queue-list' : ''}`}>
              {filteredBookings.map((booking) => (
                <article
                  key={booking.id}
                  ref={(node) => {
                    if (node) {
                      bookingRefs.current[booking.id] = node;
                    } else {
                      delete bookingRefs.current[booking.id];
                    }
                  }}
                  className={`queue-row ${highlightBookingId === booking.id ? 'queue-row-highlight' : ''}`}
                >
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
        </section>
      </div>

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