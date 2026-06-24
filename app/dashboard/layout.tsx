'use client'
import { useState, useEffect, useRef, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import {
  MagicWand, MultiBubble, EditPencil, ShieldCheck, OpenBook,
  Clock, StatsReport, Globe, Settings, Menu, Key, Bell,
} from 'iconoir-react'
import type { GhostRiveHandle } from '@/components/ghost/GhostRive'

const GhostRive = dynamic(() => import('@/components/ghost/GhostRive'), { ssr: false })

type IconType = typeof MagicWand

// ── Context ──
export const DashCtx = createContext<{
  user: any; groqKey: string; setGroqKey: (k:string)=>void;
  ghostRef: React.RefObject<GhostRiveHandle>; algo: string; setAlgo: (a:string)=>void;
  sessionWords: number; addWords: (n:number)=>void;
  sessionDocs: number; addDoc: ()=>void;
}>({} as any)
export const useDash = () => useContext(DashCtx)

const NAV: { href: string; Icon: IconType; label: string }[] = [
  { href:'/dashboard/humanizer', Icon: MagicWand,    label:'Humanizer' },
  { href:'/dashboard/chat',      Icon: MultiBubble,   label:'AI Chat' },
  { href:'/dashboard/essay',     Icon: EditPencil,    label:'Essay' },
  { href:'/dashboard/bypass',    Icon: ShieldCheck,   label:'Bypass' },
  { href:'/dashboard/citations', Icon: OpenBook,      label:'Citations' },
  { href:'/dashboard/history',   Icon: Clock,         label:'History' },
  { href:'/dashboard/analytics', Icon: StatsReport,   label:'Analytics' },
  { href:'/dashboard/africa',    Icon: Globe,         label:'Africa' },
  { href:'/dashboard/settings',  Icon: Settings,      label:'Settings' },
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
        country: m.country || 'BW',
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
  const planLbl: Record<string,string> = { free:'Free', student:'Student', pro:'Pro · BWP 80', institution:'Institution' }
  const credits  = user && user.credits_total ? Math.round((user.credits_used/user.credits_total)*100) : 0

  return (
    <DashCtx.Provider value={{ user, groqKey, setGroqKey, ghostRef, algo, setAlgo, sessionWords, addWords, sessionDocs, addDoc }}>
      <div className="flex h-screen overflow-hidden bg-paper relative z-10">

        {/* Mobile overlay */}
        {sideOpen && (
          <div className="fixed inset-0 z-[199] bg-ink/50 backdrop-blur-sm md:hidden"
            onClick={() => setSideOpen(false)} />
        )}

        {/* ── SIDEBAR ── */}
        <aside className={`fixed md:relative z-[200] h-full flex flex-col
          w-[244px] bg-paper2 border-r-2 border-ink transition-transform duration-300
          ${sideOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

          {/* Logo */}
          <div className="flex items-center gap-2.5 px-4 py-4 border-b-2 border-ink shrink-0">
            <GhostRive ref={ghostRef} width={38} height={38} initialState="idle" className="shrink-0" />
            <div>
              <div className="font-display font-semibold text-[16px] text-ink leading-none">
                Ghost<span className="mark-hi">Write</span>
              </div>
              <div className="text-[9px] text-mute uppercase tracking-widest mt-1 font-mono">Invisible craft</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
            {[
              { section:'Tools', items: NAV.slice(0,5) },
              { section:'Insights', items: NAV.slice(5,7) },
              { section:'Exclusive', items: NAV.slice(7,8) },
              { section:'Account', items: NAV.slice(8) },
            ].map(({ section, items }) => (
              <div key={section} className="mb-4">
                <span className="block px-2 mb-1.5 eyebrow text-[9.5px] text-mute">{section}</span>
                {items.map(n => {
                  const active = pathname === n.href
                  return (
                    <Link key={n.href} href={n.href}
                      onClick={() => setSideOpen(false)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl2
                        text-[13.5px] font-medium transition-all relative border-2
                        ${active
                          ? 'bg-blue text-paper border-ink shadow-b-xs'
                          : 'text-ink2 hover:bg-paper3 border-transparent'}`}>
                      <n.Icon className="w-[18px] h-[18px] shrink-0" aria-hidden />
                      {n.label}
                      {n.label==='History' && sessionDocs > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono
                          bg-sun text-ink border-2 border-ink">{sessionDocs}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-2.5 py-3 border-t-2 border-ink shrink-0">
            <button onClick={signOut}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl2
                hover:bg-paper3 transition-all cursor-pointer mb-3">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center
                bg-coral border-2 border-ink font-mono font-bold text-[10px] text-white">{initials}</div>
              <div className="min-w-0 text-left">
                <div className="text-[12px] font-semibold text-ink truncate">{user?.name || 'User'}</div>
                <div className="text-[10.5px] text-mute truncate">{user?.email || ''}</div>
              </div>
            </button>
            <div className="rounded-xl2 p-3 bg-paper3 border-2 border-ink">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono font-bold text-[11px] text-ink">
                  {(planLbl as any)[user?.plan||'free']}
                </span>
                <button className="text-[10.5px] font-mono font-semibold text-blue hover:underline">
                  Upgrade →
                </button>
              </div>
              {(() => {
                const unlimited = user?.plan === 'pro' || user?.plan === 'institution'
                return (
                  <>
                    <div className="h-2 bg-paper border-2 border-ink rounded-full overflow-hidden">
                      <div className="h-full bg-mint" style={{ width:`${unlimited ? 100 : credits}%` }} />
                    </div>
                    <div className="text-[10.5px] text-mute mt-1.5 font-medium">
                      {unlimited
                        ? 'Unlimited usage'
                        : `${(user?.credits_used||0).toLocaleString()} / ${(user?.credits_total||0).toLocaleString()} credits`}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-paper">

          {/* Topbar */}
          <div className="h-[62px] shrink-0 flex items-center px-5 gap-3
            bg-paper border-b-2 border-ink z-10">
            <button aria-label="Open menu"
              className="md:hidden w-9 h-9 rounded-xl bg-paper3 border-2 border-ink
              flex items-center justify-center text-ink hover:bg-paper2 transition-colors"
              onClick={() => setSideOpen(true)}><Menu className="w-[18px] h-[18px]" aria-hidden /></button>

            <div className="flex-1 min-w-0 font-display font-semibold text-[18px] text-ink
              tracking-[-0.01em] truncate">
              {NAV.find(n=>n.href===pathname)?.label || 'Dashboard'}
            </div>

            {/* Algo switcher */}
            <div className="hidden md:flex gap-0.5 bg-paper2 rounded-full p-0.5 border-2 border-ink">
              {[['std','Standard'],['pro','Pro'],['hyp','Hyper']].map(([a,l]) => (
                <button key={a} onClick={() => setAlgo(a)}
                  className={`px-3.5 py-1.5 rounded-full font-mono font-semibold text-[11.5px]
                    transition-all ${algo===a
                      ? 'bg-ink text-paper'
                      : 'text-ink2 hover:text-ink'}`}>{l}</button>
              ))}
            </div>

            {/* API status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
              bg-paper3 border-2 border-ink font-mono text-[10.5px] text-ink2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                apiStatus==='ok'      ? 'bg-mint' :
                apiStatus==='loading' ? 'bg-sun animate-pulse' :
                apiStatus==='err'     ? 'bg-coral' : 'bg-mute'}`} />
              <span className="hidden sm:inline">
                {apiStatus==='ok'?'Connected':apiStatus==='loading'?'…':'No key'}
              </span>
            </div>

            <button onClick={() => setShowKeyModal(true)} aria-label="Connect Groq API key"
              className="w-9 h-9 rounded-xl bg-paper3 border-2 border-ink
                flex items-center justify-center text-ink hover:bg-paper2
                transition-all"><Key className="w-[16px] h-[16px]" aria-hidden /></button>
            <button aria-label="Notifications"
              className="hidden sm:flex w-9 h-9 rounded-xl bg-paper3 border-2 border-ink
              items-center justify-center text-ink hover:bg-paper2
              transition-all"><Bell className="w-[16px] h-[16px]" aria-hidden /></button>
            <div onClick={signOut}
              className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center
                bg-coral border-2 border-ink font-mono font-bold text-[11px] text-white
                cursor-pointer">{initials}</div>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {children}
          </div>
        </div>

        {/* ── GROQ KEY MODAL ── */}
        {showKeyModal && (
          <div className="fixed inset-0 z-[999] bg-ink/60 backdrop-blur-sm
            flex items-center justify-center p-5"
            onClick={() => setShowKeyModal(false)}>
            <div className="b-card rounded-xl3 p-8 w-full max-w-sm relative"
              style={{ boxShadow: 'var(--shadow-lg)' }}
              onClick={e => e.stopPropagation()}>
              <div className="text-center mb-5">
                <img src="/casper-logo.png" className="w-16 h-16 object-contain mx-auto" alt="" />
              </div>
              <h3 className="font-display font-semibold text-[20px] text-ink mb-2">Connect Groq — Free</h3>
              <p className="text-ink2 text-[13px] leading-relaxed mb-5">
                Get your free key at{' '}
                <a href="https://console.groq.com/keys" target="_blank"
                  className="text-blue font-semibold hover:underline">console.groq.com/keys</a>
                {' '}— sign up free, no credit card. fr.
              </p>
              <label className="block eyebrow text-[10px] text-mute mb-1.5">
                Groq API Key
              </label>
              <input type="password" placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-paper border-2 border-ink rounded-xl2 px-4 py-2.5
                  text-ink text-[13.5px] outline-none focus:bg-paper3 transition-colors mb-3"
                onKeyDown={e => { if(e.key==='Enter') saveKey((e.target as HTMLInputElement).value.trim()) }}
                id="groq-key-input" />
              <div className="flex gap-2">
                <button onClick={() => {
                  const v = (document.getElementById('groq-key-input') as HTMLInputElement).value.trim()
                  if (v) saveKey(v)
                }} className="btn btn-primary flex-1 py-2.5 text-[13.5px] rounded-full">
                  Connect →
                </button>
                <button onClick={() => setShowKeyModal(false)}
                  className="btn btn-ghost py-2.5 px-5 text-[13px] rounded-full border-2 border-ink">
                  Skip
                </button>
              </div>
              <p className="text-mute text-[11px] font-mono mt-3 leading-relaxed text-center">
                Stored only in your browser — never sent anywhere except Groq directly.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashCtx.Provider>
  )
}
