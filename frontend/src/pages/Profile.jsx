// src/pages/Profile.jsx
import React from 'react'
import { useGetProfileQuery } from '../features/auth/authApi'
import styles from '../styles/Profile.module.scss'

const Profile = () => {
  // Используем RTK Query для получения профиля
  const { data, error, isLoading } = useGetProfileQuery()

  if (isLoading) {
    return <div className={styles.profileContainer}>Загрузка...</div>
  }

  if (error) {
    return (
      <div className={styles.profileContainer}>
        Ошибка: {error.error || 'Не удалось получить профиль'}
      </div>
    )
  }

  return (
    <div className={styles.profileContainer}>
      <h1>Профиль пользователя</h1>
      <div className={styles.info}>
        <p>
          <strong>ID:</strong> {data.id}
        </p>
        <p>
          <strong>Имя пользователя:</strong> {data.username}
        </p>
        <p>
          <strong>Email:</strong> {data.email}
        </p>
      </div>
    </div>
  )
}

export default Profile
