import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { bookingApi } from '../../api/bookingApi';
import ConflictWarning from './ConflictWarning';
import { ROOMS } from '../../utils/constants';
import 'react-datepicker/dist/react-datepicker.css';

const BookingForm = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    resourceId: '',
    resourceName: '',
    startTime: new Date(),
    endTime: new Date(),
    purpose: '',
    expectedAttendees: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState({ hasConflict: false, resourceName: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date, field) => {
    setFormData({ ...formData, [field]: date });
  };

  const handleResourceChange = (e) => {
    const selectedId = parseInt(e.target.value, 10);
    const selectedRoom = ROOMS.find((room) => room.id === selectedId);

    if (!selectedRoom) {
      setFormData({ ...formData, resourceId: '', resourceName: '' });
      return;
    }

    setFormData({
      ...formData,
      resourceId: selectedRoom.id,
      resourceName: selectedRoom.name,
    });
  };

  const checkConflict = async () => {
    if (!formData.resourceId || !formData.startTime || !formData.endTime) return;
    
    try {
      const result = await bookingApi.checkConflict(
        formData.resourceId,
        formData.startTime.toISOString(),
        formData.endTime.toISOString()
      );
      setConflict({
        hasConflict: result.hasConflict,
        resourceName: formData.resourceName
      });
    } catch (err) {
      console.error('Error checking conflict:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        resourceId: parseInt(formData.resourceId),
        resourceName: formData.resourceName,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
        purpose: formData.purpose,
        expectedAttendees: parseInt(formData.expectedAttendees) || null,
      };

      await bookingApi.createBooking(bookingData);
      if (typeof onSuccess === 'function') {
        onSuccess();
      } else {
        navigate('/bookings/success');
      }
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="booking-form-header">
        <h2>Create New Booking</h2>
        <p>Reserve campus resources and schedule your next session.</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}

      <div className="booking-form-card">
        <div className="booking-form-card-title">
          <span className="booking-form-card-accent" aria-hidden="true" />
          <h3>Reservation Details</h3>
        </div>

        <ConflictWarning 
          hasConflict={conflict.hasConflict}
          resourceName={conflict.resourceName}
          startTime={formData.startTime}
          endTime={formData.endTime}
        />

        <div className="form-group">
          <label>Select Resource</label>
          <select
            name="resourceName"
            value={formData.resourceId}
            onChange={handleResourceChange}
            required
          >
            <option value="">Select a room</option>
            {ROOMS.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} ({room.type})
              </option>
            ))}
          </select>
          {formData.resourceId && (
            <small className="resource-id-hint">Room ID: {formData.resourceId}</small>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Time</label>
            <DatePicker
              selected={formData.startTime}
              onChange={(date) => handleDateChange(date, 'startTime')}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={new Date()}
              required
            />
          </div>

          <div className="form-group">
            <label>End Time</label>
            <DatePicker
              selected={formData.endTime}
              onChange={(date) => handleDateChange(date, 'endTime')}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={formData.startTime}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Expected Attendees</label>
            <input
              type="number"
              name="expectedAttendees"
              value={formData.expectedAttendees}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Availability</label>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={checkConflict}
            >
              Check Availability
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Purpose of Booking</label>
          <textarea
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            rows="3"
            placeholder="Briefly describe the event or meeting agenda..."
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => {
              if (typeof onCancel === 'function') {
                onCancel();
              } else {
                navigate('/bookings');
              }
            }}
          >
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Booking'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BookingForm;