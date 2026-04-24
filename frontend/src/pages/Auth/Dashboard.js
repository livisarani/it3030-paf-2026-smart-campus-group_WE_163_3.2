import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiClipboard, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { bookingApi } from '../../api/bookingApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import BookingStatusBadge from '../Bookings/BookingStatusBadge';

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardBookings();
  }, []);

  const loadDashboardBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getAllBookings({});
      setBookings(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((booking) => booking.status === 'PENDING').length;
    const approved = bookings.filter((booking) => booking.status === 'APPROVED').length;
    const rejected = bookings.filter((booking) => booking.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [bookings]);

  const recentBookings = useMemo(() => {
    const toTime = (value) => (value ? new Date(value).getTime() : 0);

    return bookings
      .slice()
      .sort(
        (a, b) =>
          toTime(b.updatedAt) - toTime(a.updatedAt) ||
          toTime(b.createdAt) - toTime(a.createdAt) ||
          toTime(b.startTime) - toTime(a.startTime)
      )
      .slice(0, 5);
  }, [bookings]);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Monitor and manage space allocations across the campus ecosystem.</p>
      </div>

      <div className="admin-kpi-grid">
        <article className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-total" aria-hidden="true">
            <FiClipboard />
          </div>
          <div className="admin-kpi-body">
            <div className="admin-kpi-number">{stats.total}</div>
            <div className="admin-kpi-label">Total Bookings</div>
          </div>
        </article>

        <article className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-pending" aria-hidden="true">
            <FiClock />
          </div>
          <div className="admin-kpi-body">
            <div className="admin-kpi-number">{stats.pending}</div>
            <div className="admin-kpi-label">Pending Bookings</div>
          </div>
        </article>

        <article className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-approved" aria-hidden="true">
            <FiCheckCircle />
          </div>
          <div className="admin-kpi-body">
            <div className="admin-kpi-number">{stats.approved}</div>
            <div className="admin-kpi-label">Approved Bookings</div>
          </div>
        </article>

        <article className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-rejected" aria-hidden="true">
            <FiXCircle />
          </div>
          <div className="admin-kpi-body">
            <div className="admin-kpi-number">{stats.rejected}</div>
            <div className="admin-kpi-label">Rejected Bookings</div>
          </div>
        </article>
      </div>

      <section className="dashboard-requests-card">
        <div className="requests-header">
          <h3>Recent Bookings</h3>
          <Link className="recent-view-link" to="/bookings">
            View All ->
          </Link>
        </div>

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
            {recentBookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.resourceName || '-'}</td>
                <td>{formatDate(booking.startTime)}</td>
                <td>
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </td>
                <td>{booking.userName || 'Campus User'}</td>
                <td>
                  <BookingStatusBadge status={booking.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Dashboard;
