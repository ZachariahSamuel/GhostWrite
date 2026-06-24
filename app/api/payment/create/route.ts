import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPrice, getCurrency, getProvider, tierMeta, PLAN_NAME, type TierId } from '@/lib/payment'

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

async function createDpoPayment(opts: {
  amount:number; currency:string; email:string; description:string
  firstName:string; lastName:string; userId:string; appUrl:string
}): Promise<{ url:string; token:string }> {
  const companyToken = process.env.DPO_COMPANY_TOKEN
  if (!companyToken) throw new Error('DPO_COMPANY_TOKEN not configured')
  const ref = `GW-${opts.userId.slice(0,8)}-${Date.now()}`
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${companyToken}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${opts.amount}.00</PaymentAmount>
    <PaymentCurrency>${opts.currency}</PaymentCurrency>
    <CompanyRef>${ref}</CompanyRef>
    <RedirectURL>${opts.appUrl}/payment/success</RedirectURL>
    <BackURL>${opts.appUrl}/payment/cancel</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>30</PTL>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>5525</ServiceType>
      <ServiceDescription>${opts.description}</ServiceDescription>
      <ServiceDate>${new Date().toISOString().split('T')[0]} 00:00</ServiceDate>
    </Service>
  </Services>
  <AdditionalInformation>
    <UserFieldName>userId</UserFieldName>
    <UserFieldValue>${opts.userId}</UserFieldValue>
  </AdditionalInformation>
  <Customer>
    <CustomerEmail>${opts.email}</CustomerEmail>
    <CustomerFirstName>${opts.firstName}</CustomerFirstName>
    <CustomerLastName>${opts.lastName}</CustomerLastName>
    <CustomerCountry>BW</CustomerCountry>
  </Customer>
</API3G>`
  const apiUrl = process.env.DPO_API_URL || 'https://secure.3gdirectpay.com/API/v6/'
  const res = await fetch(apiUrl, { method:'POST', headers:{ 'Content-Type':'application/xml' }, body:xml })
  const text   = await res.text()
  const result = text.match(/<Result>(\d+)<\/Result>/)?.[1]
  const token  = text.match(/<TransToken>([^<]+)<\/TransToken>/)?.[1]
  if (result !== '000' || !token) {
    const msg = text.match(/<ResultExplanation>([^<]+)<\/ResultExplanation>/)?.[1]
    throw new Error(msg || 'DPO payment creation failed')
  }
  return { url:`https://secure.3gdirectpay.com/payv2.php?ID=${token}`, token }
}

async function createPaystackPayment(opts: {
  amount:number; currency:string; email:string; userId:string; appUrl:string
}): Promise<{ url:string; reference:string }> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY not configured')
  const reference = `GW-${opts.userId.slice(0,8)}-${Date.now()}`
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${secretKey}`, 'Content-Type':'application/json' },
    body: JSON.stringify({
      email:opts.email, amount:opts.amount*100, currency:opts.currency, reference,
      callback_url:`${opts.appUrl}/payment/success`,
      metadata:{ userId:opts.userId, plan:'pro',
        custom_fields:[{ display_name:'User ID', variable_name:'user_id', value:opts.userId }] },
    }),
  })
  const data = await res.json()
  if (!data.status) throw new Error(data.message || 'Paystack init failed')
  return { url:data.data.authorization_url, reference:data.data.reference }
}

export async function POST(req: NextRequest) {
  const sb = getSupabase()
  const { data:{ user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  const { data: profile } = await sb.from('profiles')
    .select('full_name, country, plan').eq('id', user.id).single()

  if (profile?.plan === 'pro') {
    return NextResponse.json({ error:'Already on Pro plan.' }, { status:400 })
  }

  const body = await req.json().catch(() => ({} as any))
  const VALID: TierId[] = ['monthly', 'semester', 'annual', 'pro']
  const tier: TierId = VALID.includes(body?.tier) ? body.tier : 'monthly'

  const country   = profile?.country || 'BW'
  const currency  = getCurrency(country)
  const amount    = getPrice(country, tier)
  const provider  = getProvider(country)
  const description = `${PLAN_NAME} ${tierMeta(tier).name}`
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL || 'https://ghostwrite.app'
  const nameParts = (profile?.full_name || 'Ghost User').split(' ')
  const firstName = nameParts[0] || 'User'
  const lastName  = nameParts.slice(1).join(' ') || 'User'

  try {
    if (provider === 'dpo') {
      const { url, token } = await createDpoPayment({
        amount, currency, email:user.email!, description, firstName, lastName, userId:user.id, appUrl,
      })
      await sb.from('payments').insert({ user_id:user.id, provider:'dpo', amount, currency, tier, status:'pending', reference:token })
      return NextResponse.json({ url, provider:'dpo', amount, currency, tier })
    } else {
      const { url, reference } = await createPaystackPayment({
        amount, currency, email:user.email!, userId:user.id, appUrl,
      })
      await sb.from('payments').insert({ user_id:user.id, provider:'paystack', amount, currency, tier, status:'pending', reference })
      return NextResponse.json({ url, provider:'paystack', amount, currency, tier })
    }
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status:500 })
  }
}
