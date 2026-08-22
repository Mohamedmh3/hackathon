import { useState } from 'react'
import type { FormEvent } from 'react'
import { isUserRole, USER_ROLES } from '../../types/domain'
import type { UserRole } from '../../types/domain'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'موظف عام',
  club_staff: 'موظف نادي',
  player: 'لاعب',
  public: 'مستخدم عادي',
}

type AuthFormLocale = 'en' | 'ar'

const ROLE_LABELS_EN: Record<UserRole, string> = {
  admin: 'Admin (Ministry)',
  club_staff: 'Club Staff',
  player: 'Player',
  public: 'Public User',
}

interface AuthFormValues {
  fullName: string
  email: string
  password: string
  role: UserRole
}

interface AuthFormProps {
  title: string
  description: string
  submitLabel: string
  onSubmit: (values: AuthFormValues) => Promise<void> | void
  defaultRole?: UserRole
  includeName?: boolean
  includeRole?: boolean
  errorMessage?: string | null
  isSubmitting?: boolean
  locale?: AuthFormLocale
}

export function AuthForm({
  title,
  description,
  submitLabel,
  onSubmit,
  defaultRole = 'public',
  includeName = true,
  includeRole = true,
  errorMessage = null,
  isSubmitting = false,
  locale = 'ar',
}: AuthFormProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(defaultRole)

  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!PASSWORD_REGEX.test(password)) {
      console.error('Password does not meet complexity requirements.')
      return
    }

    const finalName = includeName ? fullName.trim() : email.trim().split('@')[0]
    await onSubmit({
      fullName: finalName,
      email: email.trim(),
      password,
      role,
    })
  }

  const labels =
    locale === 'en'
      ? {
          fullName: 'Full name',
          fullNamePlaceholder: 'Enter your full name',
          email: 'Email',
          password: 'Password',
          passwordPlaceholder: '8-72 chars, letters + numbers',
          passwordTitle: 'Use 8-72 chars with at least one letter and one number',
          role: 'Role',
          autoComplete: 'current-password',
          roleLabels: ROLE_LABELS_EN,
        }
      : {
          fullName: 'الاسم الكامل',
          fullNamePlaceholder: 'أدخل الاسم الكامل',
          email: 'البريد الإلكتروني',
          password: 'كلمة المرور',
          passwordPlaceholder: 'من 8 إلى 72 حرفاً مع حروف وأرقام',
          passwordTitle: 'استخدم من 8 إلى 72 حرفاً مع حرف واحد ورقم واحد على الأقل',
          role: 'الدور',
          autoComplete: 'current-password',
          roleLabels: ROLE_LABELS,
        }

  return (
    <section className="auth-card">
      <header>
        <h2 className="page-title">{title}</h2>
        <p className="page-description">{description}</p>
      </header>
      <form className="auth-form" onSubmit={handleSubmit}>
        {includeName ? (
          <label className="field">
            <span>{labels.fullName}</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={labels.fullNamePlaceholder}
              required
            />
          </label>
        ) : null}
        <label className="field">
          <span>{labels.email}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
          />
        </label>
        <label className="field">
          <span>{labels.password}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={labels.passwordPlaceholder}
            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
            title={labels.passwordTitle}
            autoComplete={labels.autoComplete}
            required
          />
        </label>
        {includeRole ? (
          <label className="field">
            <span>{labels.role}</span>
            <select
              value={role}
              onChange={(event) => {
                const nextRole = event.target.value
                if (isUserRole(nextRole)) {
                  setRole(nextRole)
                } else {
                  console.error(`Unexpected role value: ${nextRole}`)
                }
              }}
            >
              {USER_ROLES.map((item) => (
                <option key={item} value={item}>
                  {labels.roleLabels[item]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {errorMessage ? <p className="page-description">{errorMessage}</p> : null}
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {submitLabel}
        </button>
      </form>
    </section>
  )
}
