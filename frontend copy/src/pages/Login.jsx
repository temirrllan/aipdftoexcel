// src/pages/Login.jsx
import React, { useState } from 'react'
import { useLoginMutation } from '../features/auth/authApi'
import { useNavigate, Link } from 'react-router-dom'
import styles from '../styles/Login.module.scss'

const Login = () => {
  const [login, { isLoading, error: serverError }] = useLoginMutation()
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  })
  const navigate = useNavigate()

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const result = await login(formData).unwrap()
      localStorage.setItem('token', result.token)
      localStorage.setItem('userId', result.user.id)
      navigate('/')
    } catch {
      // Ошибка покажется ниже
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.container}>
        <h2 className={styles.title}>Вход</h2>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="usernameOrEmail">Логин или Email</label>
            <input
              id="usernameOrEmail"
              name="usernameOrEmail"
              type="text"
              placeholder="Введите логин или email"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {serverError && (
            <p className={styles.errorServer}>
              {serverError.data?.message || 'Не удалось войти. Попробуйте снова.'}
            </p>
          )}

          <button
            type="submit"
            className={styles.submit}
            disabled={isLoading}
          >
            {isLoading ? 'Загрузка…' : 'Войти'}
          </button>
        </form>

        <p className={styles.footerText}>
          Нет аккаунта?{' '}
          <Link to="/register" className={styles.link}>
            Зарегистрируйтесь
          </Link>
        </p>
      </main>
    </div>
  )
}

export default Login
