'use client'
import { useState, useEffect } from 'react'
import { FolderMinus, Xmark } from 'iconoir-react'
import { fetchDocuments, deleteDocument } from '@/lib/documents'

type Doc = {
  id: string; type: string; title: string; word_count: number;
  bypass_score: Record<string,number>|null; algo_tier: string; created_at: string;
}

const ICON_STYLE: Record<string,string> = {
  humanized: 'bg-blue text-white',
  essay:     'bg-mint text-white',
  detection: 'bg-sun text-ink',
  citation:  'bg-coral text-white',
}
const ICON_LABEL: Record<string,string> = {
  humanized:'Hm', essay:'Es', detection:'Dt', citation:'Ct'
}

function avgBypass(scores: Record<string,number>|null): number|null {
  if (!scores) return null
  const vals = Object.values(scores).filter(v => typeof v === 'number')
  return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null
}

function formatDate(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime()-d.getTime())/1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return Math.floor(diff/60)+'m ago'
  if (diff < 86400) return Math.floor(diff/3600)+'h ago'
  if (diff < 604800)return Math.floor(diff/86400)+'d ago'
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})
}

export default function HistoryPage() {
  const [docs,    setDocs]    = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [deleting,setDeleting]= useState<string|null>(null)

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    const data = await fetchDocuments({ type: filter==='all'?undefined:filter, limit:50 })
    setDocs(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return
    setDeleting(id)
    await deleteDocument(id)
    setDocs(d => d.filter(x => x.id !== id))
    setDeleting(null)
  }

  const filtered = docs.filter(d =>
    search.trim() === '' || d.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-up max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="eyebrow text-[11px] text-mute">
          {loading ? 'Loading…' : `${filtered.length} Documents`}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="bg-paper border-2 border-ink rounded-full px-3 py-1.5 text-[11.5px] font-mono text-ink outline-none cursor-pointer">
            <option value="all">All types</option>
            <option value="humanized">Humanized</option>
            <option value="essay">Essays</option>
            <option value="detection">Detection</option>
            <option value="citation">Citations</option>
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="bg-paper border-2 border-ink rounded-full px-4 py-1.5 text-[12px] font-body text-ink outline-none focus:bg-paper3 transition-colors placeholder:text-mute w-44" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[...Array(4)].map((_,i) => (
            <div key={i} className="b-card rounded-xl3 h-16 animate-pulse opacity-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="b-card rounded-xl3 px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-xl2 bg-blue border-2 border-ink shadow-b-xs flex items-center justify-center mx-auto mb-4">
            <FolderMinus className="w-7 h-7" color="#fff" aria-hidden />
          </div>
          <div className="font-display font-semibold text-[16px] text-ink mb-2">No documents yet</div>
          <p className="text-ink2 text-[13px] mb-5 font-medium">
            Every humanization and essay auto-saves here. we got you — start cooking.
          </p>
          <a href="/dashboard/humanizer" className="btn btn-primary inline-flex px-6 py-2.5 text-[13px] rounded-full">
            Start humanizing →
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map(doc => {
            const avg   = avgBypass(doc.bypass_score)
            const icon  = ICON_LABEL[doc.type] || 'Dc'
            const style = ICON_STYLE[doc.type]  || ICON_STYLE.humanized
            return (
              <div key={doc.id}
                className="b-card b-lift rounded-xl3 flex items-center gap-3 px-4 py-3.5 group cursor-pointer">
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center
                  font-mono font-bold text-[11px] border-2 border-ink ${style}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-ink mb-0.5 truncate group-hover:text-blue transition-colors">{doc.title}</div>
                  <div className="text-[11.5px] text-mute font-medium">
                    {doc.word_count > 0 && `${doc.word_count.toLocaleString()} words · `}
                    {doc.type}
                    {doc.algo_tier && doc.algo_tier !== 'std' && ` · ${doc.algo_tier.toUpperCase()}`}
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  {avg !== null && (
                    <div className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold border-2 border-ink text-white"
                      style={{ background: avg>=80 ? 'var(--mint)' : 'var(--sun)', color: avg>=80 ? '#fff' : '#1A1A17' }}>
                      {avg}%
                    </div>
                  )}
                  <div className="text-[10px] text-mute font-mono min-w-[60px] text-right">
                    {formatDate(doc.created_at)}
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting===doc.id}
                    aria-label="Delete document"
                    className="opacity-0 group-hover:opacity-100 transition-opacity
                      w-7 h-7 rounded-lg bg-coral border-2 border-ink
                      flex items-center justify-center text-white hover:brightness-110 disabled:opacity-40">
                    {deleting===doc.id
                      ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Xmark className="w-3.5 h-3.5" aria-hidden />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
