import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from 'react-router-dom';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Toast system available globally with consistent design */}
        <Toaster
          position="top-right"
          toastOptions={{
            // Default toast styles
            style: {
              borderRadius: '8px',
              background: '#18181b',
              color: '#fff',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              fontSize: '1rem',
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
              padding: '14px 20px',
              minWidth: '220px',
              maxWidth: '90vw',
              animation: 'toastSlideIn 0.35s ease-out',
            },
            // Success toast
            success: {
              style: {
                background: '#22c55e', // green-500
                color: '#fff',
              },
              className: 'toast-success toast-animate',
              iconTheme: {
                primary: '#fff',
                secondary: '#16a34a',
              },
            },
            // Error toast
            error: {
              style: {
                background: '#ef4444', // red-500
                color: '#fff',
              },
              className: 'toast-animate',
              iconTheme: {
                primary: '#fff',
                secondary: '#b91c1c',
              },
            },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
