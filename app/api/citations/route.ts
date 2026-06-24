import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// GhostWrite — Citation Lab (real sources)
//
// Citations come from CrossRef's free public API (150M+ real scholarly works),
// not an LLM. Every result is a genuine, DOI-verifiable paper — no hallucinated
// references. No API key required.
// ─────────────────────────────────────────────────────────────────────────────

type Work = {
  title?: string[]
  author?: { given?: string; family?: string; name?: string }[]
  issued?: { 'date-parts'?: number[][] }
  'container-title'?: string[]
  publisher?: string
  volume?: string
  issue?: string
  page?: string
  DOI?: string
  type?: string
  score?: number
  abstract?: string
}

const initials = (given?: string) =>
  (given || '').split(/\s+/).filter(Boolean).map(p => `${p[0].toUpperCase()}.`).join(' ')

function authorsAPA(authors: Work['author']): string {
  if (!authors?.length) return 'Anon.'
  const names = authors.slice(0, 7).map(a =>
    a.family ? `${a.family}, ${initials(a.given)}`.trim() : (a.name || 'Anon.'))
  if (authors.length > 7) names.push('et al.')
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`
}

function authorsMLA(authors: Work['author']): string {
  if (!authors?.length) return 'Anon.'
  const first = authors[0]
  const lead  = first.family ? `${first.family}, ${first.given || ''}`.trim() : (first.name || 'Anon.')
  if (authors.length === 1) return lead
  if (authors.length === 2) {
    const b = authors[1]
    return `${lead}, and ${b.given || ''} ${b.family || b.name || ''}`.trim()
  }
  return `${lead}, et al.`
}

const yearOf = (w: Work) => w.issued?.['date-parts']?.[0]?.[0]
const cleanAbstract = (a?: string) =>
  a ? a.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : ''

function format(style: string, w: Work): string {
  const title   = (w.title?.[0] || 'Untitled').replace(/\s+/g, ' ').trim()
  const journal = w['container-title']?.[0] || w.publisher || ''
  const year    = yearOf(w) ?? 'n.d.'
  const vol     = w.volume ? `${w.volume}` : ''
  const iss     = w.issue ? `(${w.issue})` : ''
  const pages   = w.page ? w.page.replace(/-/g, '–') : ''
  const doi     = w.DOI ? `https://doi.org/${w.DOI}` : ''

  switch (style) {
    case 'MLA 9':
      return [
        `${authorsMLA(w.author)}.`,
        `"${title}."`,
        journal ? `${journal},` : '',
        vol ? `vol. ${w.volume},` : '',
        w.issue ? `no. ${w.issue},` : '',
        `${year},`,
        pages ? `pp. ${pages}.` : '',
        doi ? `${doi}.` : '',
      ].filter(Boolean).join(' ')
    case 'Harvard':
      return [
        `${authorsAPA(w.author)} (${year})`,
        `'${title}',`,
        journal ? `${journal},` : '',
        vol ? `${vol}${iss},` : '',
        pages ? `pp. ${pages}.` : '',
        doi ? `${doi}` : '',
      ].filter(Boolean).join(' ')
    case 'Chicago':
      return [
        `${authorsMLA(w.author)}.`,
        `"${title}."`,
        journal ? `${journal}` : '',
        vol ? `${vol},` : '',
        w.issue ? `no. ${w.issue}` : '',
        `(${year}):`,
        pages ? `${pages}.` : '',
        doi ? `${doi}.` : '',
      ].filter(Boolean).join(' ')
    case 'APA 7':
    default:
      return [
        `${authorsAPA(w.author)} (${year}).`,
        `${title}.`,
        journal ? `*${journal}*,` : '',
        vol ? `${vol}${iss},` : '',
        pages ? `${pages}.` : '',
        doi,
      ].filter(Boolean).join(' ')
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.query?.trim()) return NextResponse.json({ error: 'No query provided.' }, { status: 400 })

  const { query, style = 'APA 7', count = 5 } = body
  const rows = Math.min(Math.max(parseInt(String(count)) || 5, 1), 15)

  const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}`
    + `&rows=${rows}&select=title,author,issued,container-title,publisher,volume,issue,page,DOI,type,abstract`
    + `&sort=relevance`

  let works: (Work & { score?: number })[] = []
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GhostWrite/1.0 (https://ghostwrite.app; mailto:support@ghostwrite.app)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`CrossRef ${res.status}`)
    const data = await res.json()
    works = data?.message?.items || []
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Could not reach the citation database. Please try again in a moment.' },
      { status: 502 },
    )
  }

  if (!works.length) {
    return NextResponse.json({ error: 'No matching sources found. Try broader or different terms.' }, { status: 404 })
  }

  const topScore = works[0]?.score || 1
  const citations = works.map(w => {
    const abstract = cleanAbstract(w.abstract)
    const journal  = w['container-title']?.[0] || w.publisher || 'source'
    return {
      citation:   format(style, w),
      annotation: abstract
        ? (abstract.length > 240 ? abstract.slice(0, 237) + '…' : abstract)
        : `${(w.type || 'work').replace(/-/g, ' ')} in ${journal}${yearOf(w) ? `, ${yearOf(w)}` : ''}.`,
      score:      Math.max(40, Math.round(((w.score || 0) / topScore) * 99)),
      doi:        w.DOI || null,
      url:        w.DOI ? `https://doi.org/${w.DOI}` : null,
      year:       yearOf(w) ?? null,
    }
  })

  return NextResponse.json({ citations, source: 'CrossRef' })
}
