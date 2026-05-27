import { useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface UseUrlFilterStateOptions<T> {
  defaults: T
  parse: (params: URLSearchParams) => T
  serialize: (value: T) => Record<string, string | undefined>
}

type Updater<T> = Partial<T> | ((prev: T) => T)

export function useUrlFilterState<T extends object>(
  opts: UseUrlFilterStateOptions<T>
): [T, (updater: Updater<T>) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  // Capture opts in a ref so unstable inline object literals don't bust memo
  const optsRef = useRef(opts)
  optsRef.current = opts

  const value = useMemo(() => optsRef.current.parse(searchParams), [searchParams])

  const setValue = useCallback(
    (updater: Updater<T>) => {
      const current = optsRef.current.parse(searchParams)
      const next =
        typeof updater === 'function'
          ? updater(current)
          : { ...current, ...updater }

      const serialized = optsRef.current.serialize(next)
      const nextParams = new URLSearchParams(searchParams)
      for (const [key, val] of Object.entries(serialized)) {
        if (val === undefined || val === '') {
          nextParams.delete(key)
        } else {
          nextParams.set(key, val)
        }
      }
      setSearchParams(nextParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  return [value, setValue]
}
