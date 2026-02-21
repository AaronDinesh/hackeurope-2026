import { useCallback, useEffect } from 'react'
import { useContentStore, type SectionKey } from '../stores/content'

export function useSectionLoader<T>(key: SectionKey, fetcher: () => Promise<T>) {
  const state = useContentStore((state) => state[key])
  const setSectionData = useContentStore((state) => state.setSectionData)
  const setSectionLoading = useContentStore((state) => state.setSectionLoading)
  const setSectionError = useContentStore((state) => state.setSectionError)

  const reload = useCallback(async () => {
    setSectionLoading(key, true)
    try {
      const data = await fetcher()
      setSectionData(key, data as never)
    } catch (error) {
      const message = (error as Error).message ?? 'Failed to load section'
      setSectionError(key, message)
    }
  }, [fetcher, key, setSectionData, setSectionError, setSectionLoading])

  useEffect(() => {
    if (!state.updatedAt && !state.isLoading) {
      void reload()
    }
  }, [reload, state.isLoading, state.updatedAt])

  return { state, reload }
}
