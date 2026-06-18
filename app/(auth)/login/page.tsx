'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import type { GhostRiveHandle } from '@/components/ghost/GhostRive'

const GhostRive = dynamic(() => import('@/components/ghost/GhostRive'), { ssr: false })

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const ghostRef   = useRef<GhostRiveHandle>(null)
  const [email, setEmail]   = useState('')
  const [pass,  setPass]    = useState('')
  const [err,   setErr]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setErr(decodeURIComponent(urlError))
  }, [searchParams])

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    ghostRef.current?.setState('loading')
    const sb = createClient()
    const { error } = await sb.auth.signInWithPassword({ email, password: pass })
    if (error) {
      setErr(error.message); setLoading(false)
      ghostRef.current?.setState('error')
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
      return
    }
    ghostRef.current?.setState('success')
    setTimeout(() => router.push('/dashboard/humanizer'), 900)
  }

  const oauthLogin = async (provider: 'google' | 'github') => {
    const sb = createClient()
    await sb.auth.signInWithOAuth({ provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/humanizer` } })
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* LEFT BRAND PANEL */}
      <div className="hidden md:flex flex-col justify-between p-14 relative overflow-hidden
        bg-gradient-to-br from-pp/15 via-pp/8 to-bg/5 border-r border-pp/20">
        {/* Ghost bg watermark */}
        <img src="/ghost-logo.png"
          className="absolute -bottom-10 -right-10 w-64 h-64 object-contain opacity-[0.07] pointer-events-none"
          style={{ animation:'ghostFloat 5s ease-in-out infinite' }} alt="" />
        <div>
          <Link href="/" className="flex items-center gap-2 mb-16 font-display font-black text-[18px]">
            <img src="/ghost-logo.png" className="w-9 h-9 object-contain drop-shadow-[0_4px_12px_rgba(124,92,252,0.4)]" alt="" />
            Ghost<span className="text-pp">Write</span>
          </Link>
          <h2 className="font-display font-black text-[clamp(26px,3vw,36px)] leading-[1.08]
            tracking-[-1px] text-sw mb-4">
            Invisible craft.<br />
            <span className="italic text-pp2">Visible results.</span>
          </h2>
          <p className="text-gg text-[14px] leading-relaxed mb-10 max-w-xs">
            GhostWrite transforms AI-generated drafts into authentically human prose —
            so undetectable, it feels like it was always yours.
          </p>
          {/* Ghost Rive — reacts to login state */}
          <div className="flex justify-center my-6">
            <GhostRive ref={ghostRef} width={180} height={180}
              logoSrc="/ghost-logo.png" riv="/ghostwrite.riv"
              initialState="idle" />
          </div>
          <div className="flex flex-col gap-3">
            {[['99.4%','Hyper bypass rate'],['1.8s','Avg. speed'],['6','Detectors']]
              .map(([v,l]) => (
              <div key={l} className="flex items-center gap-3 px-4 py-3 rounded-xl
                bg-vb/50 border border-white/8">
                <span className="font-mono font-semibold text-[16px] text-bg w-14 shrink-0">{v}</span>
                <span className="text-gg text-[12px] font-label">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
          bg-pp/10 border border-pp/25 text-pp2 text-xs font-label font-bold w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-bg animate-blink" />
          Built for African students &amp; professionals
        </div>
      </div>

      {/* RIGHT AUTH PANEL */}
      <div className="flex flex-col justify-center px-8 md:px-16 py-12 bg-vb2 relative">
        <div className="absolute top-0 left-0 right-0 h-px
          bg-gradient-to-r from-transparent via-pp/30 to-transparent" />
        <div className="max-w-sm mx-auto w-full">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 font-display font-black text-[17px] md:hidden">
            <img src="/ghost-logo.png" className="w-8 h-8 object-contain" alt="" />
            Ghost<span className="text-pp">Write</span>
          </Link>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white/4 rounded-full border border-white/6 mb-7 relative">
            <div className="absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)]
              bg-pp rounded-full shadow-[0_2px_10px_rgba(124,92,252,0.35)] transition-all" />
            <Link href="/login"
              className="flex-1 py-2 text-center font-label font-semibold text-[13px]
                text-white relative z-10">Sign in</Link>
            <Link href="/register"
              className="flex-1 py-2 text-center font-label font-semibold text-[13px]
                text-gg2 relative z-10 hover:text-sw transition-colors">Create account</Link>
          </div>

          {err && (
            <div className="px-4 py-3 rounded-xl bg-err/10 border border-err/25
              text-err text-[13px] font-label font-medium mb-4">{err}</div>
          )}

          {/* OAuth */}
          <div className="flex gap-2 mb-4">
            {(['google','github'] as const).map(p => (
              <button key={p} onClick={() => oauthLogin(p)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                  bg-white/5 border border-white/10 text-sw text-[12.5px] font-label font-semibold
                  hover:bg-white/10 transition-all">
                {p === 'google' ? '🇬' : '🐙'} {p[0].toUpperCase()+p.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 my-4 text-gg3 text-xs font-label">
            <div className="flex-1 h-px bg-white/6" />or sign in with email<div className="flex-1 h-px bg-white/6" />
          </div>

          <form onSubmit={doLogin} className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-label font-bold text-gg2
                uppercase tracking-widest mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                  text-sw text-[13.5px] font-body outline-none
                  focus:border-pp focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all"
                placeholder="you@example.com" required />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-label font-bold text-gg2 uppercase tracking-widest">Password</label>
                <span className="text-[11.5px] text-pp2 font-semibold cursor-pointer hover:text-pp font-label">Forgot?</span>
              </div>
              <div className="relative">
                <input type={showPass?'text':'password'} value={pass} onChange={e => setPass(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                    text-sw text-[13.5px] font-body outline-none pr-11
                    focus:border-pp focus:shadow-[0_0_0_3px_rgba(124,92,252,0.12)] transition-all"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gg2 hover:text-sw transition-colors text-sm">
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="mt-2 w-full py-3 rounded-full font-label font-bold text-[14px] text-white
                bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]
                disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden btn-shimmer">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-gg text-[12.5px] font-label mt-5">
            No account?{' '}
            <Link href="/register" className="text-pp2 font-semibold hover:text-pp">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
