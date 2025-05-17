// src/components/Header.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import styles from './Header.module.scss'

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(prev => !prev)

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Link to="/">AITEM</Link>
      </div>

      <button
        className={styles.burger}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <FontAwesomeIcon icon={faBars} />
      </button>

      <nav className={`${styles.nav} ${menuOpen ? styles.show : ''}`}>
        <ul>
          <li>
            <Link to="/" onClick={() => setMenuOpen(false)}>
              Главная
            </Link>
          </li>
          <li>
            <Link to="/keywords" onClick={() => setMenuOpen(false)}>
              Ключевые слова
            </Link>
          </li>
          <li>
            <Link to="/profile" onClick={() => setMenuOpen(false)}>
              Профиль
            </Link>
          </li>
          <li>
            <Link to="/upload" onClick={() => setMenuOpen(false)}>
              Конвертация
            </Link>
          </li>
          <li>
            <Link to="/logout" onClick={() => setMenuOpen(false)}>
              Выход
            </Link>
          </li>
        </ul>
      </nav>
    </header>
)
}
export default Header
