import { useCallback, useMemo } from 'react'
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

  const value = useMemo(() => opts.parse(searchParams), [searchParams, opts])

  const setValue = useCallback(
    (updater: Updater<T>) => {
      const next =
        typeof updater === 'function'
          ? updater(value)
          : { ...value, ...updater }

      const serialized = opts.serialize(next)
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
    [value, opts, searchParams, setSearchParams]
  )

  return [value, setValue]
}
