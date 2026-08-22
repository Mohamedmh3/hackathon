import type { ReactNode } from 'react'
import { StateCard } from './StateCard'

export function LoadingState({
  title = 'جار التحميل...',
  message = 'يرجى الانتظار أثناء تجهيز هذا القسم.',
}: {
  title?: string
  message?: string
}) {
  return <StateCard title={title} message={message} tone="loading" />
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: ReactNode
}) {
  return <StateCard title={title} message={message} action={action} tone="empty" />
}

export function ErrorState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: ReactNode
}) {
  return <StateCard title={title} message={message} action={action} tone="error" />
}
