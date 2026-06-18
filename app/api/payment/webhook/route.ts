import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function activatePro(userId: string, sb: ReturnType<typeof getAdminSupabase>) {
  const nextBilling = new Date()
  nextBilling.setMonth(nextBilling.getMonth() + 1)
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
    const secret    = process.env.PAYMENT_WEBHOOK_SECRET || ''
    const signature = req.headers.get('x-paystack-signature') || ''
    const expected  = crypto.createHmac('sha512', secret).update(body).digest('hex')
    if (signature !== expected) return NextResponse.json({ error:'Invalid signature' }, { status:401 })

    const event = JSON.parse(body)
    if (event.event !== 'charge.success') return NextResponse.json({ received:true })

    const { reference, metadata } = event.data
    const userId = metadata?.userId || metadata?.custom_fields?.find((f:any)=>f.variable_name==='user_id')?.value
    if (!userId) return NextResponse.json({ error:'No userId in metadata' }, { status:400 })

    await sb.from('payments').update({ status:'complete', completed_at:new Date().toISOString() }).eq('reference', reference)
    await activatePro(userId, sb)
    return NextResponse.json({ received:true })
  }

  if (provider === 'dpo') {
    const params  = new URLSearchParams(body)
    const token   = params.get('TransactionToken') || ''
    const userId  = params.get('UserField1') || ''
    if (!token || !userId) return NextResponse.json({ error:'Missing params' }, { status:400 })

    await sb.from('payments').update({ status:'complete', completed_at:new Date().toISOString() }).eq('reference', token)
    await activatePro(userId, sb)
    return NextResponse.json({ received:true })
  }

  return NextResponse.json({ error:'Unknown provider' }, { status:400 })
}

export async function GET() { return NextResponse.json({ status:'ok' }) }
