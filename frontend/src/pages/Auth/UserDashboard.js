import React, { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiClipboard, FiClock, FiEye, FiPlusSquare, FiXCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { bookingApi } from '../../api/bookingApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import BookingStatusBadge from '../Bookings/BookingStatusBadge';

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserBookings();
  }, []);

  const loadUserBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getUserBookings(1);
      setBookings(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to load user dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((booking) => booking.status === 'PENDING').length;
    const approved = bookings.filter((booking) => booking.status === 'APPROVED').length;
    const rejected = bookings.filter((booking) => booking.status === 'REJECTED').length;

    const recentBookings = [...bookings]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);

    return {
      total,
      pending,
      approved,
      rejected,
      recentBookings,
    };
  }, [bookings]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

  const formatTimeRange = (start, end) => {
    const format = (value) =>
      new Date(value).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });

    return `${format(start)} - ${format(end)}`;
  };

  const currentUser =
    localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Campus User';
  const greetingName = (currentUser || 'User').split('@')[0];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="user-dashboard-page">
      <div className="user-dashboard-top">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {greetingName}. Here's what's happening today.</p>
        </div>

        <div className="user-dashboard-actions">
          <Link to="/bookings" className="user-action-btn user-action-secondary">
            <FiEye /> View Requests
          </Link>
          <Link to="/bookings/new" className="user-action-btn user-action-primary">
            <FiPlusSquare /> New Booking
          </Link>
        </div>
      </div>

      <div className="user-analytics-grid user-dashboard-cards">
        <article className="user-analytics-card user-kpi-card">
          <div className="kpi-icon kpi-icon-overall"><FiClipboard /></div>
          <div className="kpi-body">
            <h3>{analytics.total}</h3>
            <p>Total Bookings</p>
          </div>
        </article>

        <article className="user-analytics-card user-kpi-card">
          <div className="kpi-icon kpi-icon-action"><FiClock /></div>
          <div className="kpi-body">
            <h3>{analytics.pending}</h3>
            <p>Pending Bookings</p>
          </div>
        </article>

        <article className="user-analytics-card user-kpi-card">
          <div className="kpi-icon kpi-icon-completed"><FiCheckCircle /></div>
          <div className="kpi-body">
            <h3>{analytics.approved}</h3>
            <p>Approved Bookings</p>
          </div>
        </article>

        <article className="user-analytics-card user-kpi-card">
          <div className="kpi-icon kpi-icon-declined"><FiXCircle /></div>
          <div className="kpi-body">
            <h3>{analytics.rejected}</h3>
            <p>Rejected Bookings</p>
          </div>
        </article>
      </div>

      <section className="dashboard-requests-card user-recent-card">
        <div className="requests-header user-recent-header">
          <h3>Recent Bookings</h3>
          <Link to="/bookings" className="recent-view-link">View All →</Link>
        </div>

        {analytics.recentBookings.length === 0 ? (
          <p className="no-data">No recent bookings.</p>
        ) : (
          <table className="requests-table user-recent-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Date</th>
                <th>Time</th>
                <th>Booked By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.resourceName || '-'}</td>
                  <td>{formatDate(booking.startTime)}</td>
                  <td>{formatTimeRange(booking.startTime, booking.endTime)}</td>
                  <td>{booking.userName || currentUser}</td>
                  <td>
                    <BookingStatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default UserDashboard;
