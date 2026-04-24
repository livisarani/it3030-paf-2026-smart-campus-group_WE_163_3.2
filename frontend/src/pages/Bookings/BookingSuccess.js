import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';
import './styles/booking-success.css';

const BookingSuccess = () => {
  const navigate = useNavigate();

  const handleViewBookings = () => {
    navigate('/bookings');
  };

  const handleSubmitAnother = () => {
    navigate('/bookings/new');
  };

  return (
    <div className="booking-success-container">
      <div className="success-card">
        <div className="success-icon">
          <FiCheckCircle size={64} color="#10b981" />
        </div>
        
        <h1 className="success-title">Request Submitted!</h1>
        
        <p className="success-message">
          Your booking request has been successfully submitted and is pending approval. 
          You will be notified once it's reviewed.
        </p>
        
        <div className="success-actions">
          <button 
            className="btn-view-bookings"
            onClick={handleViewBookings}
          >
            View My Bookings
          </button>
          
          <button 
            className="btn-submit-another"
            onClick={handleSubmitAnother}
          >
            Submit Another Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
