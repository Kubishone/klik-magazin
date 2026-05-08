import type { Magazine } from '../data/magazines'

interface IssueCardProps {
  magazine: Magazine
  active?: boolean
  onOpen: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('bs-BA', {
    month: 'long',
    year: 'numeric',
  })
}

export function IssueCard({ magazine, active, onOpen }: IssueCardProps) {
  return (
    <div className="group flex flex-col gap-3">
      <button
        onClick={onOpen}
        className={[
          'relative overflow-hidden rounded-lg aspect-[3/4] transition-all duration-200',
          'hover:shadow-xl hover:shadow-navy-950 hover:scale-[1.03]',
          active
            ? 'border-2 border-forest-500 ring-2 ring-forest-500/20'
            : 'border border-navy-700 bg-navy-800 hover:border-forest-500/60',
        ].join(' ')}
      >
        {magazine.coverUrl ? (
          <img
            src={magazine.coverUrl}
            alt={magazine.title}
            className="w-full h-full object-cover"
          />
        ) : (
          // Placeholder kad nema cover slike
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-navy-700 to-navy-800 p-4">
            <svg className="w-8 h-8 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-serif text-xs text-center text-navy-400 leading-snug">
              {magazine.subtitle}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-navy-900/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="font-sans text-sm font-semibold text-white bg-forest-600 rounded-lg px-4 py-2">
            {active ? 'Čitate' : 'Otvori'}
          </span>
        </div>

        {active && (
          <div className="absolute top-2 left-2 rounded-full bg-forest-500 px-2 py-0.5 font-sans text-[10px] font-semibold text-white">
            aktivno
          </div>
        )}
      </button>

      <div>
        <p className="font-serif text-sm font-semibold text-navy-200 leading-tight">
          {magazine.subtitle}
        </p>
        <p className="font-sans text-xs text-navy-500 mt-0.5">
          {formatDate(magazine.date)}
        </p>
      </div>
    </div>
  )
}
