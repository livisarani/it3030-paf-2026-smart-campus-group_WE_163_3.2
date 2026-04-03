import React, { useEffect, useMemo, useState } from 'react';
import { FiClipboard, FiClock, FiCheckCircle } from 'react-icons/fi';
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
		return { total, pending, approved };
	}, [bookings]);

	const trendPercent = (value) => (value === 0 ? '0%' : `${Math.min(99, Math.max(1, value))}%`);
	const pendingTrend = stats.total ? Math.round((stats.pending / stats.total) * 100) : 0;
	const approvedTrend = stats.total ? Math.round((stats.approved / stats.total) * 100) : 0;

	const recentRequests = useMemo(() => {
		const toTime = (value) => (value ? new Date(value).getTime() : 0);

		return bookings
			.filter((booking) => booking.status === 'PENDING')
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
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});

	const formatTime = (dateString) =>
		new Date(dateString).toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
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
				<h1>Admin Approval Dashboard</h1>
				<p>Manage campus resource requests and view system statistics.</p>
			</div>

			<div className="stats-grid">
				<article className="stat-card">
					<div>
						<p className="stat-label">Total Requests</p>
						<div className="metric-row">
							<h2>{stats.total}</h2>
							<small className="trend-up">↑ {trendPercent(stats.total)}</small>
						</div>
					</div>
					<div className="stat-icon icon-blue">
						<FiClipboard />
					</div>
				</article>

				<article className="stat-card">
					<div>
						<p className="stat-label">Pending Approvals</p>
						<div className="metric-row">
							<h2>{stats.pending}</h2>
							<small className="trend-down">↓ {trendPercent(pendingTrend)}</small>
						</div>
					</div>
					<div className="stat-icon icon-amber">
						<FiClock />
					</div>
				</article>

				<article className="stat-card">
					<div>
						<p className="stat-label">Approved Bookings</p>
						<div className="metric-row">
							<h2>{stats.approved}</h2>
							<small className="trend-up">↑ {trendPercent(approvedTrend)}</small>
						</div>
					</div>
					<div className="stat-icon icon-green">
						<FiCheckCircle />
					</div>
				</article>
			</div>

			<section className="dashboard-requests-card">
				<div className="requests-header">
					<h3>Recent Requests</h3>
					<span className="action-required-pill">{stats.pending} Action Required</span>
				</div>

				<table className="requests-table">
					<thead>
						<tr>
							<th>User</th>
							<th>Resource</th>
							<th>Date & Time</th>
							<th>Purpose</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{recentRequests.map((booking) => (
							<tr key={booking.id}>
								<td>{booking.userName || 'Campus User'}</td>
								<td>
									<strong>{booking.resourceName}</strong>
									<br />
									<small>{booking.expectedAttendees || 0} attendees</small>
								</td>
								<td>
									{formatDate(booking.startTime)}
									<br />
									<small>
										{formatTime(booking.startTime)} - {formatTime(booking.endTime)}
									</small>
								</td>
								<td>{booking.purpose}</td>
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
