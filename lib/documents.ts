export async function saveDocument(doc: {
  type:         'humanized' | 'essay' | 'detection' | 'citation'
  title:        string
  content:      string
  word_count:   number
  algo_tier?:   string
  bypass_score?: Record<string,number> | null
  metadata?:    Record<string,any>
}): Promise<{ id:string; created_at:string } | null> {
  try {
    const res = await fetch('/api/documents', {
      method:  'POST',
      headers: { 'Content-Type':'application/json' },
      body:    JSON.stringify(doc),
    })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function fetchDocuments(opts: { type?:string; limit?:number; page?:number } = {}): Promise<any[]> {
  const p = new URLSearchParams()
  if (opts.type)  p.set('type',  opts.type)
  if (opts.limit) p.set('limit', String(opts.limit))
  if (opts.page)  p.set('page',  String(opts.page))
  try {
    const res = await fetch(`/api/documents?${p}`)
    if (!res.ok) return []
    return (await res.json()).documents || []
  } catch { return [] }
}

export async function deleteDocument(id:string): Promise<boolean> {
  try {
    const res = await fetch(`/api/documents?id=${id}`, { method:'DELETE' })
    return res.ok
  } catch { return false }
}
