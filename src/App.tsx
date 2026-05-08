import { useState, useCallback, useEffect } from 'react'

function calcInitialBookWidth() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (vw < 768) return Math.min(vw - 8, 600)
  const byVH = Math.round((vh * 0.88) / 1.414)
  const byVW = Math.round((vw * 0.92) / 2)
  return Math.min(byVH, byVW, 680) // jedna stranica
}
import { getCurrentIssue, getArchive, type Magazine } from './data/magazines'
import { usePDF } from './hooks/usePDF'
import { FlipBook } from './components/FlipBook'
import { IssueCard } from './components/IssueCard'

const currentIssue = getCurrentIssue()
const archive = getArchive()

const FIRST_BATCH = 2

export default function App() {
  const [activeIssue, setActiveIssue] = useState<Magazine | undefined>(currentIssue)

  useEffect(() => {
    document.title = activeIssue
      ? `KLIK Magazin — ${activeIssue.subtitle}`
      : 'KLIK Magazin'
  }, [activeIssue])
  const [bookWidth, setBookWidth] = useState(calcInitialBookWidth)
  const onWidthChange = useCallback((w: number) => setBookWidth(w), [])

  const { pages, loading, progress, totalPages, renderedCount, error } = usePDF(
    activeIssue?.pdfUrl ?? null,
  )

  const readyToShow = renderedCount >= Math.min(FIRST_BATCH, totalPages || 1)
  const isArchiveIssue = activeIssue && !activeIssue.isCurrent

  function openIssue(mag: Magazine) {
    setActiveIssue(mag)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">

      <section
        className="flex-1 flex flex-col items-center px-4 pt-4 sm:pt-6 pb-8"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 50% 35%, rgba(0,79,153,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 50% 30%, rgba(111,119,48,0.07) 0%, transparent 60%)
          `,
        }}
      >
        {/* Logo */}
        <div
          aria-label="KLIK"
          style={{
            width: bookWidth,
            maxWidth: '100%',
            height: `min(${Math.round(bookWidth * 0.45)}px, 18vh)`,
            backgroundImage: 'url(/logo.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            marginBottom: 6,
          }}
        />

        {/* Indicator kad se čita arhivski broj */}
        {isArchiveIssue && (
          <div className="flex items-center gap-2 mb-4">
            <span className="font-sans text-xs text-navy-400">{activeIssue.subtitle}</span>
            <span className="text-navy-700">·</span>
            <button
              onClick={() => currentIssue && openIssue(currentIssue)}
              className="font-sans text-xs text-forest-500 hover:text-forest-400 transition-colors"
            >
              ← Trenutno izdanje
            </button>
          </div>
        )}

        {/* Loading */}
        {!readyToShow && (loading || (pages.length === 0 && !error)) && (
          <div className="flex flex-col items-center gap-8 mt-8">
            <img src="/logo.png" alt="KLIK" className="h-16 w-auto object-contain opacity-60 animate-pulse" />
            <p className="font-serif text-2xl text-navy-200">
              Priprema se {activeIssue?.subtitle ?? 'magazin'}...
            </p>
            <div className="w-72">
              <div className="flex justify-between font-sans text-xs text-navy-600 mb-2">
                <span>Stranice</span>
                <span className="tabular-nums">{pages.length} / {totalPages || '?'}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-navy-800">
                <div
                  className="h-full rounded-full bg-forest-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && pages.length === 0 && (
          <div className="mt-24 text-center max-w-sm">
            <p className="font-sans text-navy-400">Nije moguće učitati ovaj broj.</p>
            <p className="mt-1 font-sans text-xs text-navy-600">{error}</p>
          </div>
        )}

        {/* FlipBook */}
        {readyToShow && (
          <FlipBook
            pages={pages}
            renderedCount={renderedCount}
            totalPages={totalPages}
            issueId={activeIssue?.id ?? ''}
            onWidthChange={onWidthChange}
          />
        )}
      </section>

      {/* Scroll hint */}
      {archive.length > 0 && readyToShow && !loading && (
        <div className="flex justify-center pb-6 animate-bounce">
          <div className="flex flex-col items-center gap-1 text-navy-700 select-none">
            <span className="font-sans text-xs">Prethodna izdanja</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* Arhiva */}
      {archive.length > 0 && (
        <section className="border-t border-navy-800 bg-navy-900 px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <h2 className="font-serif text-2xl font-semibold text-navy-200">Prethodna izdanja</h2>
              <div className="flex-1 h-px bg-navy-800" />
              <span className="font-sans text-sm text-navy-500">
                {archive.length} {archive.length === 1 ? 'broj' : 'broja'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {archive.map((mag) => (
                <IssueCard
                  key={mag.id}
                  magazine={mag}
                  active={activeIssue?.id === mag.id}
                  onOpen={() => openIssue(mag)}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
