'use client'
import { useState, useEffect } from 'react'
import { useDash } from '../layout'
import { fetchDocuments, deleteDocument } from '@/lib/documents'

type Doc = {
  id: string; type: string; title: string; word_count: number;
  bypass_score: Record<string,number>|null; algo_tier: string; created_at: string;
}

const ICON_STYLE: Record<string,string> = {
  humanized: 'bg-fl/10 border-pp/25 text-pp2',
  essay:     'bg-bg/10 border-bg/25 text-bg',
  detection: 'bg-wa/10 border-wa/25 text-wa',
  citation:  'bg-fl/10 border-pp/20 text-pp2',
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
  const { sessionDocs } = useDash()
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
    search.trim() === '' ||
    d.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="font-label font-bold text-[11px] text-gg3 uppercase tracking-widest">
          {loading ? 'Loading…' : `${filtered.length} Documents`}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="bg-white/5 border border-white/8 rounded-full px-3 py-1.5
              text-[11.5px] font-label text-sw outline-none cursor-pointer">
            <option value="all">All types</option>
            <option value="humanized">Humanized</option>
            <option value="essay">Essays</option>
            <option value="detection">Detection</option>
            <option value="citation">Citations</option>
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="bg-white/5 border border-white/8 rounded-full px-4 py-1.5
              text-[12px] font-body text-sw outline-none focus:border-pp transition-all
              placeholder:text-gg3 w-44" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[...Array(4)].map((_,i) => (
            <div key={i} className="glass rounded-xl h-16 animate-pulse opacity-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl px-6 py-12 text-center">
          <div className="text-3xl mb-3">📂</div>
          <div className="font-display font-bold text-[16px] text-sw mb-2">No documents yet</div>
          <p className="text-gg text-[13px] mb-5">
            Every humanization and essay is saved here automatically.
          </p>
          <a href="/dashboard/humanizer"
            className="inline-flex px-6 py-2.5 rounded-full font-label font-bold text-[13px]
              text-white bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]">
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
                className="glass rounded-xl flex items-center gap-3 px-4 py-3.5
                  hover:bg-white/5 hover:translate-x-0.5 transition-all group cursor-pointer">
                <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center
                  font-label font-bold text-[11px] border ${style}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-sw mb-0.5 truncate
                    group-hover:text-pp2 transition-colors">{doc.title}</div>
                  <div className="text-[11.5px] text-gg">
                    {doc.word_count > 0 && `${doc.word_count.toLocaleString()} words · `}
                    {doc.type}
                    {doc.algo_tier && doc.algo_tier !== 'std' && ` · ${doc.algo_tier.toUpperCase()}`}
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  {avg !== null && (
                    <div className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold
                      ${avg>=80?'bg-bg/10 border border-bg/25 text-bg':'bg-wa/10 border border-wa/25 text-wa'}`}>
                      {avg}%
                    </div>
                  )}
                  <div className="text-[10px] text-gg3 font-label min-w-[60px] text-right">
                    {formatDate(doc.created_at)}
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting===doc.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity
                      w-6 h-6 rounded-full bg-err/10 border border-err/25
                      flex items-center justify-center text-err text-[10px]
                      hover:bg-err/20 disabled:opacity-40">
                    {deleting===doc.id ? '…' : '✕'}
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
