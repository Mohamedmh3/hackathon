import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { NavItem } from '../../types/domain'

const NAV_ITEMS: NavItem[] = [
  { label: 'لوحة التحكم', path: '/' },
  { label: 'الإحصائيات', path: '/admin/analytics', roles: ['admin'] },
  { label: 'اللاعبون', path: '/players', roles: ['admin', 'club_staff'] },
  { label: 'الأندية', path: '/clubs', roles: ['admin', 'club_staff'] },
  { label: 'التعاقدات', path: '/contracts', roles: ['admin', 'club_staff'] },
  { label: 'ملفي', path: '/my-profile', roles: ['player'] },
  { label: 'الدليل العام', path: '/catalog' },
]

const ROLE_LABELS = {
  admin: 'موظف عام',
  club_staff: 'موظف نادي',
  player: 'لاعب',
  public: 'مستخدم عادي',
} as const

export function AppShell() {
  const { user, logout } = useAuth()

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user ? item.roles.includes(user.role) : false),
  )

  return (
    <div className="app-root">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-brand">
            <img
              src="/syria-logo.png"
              alt=""
              width={48}
              height={48}
              className="site-logo"
            />
            <div>
              <p className="site-brand-eyebrow">وزارة الشباب والرياضة</p>
              <h1 className="site-brand-title">نظام انتساب اللاعبين</h1>
            </div>
          </div>
          <div className="site-header-actions">
            <div className="user-chip" aria-label="المستخدم المسجل">
              <p>{user?.fullName}</p>
              <span>{user ? ROLE_LABELS[user.role] : ''}</span>
            </div>
            <button type="button" className="secondary-button" onClick={logout}>
              تسجيل الخروج
            </button>
          </div>
        </div>
        <div className="identity-stripe" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </header>

      <nav className="site-nav" aria-label="التنقل الرئيسي">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }: { isActive: boolean }) =>
              `site-nav-link${isActive ? ' site-nav-link-active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>الجمهورية العربية السورية — وزارة الشباب والرياضة</p>
        <p className="site-footer-sub">نظام انتساب اللاعبين والتعاقدات</p>
      </footer>
    </div>
  )
}
