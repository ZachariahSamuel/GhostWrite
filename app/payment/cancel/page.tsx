'use client'
import Link from 'next/link'

export default function PaymentCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-paper">
      <div className="b-card max-w-sm w-full text-center rounded-xl3 p-8">
        <div className="w-16 h-16 rounded-xl2 bg-sun border-2 border-ink shadow-b-xs flex items-center justify-center text-3xl mx-auto mb-5">👋</div>
        <h2 className="font-display font-semibold text-[24px] text-ink mb-3 tracking-[-0.01em]">Payment cancelled</h2>
        <p className="text-ink2 text-[14px] leading-relaxed mb-6 font-medium">No charge was made. You can upgrade to Pro anytime from your settings. all good.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/dashboard/humanizer" className="btn btn-primary px-6 py-2.5 text-[13px] rounded-full">
            Continue with free →
          </Link>
          <Link href="/dashboard/settings" className="btn btn-ghost px-6 py-2.5 text-[13px] rounded-full border-2 border-ink">
            Upgrade later
          </Link>
        </div>
      </div>
    </div>
  )
}
