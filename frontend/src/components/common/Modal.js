import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const showHeader = typeof title === 'string' ? title.trim().length > 0 : Boolean(title);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {showHeader ? (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        ) : null}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;