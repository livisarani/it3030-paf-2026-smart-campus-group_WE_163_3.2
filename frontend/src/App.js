import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/layout/PrivateRoute';

// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Auth/Dashboard';
import BookingList from './pages/Bookings/BookingList';
import BookingForm from './pages/Bookings/BookingForm';
import BookingApproval from './pages/Bookings/BookingApproval';
import ResourceList from './pages/Resources/ResourceList';
import BookingSuccess from './pages/Bookings/BookingSuccess';
import BookingDetails from './pages/Bookings/BookingDetails';
import Notifications from './pages/Auth/Notifications';
import TicketList from './pages/Tickets/TicketList';
import TicketForm from './pages/Tickets/TicketForm';
import TicketDetails from './pages/Tickets/TicketDetails';
import MyTickets from './pages/Tickets/MyTickets';

function AppRoutes() {
  const { isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to={isAdmin ? '/admin/dashboard' : '/bookings'} replace />} />
          <Route
            path="/dashboard"
            element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/bookings" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={isAdmin ? <Dashboard /> : <Navigate to="/bookings" replace />}
          />
          <Route path="/bookings" element={<BookingList />} />
          <Route path="/bookings/new" element={<BookingForm />} />
          <Route path="/bookings/:id" element={<BookingDetails />} />
          <Route path="/rooms" element={isAdmin ? <ResourceList /> : <Navigate to="/bookings" replace />} />
          <Route path="/bookings/success" element={<BookingSuccess />} />
          <Route
            path="/admin/bookings"
            element={isAdmin ? <BookingApproval /> : <Navigate to="/bookings" replace />}
          />

          <Route path="/notifications" element={<Notifications />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/new" element={<TicketForm />} />
          <Route path="/tickets/my" element={<MyTickets />} />
          <Route path="/tickets/:id" element={<TicketDetails />} />
          <Route path="/tickets/:id/edit" element={<TicketForm />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
