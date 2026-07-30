import { useSearchParams } from 'react-router-dom'

export function useTabParam(defaultTab) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || defaultTab

  function setTab(nextTab) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', nextTab)
      return next
    })
  }

  return [tab, setTab]
}
