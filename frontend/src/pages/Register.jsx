// src/pages/Register.jsx
import React, { useState } from 'react'
import { useRegisterMutation } from '../features/auth/authApi'
import styles from '../styles/Register.module.scss'
import { Link, useNavigate } from 'react-router-dom'

const Register = () => {
  const [register, { isLoading, error }] = useRegisterMutation()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await register(formData).unwrap()
      console.log('Успешная регистрация:', result)
      navigate('/login')
    } catch (err) {
      console.error('Ошибка регистрации:', err)
    }
  }

  return (
    <div className={styles.registerContainer}>
      <h1>Регистрация</h1>
      <form onSubmit={handleSubmit} className={styles.registerForm}>
        <label>
          Имя пользователя:
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
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
          Зарегистрироваться
        </button>
        {error && <p className={styles.error}>Ошибка регистрации</p>}
      </form>
      <p>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  )
}

export default Register
