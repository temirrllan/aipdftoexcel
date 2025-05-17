// src/App.jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Header from '@/components/Header'
import Logout from '@/components/Logout'

import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Upload from '@/pages/Upload'
import Profile from '@/pages/Profile'
import Keywords from '@/pages/Keywords'

import '@/styles/global.scss'

const App = () => (
  <Router>
    <Header />

    <Routes>
      <Route path="/login"      element={<Login />} />
      <Route path="/register"   element={<Register />} />
      <Route path="/dashboard"  element={<Dashboard />} />
      <Route path="/upload"     element={<Upload />} />
      <Route path="/profile"    element={<Profile />} />
      <Route path="/keywords"   element={<Keywords />} />
      <Route path="/logout"     element={<Logout />} />
    </Routes>
  </Router>
)

export default App
