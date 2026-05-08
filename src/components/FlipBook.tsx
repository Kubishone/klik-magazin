import { useRef, useState, useEffect, useCallback } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { Page } from './Page'
import { useBookmark } from '../hooks/useBookmark'
import { useSound } from '../hooks/useSound'

interface FlipBookProps {
  pages: (string | null)[]
  renderedCount: number
  totalPages: number
  issueId: string
  onWidthChange?: (totalWidth: number) => void
}

function calcDims(isFullscreen: boolean) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const portrait = vw < 768

  if (portrait) {
    const byW = Math.min(vw - 8, 600)
    const byH = Math.round((vh * 0.60) / 1.414)
    const w = isFullscreen ? vw : Math.min(byW, byH)
    return { width: w, height: Math.round(w * 1.414), portrait: true }
  }
  if (isFullscreen) {
    const w = Math.min(Math.floor(vw / 2), Math.floor(vh / 1.414))
    return { width: w, height: Math.round(w * 1.414), portrait: false }
  }
  const byVH = Math.round((vh * 0.88) / 1.414)
  const byVW = Math.round((vw * 0.92) / 2)
  const w = Math.min(byVH, byVW, 680)
  return { width: w, height: Math.round(w * 1.414), portrait: false }
}

function useBookDimensions(isFullscreen: boolean) {
  // Inicijalni state odmah tačan — react-pageflip ne reaguje na kasniju promjenu usePortrait
  const [dims, setDims] = useState(() => calcDims(isFullscreen))

  useEffect(() => {
    function calc() { setDims(calcDims(isFullscreen)) }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [isFullscreen])

  return dims
}

const SHORTCUTS = [
  { keys: ['←', '→'],     desc: 'Prethodna / Sljedeća stranica' },
  { keys: ['F'],           desc: 'Uključi / isključi fullscreen' },
  { keys: ['Esc'],         desc: 'Izlaz iz fullscreen' },
  { keys: ['Klik na br.'], desc: 'Skok na određenu stranicu' },
  { keys: ['?'],           desc: 'Prikaži / sakrij prečice' },
]

export function FlipBook({ pages, renderedCount, totalPages, issueId, onWidthChange }: FlipBookProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef           = useRef<any>(null)
  const jumpInputRef      = useRef<HTMLInputElement>(null)
  const hideTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const jumpCommittedRef  = useRef(false)

  const [currentPage,   setCurrentPage]   = useState(0)
  const [isFullscreen,  setIsFullscreen]  = useState(false)
  const [jumping,       setJumping]       = useState(false)
  const [jumpValue,     setJumpValue]     = useState('')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showThumbs,    setShowThumbs]    = useState(false)
  const [ctrlVisible,   setCtrlVisible]   = useState(true)
  const [resumePage,    setResumePage]    = useState<number | null>(null)

  const { width, height, portrait } = useBookDimensions(isFullscreen)
  const bookmark = useBookmark(issueId)
  const sound = useSound()

  // Šaljemo širinu jedne stranice — logo koristi taj isti width
  useEffect(() => {
    if (!isFullscreen) onWidthChange?.(width)
  }, [width, isFullscreen, onWidthChange])

  const total         = pages.length
  const isFirst       = currentPage === 0
  const isLast        = portrait ? currentPage >= total - 1 : currentPage >= total - 2
  const leftPage      = currentPage + 1
  const rightPage     = portrait ? null : Math.min(currentPage + 2, total)
  const isFullyLoaded = renderedCount >= totalPages
  const bgProgress    = totalPages > 0 ? Math.round((renderedCount / totalPages) * 100) : 0

  // ── Bookmark ────────────────────────────────────────────────
  useEffect(() => {
    setResumePage(bookmark.getSaved())
    setCurrentPage(0)
  }, [issueId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleResume() {
    if (resumePage === null) return
    setTimeout(() => bookRef.current?.pageFlip().turnToPage(resumePage - 1), 100)
    setResumePage(null)
  }

  function handleRestart() {
    bookmark.clear()
    setResumePage(null)
  }

  // ── Navigacija ───────────────────────────────────────────────
  function prev() { bookRef.current?.pageFlip().flipPrev() }
  function next() { bookRef.current?.pageFlip().flipNext() }

  // ── Fullscreen ───────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    function onFSChange() { setIsFullscreen(!!document.fullscreenElement) }
    document.addEventListener('fullscreenchange', onFSChange)
    return () => document.removeEventListener('fullscreenchange', onFSChange)
  }, [])

  // ── Auto-hide kontrole u fullscreen ─────────────────────────
  const bumpControls = useCallback(() => {
    setCtrlVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setCtrlVisible(false), 3000)
  }, [])

  useEffect(() => {
    if (isFullscreen) {
      bumpControls()
    } else {
      setCtrlVisible(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }
  }, [isFullscreen, bumpControls])

  // ── Skok na stranicu — fix: guard za double-call ─────────────
  function startJump() {
    jumpCommittedRef.current = false
    setJumpValue(String(leftPage))
    setJumping(true)
    setTimeout(() => jumpInputRef.current?.select(), 30)
  }

  function commitJump() {
    if (jumpCommittedRef.current) return
    jumpCommittedRef.current = true
    const num = parseInt(jumpValue, 10)
    if (!isNaN(num) && num >= 1 && num <= total) {
      bookRef.current?.pageFlip().turnToPage(num - 1)
    }
    setJumping(false)
  }

  // ── Keyboard ─────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { next(); if (isFullscreen) bumpControls() }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { prev(); if (isFullscreen) bumpControls() }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      if (e.key === '?') setShowShortcuts((s) => !s)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleFullscreen, isFullscreen, bumpControls])

  // ── Shared pieces ────────────────────────────────────────────
  const iconBtn = 'rounded-lg p-2.5 text-navy-400 bg-navy-800/80 hover:bg-navy-700 hover:text-navy-100 transition-all duration-150 active:scale-95'

  const FSIcon = isFullscreen
    ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
    : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>

  const PageCounter = (
    <div className="min-w-[100px] text-center">
      {jumping ? (
        <div className="flex items-center justify-center gap-1">
          <input
            ref={jumpInputRef}
            type="number" min={1} max={total}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  commitJump()
              if (e.key === 'Escape') { jumpCommittedRef.current = true; setJumping(false) }
            }}
            onBlur={commitJump}
            className="w-14 rounded-lg border border-forest-500 bg-navy-700 text-center font-sans text-sm text-navy-100 px-2 py-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="font-sans text-xs text-navy-400">/ {total}</span>
        </div>
      ) : (
        <button onClick={startJump} title="Klikni za skok na stranicu" className="group w-full">
          <span className="font-sans text-sm tabular-nums text-navy-300 group-hover:text-navy-100 transition-colors">
            {rightPage ? `${leftPage} – ${rightPage}` : `${leftPage}`}
          </span>
          <span className="font-sans text-xs text-navy-500 group-hover:text-navy-400 transition-colors block">
            od {total}
          </span>
        </button>
      )}
    </div>
  )

  const ResumePrompt = resumePage !== null ? (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-forest-500/30 bg-navy-800/90 backdrop-blur-sm px-4 py-3 shadow-lg max-w-full mx-4 sm:mx-0">
      <svg className="h-5 w-5 shrink-0 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <p className="font-sans text-sm text-navy-300">
        Stali ste na stranici <span className="font-semibold text-navy-100">{resumePage}</span>
      </p>
      <button onClick={handleResume} className="rounded-lg bg-forest-500 hover:bg-forest-400 px-3 py-1.5 font-sans text-xs font-semibold text-white transition-colors active:scale-95">
        Nastavi
      </button>
      <button onClick={handleRestart} className="font-sans text-xs text-navy-500 hover:text-navy-300 transition-colors">
        Iznova
      </button>
    </div>
  ) : null

  // ── Knjiga ───────────────────────────────────────────────────
  const TheBook = (
    <div style={{ filter: 'drop-shadow(0 20px 80px rgba(0,0,0,0.8))' }}>
      <HTMLFlipBook
        key={portrait ? 'portrait' : 'landscape'}
        ref={bookRef}
        width={width} height={height}
        size="fixed"
        minWidth={200} maxWidth={1600}
        minHeight={280} maxHeight={2200}
        drawShadow flippingTime={650}
        usePortrait={portrait}
        startPage={0} showCover
        mobileScrollSupport
        maxShadowOpacity={0.5}
        onFlip={(e) => {
          setCurrentPage(e.data)
          bookmark.save(e.data + 1)
          sound.play()
        }}
      >
        {pages.map((src, i) => (
          <Page key={i} src={src} pageNumber={i + 1} totalPages={total} />
        ))}
      </HTMLFlipBook>
    </div>
  )

  // ── Thumbnail strip ──────────────────────────────────────────
  const ThumbnailStrip = showThumbs ? (
    <div className="w-full max-w-4xl overflow-x-auto rounded-xl border border-navy-800 bg-navy-900/80 px-3 py-3">
      <div className="flex gap-1.5">
        {pages.map((src, i) => {
          const isActive = i === currentPage || (!portrait && i === currentPage + 1)
          return (
            <button
              key={i}
              onClick={() => { bookRef.current?.pageFlip().turnToPage(i) }}
              className={[
                'shrink-0 overflow-hidden rounded transition-all duration-150',
                isActive
                  ? 'ring-2 ring-forest-500 opacity-100 scale-105'
                  : 'opacity-50 hover:opacity-90 hover:scale-105',
              ].join(' ')}
              style={{ width: 46, height: 65 }}
              title={`Stranica ${i + 1}`}
            >
              {src ? (
                <img src={src} className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full bg-navy-700 animate-pulse" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  ) : null

  // ── Kontrole bar ─────────────────────────────────────────────
  const NormalControls = (
    <div className="flex items-center gap-1.5 sm:gap-3">
      <button onClick={toggleFullscreen} title="Fullscreen (F)" className={iconBtn.replace('bg-navy-800/80', 'bg-navy-800')}>
        {FSIcon}
      </button>
      <button onClick={prev} disabled={isFirst} className={[
        'flex items-center gap-1 sm:gap-2 rounded-lg px-3 sm:px-5 py-2 sm:py-2.5 font-sans text-sm font-medium transition-all duration-150',
        isFirst ? 'cursor-not-allowed text-navy-600 bg-navy-800' : 'text-navy-100 bg-navy-700 hover:bg-forest-600 hover:text-white active:scale-95',
      ].join(' ')}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        <span className="hidden sm:inline">Prethodna</span>
      </button>
      {PageCounter}
      <button onClick={next} disabled={isLast} className={[
        'flex items-center gap-1 sm:gap-2 rounded-lg px-3 sm:px-5 py-2 sm:py-2.5 font-sans text-sm font-medium transition-all duration-150',
        isLast ? 'cursor-not-allowed text-navy-600 bg-navy-800' : 'text-navy-100 bg-navy-700 hover:bg-forest-600 hover:text-white active:scale-95',
      ].join(' ')}>
        <span className="hidden sm:inline">Sljedeća</span>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
      {/* Zvuk toggle */}
      <button onClick={sound.toggle} title={sound.enabled ? 'Isključi zvuk' : 'Uključi zvuk'} className={[
        iconBtn.replace('bg-navy-800/80', 'bg-navy-800'),
        sound.enabled ? '' : 'opacity-40',
      ].join(' ')}>
        {sound.enabled ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9 9H6a1 1 0 00-1 1v4a1 1 0 001 1h3l4 4V5L9 9z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </button>
      {/* Thumbnail toggle */}
      <button onClick={() => setShowThumbs((s) => !s)} title="Pregled stranica" className={[
        iconBtn.replace('bg-navy-800/80', 'bg-navy-800'),
        showThumbs ? 'text-forest-400 bg-navy-700' : '',
      ].join(' ')}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      </button>
      {/* Prečice */}
      <button onClick={() => setShowShortcuts((s) => !s)} title="Prečice (?)" className={iconBtn.replace('bg-navy-800/80', 'bg-navy-800')}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
      </button>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  //  FULLSCREEN OVERLAY
  // ══════════════════════════════════════════════════════════
  const FullscreenOverlay = isFullscreen ? (
    <div
      className="fixed inset-0 z-50 bg-navy-900 flex items-center justify-center"
      onMouseMove={bumpControls}
      style={{ cursor: ctrlVisible ? 'default' : 'none' }}
    >
      {TheBook}

      <div className={[
        'absolute bottom-0 inset-x-0 flex flex-col items-center gap-2 pb-5 pt-8',
        'bg-gradient-to-t from-navy-900/90 to-transparent',
        'transition-opacity duration-500',
        ctrlVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}>
        {ResumePrompt}

        {!isFullyLoaded && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-36 h-1 overflow-hidden rounded-full bg-navy-700">
              <div className="h-full rounded-full bg-forest-600/60 transition-all duration-300" style={{ width: `${bgProgress}%` }} />
            </div>
            <span className="font-sans text-[11px] text-navy-500 tabular-nums">{renderedCount}/{totalPages}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={toggleFullscreen} title="Izlaz (Esc)" className={iconBtn}>{FSIcon}</button>
          <button onClick={prev} disabled={isFirst} className={[iconBtn, isFirst ? 'opacity-25 cursor-not-allowed' : ''].join(' ')}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          {PageCounter}
          <button onClick={next} disabled={isLast} className={[iconBtn, isLast ? 'opacity-25 cursor-not-allowed' : ''].join(' ')}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <button onClick={sound.toggle} title={sound.enabled ? 'Isključi zvuk' : 'Uključi zvuk'} className={[iconBtn, sound.enabled ? '' : 'opacity-40'].join(' ')}>
            {sound.enabled ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9 9H6a1 1 0 00-1 1v4a1 1 0 001 1h3l4 4V5L9 9z" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            )}
          </button>
          <button onClick={() => setShowShortcuts((s) => !s)} title="Prečice (?)" className={iconBtn}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
          </button>
        </div>
      </div>
    </div>
  ) : null

  // ══════════════════════════════════════════════════════════
  //  NORMALNI MOD
  // ══════════════════════════════════════════════════════════
  return (
    <>
      <div className="flex flex-col items-center gap-5 w-full">
        {TheBook}
        {ResumePrompt}
        {NormalControls}
        {ThumbnailStrip}

        {!isFullyLoaded && (
          <div className="flex flex-col items-center gap-1.5 w-56">
            <div className="flex justify-between w-full font-sans text-[11px] text-navy-600">
              <span>Učitavam preostale stranice...</span>
              <span className="tabular-nums">{renderedCount}/{totalPages}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-navy-800">
              <div className="h-full rounded-full bg-forest-600/60 transition-all duration-300" style={{ width: `${bgProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      {FullscreenOverlay}

      {/* Prečice modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-7 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl text-navy-100">Prečice</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-navy-500 hover:text-navy-200 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              {SHORTCUTS.map(({ keys, desc }) => (
                <div key={desc} className="flex items-center justify-between gap-4">
                  <span className="font-sans text-sm text-navy-400">{desc}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {keys.map((k) => (
                      <kbd key={k} className="inline-flex items-center rounded-md border border-navy-600 bg-navy-700 px-2 py-1 font-sans text-xs text-navy-300">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
