import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { bookingApi } from '../../api/bookingApi';
import ConflictWarning from './ConflictWarning';
import { ROOMS } from '../../utils/constants';
import 'react-datepicker/dist/react-datepicker.css';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = ((hours24 + 11) % 12) + 1;

  return {
    value: `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    label: `${hours12}:${String(minutes).padStart(2, '0')} ${period}`,
  };
});

const formatLocalDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:00`;
};

const combineDateAndTime = (datePart, timeValue) => {
  const combined = new Date(datePart);
  const [hours, minutes] = timeValue.split(':').map((value) => parseInt(value, 10));
  combined.setHours(hours, minutes, 0, 0);
  return combined;
};

const TimeDropdown = ({ label, value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  return (
    <div className="time-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="time-dropdown-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span>{selectedOption ? selectedOption.label : 'Select time'}</span>
        <span className="time-dropdown-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="time-dropdown-menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`time-dropdown-option ${option.value === value ? 'is-selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const BookingForm = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const now = new Date();

  const [formData, setFormData] = useState({
    resourceId: '',
    resourceName: '',
    bookingDate: now,
    startTime: '08:00',
    endTime: '09:00',
    purpose: '',
    expectedAttendees: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState({
    checked: false,
    hasConflict: false,
    resourceName: '',
    message: '',
  });

  const resetConflictState = () => {
    setConflict((prev) => ({
      ...prev,
      checked: false,
      hasConflict: false,
      message: '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date, field) => {
    resetConflictState();
    setFormData({ ...formData, [field]: date });
  };

  const handleTimeChange = (field, value) => {
    resetConflictState();
    setFormData({ ...formData, [field]: value });
  };

  const getSelectedDateTimes = () => {
    const startDateTime = combineDateAndTime(formData.bookingDate, formData.startTime);
    const endDateTime = combineDateAndTime(formData.bookingDate, formData.endTime);
    return { startDateTime, endDateTime };
  };

  const selectedDateTimes = getSelectedDateTimes();

  const handleResourceChange = (e) => {
    const selectedId = parseInt(e.target.value, 10);
    const selectedRoom = ROOMS.find((room) => room.id === selectedId);

    if (!selectedRoom) {
      resetConflictState();
      setFormData({ ...formData, resourceId: '', resourceName: '' });
      return;
    }

    resetConflictState();
    setFormData({
      ...formData,
      resourceId: selectedRoom.id,
      resourceName: selectedRoom.name,
    });
  };

  const checkConflict = async () => {
    if (!formData.resourceId || !formData.bookingDate || !formData.startTime || !formData.endTime) return;

    const { startDateTime, endDateTime } = getSelectedDateTimes();
    if (endDateTime <= startDateTime) {
      setConflict({
        checked: true,
        hasConflict: true,
        resourceName: formData.resourceName,
        message: 'End time must be later than start time.',
      });
      return;
    }
    
    try {
      const result = await bookingApi.checkConflict(
        formData.resourceId,
        formatLocalDateTime(startDateTime),
        formatLocalDateTime(endDateTime)
      );
      setConflict({
        checked: true,
        hasConflict: result.hasConflict,
        resourceName: formData.resourceName,
        message: result.message || '',
      });
    } catch (err) {
      console.error('Error checking conflict:', err);
      setError('Unable to check availability at the moment. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { startDateTime, endDateTime } = getSelectedDateTimes();

      if (endDateTime <= startDateTime) {
        setError('End time must be later than start time.');
        setLoading(false);
        return;
      }

      const bookingData = {
        resourceId: parseInt(formData.resourceId),
        resourceName: formData.resourceName,
        startTime: formatLocalDateTime(startDateTime),
        endTime: formatLocalDateTime(endDateTime),
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
          checked={conflict.checked}
          hasConflict={conflict.hasConflict}
          message={conflict.message}
          resourceName={conflict.resourceName}
          startTime={selectedDateTimes.startDateTime}
          endTime={selectedDateTimes.endDateTime}
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

        <div className="form-group">
          <label>Select Date</label>
          <DatePicker
            selected={formData.bookingDate}
            onChange={(date) => handleDateChange(date, 'bookingDate')}
            dateFormat="MMMM d, yyyy"
            minDate={new Date()}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Time</label>
            <TimeDropdown
              label="Start Time"
              value={formData.startTime}
              onChange={(value) => handleTimeChange('startTime', value)}
              options={TIME_OPTIONS}
            />
          </div>

          <div className="form-group">
            <label>End Time</label>
            <TimeDropdown
              label="End Time"
              value={formData.endTime}
              onChange={(value) => handleTimeChange('endTime', value)}
              options={TIME_OPTIONS}
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