import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(n)      { return cookieStore.get(n)?.value },
        set(n,v,o)  { try { cookieStore.set({ name:n, value:v, ...o }) } catch {} },
        remove(n,o) { try { cookieStore.set({ name:n, value:'',  ...o }) } catch {} },
      },
    }
  )
}

// POST — save a document
export async function POST(req: NextRequest) {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  const body = await req.json().catch(() => null)
  if (!body?.type || !body?.title || !body?.content) {
    return NextResponse.json({ error:'Missing: type, title, content' }, { status:400 })
  }
  const { type, title, content, word_count=0, algo_tier='std', bypass_score=null, metadata={} } = body

  const { data, error } = await sb.from('documents').insert({
    user_id: user.id,
    type,
    title:        title.slice(0, 200),
    content:      content.slice(0, 100000),
    word_count,
    algo_tier,
    bypass_score,
    metadata,
  }).select('id, created_at').single()

  if (error) return NextResponse.json({ error: error.message }, { status:500 })
  return NextResponse.json({ success:true, id:data.id, created_at:data.created_at })
}

// GET — fetch user's documents
export async function GET(req: NextRequest) {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  const { searchParams } = new URL(req.url)
  const type  = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') || '50')
  const page  = parseInt(searchParams.get('page')  || '0')

  let query = sb
    .from('documents')
    .select('id, type, title, word_count, bypass_score, algo_tier, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (type) query = (query as any).eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status:500 })
  return NextResponse.json({ documents: data || [] })
}

// DELETE — remove a document
export async function DELETE(req: NextRequest) {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error:'No document ID' }, { status:400 })

  const { error } = await sb.from('documents').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status:500 })
  return NextResponse.json({ success:true })
}
