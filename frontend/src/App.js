import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Auth/Dashboard';
import Notifications from './pages/Auth/Notifications';

// Ticket pages (Member 3)
import TicketList from './pages/Tickets/TicketList';
import TicketForm from './pages/Tickets/TicketForm';
import TicketDetails from './pages/Tickets/TicketDetails';
import MyTickets from './pages/Tickets/MyTickets';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected – wrapped in Layout (Navbar + main container) */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"      element={<Dashboard />} />
          <Route path="/notifications"  element={<Notifications />} />

          {/* Ticket Module (Member 3) */}
          <Route path="/tickets"            element={<TicketList />} />
          <Route path="/tickets/new"        element={<TicketForm />} />
          <Route path="/tickets/my"         element={<MyTickets />} />
          <Route path="/tickets/:id"        element={<TicketDetails />} />
          <Route path="/tickets/:id/edit"   element={<TicketForm />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;

