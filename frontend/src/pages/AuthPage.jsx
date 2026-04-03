import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './AuthPage.module.css'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { saveLogin } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const data = await login(form.username, form.password)
        saveLogin(data.access_token, form.username)
        navigate('/')
      } else {
        await register(form.username, form.email, form.password)
        const data = await login(form.username, form.password)
        saveLogin(data.access_token, form.username)
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className={styles.page}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <div className={styles.card}>
        <div className={styles.logo}>SeS</div>
        <p className={styles.tagline}>Share your world, one reel at a time</p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.active : ''}`}
            onClick={() => { setMode('login'); setError('') }}
          >Login</button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.active : ''}`}
            onClick={() => { setMode('register'); setError('') }}
          >Register</button>
        </div>

        <div className={styles.fields}>
          <label className={styles.label}>Username</label>
          <input
            className={styles.input}
            placeholder="your_username"
            value={form.username}
            onChange={set('username')}
            onKeyDown={handleKey}
            autoComplete="off"
          />

          {mode === 'register' && (
            <>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                onKeyDown={handleKey}
              />
            </>
          )}

          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            onKeyDown={handleKey}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.btn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Loading…' : mode === 'login' ? 'Enter SeS →' : 'Join SeS →'}
        </button>
      </div>
    </div>
  )
}
