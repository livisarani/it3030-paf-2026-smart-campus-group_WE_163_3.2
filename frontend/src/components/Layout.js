import React from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const Layout = () => (
  <div style={{ minHeight: '100vh', background: '#f4f6f4' }}>
    <Navbar />
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      `}</style>
      <Outlet />
    </main>
  </div>
);

export default Layout;
