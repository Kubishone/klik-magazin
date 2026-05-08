import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

export async function loadPDF(
  source: File | string,
): Promise<pdfjsLib.PDFDocumentProxy> {
  if (typeof source === 'string') {
    return pdfjsLib.getDocument({
      url: source,
      withCredentials: false,
    }).promise
  }
  const arrayBuffer = await source.arrayBuffer()
  return pdfjsLib.getDocument({ data: arrayBuffer }).promise
}

export async function renderPageToDataUrl(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale = 1.5,
): Promise<string> {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height

  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise

  return canvas.toDataURL('image/jpeg', 0.88)
}
