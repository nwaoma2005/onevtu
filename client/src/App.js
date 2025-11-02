import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BuyAirtime from './pages/BuyAirtime';
import BuyData from './pages/BuyData';
import CableTV from './pages/CableTv';
import Electricity from './pages/Electricity';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/buy-airtime" element={
          <ProtectedRoute>
            <BuyAirtime />
          </ProtectedRoute>
        } />
        
        <Route path="/buy-data" element={
          <ProtectedRoute>
            <BuyData />
          </ProtectedRoute>
        } />
        
        <Route path="/cable-tv" element={
          <ProtectedRoute>
            <CableTV />
          </ProtectedRoute>
        } />
        
        <Route path="/electricity" element={
          <ProtectedRoute>
            <Electricity />
          </ProtectedRoute>
        } />
        
        <Route path="/transactions" element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;