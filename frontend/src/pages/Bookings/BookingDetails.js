import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
	FiArrowLeft,
	FiCalendar,
	FiCheckCircle,
	FiClock,
	FiFileText,
	FiInfo,
	FiMapPin,
	FiPrinter,
	FiUsers,
	FiXCircle,
} from 'react-icons/fi';
import { bookingApi } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { ROOMS } from '../../utils/constants';
import BookingStatusBadge from './BookingStatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const BookingDetails = () => {
	const { id } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
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
				const list = isAdmin()
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

	const printPage = () => {
		window.print();
	};

	const handleCancel = async () => {
		if (!booking || booking.status !== 'APPROVED') return;
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
			<div className="booking-details-top">
				<div className="booking-details-top-left">
					<Link to="/bookings" className="booking-back-link" aria-label="Back">
						<FiArrowLeft />
					</Link>
					<div className="booking-details-title">
						<div className="booking-title-row">
							<h1>Booking Details</h1>
							<BookingStatusBadge status={booking.status} />
						</div>
						<p className="booking-reference">
							Reference: #BK-{booking.id}
						</p>
					</div>
				</div>

				<div className="booking-details-top-actions">
					<button type="button" className="btn-print" onClick={printPage}>
						<FiPrinter /> Print
					</button>
					{booking.status === 'APPROVED' && (
						<button type="button" className="btn-cancel-booking" onClick={handleCancel}>
							<FiXCircle /> Cancel Booking
						</button>
					)}
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
								<span>Resource</span>
								<strong>{booking.resourceName || '-'}</strong>
							</div>
							<div className="general-info-item">
								<span>Purpose</span>
								<strong>{booking.purpose || '-'}</strong>
							</div>
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
									<FiUsers /> Attendees
								</span>
								<strong>{booking.expectedAttendees || '-'} Participants</strong>
							</div>
						</div>
					</section>
				</div>

				<div className="booking-details-right">
					<aside className="booking-details-card booking-resource-card">
						<h3>Resource Details</h3>
						<div className="room-preview" aria-hidden="true">
							<span>ROOM VIEW</span>
						</div>
						<div className="details-kv">
							<span>Location</span>
							<strong>{room?.location || 'Main Campus'}</strong>
						</div>
						<div className="details-kv">
							<span>Max Capacity</span>
							<strong>{room?.seats || room?.capacity || '-'}</strong>
						</div>
						<div className="details-kv">
							<span>Status</span>
							<strong className="status-available">Available</strong>
						</div>
					</aside>

					<section className="booking-details-card booking-workflow-card">
						<h3>Workflow Status</h3>
						<ul className="workflow-timeline">
							<li className="done">
								<div className="workflow-dot">
									<FiCheckCircle />
								</div>
								<div>
									<strong>Requested</strong>
									<small>{booking.createdAt ? `Submitted ${formatDate(booking.createdAt)}` : ''}</small>
								</div>
							</li>
							<li className={booking.status === 'PENDING' ? 'active' : 'done'}>
								<div className="workflow-dot">
									<FiCheckCircle />
								</div>
								<div>
									<strong>Pending Review</strong>
									<small>{booking.status !== 'PENDING' && booking.updatedAt ? `Completed ${formatDate(booking.updatedAt)}` : ''}</small>
								</div>
							</li>
							<li className={booking.status === 'APPROVED' ? 'done' : booking.status === 'REJECTED' ? 'done rejected' : booking.status === 'CANCELLED' ? 'done cancelled' : ''}>
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
									<small>{booking.updatedAt ? `Confirmed ${formatDate(booking.updatedAt)}` : ''}</small>
								</div>
							</li>
						</ul>
					</section>
				</div>
			</div>
		</div>
	);
};

export default BookingDetails;
