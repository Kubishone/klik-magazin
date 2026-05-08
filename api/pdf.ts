export const config = { runtime: 'edge' }

const PDF_URL =
  'https://github.com/Kubishone/klik-magazin/releases/download/v1.0/kLIK.CASOPIS.4.komplet.pdf'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  const fetchHeaders: HeadersInit = {}
  const range = request.headers.get('Range')
  if (range) fetchHeaders['Range'] = range

  const upstream = await fetch(PDF_URL, { headers: fetchHeaders })

  const headers = new Headers(CORS)
  for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const val = upstream.headers.get(key)
    if (val) headers.set(key, val)
  }

  return new Response(upstream.body, { status: upstream.status, headers })
}
