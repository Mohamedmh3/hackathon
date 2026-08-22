import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { EmptyState, LoadingState } from '../components/feedback/PageStates'
import { PageHero } from '../components/layout/PageHero'
import { useAuth } from '../hooks/useAuth'
import { useClubSportManagement } from '../hooks/useClubSportManagement'
import type {
  ClubFormInput,
  ManagedClub,
} from '../types/clubSportManagement'

const INITIAL_CLUB_FORM: ClubFormInput = {
  name: '',
  city: '',
  status: 'active',
}

function toClubForm(club?: ManagedClub): ClubFormInput {
  if (!club) {
    return INITIAL_CLUB_FORM
  }
  return {
    name: club.name,
    city: club.city,
    status: club.status,
  }
}

function isClubStatus(value: string): value is 'active' | 'inactive' {
  return value === 'active' || value === 'inactive'
}

export function ClubsPage() {
  const { user } = useAuth()
  const {
    clubs,
    sports,
    clubMap,
    clubStats,
    isLoading,
    createClub,
    updateClub,
    toggleClubStatus,
    createSport,
    updateSport,
    deleteSport,
    setClubSportLink,
  } = useClubSportManagement()

  const isAdmin = user?.role === 'admin'
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null)
  const [clubFormMode, setClubFormMode] = useState<'create' | 'edit' | null>(null)
  const [clubForm, setClubForm] = useState<ClubFormInput>(INITIAL_CLUB_FORM)
  const [sportInput, setSportInput] = useState('')
  const [editingSportId, setEditingSportId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    setCurrentPage(1)
  }, [clubs.length, user?.role, user?.clubId])

  const visibleClubs = (() => {
    if (user?.role === 'club_staff' && user.clubId) {
      return clubs.filter((club) => club.id === user.clubId)
    }
    return clubs
  })()

  const totalPages = Math.max(1, Math.ceil(visibleClubs.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedClubs = visibleClubs.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const selectedClub = (() => {
    if (selectedClubId) {
      return clubMap.get(selectedClubId) ?? null
    }
    return visibleClubs[0] ?? null
  })()

  if (!user) {
    return null
  }

  if (isLoading) {
    return <LoadingState />
  }

  const handleSubmitClubForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (clubFormMode === 'create') {
      const created = createClub(clubForm)
      setSelectedClubId(created.id)
    }
    if (clubFormMode === 'edit' && selectedClub) {
      updateClub(selectedClub.id, clubForm)
    }
    setClubFormMode(null)
    setClubForm(INITIAL_CLUB_FORM)
  }

  return (
    <section className="page">
      <PageHero
        eyebrow="إدارة الأندية"
        title="الأندية والألعاب"
        description="إدارة الأندية والألعاب وربطها مع عرض ملخص الإحصائيات لكل نادٍ."
      />

      <section className="kpi-grid">
        <article className="kpi-card">
          <p className="kpi-label">إجمالي الأندية</p>
          <h3 className="kpi-value">{visibleClubs.length}</h3>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">الأندية العاملة</p>
          <h3 className="kpi-value">
            {visibleClubs.filter((club) => club.status === 'active').length}
          </h3>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">عدد الألعاب</p>
          <h3 className="kpi-value">{sports.length}</h3>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>قائمة الأندية</h3>
          {isAdmin ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setClubFormMode('create')
                setClubForm(INITIAL_CLUB_FORM)
              }}
            >
              إضافة نادي
            </button>
          ) : null}
        </div>

        {visibleClubs.length === 0 ? (
          <EmptyState
            title="لا توجد أندية متاحة"
            message="لا توجد أندية ضمن نطاق صلاحيتك."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="contracts-table clubs-table">
                <thead>
                  <tr>
                    <th>النادي</th>
                    <th>المدينة</th>
                    <th>الحالة</th>
                    <th>الألعاب المرتبطة</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClubs.map((club) => (
                    <tr
                      key={club.id}
                      className={
                        selectedClub?.id === club.id ? 'players-row-selected' : undefined
                      }
                      onClick={() => setSelectedClubId(club.id)}
                    >
                      <td>{club.name}</td>
                      <td>{club.city}</td>
                      <td>{club.status === 'active' ? 'عامل' : 'غير عامل'}</td>
                      <td>{club.sportIds.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 ? (
              <div className="catalog-card-actions" style={{ justifyContent: 'center' }}>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  السابق
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={page === safePage ? 'primary-button' : 'secondary-button'}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  className="secondary-button"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                >
                  التالي
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {selectedClub ? (
        <section className="dashboard-panel">
          <div className="panel-header">
            <h3>ملخص {selectedClub.name}</h3>
            <span>{selectedClub.city}</span>
          </div>
          <div className="details-grid">
            <p>الحالة: {selectedClub.status === 'active' ? 'عامل' : 'غير عامل'}</p>
            <p>اللاعبون: {clubStats.get(selectedClub.id)?.playersCount ?? 0}</p>
            <p>
              العقود النشطة: {clubStats.get(selectedClub.id)?.activeContractsCount ?? 0}
            </p>
            <p>
              الإنجازات: {clubStats.get(selectedClub.id)?.achievementsCount ?? 0}
            </p>
          </div>
          <div className="tag-list">
            {selectedClub.sportIds.length === 0 ? (
              <span className="tag">لا توجد ألعاب مرتبطة</span>
            ) : (
              selectedClub.sportIds.map((sportId) => (
                <span key={sportId} className="tag">
                  {sports.find((sport) => sport.id === sportId)?.name ?? sportId}
                </span>
              ))
            )}
          </div>
          {isAdmin ? (
            <div className="catalog-card-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setClubFormMode('edit')
                  setClubForm(toClubForm(selectedClub))
                }}
              >
                تعديل النادي
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => toggleClubStatus(selectedClub.id)}
              >
                تبديل الحالة
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {clubFormMode ? (
        <section className="dashboard-panel">
          <div className="panel-header">
            <h3>{clubFormMode === 'create' ? 'إنشاء نادي' : 'تعديل نادي'}</h3>
          </div>
          <form className="player-form-grid" onSubmit={handleSubmitClubForm}>
            <label className="field">
              <span>اسم النادي</span>
              <input
                required
                value={clubForm.name}
                onChange={(event) =>
                  setClubForm({ ...clubForm, name: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>المدينة</span>
              <input
                required
                value={clubForm.city}
                onChange={(event) =>
                  setClubForm({ ...clubForm, city: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>الحالة</span>
              <select
                value={clubForm.status}
                onChange={(event) => {
                  const nextStatus = event.target.value
                  if (isClubStatus(nextStatus)) {
                    setClubForm({
                      ...clubForm,
                      status: nextStatus,
                    })
                  } else {
                    console.error(`Unexpected club status: ${nextStatus}`)
                  }
                }}
              >
                <option value="active">عامل</option>
                <option value="inactive">غير عامل</option>
              </select>
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button">
                {clubFormMode === 'create' ? 'إنشاء النادي' : 'حفظ التعديلات'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setClubFormMode(null)
                  setClubForm(INITIAL_CLUB_FORM)
                }}
              >
                إلغاء
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>إدارة الألعاب</h3>
          {isAdmin ? <span>إضافة / تعديل / حذف الألعاب</span> : <span>عرض فقط</span>}
        </div>
        <div className="sport-input-row">
          <input
            className="sport-input"
            value={sportInput}
            onChange={(event) => setSportInput(event.target.value)}
            placeholder="اسم اللعبة"
            disabled={!isAdmin}
          />
          <button
            type="button"
            className="secondary-button"
            disabled={!isAdmin}
            onClick={() => {
              if (editingSportId) {
                updateSport(editingSportId, sportInput)
                setEditingSportId(null)
              } else {
                createSport(sportInput)
              }
              setSportInput('')
            }}
          >
            {editingSportId ? 'حفظ اللعبة' : 'إضافة لعبة'}
          </button>
        </div>
        <ul className="catalog-meta">
          {sports.map((sport) => (
            <li key={sport.id}>
              <span>{sport.name}</span>
              {isAdmin ? (
                <span className="inline-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingSportId(sport.id)
                      setSportInput(sport.name)
                    }}
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => deleteSport(sport.id)}
                  >
                    حذف
                  </button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {selectedClub ? (
        <section className="dashboard-panel">
          <div className="panel-header">
            <h3>ربط الألعاب مع {selectedClub.name}</h3>
            <span>{isAdmin ? 'قابل للتعديل' : 'عرض فقط'}</span>
          </div>
          <div className="link-grid">
            {sports.map((sport) => {
              const isChecked = selectedClub.sportIds.includes(sport.id)
              return (
                <label key={sport.id} className="link-item">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={!isAdmin}
                    onChange={(event) =>
                      setClubSportLink(selectedClub.id, sport.id, event.target.checked)
                    }
                  />
                  <span>{sport.name}</span>
                </label>
              )
            })}
          </div>
        </section>
      ) : null}
    </section>
  )
}
