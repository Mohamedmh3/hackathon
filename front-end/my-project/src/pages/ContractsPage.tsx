import { useState } from 'react'
import { CATALOG_CLUBS } from '../data/publicCatalogData'
import { useAuth } from '../hooks/useAuth'
import { useContractsTransfers } from '../hooks/useContractsTransfers'
import {
  getContractStatusLabel,
  getPlayerStatusLabel,
  getTerminationReasonLabel,
} from '../lib/labels'
import { EmptyState, ErrorState, LoadingState } from '../components/feedback/PageStates'
import { PageHero } from '../components/layout/PageHero'
import { usePageLoadState } from '../hooks/usePageLoadState'
import type {
  ContractRecord,
  ContractTerminationReason,
} from '../types/contractsTransfer'
import { isContractTerminationReason } from '../types/contractsTransfer'
import type { ManagedPlayer } from '../types/playerManagement'

const TERMINATION_OPTIONS: Array<{
  value: ContractTerminationReason
  label: string
}> = [
  { value: 'contract_expired', label: 'انتهاء مدة' },
  { value: 'mutual_termination', label: 'فسخ بالتراضي' },
  { value: 'unilateral_termination', label: 'فسخ أحادي' },
  { value: 'retirement', label: 'تقاعد' },
]

function contractOwnerName(
  contract: ContractRecord,
  playersById: Map<string, ManagedPlayer>,
) {
  return playersById.get(contract.playerId)?.fullName ?? contract.playerId
}

function contractClubName(clubId: string) {
  return CATALOG_CLUBS.find((item) => item.id === clubId)?.name ?? clubId
}

export function ContractsPage() {
  const { user } = useAuth()
  const isLoading = usePageLoadState()
  const {
    playersById,
    transferLog,
    getScopedContracts,
    closeContract,
    transferPlayer,
  } = useContractsTransfers()
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [closeReason, setCloseReason] =
    useState<ContractTerminationReason>('contract_expired')
  const [transferTargetClub, setTransferTargetClub] = useState(CATALOG_CLUBS[0].id)
  const [transferStartDate, setTransferStartDate] = useState('')
  const [transferEndDate, setTransferEndDate] = useState('')

  if (!user) {
    return null
  }

  if (isLoading) {
    return <LoadingState />
  }

  const scopedContracts = getScopedContracts({ role: user.role, clubId: user.clubId })
  const selectedContract =
    scopedContracts.find((item) => item.id === selectedContractId) ?? null
  const selectedPlayer = selectedContract
    ? playersById.get(selectedContract.playerId) ?? null
    : null

  const activeScopedContracts = scopedContracts.filter(
    (item) => item.status === 'active',
  )

  const canManage = user.role === 'admin' || user.role === 'club_staff'

  return (
    <section className="page">
      <PageHero
        eyebrow="التعاقدات والانتقالات"
        title="التعاقدات والانتقالات"
        description="إغلاق العقود وتنفيذ الانتقالات مع تحديث الأرشيف بشكل آمن."
      />

      {!canManage ? (
        <ErrorState
          title="دور غير مخوّل"
          message="إدارة التعاقدات والانتقالات متاحة للموظف العام وموظف النادي فقط."
        />
      ) : null}

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>قائمة التعاقدات</h3>
          <span>الإجمالي: {scopedContracts.length}</span>
        </div>
        {scopedContracts.length === 0 ? (
          <EmptyState
            title="لا توجد تعاقدات متاحة"
            message="لا توجد تعاقدات ضمن نطاق صلاحيتك."
          />
        ) : (
          <div className="table-wrap">
            <table className="contracts-table contracts-page-table">
              <thead>
                <tr>
                  <th>اللاعب</th>
                  <th>النادي</th>
                  <th>البداية</th>
                  <th>النهاية</th>
                  <th>الحالة</th>
                  <th>سبب الإنهاء</th>
                </tr>
              </thead>
              <tbody>
                {scopedContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className={
                      selectedContractId === contract.id ? 'players-row-selected' : undefined
                    }
                    onClick={() => setSelectedContractId(contract.id)}
                  >
                    <td>{contractOwnerName(contract, playersById)}</td>
                    <td>{contractClubName(contract.clubId)}</td>
                    <td>{contract.startDate}</td>
                    <td>{contract.endDate}</td>
                    <td>{getContractStatusLabel(contract.status)}</td>
                    <td>{getTerminationReasonLabel(contract.terminationReason)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedContract && selectedPlayer ? (
        <section className="dashboard-panel">
          <div className="panel-header">
            <h3>تفاصيل العقد</h3>
            <span>{selectedContract.id}</span>
          </div>
          <div className="details-grid">
            <p>اللاعب: {selectedPlayer.fullName}</p>
            <p>النادي الحالي: {contractClubName(selectedPlayer.currentClubId)}</p>
            <p>حالة العقد: {getContractStatusLabel(selectedContract.status)}</p>
            <p>حالة اللاعب: {getPlayerStatusLabel(selectedPlayer.status)}</p>
            <p>تاريخ الانتساب: {selectedPlayer.enrollmentDate}</p>
          </div>

          {selectedContract.status === 'active' ? (
            <>
              <section className="status-change-box">
                <h4>إغلاق العقد</h4>
                <div className="status-change-controls">
                  <select
                    value={closeReason}
                    onChange={(event) => {
                      const nextReason = event.target.value
                      if (isContractTerminationReason(nextReason)) {
                        setCloseReason(nextReason)
                      } else {
                        console.error(
                          `Unexpected termination reason: ${nextReason}`,
                        )
                      }
                    }}
                  >
                    {TERMINATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={selectedContract.id}
                    disabled
                    aria-label="معرف العقد المحدد"
                  />
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      closeContract({
                        contractId: selectedContract.id,
                        reason: closeReason,
                        executedBy: user.fullName,
                      })
                    }
                  >
                    إغلاق العقد
                  </button>
                </div>
              </section>

              <section className="status-change-box">
                <h4>نقل لاعب</h4>
                <div className="transfer-grid">
                  <label className="field">
                    <span>النادي الجديد</span>
                    <select
                      value={transferTargetClub}
                      onChange={(event) => setTransferTargetClub(event.target.value)}
                    >
                      {CATALOG_CLUBS.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>بداية العقد الجديد</span>
                    <input
                      type="date"
                      value={transferStartDate}
                      onChange={(event) => setTransferStartDate(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>نهاية العقد الجديد</span>
                    <input
                      type="date"
                      value={transferEndDate}
                      onChange={(event) => setTransferEndDate(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      if (!transferStartDate || !transferEndDate) {
                        console.error('تواريخ الانتقال مطلوبة.')
                        return
                      }
                      transferPlayer({
                        playerId: selectedPlayer.id,
                        toClubId: transferTargetClub,
                        startDate: transferStartDate,
                        endDate: transferEndDate,
                        executedBy: user.fullName,
                      })
                    }}
                  >
                    تنفيذ الانتقال
                  </button>
                </div>
              </section>
            </>
          ) : (
            <EmptyState
              title="العقد مغلق"
              message="يمكن إغلاق أو نقل العقود النشطة فقط."
            />
          )}

          <section className="status-change-box">
            <h4>سجل أندية اللاعب</h4>
            <ul className="catalog-meta">
              {selectedPlayer.history.length === 0 ? (
                <li>لا توجد سجلات بعد.</li>
              ) : (
                selectedPlayer.history.map((item) => (
                  <li key={item.id}>
                    {contractClubName(item.clubId)} | {item.startDate} إلى {item.endDate} |{' '}
                    {item.reason}
                  </li>
                ))
              )}
            </ul>
          </section>
        </section>
      ) : null}

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>آخر الانتقالات</h3>
          <span>العمليات: {transferLog.length}</span>
        </div>
        {transferLog.length === 0 ? (
          <EmptyState
            title="لا توجد انتقالات بعد"
            message="نفّذ عملية انتقال لعرض السجل هنا."
          />
        ) : (
          <ul className="catalog-meta">
            {transferLog.map((log) => (
              <li key={log.id}>
                {playersById.get(log.playerId)?.fullName ?? log.playerId}: {contractClubName(log.fromClubId)} إلى{' '}
                {contractClubName(log.toClubId)} بتاريخ {log.transferDate} بواسطة {log.executedBy}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>العقود النشطة القريبة من الانتهاء</h3>
          <span>النشطة: {activeScopedContracts.length}</span>
        </div>
        <ul className="catalog-meta">
          {activeScopedContracts.map((contract) => (
            <li key={contract.id}>
              {contractOwnerName(contract, playersById)} - {contract.endDate}
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
