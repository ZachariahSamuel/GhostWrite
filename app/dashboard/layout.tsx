'use client'
import { useState, useEffect, useRef, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import type { GhostRiveHandle } from '@/components/ghost/GhostRive'

const GhostRive = dynamic(() => import('@/components/ghost/GhostRive'), { ssr: false })

// ── Context ──
export const DashCtx = createContext<{
  user: any; groqKey: string; setGroqKey: (k:string)=>void;
  ghostRef: React.RefObject<GhostRiveHandle>; algo: string; setAlgo: (a:string)=>void;
  sessionWords: number; addWords: (n:number)=>void;
  sessionDocs: number; addDoc: ()=>void;
}>({} as any)
export const useDash = () => useContext(DashCtx)

const NAV = [
  { href:'/dashboard/humanizer', icon:'✨', label:'Humanizer' },
  { href:'/dashboard/chat',      icon:'💬', label:'AI Chat' },
  { href:'/dashboard/essay',     icon:'✍️', label:'Essay' },
  { href:'/dashboard/bypass',    icon:'🛡️', label:'Bypass' },
  { href:'/dashboard/citations', icon:'📚', label:'Citations' },
  { href:'/dashboard/history',   icon:'🕐', label:'History' },
  { href:'/dashboard/analytics', icon:'📊', label:'Analytics' },
  { href:'/dashboard/africa',    icon:'🌍', label:'Africa' },
  { href:'/dashboard/settings',  icon:'⚙️', label:'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const ghostRef  = useRef<GhostRiveHandle>(null)
  const [user, setUser]           = useState<any>(null)
  const [groqKey, setGroqKeyState]= useState('')
  const [algo, setAlgo]           = useState('std')
  const [sessionWords, setSessionWords] = useState(0)
  const [sessionDocs,  setSessionDocs]  = useState(0)
  const [sideOpen, setSideOpen]   = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [apiStatus, setApiStatus] = useState<'ok'|'err'|'loading'|'none'>('none')

  const setGroqKey = (k: string) => {
    setGroqKeyState(k)
    if (typeof window !== 'undefined') localStorage.setItem('phantom_groq_key', k)
  }
  const addWords = (n: number) => setSessionWords(w => w+n)
  const addDoc   = ()          => setSessionDocs(d => d+1)

  useEffect(() => {
    const k = localStorage.getItem('phantom_groq_key') || ''
    setGroqKeyState(k)
    setApiStatus(k ? 'loading' : 'none')
    if (k) testKey(k)

    const sb = createClient()
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const m = data.user.user_metadata || {}
      setUser({ id: data.user.id, email: data.user.email,
        name: m.full_name || data.user.email?.split('@')[0],
        plan: m.plan || 'free',
        credits_used: m.credits_used || 0,
        credits_total: m.credits_total || 500 })
    })
  }, [])

  const testKey = async (k: string) => {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+k },
        body: JSON.stringify({ model:'llama-3.3-70b-versatile',
          messages:[{role:'user',content:'reply: ready'}], max_tokens:5 })
      })
      setApiStatus(r.ok ? 'ok' : 'err')
    } catch { setApiStatus('err') }
  }

  const saveKey = (k: string) => {
    if (!k.startsWith('gsk_')) return
    setGroqKey(k); setApiStatus('loading'); testKey(k)
    setShowKeyModal(false)
  }

  const signOut = async () => {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/login')
  }

  const initials = user?.name?.split(' ').map((p:string)=>p[0]).join('').toUpperCase().slice(0,2) || 'GW'
  const planLbl: Record<string,string> = { free:'⚡ Free', student:'🎓 Student', pro:'🚀 Pro · BWP 80', institution:'🏢 Institution' }
  const credits  = user ? Math.round((user.credits_used/user.credits_total)*100) : 35

  return (
    <DashCtx.Provider value={{ user, groqKey, setGroqKey, ghostRef, algo, setAlgo, sessionWords, addWords, sessionDocs, addDoc }}>
      <div className="flex h-screen overflow-hidden bg-vb relative z-10">

        {/* Mobile overlay */}
        {sideOpen && (
          <div className="fixed inset-0 z-[199] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSideOpen(false)} />
        )}

        {/* ── SIDEBAR ── */}
        <aside className={`fixed md:relative z-[200] h-full flex flex-col
          w-[240px] bg-vb2 border-r border-white/6 transition-transform duration-300
          ${sideOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

          {/* Logo */}
          <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/6 shrink-0">
            <GhostRive ref={ghostRef} width={32} height={32}
              logoSrc="/ghost-logo.png" riv="/ghostwrite.riv"
              initialState="idle" className="shrink-0" />
            <div>
              <div className="font-display font-black text-[15px] text-sw leading-none">
                Ghost<span className="text-pp">Write</span>
              </div>
              <div className="text-[9px] text-gg3 uppercase tracking-widest mt-0.5 font-label">Invisible craft</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
            {[
              { section:'Tools', items: NAV.slice(0,5) },
              { section:'Insights', items: NAV.slice(5,7) },
              { section:'Exclusive', items: NAV.slice(7,8) },
              { section:'Account', items: NAV.slice(8) },
            ].map(({ section, items }) => (
              <div key={section} className="mb-4">
                <span className="block px-2.5 mb-1 text-[9.5px] font-label font-bold
                  text-gg3 uppercase tracking-[1.2px]">{section}</span>
                {items.map(n => {
                  const active = pathname === n.href
                  return (
                    <Link key={n.href} href={n.href}
                      onClick={() => setSideOpen(false)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                        text-[13px] font-body font-medium transition-all relative
                        ${active
                          ? 'bg-fl/10 text-fl border-l-2 border-pp'
                          : 'text-gg hover:bg-white/5 hover:text-sw border-l-2 border-transparent'}`}>
                      <span className="text-sm w-[18px] text-center opacity-70">{n.icon}</span>
                      {n.label}
                      {n.label==='History' && (
                        <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold
                          bg-fl/10 text-pp2 border border-pp/30">{47+sessionDocs}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-2.5 py-3 border-t border-white/6 shrink-0">
            <button onClick={signOut}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg
                hover:bg-white/5 transition-all cursor-pointer mb-3">
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center
                bg-gradient-to-br from-pp to-pp3 font-label font-bold text-[10px] text-white
                shadow-[0_2px_8px_rgba(124,92,252,0.28)]">{initials}</div>
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-sw truncate">{user?.name || 'User'}</div>
                <div className="text-[10.5px] text-gg truncate">{user?.email || ''}</div>
              </div>
            </button>
            <div className="rounded-xl p-3 bg-fl/5 border border-pp/20">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label font-bold text-[11px] text-pp2">
                  {(planLbl as any)[user?.plan||'free']}
                </span>
                <button className="text-[10.5px] font-label font-semibold text-pp2 opacity-70 hover:opacity-100">
                  Upgrade →
                </button>
              </div>
              <div className="h-[2px] bg-pp/15 rounded-full overflow-hidden">
                <div className="h-full bg-pp rounded-full" style={{ width:`${credits}%` }} />
              </div>
              <div className="text-[10.5px] text-gg mt-1.5 font-label">
                {user?.credits_used?.toLocaleString()||350} / {user?.credits_total?.toLocaleString()||1000} credits
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Topbar */}
          <div className="h-[62px] shrink-0 flex items-center px-5 gap-3
            bg-vb/90 backdrop-blur-2xl border-b border-white/6 z-10
            shadow-[0_1px_0_rgba(124,92,252,0.08)]">
            <button className="md:hidden w-8 h-8 rounded-lg bg-white/5 border border-white/8
              flex items-center justify-center text-gg text-[15px]"
              onClick={() => setSideOpen(true)}>☰</button>

            <div className="flex-1 min-w-0 font-display font-bold text-[17px] text-sw
              tracking-[-0.3px] truncate">
              {NAV.find(n=>n.href===pathname)?.label || 'Dashboard'}
            </div>

            {/* Algo switcher */}
            <div className="hidden md:flex gap-0.5 bg-white/4 rounded-full p-0.5 border border-white/8">
              {[['std','Standard'],['pro','Pro'],['hyp','Hyper ⚡']].map(([a,l]) => (
                <button key={a} onClick={() => setAlgo(a)}
                  className={`px-3.5 py-1.5 rounded-full font-label font-semibold text-[11.5px]
                    transition-all ${algo===a
                      ? 'bg-pp text-white shadow-[0_2px_10px_rgba(124,92,252,0.35)]'
                      : 'text-gg2 hover:text-sw'}`}>{l}</button>
              ))}
            </div>

            {/* API status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
              bg-white/4 border border-white/8 font-mono text-[10.5px] text-gg">
              <span className={`w-1.5 h-1.5 rounded-full ${
                apiStatus==='ok'      ? 'bg-bg shadow-[0_0_6px_rgba(16,185,129,0.5)]' :
                apiStatus==='loading' ? 'bg-wa animate-pulse' :
                apiStatus==='err'     ? 'bg-err' : 'bg-gg3'}`} />
              <span className="hidden sm:inline">
                {apiStatus==='ok'?'Connected':apiStatus==='loading'?'…':'No key'}
              </span>
            </div>

            <button onClick={() => setShowKeyModal(true)}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/8
                flex items-center justify-center text-gg hover:text-sw hover:bg-white/10
                transition-all text-[14px]">🔑</button>
            <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/8
              flex items-center justify-center text-gg hover:text-sw hover:bg-white/10
              transition-all text-[14px]">🔔</button>
            <div onClick={signOut}
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center
                bg-gradient-to-br from-pp to-pp3 font-label font-bold text-[11px] text-white
                cursor-pointer shadow-[0_2px_8px_rgba(124,92,252,0.28)]">{initials}</div>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {children}
          </div>
        </div>

        {/* ── GROQ KEY MODAL ── */}
        {showKeyModal && (
          <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md
            flex items-center justify-center p-5"
            onClick={() => setShowKeyModal(false)}>
            <div className="bg-vb3 border border-white/10 rounded-3xl p-8 w-full max-w-sm
              relative shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 right-0 h-px
                bg-gradient-to-r from-transparent via-pp/50 to-transparent rounded-t-3xl" />
              <div className="text-center mb-5">
                <img src="/ghost-logo.png" className="w-12 h-12 object-contain mx-auto mb-3
                  drop-shadow-[0_4px_12px_rgba(124,92,252,0.4)]" alt="" />
              </div>
              <h3 className="font-display font-bold text-[20px] text-sw mb-2">Connect Groq — Free</h3>
              <p className="text-gg text-[13px] leading-relaxed mb-5">
                Get your free key at{' '}
                <a href="https://console.groq.com/keys" target="_blank"
                  className="text-pp2 font-semibold hover:text-pp">console.groq.com/keys</a>
                {' '}— sign up free, no credit card.
              </p>
              <label className="block text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-1.5">
                Groq API Key
              </label>
              <input type="password" placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                  text-sw text-[13.5px] outline-none focus:border-pp transition-all mb-3"
                onKeyDown={e => { if(e.key==='Enter') saveKey((e.target as HTMLInputElement).value.trim()) }}
                id="groq-key-input" />
              <div className="flex gap-2">
                <button onClick={() => {
                  const v = (document.getElementById('groq-key-input') as HTMLInputElement).value.trim()
                  if (v) saveKey(v)
                }} className="flex-1 py-2.5 rounded-full bg-pp text-white font-label font-bold text-[13.5px]
                  hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]">
                  Connect →
                </button>
                <button onClick={() => setShowKeyModal(false)}
                  className="py-2.5 px-5 rounded-full bg-white/5 border border-white/10
                    text-gg font-label font-semibold text-[13px] hover:bg-white/10 transition-all">
                  Skip
                </button>
              </div>
              <p className="text-gg3 text-[11px] font-label mt-3 leading-relaxed text-center">
                Stored only in your browser — never sent anywhere except Groq directly.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashCtx.Provider>
  )
}
