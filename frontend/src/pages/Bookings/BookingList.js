import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { bookingApi } from '../../api/bookingApi';
import BookingStatusBadge from './BookingStatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import Pagination from '../../components/common/Pagination';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectingBookingId, setRejectingBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState({ bookingId: null, action: null });
  const [cancelingBookingId, setCancelingBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmittingId, setCancelSubmittingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { isAdmin } = useAuth();
  const adminView = isAdmin();

  const pageSize = 5;

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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
      setRejectingBookingId(null);
      setRejectionReason('');
      await bookingApi.approveBooking(booking.id, '');
      await loadBookings();
    } catch (err) {
      setError('Failed to approve booking');
    } finally {
      setSubmitting({ bookingId: null, action: null });
    }
  };

  const handleAdminRejectStart = (booking) => {
    setRejectingBookingId(booking.id);
    setRejectionReason('');
    setError(null);
  };

  const handleAdminRejectSubmit = async (booking) => {
    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting({ bookingId: booking.id, action: 'reject' });
      await bookingApi.rejectBooking(booking.id, trimmedReason);
      setRejectingBookingId(null);
      setRejectionReason('');
      await loadBookings();
    } catch (err) {
      setError('Failed to reject booking');
    } finally {
      setSubmitting({ bookingId: null, action: null });
    }
  };

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;

      if (!query) {
        return matchesStatus;
      }

      const searchableText = [
        booking.id,
        booking.userName,
        booking.resourceName,
        booking.purpose,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && searchableText.includes(query);
    });
  }, [bookings, searchTerm, statusFilter]);

  const totalEntries = filteredBookings.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedBookings = useMemo(() => {
    return filteredBookings.slice(startIndex, endIndex);
  }, [filteredBookings, startIndex, endIndex]);

  const showingStart = totalEntries === 0 ? 0 : startIndex + 1;
  const showingEnd = totalEntries === 0 ? 0 : endIndex;

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
    <div className="booking-page">
      <div className="booking-page-header">
        <div>
          <h1>{adminView ? 'All Bookings' : 'My Bookings'}</h1>
          <p>Manage and view campus room bookings.</p>
        </div>
        {!adminView && (
          <Link to="/bookings/new" className="new-booking-btn">
            + New Booking
          </Link>
        )}
      </div>

      {error ? <ErrorAlert message={error} /> : null}

      <section className="booking-table-card">
        <div className="booking-toolbar">
          <div className="booking-search">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bookings by ID, User, or Room..."
            />
          </div>

          <select
            className="booking-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {filteredBookings.length === 0 ? (
          <p className="no-data">No bookings found.</p>
        ) : (
          <>
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Requested By</th>
                  <th>Room</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((booking) => (
                  <tr key={booking.id}>
                  <td className="booking-id">BK-{booking.id}</td>
                  <td>{booking.userName || 'Campus User'}</td>
                  <td>{booking.resourceName}</td>
                  <td>
                    <div className="booking-date">{formatDate(booking.startTime)}</div>
                    <small>
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </small>
                  </td>
                  <td>
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td>
                    {adminView ? (
                      booking.status === 'PENDING' ? (
                        <div className="admin-action-cell">
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="btn-approve-small"
                              onClick={() => handleAdminApprove(booking)}
                              disabled={submitting.bookingId === booking.id}
                            >
                              <FiCheck /> Accept
                            </button>
                            <button
                              type="button"
                              className="btn-reject-small"
                              onClick={() =>
                                rejectingBookingId === booking.id
                                  ? handleAdminRejectSubmit(booking)
                                  : handleAdminRejectStart(booking)
                              }
                              disabled={submitting.bookingId === booking.id}
                            >
                              <FiX /> {rejectingBookingId === booking.id ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>

                          {rejectingBookingId === booking.id ? (
                            <input
                              className="reject-reason-input"
                              type="text"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Reason for rejection..."
                              disabled={submitting.bookingId === booking.id}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAdminRejectSubmit(booking);
                                }
                              }}
                            />
                          ) : null}
                        </div>
                      ) : null
                    ) : (
                      <div className="user-action-cell">
                        <div className="action-buttons">
                          <Link
                            to={`/bookings/${booking.id}`}
                            state={{ booking }}
                            className="action-pill action-pill-detail"
                          >
                            Detail
                          </Link>

                            {booking.status === 'PENDING' ? (
                            <button
                              type="button"
                              className="action-pill action-pill-cancel"
                              onClick={() =>
                                cancelingBookingId === booking.id
                                  ? submitCancel(booking.id)
                                  : startCancel(booking.id)
                              }
                              disabled={cancelSubmittingId === booking.id}
                            >
                              {cancelingBookingId === booking.id ? 'Canceling...' : 'Cancel'}
                            </button>
                          ) : null}
                        </div>

                          {booking.status === 'PENDING' && cancelingBookingId === booking.id ? (
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
                    )}
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="booking-table-footer">
              <div className="booking-entries">
                Showing {showingStart} to {showingEnd} of {totalEntries} entries
              </div>
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default BookingList;