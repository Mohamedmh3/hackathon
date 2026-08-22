import { useClubSportManagement } from '../../hooks/useClubSportManagement'
import type { PlayerFiltersValue } from '../../types/playerManagement'

interface PlayerFiltersProps {
  filters: PlayerFiltersValue
  onChange: (next: PlayerFiltersValue) => void
}

export function PlayerFilters({ filters, onChange }: PlayerFiltersProps) {
  const { clubs, sports } = useClubSportManagement()

  return (
    <section className="player-filters">
      <label className="field">
        <span>بحث</span>
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="اسم اللاعب أو الكود"
        />
      </label>
      <label className="field">
        <span>اللعبة</span>
        <select
          value={filters.sportId}
          onChange={(event) => onChange({ ...filters, sportId: event.target.value })}
        >
          <option value="all">كل الألعاب</option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>النادي</span>
        <select
          value={filters.clubId}
          onChange={(event) => onChange({ ...filters, clubId: event.target.value })}
        >
          <option value="all">كل الأندية</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>الحالة</span>
        <select
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: event.target.value })}
        >
          <option value="all">كل الحالات</option>
          <option value="active">عامل</option>
          <option value="free">متوفر</option>
          <option value="retired">متقاعد</option>
          <option value="deceased">متوفى</option>
        </select>
      </label>
      <label className="field">
        <span>الجنس</span>
        <select
          value={filters.gender}
          onChange={(event) => onChange({ ...filters, gender: event.target.value })}
        >
          <option value="all">الكل</option>
          <option value="male">ذكر</option>
          <option value="female">أنثى</option>
        </select>
      </label>
    </section>
  )
}
