'use client'
import { useState, useEffect } from 'react'
import { Rocket, Flash, Check } from 'iconoir-react'
import { useDash } from '../layout'
import { TIERS, formatPrice, tierMeta, MARKETS, getMarket, type TierId } from '@/lib/payment'

type Payment = { id:string; amount:number; currency:string; status:string; created_at:string }

export default function SettingsPage() {
  const { user, groqKey } = useDash()
  const [prefs, setPrefs] = useState({
    dna:true, lowBw:false, autoDetect:true, africa:true, emails:false
  })
  const [payments, setPayments] = useState<Payment[]>([])
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeErr, setUpgradeErr] = useState('')
  const [tier, setTier] = useState<TierId>('semester')

  const country = user?.country || 'BW'
  const rails   = MARKETS[getMarket(country)].rails
  const studentTiers = TIERS.filter(t => t.audience === 'student')

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
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok) { setUpgradeErr(data.error || 'Could not start payment'); setUpgrading(false); return }
      window.location.href = data.url
    } catch(e: any) {
      setUpgradeErr(e.message || 'Network error'); setUpgrading(false)
    }
  }

  const inputCls = "w-full bg-paper border-2 border-ink rounded-xl2 px-3 py-2.5 text-ink text-[13px] outline-none focus:bg-paper3 transition-colors"
  const labelCls = "block eyebrow text-[10px] text-mute mb-1"
  const sectionHd = "eyebrow text-[10px] text-coral"

  return (
    <div className="animate-fade-up max-w-2xl mx-auto">

      {/* ── Plan / Billing ── */}
      <div className="b-card rounded-xl3 overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-ink">
          <span className={sectionHd}>Plan &amp; Billing</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold text-[11px] border-2 border-ink text-white"
            style={{ background: isPro ? 'var(--mint)' : 'var(--paper)', color: isPro ? '#fff' : '#1A1A17' }}>
            {isPro ? <><Rocket className="w-3 h-3" aria-hidden /> Pro</> : <><Flash className="w-3 h-3" aria-hidden /> Free</>}
          </span>
        </div>
        <div className="p-5">
          {isPro ? (
            <>
              <div className="font-display font-semibold text-[15px] text-ink mb-1">You're on Pro</div>
              <div className="text-ink2 text-[12px] mb-4 font-medium">
                Unlimited words · Hyper mode · Writing DNA · Citation Lab · DOCX/PDF export
              </div>
              <div className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl2 bg-mint border-2 border-ink text-[12.5px] font-semibold text-white">
                <Check className="w-4 h-4" color="#fff" aria-hidden /> Unlimited usage active
              </div>
            </>
          ) : (
            <>
              <div className="font-display font-semibold text-[15px] text-ink mb-1">Go unlimited</div>
              <div className="text-ink2 text-[12px] mb-4 leading-relaxed font-medium">
                Unlimited words, all three humanizer modes, Writing DNA, the full Citation Lab,
                and DOCX/PDF export. Pick what suits you — prices in your local currency. lowkey worth it.
              </div>

              {/* Tier picker */}
              <div className="flex flex-col gap-2 mb-4">
                {studentTiers.map(t => {
                  const active = tier === t.id
                  return (
                    <button key={t.id} onClick={() => setTier(t.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl2 border-2 border-ink text-left transition-all
                        ${active ? 'bg-blue text-white shadow-b-xs' : 'bg-paper3 text-ink hover:bg-paper2'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                          ${active ? 'border-white bg-white' : 'border-ink'}`}>
                          {active && <Check className="w-3 h-3" color="#2B44FF" aria-hidden />}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-semibold text-[13px]">{t.name}</span>
                            {t.popular && (
                              <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-mono font-bold
                                bg-sun text-ink border-2 border-ink uppercase tracking-wide">Popular</span>
                            )}
                          </div>
                          <div className={`text-[11px] font-medium ${active ? 'text-white/80' : 'text-ink2'}`}>{t.blurb}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-semibold text-[18px] leading-none">{formatPrice(country, t.id)}</div>
                        <div className={`text-[10px] mt-0.5 ${active ? 'text-white/70' : 'text-mute'}`}>{t.cadence}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <button onClick={upgrade} disabled={upgrading}
                className="btn btn-coral w-full px-6 py-3 text-[13.5px] rounded-full disabled:opacity-50 mb-3">
                {upgrading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin"/>
                      Redirecting…
                    </span>
                  : <>Continue — {formatPrice(country, tier)} {tierMeta(tier).cadence} →</>}
              </button>

              {upgradeErr && (
                <div className="px-4 py-3 rounded-xl2 bg-coral/15 border-2 border-ink text-ink text-[12.5px] font-medium mb-3">{upgradeErr}</div>
              )}
              <div className="text-[11px] text-mute font-mono leading-relaxed">
                Pay with {rails} — you'll be redirected to a secure checkout. Cancel anytime.
              </div>
            </>
          )}

          {payments.length > 0 && (
            <div className="mt-5 pt-4 border-t-2 border-ink">
              <div className="eyebrow text-[10px] text-mute mb-3">Payment History</div>
              <div className="flex flex-col gap-2">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-[12px] font-medium">
                    <span className="text-ink2">{new Date(p.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
                    <span className="text-ink font-mono">{p.currency} {p.amount}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border-2 border-ink text-white"
                      style={{ background: p.status==='complete' ? 'var(--mint)' : p.status==='failed' ? 'var(--coral)' : 'var(--sun)',
                               color: p.status==='pending' ? '#1A1A17' : '#fff' }}>
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
      <div className="b-card rounded-xl3 overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-ink">
          <span className={sectionHd}>Groq API</span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper border-2 border-ink font-mono text-[10.5px] text-ink2">
            <span className={`w-1.5 h-1.5 rounded-full ${groqKey?'bg-mint':'bg-mute'}`} />
            {groqKey ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <div className="p-5">
          <div className="font-display font-semibold text-[15px] text-ink mb-1">AI Connection</div>
          <div className="text-ink2 text-[12px] mb-4 font-medium">Connect your free Groq key to unlock all GhostWrite tools.</div>
          {[
            { label:'Groq API Key', desc:groqKey?'gsk_••••••••••••••••• (configured)':'Not configured — use the key icon in the top bar to add' },
            { label:'Active Model', desc:'llama-3.3-70b-versatile via Groq free tier' },
            { label:'Rate Limit',   desc:'30 requests/min · 14,400/day on Groq free' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-3 border-b-2 border-ink/10 last:border-0 last:pb-0 gap-4">
              <div>
                <div className="text-[13px] font-semibold text-ink mb-0.5">{r.label}</div>
                <div className="text-[11.5px] text-ink2 font-medium">{r.desc}</div>
              </div>
              {r.label==='Groq API Key' && (
                <span className="px-2.5 py-1 rounded-full font-mono font-semibold text-[11px] border-2 border-ink text-white"
                  style={{ background: groqKey ? 'var(--mint)' : 'var(--paper)', color: groqKey ? '#fff' : '#1A1A17' }}>
                  {groqKey?'Active':'None'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Profile ── */}
      <div className="b-card rounded-xl3 overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-ink">
          <span className={sectionHd}>Profile</span>
          <button className="btn btn-primary px-4 py-1.5 text-[12px] rounded-full">Save</button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-xl2 bg-coral border-2 border-ink shadow-b-xs
              flex items-center justify-center font-mono font-bold text-[20px] text-white">
              {user?.name?.split(' ').map((p:string)=>p[0]).join('').toUpperCase().slice(0,2)||'GW'}
            </div>
            <button className="btn btn-ghost px-4 py-2 text-[12px] rounded-full border-2 border-ink">
              Change photo
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[['First name','Zach'],['Last name','Molefe']].map(([l,v]) => (
              <div key={l}>
                <label className={labelCls}>{l}</label>
                <input defaultValue={v} className={inputCls} />
              </div>
            ))}
          </div>
          <div className="mb-3">
            <label className={labelCls}>Email</label>
            <input defaultValue={user?.email||''} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <select className={inputCls + ' cursor-pointer'}>
              {[['BW','🇧🇼 Botswana'],['ZA','🇿🇦 South Africa'],['NA','🇳🇦 Namibia']].map(([v,l])=>(
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Preferences ── */}
      <div className="b-card rounded-xl3 overflow-hidden">
        <div className="px-5 py-3.5 border-b-2 border-ink">
          <span className={sectionHd}>Preferences</span>
        </div>
        <div className="p-5">
          {[
            ['dna',       'Writing DNA',              'Apply personal voice fingerprint to all outputs'],
            ['lowBw',     'Low-Bandwidth Mode',        'Optimise for 3G — 60% less data usage'],
            ['autoDetect','Auto bypass check',         'Run detector automatically after each job'],
            ['africa',    'Africa Suite',              'Enable African language support and regional features'],
            ['emails',    'Email Notifications',       'Credit alerts and feature updates'],
          ].map(([k,n,d]) => (
            <div key={k} className="flex items-center justify-between py-3.5 border-b-2 border-ink/10 last:border-0 last:pb-0 gap-4">
              <div>
                <div className="text-[13px] font-semibold text-ink mb-0.5">{n}</div>
                <div className="text-[11.5px] text-ink2 font-medium">{d}</div>
              </div>
              <button onClick={() => toggle(k as keyof typeof prefs)}
                aria-pressed={(prefs as any)[k]}
                className={`relative shrink-0 rounded-full border-2 border-ink transition-all
                  ${(prefs as any)[k] ? 'bg-mint' : 'bg-paper'}`}
                style={{ width:'42px', height:'24px' }}>
                <span className={`absolute top-[2px] w-4 h-4 rounded-full bg-ink transition-all
                  ${(prefs as any)[k] ? 'left-[21px]' : 'left-[2px]'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
