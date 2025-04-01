// src/pages/Login.jsx
import React, { useState } from 'react'
import { useLoginMutation } from '../features/auth/authApi'
import styles from '../styles/Login.module.scss'
import { Link, useNavigate } from 'react-router-dom'

const Login = () => {
  const [login, { isLoading, error }] = useLoginMutation()
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  })
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await login(formData).unwrap()
      console.log('Успешный вход:', result)
      // Сохраняем токен в localStorage или в стейт
      localStorage.setItem('token', result.token)
      navigate('/dashboard') // перенаправление на основную страницу
    } catch (err) {
      console.error('Ошибка входа:', err)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <h1>Вход</h1>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <label>
          Имя пользователя или Email:
          <input
            type="text"
            name="usernameOrEmail"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Пароль:
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit" disabled={isLoading}>
          Войти
        </button>
        {error && <p className={styles.error}>Ошибка входа</p>}
      </form>
      <p>
        Нет аккаунта? <Link to="/register">Регистрация</Link>
      </p>
    </div>
  )
}

export default Login
