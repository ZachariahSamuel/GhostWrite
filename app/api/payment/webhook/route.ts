import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { tierMeta, type TierId } from '@/lib/payment'

const monthsForTier = (tier?: string | null) => tierMeta(((tier || 'monthly') as TierId)).months

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Verify a DPO transaction token directly against DPO before trusting a webhook.
// A webhook POST is unauthenticated, so we must independently confirm the payment.
async function verifyDpoToken(token: string): Promise<boolean> {
  const companyToken = process.env.DPO_COMPANY_TOKEN
  if (!companyToken) return false
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${companyToken}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${token}</TransactionToken>
</API3G>`
  const apiUrl = process.env.DPO_API_URL || 'https://secure.3gdirectpay.com/API/v6/'
  try {
    const res  = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/xml' }, body: xml, signal: AbortSignal.timeout(8000) })
    const text = await res.text()
    return text.match(/<Result>(\d+)<\/Result>/)?.[1] === '000'
  } catch {
    return false
  }
}

async function activatePro(userId: string, sb: ReturnType<typeof getAdminSupabase>, months: number) {
  const nextBilling = new Date()
  nextBilling.setMonth(nextBilling.getMonth() + months)
  await sb.from('profiles').update({
    plan:'pro', credits_total:999999, credits_used:0,
    next_billing:nextBilling.toISOString(), updated_at:new Date().toISOString(),
  }).eq('id', userId)
}

export async function POST(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') || 'paystack'
  const body     = await req.text()
  const sb       = getAdminSupabase()

  if (provider === 'paystack') {
    // Paystack signs the raw body with HMAC-SHA512 using your SECRET KEY.
    const secret    = process.env.PAYSTACK_SECRET_KEY || ''
    const signature = req.headers.get('x-paystack-signature') || ''
    if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    const expected  = crypto.createHmac('sha512', secret).update(body).digest('hex')
    if (signature !== expected) return NextResponse.json({ error:'Invalid signature' }, { status:401 })

    const event = JSON.parse(body)
    if (event.event !== 'charge.success') return NextResponse.json({ received:true })

    const { reference, metadata } = event.data
    // Resolve the user + tier from OUR record (signature already proves authenticity).
    const { data: payment } = await sb.from('payments')
      .select('user_id, tier, status').eq('reference', reference).single()
    const userId = payment?.user_id
      || metadata?.userId
      || metadata?.custom_fields?.find((f:any)=>f.variable_name==='user_id')?.value
    if (!userId) return NextResponse.json({ error:'No user for payment' }, { status:400 })
    if (payment?.status === 'complete') return NextResponse.json({ received:true, already:true })

    await sb.from('payments').update({ status:'complete', completed_at:new Date().toISOString() }).eq('reference', reference)
    await activatePro(userId, sb, monthsForTier(payment?.tier))
    return NextResponse.json({ received:true })
  }

  if (provider === 'dpo') {
    const params = new URLSearchParams(body)
    const token  = params.get('TransactionToken') || ''
    if (!token) return NextResponse.json({ error: 'Missing transaction token' }, { status: 400 })

    // 1) Resolve the owning user + tier from OUR record, never from the webhook payload.
    const { data: payment } = await sb.from('payments')
      .select('user_id, tier, status').eq('reference', token).single()
    if (!payment) return NextResponse.json({ error: 'Unknown transaction' }, { status: 404 })
    if (payment.status === 'complete') return NextResponse.json({ received: true, already: true })

    // 2) Independently confirm the payment really succeeded at DPO.
    const ok = await verifyDpoToken(token)
    if (!ok) {
      await sb.from('payments').update({ status: 'failed' }).eq('reference', token)
      return NextResponse.json({ error: 'Payment not confirmed by DPO' }, { status: 402 })
    }

    await sb.from('payments').update({ status: 'complete', completed_at: new Date().toISOString() }).eq('reference', token)
    await activatePro(payment.user_id, sb, monthsForTier(payment.tier))
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ error:'Unknown provider' }, { status:400 })
}

export async function GET() { return NextResponse.json({ status:'ok' }) }
