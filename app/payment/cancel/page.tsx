'use client'
import Link from 'next/link'

export default function PaymentCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-vb">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-5">👋</div>
        <h2 className="font-display font-black text-[24px] text-sw mb-3 tracking-[-0.5px]">Payment cancelled</h2>
        <p className="text-gg text-[14px] leading-relaxed mb-6">No charge was made. You can upgrade to Pro anytime from your settings.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/dashboard/humanizer" className="px-6 py-2.5 rounded-full font-label font-bold text-[13px]
            text-white bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]">
            Continue with free →
          </Link>
          <Link href="/dashboard/settings" className="px-6 py-2.5 rounded-full font-label font-semibold text-[13px]
            text-gg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            Upgrade later
          </Link>
        </div>
      </div>
    </div>
  )
}
