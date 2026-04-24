import React, { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import { bookingApi } from '../../api/bookingApi';
import { ROOMS } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const toDayStartIso = (date) => {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d.toISOString();
};

const toDayEndIso = (date) => {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d.toISOString();
};

const formatTime = (dateString) =>
	new Date(dateString).toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
	});

const BookingCalendar = () => {
	const [selectedRoomId, setSelectedRoomId] = useState(ROOMS?.[0]?.id || '');
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [dayBookings, setDayBookings] = useState([]);

	const selectedRoom = useMemo(() => {
		const id = typeof selectedRoomId === 'string' ? parseInt(selectedRoomId, 10) : selectedRoomId;
		return ROOMS.find((r) => r.id === id);
	}, [selectedRoomId]);

	useEffect(() => {
		const load = async () => {
			if (!selectedRoomId) return;

			try {
				setLoading(true);
				setError(null);

				const resourceId = parseInt(selectedRoomId, 10);
				const startDate = toDayStartIso(selectedDate);
				const endDate = toDayEndIso(selectedDate);

				const data = await bookingApi.getAllBookings({ resourceId, startDate, endDate });

				const visible = (data || []).filter(
					(b) => b.status !== 'REJECTED' && b.status !== 'CANCELLED'
				);

				visible.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
				setDayBookings(visible);
			} catch (err) {
				setError(typeof err === 'string' ? err : err?.message || 'Failed to load availability');
				setDayBookings([]);
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [selectedRoomId, selectedDate]);

	return (
		<section className="availability-card">
			<div className="availability-header">
				<div>
					<h2>Check Availability</h2>
					<p>Pick a room and a date to see existing bookings.</p>
				</div>

				<div className="availability-controls">
					<label className="availability-label">
						Room
						<select
							value={selectedRoomId}
							onChange={(e) => setSelectedRoomId(e.target.value)}
						>
							{ROOMS.map((room) => (
								<option key={room.id} value={room.id}>
									{room.name}
								</option>
							))}
						</select>
					</label>
				</div>
			</div>

			{error ? <ErrorAlert message={error} /> : null}

			<div className="availability-body">
				<div className="availability-calendar">
					<Calendar value={selectedDate} onChange={setSelectedDate} />
				</div>

				<div className="availability-slots">
					<div className="availability-slots-head">
						<h3>{selectedRoom?.name || 'Selected room'}</h3>
						<small>
							{selectedDate.toLocaleDateString(undefined, {
								weekday: 'short',
								year: 'numeric',
								month: 'short',
								day: '2-digit',
							})}
						</small>
					</div>

					{loading ? (
						<LoadingSpinner />
					) : dayBookings.length === 0 ? (
						<p className="no-data">No bookings for this date.</p>
					) : (
						<ul className="availability-list">
							{dayBookings.map((b) => (
								<li key={b.id} className="availability-item">
									<div className="availability-time">
										{formatTime(b.startTime)} - {formatTime(b.endTime)}
									</div>
									<div className="availability-meta">
										<strong>BK-{b.id}</strong>
										<span>{b.userName || 'Campus User'}</span>
									</div>
									<div className="availability-status">{b.status}</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</section>
	);
};

export default BookingCalendar;
