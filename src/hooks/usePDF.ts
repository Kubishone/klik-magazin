import { useState, useEffect } from 'react'
import { loadPDF, renderPageToDataUrl } from '../utils/pdfRenderer'

export interface UsePDFResult {
  pages: (string | null)[]
  totalPages: number
  renderedCount: number
  loading: boolean
  error: string | null
  progress: number
}

export function usePDF(source: File | string | null, scale = 1.5): UsePDFResult {
  const [pages, setPages] = useState<(string | null)[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [renderedCount, setRenderedCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!source) {
      setPages([])
      setTotalPages(0)
      setRenderedCount(0)
      setProgress(0)
      setError(null)
      return
    }

    let cancelled = false

    async function process() {
      setLoading(true)
      setError(null)
      setRenderedCount(0)
      setProgress(0)

      try {
        const pdf = await loadPDF(source!)
        const numPages = pdf.numPages
        if (cancelled) return

        // Inicijalizuj sve stranice kao null odmah — znamo ukupan broj
        const allPages: (string | null)[] = Array(numPages).fill(null)
        setTotalPages(numPages)
        setPages([...allPages])

        for (let i = 1; i <= numPages; i++) {
          if (cancelled) break
          const dataUrl = await renderPageToDataUrl(pdf, i, scale)
          allPages[i - 1] = dataUrl
          setPages([...allPages])
          setRenderedCount(i)
          setProgress(Math.round((i / numPages) * 100))
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Greška pri učitavanju PDF-a.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    process()
    return () => {
      cancelled = true
    }
  }, [source, scale])

  return { pages, totalPages, renderedCount, loading, error, progress }
}
