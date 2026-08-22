import { useEffect, useState } from 'react'

export function usePageLoadState(delayMs = 250): boolean {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return isLoading
}
