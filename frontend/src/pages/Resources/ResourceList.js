import React from 'react';
import { FiPlus, FiUsers, FiWifi } from 'react-icons/fi';
import { ROOMS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const statusClass = (status) => {
	if (status === 'Available') return 'room-status available';
	if (status === 'Occupied') return 'room-status occupied';
	return 'room-status maintenance';
};

const ResourceList = () => {
	const { isAdmin } = useAuth();

	return (
		<div className="rooms-page">
			<div className="rooms-header">
				<div>
					<h1>Room Management</h1>
					<p>View and manage campus facilities and capacities.</p>
				</div>

				{isAdmin ? (
					<button type="button" className="add-room-btn">
						<FiPlus />
						<span>Add Room</span>
					</button>
				) : (
					<span className="rooms-readonly-pill">View Only</span>
				)}
			</div>

			<div className="rooms-grid">
				{ROOMS.map((room) => (
					<article className="room-card" key={room.id}>
						<div className="room-card-header">
							<div>
								<h3>{room.name}</h3>
								<p>{room.type}</p>
							</div>
							<span className={statusClass(room.status)}>{room.status}</span>
						</div>

						<div className="room-meta">
							<span>
								<FiUsers /> {room.seats} Seats
							</span>
							<span>
								<FiWifi /> Wi-Fi
							</span>
						</div>

						<div className="room-features">
							<p>Features</p>
							<div>
								{room.features.map((feature) => (
									<span key={feature} className="feature-chip">
										{feature}
									</span>
								))}
							</div>
						</div>

						{isAdmin ? (
							<div className="room-actions">
								<button type="button" className="room-edit-btn">Edit</button>
								<button type="button" className="room-schedule-btn">Schedule</button>
							</div>
						) : (
							<div className="room-actions-view">Room details available for viewing.</div>
						)}
					</article>
				))}
			</div>
		</div>
	);
};

export default ResourceList;
