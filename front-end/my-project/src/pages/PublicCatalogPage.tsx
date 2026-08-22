import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  EmptyState,
  LoadingState,
} from '../components/feedback/PageStates'
import { PageHero } from '../components/layout/PageHero'
import { useAuth } from '../hooks/useAuth'
import { useCatalogFavorites } from '../hooks/useCatalogFavorites'
import { getPublicClubsRequest, getPublicPlayersRequest } from '../lib/api'
import type { PublicCatalogClub, PublicCatalogPlayer } from '../types/domain'

type CatalogView = 'players' | 'clubs'

const STATUS_LABELS: Record<string, string> = {
  active: 'عامل',
  retired: 'متقاعد',
  free: 'متوفر',
  deceased: 'متوفى',
}

function mapBackendPlayer(player: Awaited<ReturnType<typeof getPublicPlayersRequest>>[number]): PublicCatalogPlayer {
  return {
    id: player.id,
    fullName: player.full_name,
    sportId: player.sport?.name ?? 'غير معروف',
    currentClubId: player.club?.name ?? 'غير معروف',
    status: player.status,
    gender: player.gender,
    nationality: player.nationality,
  }
}

function mapBackendClub(club: Awaited<ReturnType<typeof getPublicClubsRequest>>[number]): PublicCatalogClub {
  return {
    id: club.id,
    name: club.name,
    city: club.city,
    sportIds: [],
    status: club.status,
  }
}

export function PublicCatalogPage() {
  const { user } = useAuth()
  const [view, setView] = useState<CatalogView>('players')
  const [search, setSearch] = useState('')
  const [sportFilter, setSportFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clubFilter, setClubFilter] = useState('all')
  const [players, setPlayers] = useState<PublicCatalogPlayer[]>([])
  const [clubs, setClubs] = useState<PublicCatalogClub[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const { playerIds, clubIds, togglePlayerFavorite, toggleClubFavorite } =
    useCatalogFavorites(user?.id ?? 'anonymous')

  useEffect(() => {
    let isMounted = true

    const loadCatalog = async () => {
      try {
        setCatalogLoading(true)
        setCatalogError(null)

        const [nextPlayers, nextClubs] = await Promise.all([
          getPublicPlayersRequest(),
          getPublicClubsRequest(),
        ])

        if (!isMounted) {
          return
        }

        setPlayers(nextPlayers.map(mapBackendPlayer))
        setClubs(nextClubs.map(mapBackendClub))
      } catch (error) {
        if (!isMounted) {
          return
        }
        setCatalogError(
          error instanceof Error ? error.message : 'Unable to load catalog data.',
        )
      } finally {
        if (isMounted) {
          setCatalogLoading(false)
        }
      }
    }

    void loadCatalog()

    return () => {
      isMounted = false
    }
  }, [])

  const canManageFavorites = user?.role === 'public'
  const sportOptions = useMemo(() => {
    return [...new Set(players.map((player) => player.sportId).filter(Boolean))]
  }, [players])

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesSearch =
        player.fullName.toLowerCase().includes(search.toLowerCase()) ||
        player.nationality.toLowerCase().includes(search.toLowerCase())
      const matchesSport =
        sportFilter === 'all' ? true : player.sportId === sportFilter
      const matchesStatus =
        statusFilter === 'all' ? true : player.status === statusFilter
      const matchesClub =
        clubFilter === 'all' ? true : player.currentClubId === clubFilter
      return matchesSearch && matchesSport && matchesStatus && matchesClub
    })
  }, [clubFilter, players, search, sportFilter, statusFilter])

  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      const matchesSearch =
        club.name.toLowerCase().includes(search.toLowerCase()) ||
        club.city.toLowerCase().includes(search.toLowerCase())
      return matchesSearch
    })
  }, [clubs, search])

  if (catalogLoading) {
    return <LoadingState />
  }

  if (catalogError) {
    return (
      <section className="page">
        <EmptyState title="تعذّر تحميل الدليل" message={catalogError} />
      </section>
    )
  }

  return (
    <section className="page">
      <PageHero
        eyebrow="البوابة العامة"
        title="الدليل العام"
        description="استعرض اللاعبين والأندية ببيانات عامة وآمنة — للمستخدمين والجماهير."
      />

      <div className="catalog-switch">
        <button
          type="button"
          className={`secondary-button${view === 'players' ? ' is-active' : ''}`}
          onClick={() => setView('players')}
        >
          اللاعبون
        </button>
        <button
          type="button"
          className={`secondary-button${view === 'clubs' ? ' is-active' : ''}`}
          onClick={() => setView('clubs')}
        >
          الأندية
        </button>
      </div>

      <section className="catalog-filters">
        <label className="field">
          <span>بحث</span>
          <input
            type="search"
            placeholder="ابحث بالاسم أو المدينة أو الجنسية..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="field">
          <span>اللعبة</span>
          <select
            value={sportFilter}
            onChange={(event) => setSportFilter(event.target.value)}
          >
            <option value="all">كل الألعاب</option>
            {sportOptions.map((sportName) => (
              <option key={sportName} value={sportName}>
                {sportName}
              </option>
            ))}
          </select>
        </label>
        {view === 'players' ? (
          <>
            <label className="field">
              <span>الحالة</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">كل الحالات</option>
                <option value="active">عامل</option>
                <option value="free">متوفر</option>
                <option value="retired">متقاعد</option>
                <option value="deceased">متوفى</option>
              </select>
            </label>
            <label className="field">
              <span>النادي</span>
              <select
                value={clubFilter}
                onChange={(event) => setClubFilter(event.target.value)}
              >
                <option value="all">كل الأندية</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.name}>
                    {club.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
      </section>

      {!canManageFavorites ? (
        <EmptyState
          title="المفضلة للمستخدم العادي"
          message="سجّل بحساب مستخدم عادي لإضافة اللاعبين والأندية إلى المفضلة."
        />
      ) : null}

      {view === 'players' ? (
        <div className="catalog-grid">
          {filteredPlayers.length === 0 ? (
            <EmptyState
              title="لا يوجد لاعبون مطابقون"
              message="جرّب تعديل البحث أو الفلاتر."
            />
          ) : (
            filteredPlayers.map((player) => {
              const sport = player.sportId || 'لعبة غير معروفة'
              const club = player.currentClubId || 'نادي غير معروف'
              const isFavorite = playerIds.includes(player.id)

              return (
                <article key={player.id} className="catalog-card">
                  <h3>{player.fullName}</h3>
                  <ul className="catalog-meta">
                    <li>اللعبة: {sport}</li>
                    <li>النادي الحالي: {club}</li>
                    <li>الحالة: {STATUS_LABELS[player.status]}</li>
                  </ul>
                  <div className="catalog-card-actions">
                    <Link to={`/catalog/players/${player.id}`}>
                      عرض الملف العام
                    </Link>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!canManageFavorites}
                      onClick={() => togglePlayerFavorite(player.id)}
                    >
                      {isFavorite
                        ? 'إزالة من المفضلة'
                        : 'إضافة للمفضلة'}
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      ) : (
        <div className="catalog-grid">
          {filteredClubs.length === 0 ? (
            <EmptyState
              title="لا توجد أندية مطابقة"
              message="جرّب تعديل البحث أو الفلاتر."
            />
          ) : (
            filteredClubs.map((club) => {
              const sports = club.sportIds.length > 0 ? club.sportIds.join(', ') : 'لا توجد ألعاب مسجلة'
              const isFavorite = clubIds.includes(club.id)

              return (
                <article key={club.id} className="catalog-card">
                  <h3>{club.name}</h3>
                  <ul className="catalog-meta">
                    <li>المدينة: {club.city}</li>
                    <li>الألعاب: {sports}</li>
                    <li>الحالة: {club.status === 'active' ? 'عامل' : 'غير عامل'}</li>
                  </ul>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!canManageFavorites}
                    onClick={() => toggleClubFavorite(club.id)}
                  >
                    {isFavorite
                      ? 'إزالة من المفضلة'
                      : 'إضافة للمفضلة'}
                  </button>
                </article>
              )
            })
          )}
        </div>
      )}
    </section>
  )
}
