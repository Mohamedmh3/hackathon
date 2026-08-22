import { CATALOG_CLUBS, CATALOG_SPORTS } from '../../data/publicCatalogData'
import {
  getContractStatusLabel,
  getGenderLabel,
  getPlayerStatusLabel,
} from '../../lib/labels'
import type { ManagedPlayer } from '../../types/playerManagement'

interface PlayerTableProps {
  players: ManagedPlayer[]
  selectedPlayerId: string | null
  onSelectPlayer: (playerId: string) => void
}

function getAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1
  }
  return age
}

export function PlayerTable({
  players,
  selectedPlayerId,
  onSelectPlayer,
}: PlayerTableProps) {
  return (
    <div className="table-wrap">
      <table className="contracts-table players-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الكود</th>
            <th>اللعبة</th>
            <th>النادي</th>
            <th>الانتساب</th>
            <th>العمر</th>
            <th>الجنسية</th>
            <th>الجنس</th>
            <th>الحالة</th>
            <th>العقد</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const sport =
              CATALOG_SPORTS.find((item) => item.id === player.sportId)?.name ??
              player.sportId
            const club =
              CATALOG_CLUBS.find((item) => item.id === player.currentClubId)?.name ??
              player.currentClubId
            const isSelected = selectedPlayerId === player.id
            return (
              <tr
                key={player.id}
                className={isSelected ? 'players-row-selected' : undefined}
                onClick={() => onSelectPlayer(player.id)}
              >
                <td>{player.fullName}</td>
                <td>{player.playerCode}</td>
                <td>{sport}</td>
                <td>{club}</td>
                <td>{player.enrollmentDate}</td>
                <td>{getAge(player.birthDate)}</td>
                <td>{player.nationality}</td>
                <td>{getGenderLabel(player.gender)}</td>
                <td>{getPlayerStatusLabel(player.status)}</td>
                <td>{getContractStatusLabel(player.contractStatus)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
