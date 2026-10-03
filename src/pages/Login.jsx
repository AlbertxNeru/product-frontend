import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'

function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isRegister = mode === 'register'

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isRegister ? '/api/register' : '/api/login'
      const payload = isRegister
        ? form
        : { email: form.email, password: form.password }

      const response = await api.post(endpoint, payload)
      const { user, tokens } = response.data

      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/products', { replace: true })
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Unable to connect to the LavaLust API. Check that the backend is running.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="brand-mark">PM</div>
        <div className="auth-copy">
          <span className="eyebrow">LABORATORY EXERCISE NO. 6</span>
          <h1>Product management, made simple.</h1>
          <p>
            A React frontend connected to a protected LavaLust API and Aiven MySQL database.
          </p>
        </div>
        <div className="architecture-row" aria-label="Application architecture">
          <span>React</span>
          <b>→</b>
          <span>LavaLust API</span>
          <b>→</b>
          <span>Aiven MySQL</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand">
            <div className="brand-mark">PM</div>
            <span>Product Manager</span>
          </div>

          <span className="eyebrow">WELCOME</span>
          <h2>{isRegister ? 'Create your account' : 'Sign in to your account'}</h2>
          <p className="muted">
            {isRegister
              ? 'Create the first user for your laboratory application.'
              : 'Enter your credentials to manage products.'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <label>
                Username
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. admin"
                  minLength="3"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                minLength="6"
                required
              />
            </label>

            {error && <div className="alert error-alert">{error}</div>}

            <button className="primary-button full-button" disabled={loading} type="submit">
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <button
            type="button"
            className="text-button"
            onClick={() => {
              setMode(isRegister ? 'login' : 'register')
              setError('')
            }}
          >
            {isRegister ? 'Already have an account? Sign in' : 'No account yet? Create one'}
          </button>
        </div>
      </section>
    </main>
  )
}

export default Login
