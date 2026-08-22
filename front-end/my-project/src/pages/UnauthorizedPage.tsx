import { Link } from 'react-router-dom'
import { ErrorState } from '../components/feedback/PageStates'

export function UnauthorizedPage() {
  return (
    <section className="auth-page">
      <ErrorState
        title="وصول مقيّد"
        message="ليس لديك صلاحية لفتح هذا القسم."
        action={<Link to="/">العودة للوحة التحكم</Link>}
      />
    </section>
  )
}
