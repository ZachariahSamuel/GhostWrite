import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { tierMeta, type TierId } from '@/lib/payment'

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      get(n)      { return cookieStore.get(n)?.value },
      set(n,v,o)  { try { cookieStore.set({ name:n, value:v, ...o }) } catch {} },
      remove(n,o) { try { cookieStore.set({ name:n, value:'',  ...o }) } catch {} },
    }}
  )
}

async function verifyDpo(token: string): Promise<boolean> {
  const companyToken = process.env.DPO_COMPANY_TOKEN
  if (!companyToken) return false
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${companyToken}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${token}</TransactionToken>
</API3G>`
  const apiUrl = process.env.DPO_API_URL || 'https://secure.3gdirectpay.com/API/v6/'
  const res  = await fetch(apiUrl, { method:'POST', headers:{ 'Content-Type':'application/xml' }, body:xml })
  const text = await res.text()
  return text.match(/<Result>(\d+)<\/Result>/)?.[1] === '000'
}

async function verifyPaystack(reference: string): Promise<boolean> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return false
  const res  = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers:{ 'Authorization':`Bearer ${secretKey}` },
  })
  const data = await res.json()
  return data.status && data.data?.status === 'success'
}

async function activatePro(userId: string, sb: any, months: number) {
  const nextBilling = new Date()
  nextBilling.setMonth(nextBilling.getMonth() + months)
  await sb.from('profiles').update({
    plan:'pro', credits_total:999999, credits_used:0,
    next_billing:nextBilling.toISOString(), updated_at:new Date().toISOString(),
  }).eq('id', userId)
}

export async function POST(req: NextRequest) {
  const sb = getSupabase()
  const { data:{ user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  const body = await req.json().catch(() => null)
  const { reference, provider } = body || {}
  if (!reference || !provider) return NextResponse.json({ error:'Missing reference or provider' }, { status:400 })

  const { data: payment } = await sb.from('payments').select('*')
    .eq('reference', reference).eq('user_id', user.id).single()

  if (!payment) return NextResponse.json({ error:'Payment record not found' }, { status:404 })
  if (payment.status === 'complete') return NextResponse.json({ success:true, already:true })

  let verified = false
  try {
    if (provider === 'dpo')      verified = await verifyDpo(reference)
    if (provider === 'paystack') verified = await verifyPaystack(reference)
  } catch(e: any) {
    return NextResponse.json({ error:`Verification error: ${e.message}` }, { status:500 })
  }

  if (!verified) {
    await sb.from('payments').update({ status:'failed' }).eq('reference', reference)
    return NextResponse.json({ error:'Payment not confirmed by provider.' }, { status:402 })
  }

  await sb.from('payments').update({ status:'complete', completed_at:new Date().toISOString() }).eq('reference', reference)
  const months = tierMeta(((payment.tier || 'monthly') as TierId)).months
  await activatePro(user.id, sb, months)

  return NextResponse.json({ success:true, plan:'pro', tier: payment.tier || 'monthly', months })
}
