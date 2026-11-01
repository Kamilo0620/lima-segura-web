import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { getErrorMessage } from '../services/api'

export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        setData(await fetcher(controller.signal))
      } catch (err) {
        if (!axios.isCancel(err)) setError(getErrorMessage(err))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [fetcher, reloadKey])

  return { data, loading, error, refetch }
}