// src/pages/Dashboard.jsx
import React from 'react'
import Header from '../components/Header'
import styles from '../styles/Dashboard.module.scss'

const Dashboard = () => {
  return (
    <div className={styles.dashboard}>
      <Header />
      <main className={styles.main}>
        <h1>Добро пожаловать на главную страницу!</h1>
        {/* Здесь можно разместить остальной контент главной страницы */}
      </main>
    </div>
  )
}

export default Dashboard
