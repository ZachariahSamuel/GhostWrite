'use client'
import { useState, useEffect } from 'react'
import { useDash } from '../layout'

type Payment = { id:string; amount:number; currency:string; status:string; created_at:string }

export default function SettingsPage() {
  const { user, groqKey } = useDash()
  const [prefs, setPrefs] = useState({
    dna:true, lowBw:false, autoDetect:true, africa:true, emails:false
  })
  const [payments, setPayments] = useState<Payment[]>([])
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeErr, setUpgradeErr] = useState('')

  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]:!p[k] }))

  useEffect(() => {
    fetch('/api/payment/history').then(r => r.ok ? r.json() : { payments:[] })
      .then(d => setPayments(d.payments || []))
      .catch(() => {})
  }, [])

  const isPro = user?.plan === 'pro'

  const upgrade = async () => {
    setUpgrading(true); setUpgradeErr('')
    try {
      const res = await fetch('/api/payment/create', { method:'POST' })
      const data = await res.json()
      if (!res.ok) { setUpgradeErr(data.error || 'Could not start payment'); setUpgrading(false); return }
      window.location.href = data.url
    } catch(e: any) {
      setUpgradeErr(e.message || 'Network error'); setUpgrading(false)
    }
  }

  return (
    <div className="animate-fade-up max-w-2xl">

      {/* ── Plan / Billing ── */}
      <div className="glass rounded-xl overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6">
          <span className="font-label font-bold text-[10px] text-gg2 uppercase tracking-widest">Plan &amp; Billing</span>
          <span className={`px-3 py-1 rounded-full font-label font-bold text-[11px] border
            ${isPro ? 'bg-bg/10 border-bg/25 text-bg' : 'bg-white/5 border-white/8 text-gg'}`}>
            {isPro ? '🚀 Pro · BWP 80/mo' : '⚡ Free'}
          </span>
        </div>
        <div className="p-5">
          {isPro ? (
            <>
              <div className="font-display font-bold text-[15px] text-sw mb-1">You're on Pro</div>
              <div className="text-gg text-[12px] mb-4">
                Unlimited words · Hyper mode · Writing DNA · Africa Suite · DOCX/PDF export
              </div>
              <div className="px-4 py-3 rounded-xl bg-bg/8 border border-bg/20 text-[12.5px] font-label text-bg">
                ✓ Unlimited usage active
              </div>
            </>
          ) : (
            <>
              <div className="font-display font-bold text-[15px] text-sw mb-1">Upgrade to Pro</div>
              <div className="text-gg text-[12px] mb-4 leading-relaxed">
                Unlock unlimited words, all 3 humanizer tiers including Hyper ⚡, Writing DNA,
                full Citation Lab, Africa Suite, and DOCX/PDF export — for BWP 80/month.
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl
                bg-pp/8 border border-pp/25 mb-4">
                <div>
                  <div className="font-mono font-semibold text-[24px] text-pp2 leading-none">BWP 80</div>
                  <div className="text-[11px] text-gg font-label mt-1">per month · cancel anytime</div>
                </div>
                <button onClick={upgrade} disabled={upgrading}
                  className="px-6 py-2.5 rounded-full font-label font-bold text-[13px] text-white
                    bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]
                    disabled:opacity-50 relative overflow-hidden btn-shimmer">
                  {upgrading
                    ? <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin"/>
                        Redirecting…
                      </span>
                    : 'Upgrade now →'}
                </button>
              </div>
              {upgradeErr && (
                <div className="px-4 py-3 rounded-xl bg-err/10 border border-err/25
                  text-err text-[12.5px] font-label">{upgradeErr}</div>
              )}
              <div className="text-[11px] text-gg3 font-label leading-relaxed">
                Payment via DPO Pay (Orange Money, MyZaka, Visa/Mastercard) or Paystack —
                depending on your country. You'll be redirected to a secure payment page.
              </div>
            </>
          )}

          {payments.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/6">
              <div className="text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-3">
                Payment History
              </div>
              <div className="flex flex-col gap-2">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-[12px] font-label">
                    <span className="text-gg">{new Date(p.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
                    <span className="text-sw">{p.currency} {p.amount}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border
                      ${p.status==='complete' ? 'bg-bg/10 border-bg/25 text-bg'
                        : p.status==='failed' ? 'bg-err/10 border-err/25 text-err'
                        : 'bg-wa/10 border-wa/25 text-wa'}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── API Config ── */}
      <div className="glass rounded-xl overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6">
          <span className="font-label font-bold text-[10px] text-gg2 uppercase tracking-widest">Groq API</span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/4 border border-white/8
            font-mono text-[10.5px] text-gg">
            <span className={`w-1.5 h-1.5 rounded-full ${groqKey?'bg-bg shadow-[0_0_6px_rgba(16,185,129,0.5)]':'bg-gg3'}`} />
            {groqKey ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <div className="p-5">
          <div className="font-display font-bold text-[15px] text-sw mb-1">AI Connection</div>
          <div className="text-gg text-[12px] mb-4">Connect your free Groq key to unlock all GhostWrite tools.</div>
          {[
            { label:'Groq API Key', desc:groqKey?'gsk_••••••••••••••••• (configured)':'Not configured — click 🔑 to add' },
            { label:'Active Model', desc:'llama-3.3-70b-versatile via Groq free tier' },
            { label:'Rate Limit',   desc:'30 requests/min · 14,400/day on Groq free' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-3
              border-b border-white/6 last:border-0 last:pb-0 gap-4">
              <div>
                <div className="text-[13px] font-medium text-sw mb-0.5">{r.label}</div>
                <div className="text-[11.5px] text-gg">{r.desc}</div>
              </div>
              {r.label==='Groq API Key' && (
                <span className={`px-2.5 py-1 rounded-full font-label font-semibold text-[11px] border
                  ${groqKey?'bg-bg/10 border-bg/25 text-bg':'bg-white/5 border-white/8 text-gg'}`}>
                  {groqKey?'Active':'None'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Profile ── */}
      <div className="glass rounded-xl overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6">
          <span className="font-label font-bold text-[10px] text-gg2 uppercase tracking-widest">Profile</span>
          <button className="px-4 py-1.5 rounded-full font-label font-bold text-[12px] text-white
            bg-pp hover:bg-pp2 transition-all shadow-[0_3px_10px_rgba(124,92,252,0.28)]">Save</button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pp to-pp3
              flex items-center justify-center font-label font-bold text-[20px] text-white
              shadow-[0_4px_16px_rgba(124,92,252,0.30)]">
              {user?.name?.split(' ').map((p:string)=>p[0]).join('').toUpperCase().slice(0,2)||'GW'}
            </div>
            <button className="px-4 py-2 rounded-full font-label font-semibold text-[12px]
              text-gg bg-white/5 border border-white/8 hover:bg-white/10 hover:text-sw transition-all">
              Change photo
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[['First name','Zach'],['Last name','Molefe']].map(([l,v]) => (
              <div key={l}>
                <label className="block text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-1">{l}</label>
                <input defaultValue={v}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                    text-sw text-[13px] outline-none focus:border-pp transition-all" />
              </div>
            ))}
          </div>
          <div className="mb-3">
            <label className="block text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-1">Email</label>
            <input defaultValue={user?.email||''}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                text-sw text-[13px] outline-none focus:border-pp transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-1">Country</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
              text-sw text-[13px] outline-none focus:border-pp transition-all cursor-pointer">
              {[['BW','🇧🇼 Botswana'],['ZA','🇿🇦 South Africa'],['NA','🇳🇦 Namibia']].map(([v,l])=>(
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Preferences ── */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/6">
          <span className="font-label font-bold text-[10px] text-gg2 uppercase tracking-widest">Preferences</span>
        </div>
        <div className="p-5">
          {[
            ['dna',       'Writing DNA',              'Apply personal voice fingerprint to all outputs'],
            ['lowBw',     'Low-Bandwidth Mode',        'Optimise for 3G — 60% less data usage'],
            ['autoDetect','Auto bypass check',         'Run detector automatically after each job'],
            ['africa',    'Africa Suite',              'Enable African language support and regional features'],
            ['emails',    'Email Notifications',       'Credit alerts and feature updates'],
          ].map(([k,n,d]) => (
            <div key={k} className="flex items-center justify-between py-3.5
              border-b border-white/6 last:border-0 last:pb-0 gap-4">
              <div>
                <div className="text-[13px] font-medium text-sw mb-0.5">{n}</div>
                <div className="text-[11.5px] text-gg">{d}</div>
              </div>
              <button onClick={() => toggle(k as keyof typeof prefs)}
                className={`relative shrink-0 border-none transition-all rounded-full
                  ${(prefs as any)[k] ? 'bg-pp' : 'bg-white/10'}`}
                style={{ width:'40px', height:'22px' }}>
                <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white
                  shadow-[0_1px_4px_rgba(0,0,0,0.4)] transition-all
                  ${(prefs as any)[k] ? 'left-[19px]' : 'left-[3px]'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
