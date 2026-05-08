# Kako dodati novo izdanje KLIK Magazina

## Fajlovi
Svako izdanje treba dva fajla:

```
public/magazines/klik-002.pdf          ← PDF knjiga
public/magazines/covers/klik-002.jpg   ← Naslovnica (JPG, preporučeno 600×850px)
```

## Kod
Otvorite `src/data/magazines.ts` i dodajte novi unos NA VRH liste:

```ts
{
  id: 'klik-002',
  title: 'KLIK Magazin',
  subtitle: 'Broj 2 · 2026',
  date: '2026-08-01',
  pdfUrl: '/magazines/klik-002.pdf',
  coverUrl: '/magazines/covers/klik-002.jpg',
  isCurrent: true,   // ← ovo je novo trenutno izdanje
},
```

Na starom trenutnom izdanju obrišite ili promijenite `isCurrent: true` u `isCurrent: false`.

## Rezultat
- Novo izdanje se pojavljuje kao "Trenutno izdanje" na početnoj
- Staro se automatski premješta u "Prethodna izdanja"
