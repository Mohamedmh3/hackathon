import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useClubSportManagement } from '../../hooks/useClubSportManagement'
import type { ManagedPlayer, PlayerFormInput } from '../../types/playerManagement'

interface PlayerFormProps {
  mode: 'create' | 'edit'
  initialPlayer?: ManagedPlayer
  onSubmit: (values: PlayerFormInput) => void
  onCancel: () => void
}

function initialValues(
  clubs: { id: string }[],
  sports: { id: string }[],
  player?: ManagedPlayer,
): PlayerFormInput {
  if (!player) {
    return {
      fullName: '',
      playerCode: '',
      sportId: sports[0]?.id ?? '',
      currentClubId: clubs[0]?.id ?? '',
      enrollmentDate: '',
      birthDate: '',
      nationality: 'مصري',
      gender: 'male',
    }
  }

  return {
    fullName: player.fullName,
    playerCode: player.playerCode,
    sportId: player.sportId,
    currentClubId: player.currentClubId,
    enrollmentDate: player.enrollmentDate,
    birthDate: player.birthDate,
    nationality: player.nationality,
    gender: player.gender,
  }
}

export function PlayerForm({
  mode,
  initialPlayer,
  onSubmit,
  onCancel,
}: PlayerFormProps) {
  const { clubs, sports } = useClubSportManagement()
  const defaults = useMemo(
    () => initialValues(clubs, sports, initialPlayer),
    [clubs, sports, initialPlayer],
  )
  const [values, setValues] = useState<PlayerFormInput>(defaults)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(values)
  }

  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <h3>{mode === 'create' ? 'إضافة لاعب' : 'تعديل لاعب'}</h3>
      </div>
      <form className="player-form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>الاسم الكامل</span>
          <input
            required
            value={values.fullName}
            onChange={(event) =>
              setValues({ ...values, fullName: event.target.value })
            }
          />
        </label>
        <label className="field">
          <span>كود اللاعب</span>
          <input
            required
            value={values.playerCode}
            onChange={(event) =>
              setValues({ ...values, playerCode: event.target.value.toUpperCase() })
            }
          />
        </label>
        <label className="field">
          <span>اللعبة</span>
          <select
            value={values.sportId}
            onChange={(event) => setValues({ ...values, sportId: event.target.value })}
          >
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>النادي الحالي</span>
          <select
            value={values.currentClubId}
            onChange={(event) =>
              setValues({ ...values, currentClubId: event.target.value })
            }
          >
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>تاريخ الانتساب</span>
          <input
            required
            type="date"
            value={values.enrollmentDate}
            onChange={(event) =>
              setValues({ ...values, enrollmentDate: event.target.value })
            }
          />
        </label>
        <label className="field">
          <span>تاريخ الميلاد</span>
          <input
            required
            type="date"
            value={values.birthDate}
            onChange={(event) => setValues({ ...values, birthDate: event.target.value })}
          />
        </label>
        <label className="field">
          <span>الجنسية</span>
          <input
            required
            value={values.nationality}
            onChange={(event) =>
              setValues({ ...values, nationality: event.target.value })
            }
          />
        </label>
        <label className="field">
          <span>الجنس</span>
          <select
            value={values.gender}
            onChange={(event) =>
              setValues({ ...values, gender: event.target.value as 'male' | 'female' })
            }
          >
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </label>
        <div className="form-actions">
          <button type="submit" className="primary-button">
            {mode === 'create' ? 'إنشاء لاعب' : 'حفظ التعديلات'}
          </button>
          <button type="button" className="secondary-button" onClick={onCancel}>
            إلغاء
          </button>
        </div>
      </form>
    </section>
  )
}
