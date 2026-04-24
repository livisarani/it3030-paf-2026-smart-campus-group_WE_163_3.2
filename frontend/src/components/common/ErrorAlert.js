import React from 'react';

const ErrorAlert = ({ message, onClose }) => {
  return (
    <div className="error-alert">
      <span className="error-icon">⚠️</span>
      <span className="error-message">{message}</span>
      {onClose && (
        <button className="close-btn" onClick={onClose}>×</button>
      )}
    </div>
  );
};

export default ErrorAlert;