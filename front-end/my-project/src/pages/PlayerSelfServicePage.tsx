import { useState } from 'react'
import { CATALOG_CLUBS, CATALOG_SPORTS } from '../data/publicCatalogData'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/feedback/PageStates'
import { PageHero } from '../components/layout/PageHero'
import { useAuth } from '../hooks/useAuth'
import { usePageLoadState } from '../hooks/usePageLoadState'
import { usePlayerSelfService } from '../hooks/usePlayerSelfService'

export function PlayerSelfServicePage() {
  const { user } = useAuth()
  const isLoading = usePageLoadState()
  const { playersById, updateAchievementImage, updatePlayerPhoto } =
    usePlayerSelfService()

  if (!user) {
    return null
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (!user.playerId) {
    return (
      <section className="page">
        <ErrorState
          title="الملف الشخصي غير متاح"
          message="حسابك غير مرتبط بملف لاعب حتى الآن."
        />
      </section>
    )
  }

  const player = playersById.get(user.playerId)
  if (!player) {
    return (
      <section className="page">
        <ErrorState
          title="سجل اللاعب غير موجود"
          message="تعذر تحميل ملف اللاعب المرتبط."
        />
      </section>
    )
  }

  const currentContract =
    player.contracts.find((contract) => contract.status === 'active') ?? null
  const sportName =
    CATALOG_SPORTS.find((sport) => sport.id === player.sportId)?.name ?? player.sportId
  const clubName =
    CATALOG_CLUBS.find((club) => club.id === player.currentClubId)?.name ??
    player.currentClubId

  return (
    <section className="page">
      <PageHero
        eyebrow="خدمات اللاعب"
        title="ملفي الشخصي"
        description="يمكنك تحديث صورتك الشخصية وصور الإنجازات. بيانات العقد للعرض فقط."
      />

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>{player.fullName}</h3>
          <span>{player.playerCode}</span>
        </div>
        <div className="details-grid">
          <p>اللعبة: {sportName}</p>
          <p>النادي الحالي: {clubName}</p>
          <p>الحالة: {player.status}</p>
          <p>الجنسية: {player.nationality}</p>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>عقدي الحالي</h3>
        </div>
        {currentContract ? (
          <ul className="catalog-meta">
            <li>النادي: {clubName}</li>
            <li>تاريخ البداية: {currentContract.startDate}</li>
            <li>تاريخ النهاية: {currentContract.endDate}</li>
            <li>الحالة: {currentContract.status}</li>
          </ul>
        ) : (
          <EmptyState
            title="لا يوجد عقد نشط"
            message="لا يوجد لديك عقد نشط حالياً."
          />
        )}
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>الصورة الشخصية</h3>
        </div>
        <PlayerPhotoEditor
          initialPhotoUrl={player.photoUrl}
          onSave={(nextPhoto) => updatePlayerPhoto(player.id, nextPhoto)}
        />
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>صور الإنجازات</h3>
        </div>
        {player.achievements.length === 0 ? (
          <EmptyState
            title="لا توجد إنجازات بعد"
            message="ستظهر إنجازاتك بعد إضافتها من الإدارة أو النادي."
          />
        ) : (
          <div className="achievement-grid">
            {player.achievements.map((achievement) => (
              <AchievementImageEditor
                key={achievement.id}
                title={achievement.title}
                date={achievement.eventDate}
                rank={achievement.rank}
                initialImageUrl={achievement.imageUrl ?? ''}
                onSave={(nextImage) =>
                  updateAchievementImage(player.id, achievement.id, nextImage)
                }
              />
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function PlayerPhotoEditor({
  initialPhotoUrl,
  onSave,
}: {
  initialPhotoUrl: string
  onSave: (nextPhoto: string) => void
}) {
  const [photoInput, setPhotoInput] = useState(initialPhotoUrl)

  return (
    <div className="self-service-editor">
      <img
        className="player-photo-preview"
        src={photoInput || initialPhotoUrl}
        alt="معاينة صورة اللاعب"
      />
      <div className="self-service-controls">
        <label className="field">
          <span>رابط الصورة</span>
          <input
            value={photoInput}
            onChange={(event) => setPhotoInput(event.target.value)}
            placeholder="https://..."
          />
        </label>
        <button
          type="button"
          className="primary-button"
          onClick={() => onSave(photoInput)}
        >
          حفظ الصورة
        </button>
      </div>
    </div>
  )
}

function AchievementImageEditor({
  title,
  date,
  rank,
  initialImageUrl,
  onSave,
}: {
  title: string
  date: string
  rank: string
  initialImageUrl: string
  onSave: (nextImage: string) => void
}) {
  const [imageInput, setImageInput] = useState(initialImageUrl)

  return (
    <article className="catalog-card">
      <h3>{title}</h3>
      <p className="page-description">
        {date} - {rank}
      </p>
      <label className="field">
        <span>رابط صورة الإنجاز</span>
        <input
          value={imageInput}
          onChange={(event) => setImageInput(event.target.value)}
          placeholder="https://..."
        />
      </label>
      <button
        type="button"
        className="primary-button"
        onClick={() => onSave(imageInput)}
      >
        حفظ الصورة
      </button>
    </article>
  )
}
