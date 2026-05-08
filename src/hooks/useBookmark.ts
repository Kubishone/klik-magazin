const KEY = (id: string) => `klik-bm-${id}`

export function useBookmark(issueId: string) {
  function getSaved(): number | null {
    try {
      const val = localStorage.getItem(KEY(issueId))
      const num = val ? parseInt(val, 10) : NaN
      return isNaN(num) || num <= 1 ? null : num
    } catch {
      return null
    }
  }

  function save(page: number) {
    try {
      if (page <= 1) {
        localStorage.removeItem(KEY(issueId))
      } else {
        localStorage.setItem(KEY(issueId), String(page))
      }
    } catch {}
  }

  function clear() {
    try {
      localStorage.removeItem(KEY(issueId))
    } catch {}
  }

  return { getSaved, save, clear }
}
