import { Link } from 'react-router-dom'
import { ErrorState } from '../components/feedback/PageStates'

export function NotFoundPage() {
  return (
    <section className="page">
      <ErrorState
        title="الصفحة غير موجودة"
        message="الصفحة المطلوبة غير متاحة."
        action={<Link to="/">العودة للوحة التحكم</Link>}
      />
    </section>
  )
}
