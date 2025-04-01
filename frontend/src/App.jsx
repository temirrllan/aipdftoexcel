// src/App.jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import './styles/global.scss'
import Profile from './pages/Profile'
import Keywords from './pages/Keywords'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        {/* Другие маршруты */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/keywords" element={<Keywords />} />

      </Routes>
    </Router>
  )
}

export default App
