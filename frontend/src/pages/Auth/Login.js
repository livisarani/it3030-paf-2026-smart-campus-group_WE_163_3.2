import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/bookings'} replace />;
  }

  const handleLogin = (role) => {
    if (role === 'admin') {
      login('admin@campus.com', 'Admin User', 'ADMIN');
      navigate('/admin/dashboard');
    } else {
      login('john@campus.com', 'John Doe', 'USER');
      navigate('/bookings');
    }
  };

  return (
    <div className="login-container">
      <h1>Smart Campus Hub</h1>
      <p>Select a role to continue</p>
      <div className="login-buttons">
        <button type="button" onClick={() => handleLogin('user')}>
          Login as User
        </button>
        <button type="button" onClick={() => handleLogin('admin')}>
          Login as Admin
        </button>
      </div>
    </div>
  );
};

export default Login;
