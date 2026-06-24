'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { GhostRiveHandle } from '@/components/ghost/GhostRive'

const GhostRive = dynamic(() => import('@/components/ghost/GhostRive'), { ssr:false })

function PaymentSuccessContent() {
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
    <div className="min-h-screen flex items-center justify-center px-6 bg-paper">
      <div className="b-card max-w-sm w-full text-center rounded-xl3 p-8">
        <div className="flex justify-center mb-6">
          <GhostRive ref={ghostRef} width={140} height={140}
            initialState="loading" />
        </div>
        {status === 'verifying' && (
          <>
            <h2 className="font-display font-semibold text-[24px] text-ink mb-3 tracking-[-0.01em]">Confirming payment…</h2>
            <p className="text-ink2 text-[14px] leading-relaxed font-medium">Verifying your payment with the provider. This takes just a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-xl2 bg-mint border-2 border-ink shadow-b-xs flex items-center justify-center text-3xl mx-auto mb-5">🎉</div>
            <h2 className="font-display font-semibold text-[26px] text-ink mb-3 tracking-[-0.01em]">Welcome to Pro!</h2>
            <p className="text-ink2 text-[14px] leading-relaxed mb-5 font-medium">
              Your GhostWrite Pro plan is now active. Unlimited words, all three humanizer tiers, Writing DNA, and the full Africa Suite. lock in.
            </p>
            <div className="px-4 py-3 rounded-xl2 bg-mint border-2 border-ink text-white text-[13px] font-semibold mb-6">
              ✓ Redirecting to your dashboard…
            </div>
            <Link href="/dashboard/humanizer" className="btn btn-primary inline-flex px-8 py-3 text-[14px] rounded-full">
              Go to dashboard →
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-xl2 bg-coral border-2 border-ink shadow-b-xs flex items-center justify-center text-3xl mx-auto mb-5">⚠️</div>
            <h2 className="font-display font-semibold text-[24px] text-ink mb-3 tracking-[-0.01em]">Payment not confirmed</h2>
            <p className="text-ink2 text-[14px] leading-relaxed mb-5 font-medium">
              {message || 'We could not verify your payment. If you were charged, please contact support.'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/dashboard/settings" className="btn btn-primary px-6 py-2.5 text-[13px] rounded-full">
                Try again
              </Link>
              <a href="mailto:support@ghostwrite.app" className="btn btn-ghost px-6 py-2.5 text-[13px] rounded-full border-2 border-ink">
                Contact support
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
