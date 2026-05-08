import { forwardRef } from 'react'

interface PageProps {
  src: string | null
  pageNumber: number
  totalPages: number
}

export const Page = forwardRef<HTMLDivElement, PageProps>(
  ({ src, pageNumber, totalPages }, ref) => (
    <div
      ref={ref}
      className="relative overflow-hidden select-none"
      style={{ width: '100%', height: '100%', backgroundColor: '#f5f0e8' }}
    >
      {src ? (
        <>
          <img
            src={src}
            alt={`Stranica ${pageNumber}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute bottom-0 inset-x-0 flex justify-center py-1.5 bg-gradient-to-t from-black/20 to-transparent">
            <span className="font-sans text-[11px] text-white/70 tabular-nums">
              {pageNumber} / {totalPages}
            </span>
          </div>
        </>
      ) : (
        // Skeleton dok se stranica renderuje
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#f5f0e8]">
          <div className="flex flex-col gap-2 w-3/5 opacity-20">
            <div className="h-2 rounded bg-gray-400 w-full animate-pulse" />
            <div className="h-2 rounded bg-gray-400 w-4/5 animate-pulse" />
            <div className="h-2 rounded bg-gray-400 w-full animate-pulse" />
            <div className="h-2 rounded bg-gray-400 w-2/3 animate-pulse" />
            <div className="mt-2 h-2 rounded bg-gray-400 w-full animate-pulse" />
            <div className="h-2 rounded bg-gray-400 w-3/4 animate-pulse" />
          </div>
          <span className="font-sans text-xs text-gray-300 tabular-nums absolute bottom-3">
            {pageNumber}
          </span>
        </div>
      )}
    </div>
  ),
)

Page.displayName = 'Page'
