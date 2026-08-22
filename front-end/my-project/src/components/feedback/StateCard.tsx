import type { ReactNode } from 'react'

interface StateCardProps {
  title: string
  message: string
  action?: ReactNode
  tone?: 'default' | 'loading' | 'empty' | 'error'
}

export function StateCard({
  title,
  message,
  action,
  tone = 'default',
}: StateCardProps) {
  return (
    <section
      className={`state-card state-card-${tone}`}
      role="status"
      aria-live="polite"
    >
      <h2>{title}</h2>
      <p>{message}</p>
      {action ? <div className="state-card-action">{action}</div> : null}
    </section>
  )
}
