import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

// GET — fetch the current user's payment history (used by the Settings page)
export async function GET(req: NextRequest) {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await sb
    .from('payments')
    .select('id, amount, currency, status, provider, created_at, completed_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payments: data || [] })
}
