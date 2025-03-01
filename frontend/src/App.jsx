import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Components
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Locations from './pages/Locations';
import ConnectGoogle from './pages/ConnectGoogle';
import Login from './pages/Login';
import Register from './pages/Register';
import Reviews from './pages/Reviews';
import Posts from './pages/Posts';

// Context
import { useAuth } from './context/AuthContext';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  // Show loading state or redirect if not authenticated
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  const { currentUser } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* Sidebar (shown on authenticated routes) */}
        {currentUser && <Sidebar />}
        
        {/* Main content */}
        <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflow: 'auto' }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/accounts" 
              element={
                <ProtectedRoute>
                  <Accounts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/locations" 
              element={
                <ProtectedRoute>
                  <Locations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/connect-google" 
              element={
                <ProtectedRoute>
                  <ConnectGoogle />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reviews" 
              element={
                <ProtectedRoute>
                  <Reviews />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/posts" 
              element={
                <ProtectedRoute>
                  <Posts />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;