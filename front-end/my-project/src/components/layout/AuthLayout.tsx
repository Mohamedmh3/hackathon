import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <header className="auth-layout-header">
        <Link to="/login" className="auth-layout-brand">
          <img
            src="/syria-logo.png"
            alt=""
            width={52}
            height={52}
            className="site-logo"
          />
          <div>
            <p className="auth-layout-eyebrow">وزارة الشباب والرياضة</p>
            <p className="auth-layout-title">نظام انتساب اللاعبين</p>
          </div>
        </Link>
      </header>
      <div className="auth-layout-stripe" aria-hidden="true" />
      <main className="auth-layout-main">
        <Outlet />
      </main>
      <footer className="site-footer site-footer-compact">
        <p>الجمهورية العربية السورية — وزارة الشباب والرياضة</p>
      </footer>
    </div>
  )
}
