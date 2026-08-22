import { Link, useNavigate } from 'react-router-dom'
import { AuthForm } from '../components/auth/AuthForm'
import { useAuth } from '../hooks/useAuth'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, authError, isAuthLoading, clearAuthError } = useAuth()

  return (
    <section className="auth-page">
      <AuthForm
        title="إنشاء حساب"
        description="أنشئ حساباً جديداً عبر خادم النظام."
        submitLabel="إنشاء الحساب"
        locale="ar"
        includeName
        includeRole={false}
        errorMessage={authError}
        isSubmitting={isAuthLoading}
        onSubmit={async (values) => {
          clearAuthError()
          await register(values)
          navigate('/', { replace: true })
        }}
      />
      <p className="auth-footnote">
        لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
      </p>
    </section>
  )
}
