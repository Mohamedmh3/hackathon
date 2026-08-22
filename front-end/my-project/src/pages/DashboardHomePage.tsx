import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StateCard } from '../components/feedback/StateCard'
import { ErrorState, LoadingState } from '../components/feedback/PageStates'
import { PageHero } from '../components/layout/PageHero'
import {
  DASHBOARD_SHORTCUTS,
  hasAdminDashboardAccess,
} from '../data/dashboardData'
import { useAuth } from '../hooks/useAuth'
import {
  getClubsRequest,
  getDashboardOverviewRequest,
  getDashboardPlayersByClubRequest,
  getDashboardPlayersBySportRequest,
  getDashboardPlayersByStatusRequest,
  getExpiringContractsRequest,
  getPlayersRequest,
  getStoredAuthToken,
} from '../lib/api'

function getDaysUntil(endDate: string): number {
  const now = new Date()
  const end = new Date(endDate)
  const msInDay = 1000 * 60 * 60 * 24
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / msInDay))
}

export function DashboardHomePage() {
  const { user } = useAuth()
  const canSeeDashboard = Boolean(user && hasAdminDashboardAccess(user.role))
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [overview, setOverview] = useState<{
    totalPlayers: number
    totalClubs: number
    activeContracts: number
    contractsExpiringSoon: number
  } | null>(null)
  const [playersByStatus, setPlayersByStatus] = useState<Array<{ label: string; count: number }>>([])
  const [playersBySport, setPlayersBySport] = useState<Array<{ label: string; count: number }>>([])
  const [playersByClub, setPlayersByClub] = useState<Array<{ label: string; count: number }>>([])
  const [expiringContracts, setExpiringContracts] = useState<
    Array<{ id: string; playerName: string; clubName: string; endDate: string }>
  >([])

  useEffect(() => {
    if (!canSeeDashboard) {
      setIsLoading(false)
      return
    }

    const accessToken = getStoredAuthToken()
    if (!accessToken) {
      setLoadError('الجلسة غير متاحة. يرجى تسجيل الدخول مرة أخرى.')
      setIsLoading(false)
      return
    }

    let isAlive = true
    setIsLoading(true)
    setLoadError(null)

    Promise.all([
      getDashboardOverviewRequest(accessToken, 30),
      getDashboardPlayersByStatusRequest(accessToken),
      getDashboardPlayersBySportRequest(accessToken),
      getDashboardPlayersByClubRequest(accessToken),
      getExpiringContractsRequest(accessToken, 30),
      getPlayersRequest(accessToken),
      getClubsRequest(accessToken),
    ])
      .then(
        ([
          nextOverview,
          nextPlayersByStatus,
          nextPlayersBySport,
          nextPlayersByClub,
          nextExpiringContracts,
          nextPlayers,
          nextClubs,
        ]) => {
          if (!isAlive) {
            return
          }

          const playerNameById = new Map(nextPlayers.map((player) => [player.id, player.full_name]))
          const clubNameById = new Map(nextClubs.map((club) => [club.id, club.name]))

          setOverview(nextOverview)
          setPlayersByStatus(nextPlayersByStatus.map((item) => ({ label: item.label, count: item.count })))
          setPlayersBySport(nextPlayersBySport.map((item) => ({ label: item.label, count: item.count })))
          setPlayersByClub(nextPlayersByClub.map((item) => ({ label: item.label, count: item.count })))
          setExpiringContracts(
            nextExpiringContracts.map((contract) => ({
              id: contract.id,
              playerName: playerNameById.get(contract.player_id) ?? contract.player_id,
              clubName: clubNameById.get(contract.club_id) ?? contract.club_id,
              endDate: contract.end_date,
            })),
          )
        },
      )
      .catch((error: unknown) => {
        if (!isAlive) {
          return
        }
        const message = error instanceof Error ? error.message : 'تعذر تحميل بيانات لوحة التحكم.'
        setLoadError(message)
      })
      .finally(() => {
        if (isAlive) {
          setIsLoading(false)
        }
      })

    return () => {
      isAlive = false
    }
  }, [canSeeDashboard])

  if (!user) {
    return null
  }

  if (!hasAdminDashboardAccess(user.role)) {
    const limitedAction =
      user.role === 'player' ? (
        <Link to="/my-profile">فتح ملفي</Link>
      ) : (
        <Link to="/catalog">فتح الدليل العام</Link>
      )

    return (
      <section className="page">
        <PageHero
          eyebrow="مرحباً بك"
          title={`أهلاً، ${user.fullName}`}
          description={
            user.role === 'player'
              ? 'حسابك مخصص للاعب. يمكنك إدارة ملفك الشخصي وصور الإنجازات.'
              : 'صلاحية حسابك محدودة. استخدم الدليل العام لاستعراض الأندية واللاعبين.'
          }
        />
        <StateCard
          title={user.role === 'player' ? 'وضع خدمات اللاعب' : 'وضع الوصول العام'}
          message={
            user.role === 'player'
              ? 'مؤشرات الإدارة غير متاحة لهذا الدور. يمكنك عرض عقدك وتحديث صورك.'
              : 'مؤشرات الإدارة ولوحات التعاقدات متاحة للموظف العام وموظف النادي فقط.'
          }
          action={limitedAction}
        />
      </section>
    )
  }

  const pageMeta = user.role === 'admin'
    ? {
        title: 'لوحة تحكم الوزارة',
        description: 'متابعة اللاعبين والتعاقدات وجاهزية الانتقالات على مستوى جميع الأندية.',
      }
    : {
        title: 'لوحة عمليات النادي',
        description: 'متابعة قائمة لاعبي النادي والعقود التي تحتاج تجديداً أو قرار انتقال قريباً.',
      }

  const quickLinks = user.role === 'admin'
    ? [
        {
          id: 'shortcut-analytics',
          label: 'الإحصائيات المتقدمة',
          description: 'عرض تحليلات ورسوم بيانية تشغيلية للإدارة.',
          path: '/admin/analytics',
        },
        ...DASHBOARD_SHORTCUTS,
      ]
    : DASHBOARD_SHORTCUTS

  const kpis = (() => {
    if (!overview) {
      return []
    }
    if (user.role === 'admin') {
      return [
        { id: 'kpi-players', label: 'إجمالي اللاعبين', value: overview.totalPlayers },
        { id: 'kpi-clubs', label: 'إجمالي الأندية', value: overview.totalClubs },
        { id: 'kpi-active-contracts', label: 'العقود النشطة', value: overview.activeContracts },
        { id: 'kpi-expiring', label: 'العقود القريبة من الانتهاء', value: overview.contractsExpiringSoon },
      ]
    }
    return [
      { id: 'kpi-players', label: 'لاعبو النادي', value: overview.totalPlayers },
      { id: 'kpi-clubs', label: 'الأندية ضمن النطاق', value: overview.totalClubs },
      { id: 'kpi-active-contracts', label: 'العقود النشطة', value: overview.activeContracts },
      { id: 'kpi-expiring', label: 'عقود تنتهي قريبًا', value: overview.contractsExpiringSoon },
    ]
  })()

  if (isLoading) {
    return <LoadingState message="جار تحميل بيانات لوحة التحكم من قاعدة البيانات..." />
  }

  if (loadError) {
    return (
      <ErrorState
        title="تعذر تحميل لوحة التحكم"
        message={loadError}
      />
    )
  }

  return (
    <section className="page">
      <PageHero
        eyebrow="لوحة التحكم"
        title={pageMeta.title}
        description={pageMeta.description}
      />

      <section className="showcase-hero" aria-label="ملخص سريع">
        <div className="showcase-hero-content">
          <p className="showcase-hero-eyebrow">منصة تشغيل مركزية</p>
          <h3 className="showcase-hero-title">
            أهلاً {user.fullName}، تابع المؤشرات الحية واتخذ القرار أسرع
          </h3>
          <p className="showcase-hero-description">
            كل الأرقام في هذه اللوحة متصلة مباشرة بقاعدة البيانات، مع رؤية فورية لحالة اللاعبين
            والعقود القريبة من الانتهاء.
          </p>
          <div className="showcase-hero-actions">
            <Link to="/players" className="primary-button">
              إدارة اللاعبين
            </Link>
            <Link to="/contracts" className="secondary-button">
              متابعة العقود
            </Link>
            {user.role === 'admin' ? (
              <Link to="/admin/analytics" className="secondary-button">
                فتح الإحصائيات المتقدمة
              </Link>
            ) : null}
          </div>
        </div>
        <div className="showcase-hero-side">
          <div className="showcase-hero-visual" aria-hidden="true">
            <span className="showcase-orb showcase-orb-red" />
            <span className="showcase-orb showcase-orb-green" />
            <span className="showcase-ring showcase-ring-one" />
            <span className="showcase-ring showcase-ring-two" />
            <span className="showcase-particle p1" />
            <span className="showcase-particle p2" />
            <span className="showcase-particle p3" />
            <span className="showcase-particle p4" />
            <span className="showcase-particle p5" />
            <span className="showcase-particle p6" />
            <span className="showcase-particle p7" />
            <span className="showcase-particle p8" />
          </div>

          <div className="showcase-hero-stats">
            {kpis.slice(0, 3).map((kpi) => (
              <article key={`showcase-${kpi.id}`} className="showcase-stat-card">
                <p>{kpi.label}</p>
                <h4>{kpi.value.toLocaleString()}</h4>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="kpi-grid" aria-label="مؤشرات لوحة التحكم">
        {kpis.map((kpi) => (
          <article key={kpi.id} className="kpi-card">
            <p className="kpi-label">{kpi.label}</p>
            <h3 className="kpi-value">{kpi.value.toLocaleString()}</h3>
            <p className="kpi-trend">بيانات مباشرة من قاعدة البيانات</p>
          </article>
        ))}
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>العقود التي تنتهي خلال 30 يوماً</h3>
          <Link to="/contracts">فتح التعاقدات</Link>
        </div>
        {expiringContracts.length === 0 ? (
          <StateCard
            title="لا توجد عقود قريبة الانتهاء"
            message="لا توجد عقود نشطة تنتهي خلال 30 يوماً."
          />
        ) : (
          <div className="table-wrap">
            <table className="contracts-table">
              <thead>
                <tr>
                  <th>اللاعب</th>
                  <th>النادي</th>
                  <th>تاريخ الانتهاء</th>
                  <th>الأيام المتبقية</th>
                </tr>
              </thead>
              <tbody>
                {expiringContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>{contract.playerName}</td>
                    <td>{contract.clubName}</td>
                    <td>{contract.endDate}</td>
                    <td>{getDaysUntil(contract.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>توزيع اللاعبين</h3>
          <span>حسب الحالة/اللعبة/النادي</span>
        </div>
        <div className="details-grid">
          <div>
            <h4>حسب الحالة</h4>
            {playersByStatus.map((item) => (
              <p key={`status-${item.label}`}>{item.label}: {item.count}</p>
            ))}
          </div>
          <div>
            <h4>حسب اللعبة</h4>
            {playersBySport.map((item) => (
              <p key={`sport-${item.label}`}>{item.label}: {item.count}</p>
            ))}
          </div>
          <div>
            <h4>حسب النادي</h4>
            {playersByClub.map((item) => (
              <p key={`club-${item.label}`}>{item.label}: {item.count}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>الإدارة المركزية</h3>
          <span>انتقال سريع</span>
        </div>
        <div className="quick-links-grid">
          {quickLinks.map((item) => (
            <article key={item.id} className="quick-link-card">
              <h3>{item.label}</h3>
              <p>{item.description}</p>
              <Link to={item.path}>فتح القسم</Link>
            </article>
          ))}
        </div>
      </section>
      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>معاينة البوابة العامة</h3>
        </div>
        <p className="page-description">
          راجع ما يمكن للمستخدم العادي رؤيته في الواجهة العامة.
        </p>
        <Link to="/catalog">فتح الدليل العام</Link>
      </section>
    </section>
  )
}
