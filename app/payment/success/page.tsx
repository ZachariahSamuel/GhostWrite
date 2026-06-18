'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { GhostRiveHandle } from '@/components/ghost/GhostRive'

const GhostRive = dynamic(() => import('@/components/ghost/GhostRive'), { ssr:false })

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const router        = useRouter()
  const ghostRef       = useRef<GhostRiveHandle>(null)
  const [status, setStatus] = useState<'verifying'|'success'|'error'>('verifying')
  const [message,setMessage] = useState('')

  useEffect(() => {
    const verify = async () => {
      const token     = searchParams.get('TransactionToken')
      const reference  = searchParams.get('reference') || searchParams.get('trxref')
      const provider   = token ? 'dpo' : 'paystack'
      const ref        = token || reference

      if (!ref) {
        setStatus('error'); setMessage('No payment reference found. Please contact support.')
        ghostRef.current?.setState('error'); return
      }

      ghostRef.current?.setState('loading')
      try {
        const res = await fetch('/api/payment/verify', {
          method:'POST', headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ reference:ref, provider }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          setStatus('success'); ghostRef.current?.setState('success')
          setTimeout(() => router.push('/dashboard/humanizer'), 3000)
        } else {
          setStatus('error'); setMessage(data.error || 'Payment could not be verified.')
          ghostRef.current?.setState('error')
        }
      } catch {
        setStatus('error'); setMessage('Network error during verification. Please contact support.')
        ghostRef.current?.setState('error')
      }
    }
    verify()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-vb">
      <div className="max-w-sm w-full text-center">
        <div className="flex justify-center mb-6">
          <GhostRive ref={ghostRef} width={140} height={140}
            logoSrc="/ghost-logo.png" riv="/ghostwrite.riv" initialState="loading" />
        </div>
        {status === 'verifying' && (
          <>
            <h2 className="font-display font-black text-[24px] text-sw mb-3 tracking-[-0.5px]">Confirming payment…</h2>
            <p className="text-gg text-[14px] leading-relaxed">Verifying your payment with the provider. This takes just a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-bg/10 border border-bg/25 flex items-center justify-center text-3xl mx-auto mb-5">🎉</div>
            <h2 className="font-display font-black text-[26px] text-sw mb-3 tracking-[-0.5px]">Welcome to Pro!</h2>
            <p className="text-gg text-[14px] leading-relaxed mb-5">
              Your GhostWrite Pro plan is now active. Unlimited words, all three humanizer tiers, Writing DNA, and the full Africa Suite.
            </p>
            <div className="px-4 py-3 rounded-xl bg-bg/10 border border-bg/25 text-bg text-[13px] font-label font-semibold mb-6">
              ✓ Redirecting to your dashboard…
            </div>
            <Link href="/dashboard/humanizer" className="inline-flex px-8 py-3 rounded-full font-label font-bold text-[14px]
              text-white bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]">
              Go to dashboard →
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-err/10 border border-err/25 flex items-center justify-center text-3xl mx-auto mb-5">⚠️</div>
            <h2 className="font-display font-black text-[24px] text-sw mb-3 tracking-[-0.5px]">Payment not confirmed</h2>
            <p className="text-gg text-[14px] leading-relaxed mb-5">
              {message || 'We could not verify your payment. If you were charged, please contact support.'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/dashboard/settings" className="px-6 py-2.5 rounded-full font-label font-bold text-[13px] text-white bg-pp hover:bg-pp2 transition-all">
                Try again
              </Link>
              <a href="mailto:support@ghostwrite.app" className="px-6 py-2.5 rounded-full font-label font-semibold text-[13px]
                text-gg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                Contact support
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
