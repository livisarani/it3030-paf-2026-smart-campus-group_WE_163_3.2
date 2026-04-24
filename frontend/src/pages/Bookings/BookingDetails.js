import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
	FiArrowLeft,
	FiCalendar,
	FiCheckCircle,
	FiClock,
	FiInfo,
	FiMapPin,
	FiUsers,
	FiXCircle,
} from 'react-icons/fi';
import { bookingApi } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { ROOMS } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const BookingDetails = () => {
	const { id } = useParams();
	const location = useLocation();
	const { isAdmin } = useAuth();
	const [booking, setBooking] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const bookingId = Number(id);

	useEffect(() => {
		const loadBooking = async () => {
			if (location.state?.booking) {
				setBooking(location.state.booking);
				setError(null);
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const list = isAdmin
					? await bookingApi.getAllBookings({})
					: await bookingApi.getUserBookings(1);

				const selected = (list || []).find((item) => Number(item.id) === bookingId);

				if (!selected) {
					setError('Booking not found');
					setBooking(null);
					return;
				}

				setBooking(selected);
				setError(null);
			} catch (err) {
				setError(typeof err === 'string' ? err : err?.message || 'Failed to load booking details');
			} finally {
				setLoading(false);
			}
		};

		loadBooking();
	}, [bookingId, isAdmin, location.state]);

	const room = useMemo(() => {
		if (!booking) return null;
		return ROOMS.find((r) => r.id === booking.resourceId || r.name === booking.resourceName);
	}, [booking]);

	const formatDate = (value) =>
		value
			? new Date(value).toLocaleDateString(undefined, {
					year: 'numeric',
				month: 'short',
				day: '2-digit',
				})
			: '-';

	const formatTime = (value) =>
		value
			? new Date(value).toLocaleTimeString(undefined, {
					hour: '2-digit',
					minute: '2-digit',
				})
			: '-';

	const formatDateTime = (value) =>
		value
			? new Date(value).toLocaleString(undefined, {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			})
			: '';

	const handleCancel = async () => {
		if (!booking || booking.status !== 'PENDING') return;
		if (!window.confirm('Are you sure you want to cancel this booking?')) return;
		const reason = window.prompt('Why are you cancelling this booking?');
		if (reason === null) {
			return;
		}

		const trimmed = (reason || '').trim();

		try {
			const updated = await bookingApi.cancelBooking(booking.id, trimmed);
			setBooking((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					...(updated || {}),
					status: (updated && updated.status) || 'CANCELLED',
					cancelReason: (updated && updated.cancelReason) || trimmed,
				};
			});
		} catch (err) {
			setError(err?.message || 'Failed to cancel booking');
		}
	};

	if (loading) return <LoadingSpinner />;
	if (error) return <ErrorAlert message={error} />;
	if (!booking) return <ErrorAlert message="Booking not found" />;

	return (
		<div className="booking-details-page booking-details-v2">
			<nav className="booking-breadcrumb" aria-label="Breadcrumb">
				{isAdmin && (
					<>
						<Link to="/rooms">Resources</Link>
						<span aria-hidden="true">›</span>
					</>
				)}
				<Link to="/bookings">Bookings</Link>
				<span aria-hidden="true">›</span>
				<span>#BK-{booking.id}</span>
			</nav>

			<div className="booking-details-top">
				<div className="booking-details-top-left">
					<Link to="/bookings" className="booking-back-link" aria-label="Back">
						<FiArrowLeft />
					</Link>
					<div className="booking-details-title">
						<div className="booking-title-row">
							<h1>Booking Details</h1>
						</div>
					</div>
				</div>
			</div>

			<div className="booking-details-grid-v2">
				<div className="booking-details-left">
					<section className="booking-details-card booking-general-card">
						<div className="card-title-row">
							<h3>
								<FiInfo /> General Information
							</h3>
						</div>
						<div className="general-info-grid">
							<div className="general-info-item">
								<span>
									<FiCalendar /> Date
								</span>
								<strong>{formatDate(booking.startTime)}</strong>
							</div>
							<div className="general-info-item">
								<span>
									<FiClock /> Time Slot
								</span>
								<strong>
									{formatTime(booking.startTime)} - {formatTime(booking.endTime)}
								</strong>
							</div>
							<div className="general-info-item">
								<span>
									<FiUsers /> Participants
								</span>
								<strong>{booking.expectedAttendees || '-'} Students</strong>
							</div>
							<div className="general-info-item">
								<span>Purpose</span>
								<strong>{booking.purpose || '-'}</strong>
							</div>
						</div>

						<div className="booking-description">
							<p className="booking-description-title">Detailed Description</p>
							<p className="booking-description-text">{booking.purpose || '—'}</p>
						</div>
					</section>

					<section className="booking-lower-grid">
						<aside className="booking-room-card" aria-label="Room preview">
							<div className="booking-room-preview" aria-hidden="true" />
							<div className="booking-room-name">{booking.resourceName || 'Campus Space'}</div>
						</aside>

						<aside className="booking-details-card booking-resource-card">
							<div className="booking-resource-header">
								<h3>
									<FiMapPin /> Resource Details
								</h3>
								<span className="booking-resource-id">ID: RES-{booking.resourceId || '—'}</span>
							</div>
							<div className="details-kv">
								<span>Location</span>
								<strong>{room?.location || 'Main Campus'}</strong>
							</div>
							<div className="details-kv">
								<span>Capacity</span>
								<strong>Up to {room?.seats || room?.capacity || '-'} Persons</strong>
							</div>
							<div className="details-kv">
								<span>Equipment</span>
								<strong>{room?.features?.[0] || '—'}</strong>
							</div>
							<div className="details-kv">
								<span>Network</span>
								<strong>Campus Wi‑Fi</strong>
							</div>
						</aside>
					</section>
				</div>

				<div className="booking-details-right">
					<section className="booking-details-card booking-workflow-card">
						<h3>Workflow Status</h3>
						<ul className="workflow-timeline">
							<li className="workflow-item done">
								<div className="workflow-dot">
									<FiCheckCircle />
								</div>
								<div>
									<strong>Requested</strong>
									<small>
										{booking.createdAt ? `BK-${booking.id} · ${formatDateTime(booking.createdAt)}` : `BK-${booking.id}`}
										{booking.userName || booking.userEmail
											? ` (initiated by ${booking.userName || booking.userEmail})`
											: ''}
									</small>
								</div>
							</li>
							<li className={`workflow-item ${booking.status === 'PENDING' ? 'active' : 'done'}`}>
								<div className="workflow-dot">
									<FiCheckCircle />
								</div>
								<div>
									<strong>Pending Review</strong>
									<small>
										{booking.status === 'PENDING'
											? 'In Progress'
											: booking.updatedAt
												? `Completed ${formatDateTime(booking.updatedAt)}`
												: ''}
									</small>
								</div>
							</li>
							<li
								className={`workflow-item ${
									booking.status === 'APPROVED' || booking.status === 'REJECTED' || booking.status === 'CANCELLED'
										? 'done'
										: 'todo'
								} ${booking.status === 'REJECTED' ? 'rejected' : ''} ${
									booking.status === 'CANCELLED' ? 'cancelled' : ''
								}`}
							>
								<div className="workflow-dot">
									<FiCheckCircle />
								</div>
								<div>
									<strong>
										{booking.status === 'REJECTED'
											? 'Rejected'
											: booking.status === 'CANCELLED'
												? 'Cancelled'
												: 'Approved'}
									</strong>
									<small>{booking.updatedAt ? `Scheduled Step · ${formatDateTime(booking.updatedAt)}` : ''}</small>
								</div>
							</li>
						</ul>
					</section>

					{booking.status === 'REJECTED' || booking.status === 'CANCELLED' ? (
						<section className="booking-reason-card" aria-label="Reason">
							<h3>Reason</h3>
							<p className="booking-reason-text">
								{booking.status === 'REJECTED'
									? booking.rejectionReason || '—'
									: booking.cancelReason || '—'}
							</p>
						</section>
					) : null}

					{!isAdmin && booking.status === 'PENDING' && (
						<button type="button" className="btn-cancel-booking" onClick={handleCancel}>
							<FiXCircle /> Cancel Booking
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default BookingDetails;
