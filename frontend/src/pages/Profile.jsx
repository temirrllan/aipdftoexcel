// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from '../styles/Profile.module.scss'

const Profile = () => {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await fetch('http://localhost:3001/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.message || 'Не удалось получить профиль')
        }
        setUser(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  if (loading) return <div className={styles.loader}>Загрузка...</div>
  if (error)   return <div className={styles.error}>{error}</div>

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Профиль пользователя</h1>
      <div className={styles.info}>
        <div className={styles.row}>
          <span className={styles.label}>ID:</span>
          <span className={styles.value}>{user.id}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Имя:</span>
          <span className={styles.value}>{user.username}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Email:</span>
          <span className={styles.value}>{user.email}</span>
        </div>
      </div>
    </main>
  )
}

export default Profile
