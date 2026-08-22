import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/feedback/PageStates'
import { PageHero } from '../components/layout/PageHero'
import { useAuth } from '../hooks/useAuth'
import { useCatalogFavorites } from '../hooks/useCatalogFavorites'
import { getPublicPlayersRequest } from '../lib/api'

const STATUS_LABELS: Record<string, string> = {
  active: 'عامل',
  retired: 'متقاعد',
  free: 'متوفر',
  deceased: 'متوفى',
}

interface CatalogProfilePlayer {
  id: string
  fullName: string
  sportName: string
  clubName: string
  status: 'active' | 'retired' | 'free' | 'deceased'
  gender: 'male' | 'female'
  nationality: string
}

export function PublicPlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>()
  const { user } = useAuth()
  const canManageFavorites = user?.role === 'public'
  const { playerIds, togglePlayerFavorite } = useCatalogFavorites(
    user?.id ?? 'anonymous',
  )
  const [player, setPlayer] = useState<CatalogProfilePlayer | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadPlayer = async () => {
      try {
        setPageLoading(true)
        setPageError(null)
        const players = await getPublicPlayersRequest()
        const nextPlayer = players.find((item) => item.id === playerId)

        if (!isMounted) {
          return
        }

        if (!nextPlayer) {
          setPlayer(null)
          return
        }

        setPlayer({
          id: nextPlayer.id,
          fullName: nextPlayer.full_name,
          sportName: nextPlayer.sport?.name ?? 'لعبة غير معروفة',
          clubName: nextPlayer.club?.name ?? 'نادي غير معروف',
          status: nextPlayer.status,
          gender: nextPlayer.gender,
          nationality: nextPlayer.nationality,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }
        setPageError(
          error instanceof Error ? error.message : 'Unable to load player profile.',
        )
      } finally {
        if (isMounted) {
          setPageLoading(false)
        }
      }
    }

    void loadPlayer()

    return () => {
      isMounted = false
    }
  }, [playerId])

  if (pageLoading) {
    return <LoadingState />
  }

  if (pageError) {
    return (
      <section className="page">
        <ErrorState title="تعذّر تحميل الملف" message={pageError} action={<Link to="/catalog">العودة للدليل</Link>} />
      </section>
    )
  }

  if (!player) {
    return (
      <section className="page">
        <ErrorState
          title="اللاعب غير موجود"
          message="الملف العام المطلوب غير موجود."
          action={<Link to="/catalog">العودة للدليل</Link>}
        />
      </section>
    )
  }

  const isFavorite = playerIds.includes(player.id)

  return (
    <section className="page">
      <PageHero
        eyebrow="الملف العام"
        title={player.fullName}
        description="عرض عام فقط بدون بيانات حساسة."
      />
      <article className="catalog-card">
        <ul className="catalog-meta">
          <li>اللعبة: {player.sportName}</li>
          <li>النادي الحالي: {player.clubName}</li>
          <li>الحالة: {STATUS_LABELS[player.status]}</li>
          <li>الجنس: {player.gender === 'male' ? 'ذكر' : 'أنثى'}</li>
          <li>الجنسية: {player.nationality}</li>
        </ul>
        <div className="catalog-card-actions">
          <Link to="/catalog">العودة للدليل</Link>
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
      {!canManageFavorites ? (
        <EmptyState
          title="المفضلة للمستخدم العادي"
          message="استخدم حساب مستخدم عادي لحفظ المفضلة."
        />
      ) : null}
    </section>
  )
}
