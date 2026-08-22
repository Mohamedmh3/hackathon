import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthForm } from '../components/auth/AuthForm'
import { useAuth } from '../hooks/useAuth'

interface LoginLocationState {
  from?: { pathname?: string }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, authError, isAuthLoading, clearAuthError } = useAuth()

  const from =
    (location.state as LoginLocationState | null)?.from?.pathname ?? '/'

  return (
    <section className="auth-page">
      <AuthForm
        title="تسجيل الدخول"
        description="سجّل دخولك للوصول إلى نظام انتساب اللاعبين."
        submitLabel="تسجيل الدخول"
        locale="ar"
        includeName={false}
        includeRole={false}
        errorMessage={authError}
        isSubmitting={isAuthLoading}
        onSubmit={async ({ email, password }) => {
          clearAuthError()
          await login({
            email,
            password,
            fullName: email.split('@')[0] || 'User',
          })
          navigate(from, { replace: true })
        }}
      />
      <p className="auth-footnote">
        لا تملك حساباً؟ <Link to="/register">إنشاء حساب جديد</Link>
      </p>
    </section>
  )
}
