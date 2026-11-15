import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { getErrorMessage } from '../services/api'
import { useIncidentStream } from './useIncidentStream'

interface UseFetchOptions {
  pollMs?: number
  streamRefresh?: boolean
  streamDebounceMs?: number
}

export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  options?: UseFetchOptions,
) {
  const pollMs = options?.pollMs ?? 0
  const streamRefresh = options?.streamRefresh ?? false
  const streamDebounceMs = options?.streamDebounceMs ?? 250

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const silentNextRef = useRef(false)
  const hasDataRef = useRef(false)

  const refetch = useCallback(() => {
    silentNextRef.current = false
    setReloadKey((key) => key + 1)
  }, [])

  const silentRefetch = useCallback(() => {
    if (hasDataRef.current) {
      silentNextRef.current = true
    }
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const silent = silentNextRef.current
    silentNextRef.current = false

    async function load() {
      if (!silent) {
        setLoading(true)
        setError(null)
      }
      try {
        const result = await fetcher(controller.signal)
        if (!controller.signal.aborted) {
          hasDataRef.current = true
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!axios.isCancel(err) && !silent) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (!controller.signal.aborted && !silent) {
          setLoading(false)
        }
      }
    }

    load()
    return () => controller.abort()
  }, [fetcher, reloadKey])

  useEffect(() => {
    if (pollMs <= 0 && !streamRefresh) return

    const timer =
      pollMs > 0
        ? setInterval(() => {
            if (document.visibilityState === 'visible') {
              silentRefetch()
            }
          }, pollMs)
        : null

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        silentRefetch()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [pollMs, streamRefresh, silentRefetch])

  useIncidentStream(
    useCallback(() => {
      if (streamRefresh) {
        silentRefetch()
      }
    }, [streamRefresh, silentRefetch]),
    streamDebounceMs,
  )

  return { data, loading, error, refetch, silentRefetch }
}
