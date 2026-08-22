import { useMemo, useState } from 'react'
import { useClubSportManagement } from '../../hooks/useClubSportManagement'
import {
  getContractStatusLabel,
  getDocumentTypeLabel,
  getGenderLabel,
  getPlayerStatusLabel,
} from '../../lib/labels'
import { isPlayerStatus } from '../../types/domain'
import type { PlayerStatus, UserRole } from '../../types/domain'
import type { ManagedPlayer } from '../../types/playerManagement'

type ProfileTab = 'details' | 'contracts' | 'history' | 'achievements' | 'documents'

const STATUS_OPTIONS: PlayerStatus[] = ['active', 'free', 'retired', 'deceased']

interface PlayerProfilePanelProps {
  player: ManagedPlayer
  userRole: UserRole
  userClubId?: string
  onStatusChange: (nextStatus: PlayerStatus, reason: string) => void
}

function scopedTabs(canViewSensitive: boolean): ProfileTab[] {
  if (canViewSensitive) {
    return ['details', 'contracts', 'history', 'achievements', 'documents']
  }
  return ['details']
}

export function PlayerProfilePanel({
  player,
  userRole,
  userClubId,
  onStatusChange,
}: PlayerProfilePanelProps) {
  const { clubs, sports } = useClubSportManagement()
  const canViewSensitive =
    userRole === 'admin' ||
    (userRole === 'club_staff' && userClubId === player.currentClubId)
  const tabs = useMemo(() => scopedTabs(canViewSensitive), [canViewSensitive])
  const [activeTab, setActiveTab] = useState<ProfileTab>(tabs[0])
  const [nextStatus, setNextStatus] = useState<PlayerStatus>(player.status)
  const [reason, setReason] = useState('')

  const sport =
    sports.find((item) => item.id === player.sportId)?.name ?? player.sportId
  const club =
    clubs.find((item) => item.id === player.currentClubId)?.name ??
    player.currentClubId

  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <h3>{player.fullName}</h3>
        <span>{player.playerCode}</span>
      </div>

      <div className="tab-list">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`secondary-button${activeTab === tab ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'details'
              ? 'البيانات'
              : tab === 'contracts'
                ? 'العقود'
                : tab === 'history'
                  ? 'السجل'
                  : tab === 'achievements'
                    ? 'الإنجازات'
                    : 'الوثائق'}
          </button>
        ))}
      </div>

      {activeTab === 'details' ? (
        <div className="details-grid">
          <p>اللعبة: {sport}</p>
          <p>النادي الحالي: {club}</p>
          <p>الحالة: {getPlayerStatusLabel(player.status)}</p>
          <p>الانتساب: {player.enrollmentDate}</p>
          <p>تاريخ الميلاد: {player.birthDate}</p>
          <p>الجنسية: {player.nationality}</p>
          <p>الجنس: {getGenderLabel(player.gender)}</p>
          <p>حالة العقد: {getContractStatusLabel(player.contractStatus)}</p>
        </div>
      ) : null}

      {activeTab === 'contracts' ? (
        <ul className="catalog-meta">
          {player.contracts.map((contract) => (
            <li key={contract.id}>
              {getContractStatusLabel(contract.status)} | {contract.startDate} إلى{' '}
              {contract.endDate}
            </li>
          ))}
        </ul>
      ) : null}

      {activeTab === 'history' ? (
        <ul className="catalog-meta">
          {player.history.length === 0 ? (
            <li>لا يوجد سجل أندية بعد.</li>
          ) : (
            player.history.map((item) => (
              <li key={item.id}>
                {item.startDate} إلى {item.endDate} - {item.reason}
              </li>
            ))
          )}
        </ul>
      ) : null}

      {activeTab === 'achievements' ? (
        <ul className="catalog-meta">
          {player.achievements.length === 0 ? (
            <li>لا توجد إنجازات بعد.</li>
          ) : (
            player.achievements.map((item) => (
              <li key={item.id}>
                {item.title} ({item.rank}) - {item.eventDate}
              </li>
            ))
          )}
        </ul>
      ) : null}

      {activeTab === 'documents' ? (
        <ul className="catalog-meta">
          {player.documents.length === 0 ? (
            <li>لا توجد وثائق بعد.</li>
          ) : (
            player.documents.map((item) => (
              <li key={item.id}>
                {item.name} ({getDocumentTypeLabel(item.type)}) - {item.uploadedAt}
              </li>
            ))
          )}
        </ul>
      ) : null}

      {canViewSensitive ? (
        <section className="status-change-box">
          <h4>تغيير الحالة</h4>
          <div className="status-change-controls">
            <select
              value={nextStatus}
              onChange={(event) => {
                const value = event.target.value
                if (isPlayerStatus(value)) {
                  setNextStatus(value)
                } else {
                  console.error(`Unexpected status value: ${value}`)
                }
              }}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                    {status === 'active'
                      ? 'عامل'
                      : status === 'free'
                        ? 'متوفر'
                        : status === 'retired'
                          ? 'متقاعد'
                          : 'متوفى'}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="سبب التغيير (إلزامي)"
            />
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                const normalizedReason = reason.trim()
                if (!normalizedReason) {
                  console.error('سبب تغيير الحالة مطلوب.')
                  return
                }
                onStatusChange(nextStatus, normalizedReason)
                setReason('')
              }}
            >
              تحديث الحالة
            </button>
          </div>
          <ul className="catalog-meta">
            {player.statusChanges.length === 0 ? (
              <li>لا توجد تغييرات حالة بعد.</li>
            ) : (
              player.statusChanges.map((change) => (
                <li key={change.id}>
                  {change.changedAt}: {getPlayerStatusLabel(change.oldStatus)} إلى{' '}
                  {getPlayerStatusLabel(change.newStatus)} بواسطة {change.changedBy} (
                  {change.reason})
                </li>
              ))
            )}
          </ul>
        </section>
      ) : (
        <p className="page-description">
          تبويبات البيانات الحساسة متاحة للموظف العام أو موظف النادي المالك فقط.
        </p>
      )}
    </section>
  )
}
