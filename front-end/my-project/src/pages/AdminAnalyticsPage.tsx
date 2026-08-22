import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, LoadingState } from '../components/feedback/PageStates'
import { PageHero } from '../components/layout/PageHero'
import { useAuth } from '../hooks/useAuth'
import {
  getDashboardOverviewRequest,
  getDashboardPlayersByClubRequest,
  getDashboardPlayersBySportRequest,
  getDashboardPlayersByStatusRequest,
  getPlayersRequest,
  getStoredAuthToken,
} from '../lib/api'

interface GenderBreakdown {
  male: number
  female: number
}

interface DashboardDataState {
  overview: {
    totalPlayers: number
    totalClubs: number
    activeContracts: number
    contractsExpiringSoon: number
  }
  statusRows: Array<{ label: string; count: number }>
  sportRows: Array<{ label: string; count: number }>
  clubRows: Array<{ label: string; count: number }>
  nationalityRows: Array<{ label: string; count: number }>
  gender: GenderBreakdown
}

function toTopRows(
  rows: Array<{ label: string; count: number }>,
  limit = 6,
): Array<{ label: string; count: number }> {
  return [...rows].sort((a, b) => b.count - a.count).slice(0, limit)
}

function toPercent(value: number, total: number): string {
  if (total <= 0) {
    return '0%'
  }
  return `${Math.round((value / total) * 100)}%`
}

export function AdminAnalyticsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardDataState | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setIsLoading(false)
      return
    }

    const accessToken = getStoredAuthToken()
    if (!accessToken) {
      setError('الجلسة غير متاحة. يرجى تسجيل الدخول مرة أخرى.')
      setIsLoading(false)
      return
    }

    let isAlive = true
    setIsLoading(true)
    setError(null)

    Promise.all([
      getDashboardOverviewRequest(accessToken, 30),
      getDashboardPlayersByStatusRequest(accessToken),
      getDashboardPlayersBySportRequest(accessToken),
      getDashboardPlayersByClubRequest(accessToken),
      getPlayersRequest(accessToken),
    ])
      .then(([overview, statusRows, sportRows, clubRows, players]) => {
        if (!isAlive) {
          return
        }

        const gender: GenderBreakdown = { male: 0, female: 0 }
        const nationalityMap = new Map<string, number>()

        players.forEach((player) => {
          if (player.gender === 'male') {
            gender.male += 1
          } else if (player.gender === 'female') {
            gender.female += 1
          }

          const nationality = player.nationality.trim() || 'غير محدد'
          nationalityMap.set(nationality, (nationalityMap.get(nationality) ?? 0) + 1)
        })

        const nationalityRows = Array.from(nationalityMap.entries()).map(([label, count]) => ({
          label,
          count,
        }))

        setData({
          overview,
          statusRows: toTopRows(statusRows, 6),
          sportRows: toTopRows(sportRows, 6),
          clubRows: toTopRows(clubRows, 6),
          nationalityRows: toTopRows(nationalityRows, 6),
          gender,
        })
      })
      .catch((loadError: unknown) => {
        if (!isAlive) {
          return
        }
        const nextMessage =
          loadError instanceof Error ? loadError.message : 'تعذر تحميل الإحصائيات من قاعدة البيانات.'
        setError(nextMessage)
      })
      .finally(() => {
        if (isAlive) {
          setIsLoading(false)
        }
      })

    return () => {
      isAlive = false
    }
  }, [user])

  const totalPlayers = data?.overview.totalPlayers ?? 0
  const malePercent = data ? toPercent(data.gender.male, totalPlayers) : '0%'
  const femalePercent = data ? toPercent(data.gender.female, totalPlayers) : '0%'
  const maxStatusCount = useMemo(
    () => Math.max(...(data?.statusRows.map((row) => row.count) ?? [0]), 1),
    [data?.statusRows],
  )
  const maxSportCount = useMemo(
    () => Math.max(...(data?.sportRows.map((row) => row.count) ?? [0]), 1),
    [data?.sportRows],
  )
  const maxClubCount = useMemo(
    () => Math.max(...(data?.clubRows.map((row) => row.count) ?? [0]), 1),
    [data?.clubRows],
  )

  if (!user) {
    return null
  }

  if (user.role !== 'admin') {
    return (
      <ErrorState
        title="صلاحية غير كافية"
        message="هذه الصفحة مخصصة لموظف عام فقط."
        action={<Link to="/">العودة إلى لوحة التحكم</Link>}
      />
    )
  }

  if (isLoading) {
    return <LoadingState title="تحميل الإحصائيات..." message="جاري جلب البيانات التحليلية من قاعدة البيانات." />
  }

  if (error || !data) {
    return (
      <ErrorState
        title="تعذر تحميل الإحصائيات"
        message={error ?? 'حدث خطأ غير متوقع.'}
        action={<Link to="/">العودة إلى لوحة التحكم</Link>}
      />
    )
  }

  const donutStyle = {
    background: `conic-gradient(var(--sy-red) 0 ${malePercent}, var(--sy-green) ${malePercent} 100%)`,
  }

  return (
    <section className="page">
      <PageHero
        eyebrow="لوحة الإدارة"
        title="التحليلات والإحصائيات"
        description="مؤشرات تشغيلية مباشرة من قاعدة البيانات لدعم اتخاذ القرار."
      />

      <section className="kpi-grid" aria-label="مؤشرات رئيسية">
        <article className="kpi-card">
          <p className="kpi-label">إجمالي اللاعبين</p>
          <h3 className="kpi-value">{data.overview.totalPlayers.toLocaleString()}</h3>
          <p className="kpi-trend">من قاعدة البيانات</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">إجمالي الأندية</p>
          <h3 className="kpi-value">{data.overview.totalClubs.toLocaleString()}</h3>
          <p className="kpi-trend">نشطة + غير نشطة</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">العقود النشطة</p>
          <h3 className="kpi-value">{data.overview.activeContracts.toLocaleString()}</h3>
          <p className="kpi-trend">عقود فعالة حاليًا</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">تنتهي خلال 30 يوم</p>
          <h3 className="kpi-value">{data.overview.contractsExpiringSoon.toLocaleString()}</h3>
          <p className="kpi-trend">تتطلب متابعة عاجلة</p>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="dashboard-panel chart-card">
          <div className="panel-header">
            <h3>توزيع الجنس</h3>
            <span>{totalPlayers.toLocaleString()} لاعب</span>
          </div>
          <div className="gender-chart-wrap">
            <div className="gender-donut" style={donutStyle} aria-label="توزيع الجنس" />
            <div className="gender-legend">
              <p><span className="legend-dot legend-male" /> ذكور: {data.gender.male} ({malePercent})</p>
              <p><span className="legend-dot legend-female" /> إناث: {data.gender.female} ({femalePercent})</p>
            </div>
          </div>
        </article>

        <article className="dashboard-panel chart-card">
          <div className="panel-header">
            <h3>توزيع الحالات</h3>
            <span>Top 6</span>
          </div>
          <div className="bar-list">
            {data.statusRows.map((row) => (
              <div key={row.label} className="bar-row">
                <div className="bar-row-label">
                  <span>{row.label}</span>
                  <strong>{row.count}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(row.count / maxStatusCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-panel chart-card">
          <div className="panel-header">
            <h3>أكثر الألعاب تمثيلاً</h3>
            <span>Top 6</span>
          </div>
          <div className="bar-list">
            {data.sportRows.map((row) => (
              <div key={row.label} className="bar-row">
                <div className="bar-row-label">
                  <span>{row.label}</span>
                  <strong>{row.count}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill bar-fill-green" style={{ width: `${(row.count / maxSportCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-panel chart-card">
          <div className="panel-header">
            <h3>أعلى الأندية بعدد اللاعبين</h3>
            <span>Top 6</span>
          </div>
          <div className="bar-list">
            {data.clubRows.map((row) => (
              <div key={row.label} className="bar-row">
                <div className="bar-row-label">
                  <span>{row.label}</span>
                  <strong>{row.count}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill bar-fill-dark" style={{ width: `${(row.count / maxClubCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>الجنسيات الأكثر تمثيلاً</h3>
          <span>Top 6</span>
        </div>
        <div className="table-wrap">
          <table className="contracts-table">
            <thead>
              <tr>
                <th>الجنسية</th>
                <th>العدد</th>
                <th>النسبة</th>
              </tr>
            </thead>
            <tbody>
              {data.nationalityRows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.count}</td>
                  <td>{toPercent(row.count, totalPlayers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
