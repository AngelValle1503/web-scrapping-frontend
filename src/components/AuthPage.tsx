import { useState } from 'react'
import { KeyRound, LogIn, UserPlus } from 'lucide-react'
import { apiUrl, setAuthToken } from '../api'

export type AuthenticatedUser = {
  id: number
  name: string
  email: string
}

type AuthPageProps = {
  onAuthenticated: (user: AuthenticatedUser) => void
}

type AuthResponse = {
  token?: string
  user?: AuthenticatedUser
  message?: string
  errors?: Record<string, string[]>
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch(apiUrl(`/api/auth/${mode === 'login' ? 'login' : 'register'}`), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          mode === 'login'
            ? { email, password }
            : { name, email, password, password_confirmation: passwordConfirmation }
        ),
      })
      const data = (await response.json()) as AuthResponse

      if (!response.ok || !data.token || !data.user) {
        setError(data.errors?.email?.[0] ?? data.errors?.password?.[0] ?? data.message ?? 'No se pudo completar la solicitud.')
        return
      }

      setAuthToken(data.token)
      onAuthenticated(data.user)
    } catch {
      setError('No se pudo conectar con la API. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode)
    setError(null)
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand-icon">
          <KeyRound size={28} />
        </div>
        <h1>Web Scraper &amp; Tracker</h1>
        <p>Inicia sesión para gestionar tu catálogo y monitoreos.</p>

        <div className="auth-mode-tabs" role="tablist" aria-label="Autenticación">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => selectMode('login')}>
            <LogIn size={16} /> Iniciar sesión
          </button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => selectMode('register')}>
            <UserPlus size={16} /> Crear cuenta
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label>
              Nombre
              <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
            </label>
          )}

          <label>
            Correo electrónico
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>

          <label>
            Contraseña
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>

          {mode === 'register' && (
            <label>
              Confirmar contraseña
              <input type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} required minLength={8} autoComplete="new-password" />
            </label>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" disabled={submitting} type="submit">
            {submitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </section>
    </main>
  )
}
