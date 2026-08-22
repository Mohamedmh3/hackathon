import { useEffect, useMemo, useState } from 'react'
import { EmptyState, LoadingState } from '../components/feedback/PageStates'
import { PageHero } from '../components/layout/PageHero'
import { PlayerFilters } from '../components/players/PlayerFilters'
import { PlayerForm } from '../components/players/PlayerForm'
import { PlayerProfilePanel } from '../components/players/PlayerProfilePanel'
import { PlayerTable } from '../components/players/PlayerTable'
import { useAuth } from '../hooks/useAuth'
import { usePlayerManagement } from '../hooks/usePlayerManagement'
import type { PlayerFiltersValue } from '../types/playerManagement'

const INITIAL_FILTERS: PlayerFiltersValue = {
  search: '',
  sportId: 'all',
  clubId: 'all',
  status: 'all',
  gender: 'all',
}

export function PlayersPage() {
  const { user } = useAuth()
  const {
    playerById,
    isLoading,
    createPlayer,
    updatePlayer,
    changePlayerStatus,
    filterPlayers,
  } = usePlayerManagement()
  const [filters, setFilters] = useState<PlayerFiltersValue>(INITIAL_FILTERS)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const filteredPlayers = useMemo(() => filterPlayers(filters), [filterPlayers, filters])
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedPlayers = filteredPlayers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )
  const selectedPlayer = selectedPlayerId ? playerById.get(selectedPlayerId) : undefined

  if (!user) {
    return null
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <section className="page">
      <PageHero
        eyebrow="إدارة اللاعبين"
        title="اللاعبون"
        description="إدارة اللاعبين عبر البحث والفلترة وعرض الملفات وتتبّع تغييرات الحالة."
      />

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>سجل اللاعبين</h3>
          <div className="catalog-card-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setFormMode('create')}
            >
              إضافة لاعب
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={!selectedPlayer}
              onClick={() => setFormMode('edit')}
            >
              تعديل المحدد
            </button>
          </div>
        </div>

        <PlayerFilters filters={filters} onChange={setFilters} />

        {filteredPlayers.length === 0 ? (
          <EmptyState
            title="لا يوجد لاعبون مطابقون"
            message="جرّب تعديل البحث أو الفلاتر."
          />
        ) : (
          <>
            <PlayerTable
              players={paginatedPlayers}
              selectedPlayerId={selectedPlayer?.id ?? null}
              onSelectPlayer={setSelectedPlayerId}
            />
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

      {formMode === 'create' ? (
        <PlayerForm
          mode="create"
          onSubmit={(values) => {
            const created = createPlayer(values)
            setSelectedPlayerId(created.id)
            setFormMode(null)
          }}
          onCancel={() => setFormMode(null)}
        />
      ) : null}

      {formMode === 'edit' && selectedPlayer ? (
        <PlayerForm
          mode="edit"
          initialPlayer={selectedPlayer}
          onSubmit={(values) => {
            updatePlayer(selectedPlayer.id, values)
            setFormMode(null)
          }}
          onCancel={() => setFormMode(null)}
        />
      ) : null}

      {selectedPlayer ? (
        <PlayerProfilePanel
          key={selectedPlayer.id}
          player={selectedPlayer}
          userRole={user.role}
          userClubId={user.clubId}
          onStatusChange={(nextStatus, reason) =>
            changePlayerStatus(selectedPlayer.id, nextStatus, reason, user.fullName)
          }
        />
      ) : (
        <EmptyState
          title="اختر لاعباً"
          message="اختر لاعباً من الجدول لعرض التفاصيل وتغيير الحالة."
        />
      )}
    </section>
  )
}
