// =============================================================
//  ADMIN UPUTE — kako dodati novo izdanje:
//
//  1. Kopirajte PDF u:  public/magazines/klik-BROJ.pdf
//  2. Kopirajte naslovnicu (JPEG) u:  public/magazines/covers/klik-BROJ.jpg
//  3. Dodajte novi unos NA VRH ove liste i postavite isCurrent: true
//  4. Na starom trenutnom izdanju promijenite isCurrent: false
//  5. Sačuvajte fajl — aplikacija se automatski ažurira
// =============================================================

export interface Magazine {
  id: string
  title: string
  subtitle: string
  date: string       // ISO format: 'YYYY-MM-DD'
  pdfUrl: string
  coverUrl?: string  // opcionalno — JPG naslovnica za arhivsku karticu
  isCurrent?: boolean
}

export const magazines: Magazine[] = [
  // --- DODAJTE NOVA IZDANJA NA VRH ---

  {
    id: 'klik-004',
    title: 'KLIK Magazin',
    subtitle: 'Broj 3',
    date: '2026-05-01',
    pdfUrl: '/api/pdf',
    isCurrent: true,
  },

  // --- ARHIVA ---
]

export function getCurrentIssue(): Magazine | undefined {
  return magazines.find((m) => m.isCurrent) ?? magazines[0]
}

export function getArchive(): Magazine[] {
  return magazines.filter((m) => !m.isCurrent)
}
