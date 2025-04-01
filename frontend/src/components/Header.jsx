// src/components/Header.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Header.module.scss'

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Link to="/">MyApp</Link>
      </div>
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link to="/dashboard">Главная</Link>
          </li>
          <li>
            <Link to="/profile">Профиль</Link>
          </li>
          <li>
            <Link to="/upload">Конвертация</Link>
          </li>
          <li>
            <Link to="/logout">Выход</Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default Header
