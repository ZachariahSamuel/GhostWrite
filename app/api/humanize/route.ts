import { NextRequest, NextResponse } from 'next/server'
import { buildHumanizerPrompt } from '@/lib/groq'
import { checkCredits, consumeCredits } from '@/lib/credits'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getDNA(userId: string) {
  const cookieStore = cookies()
  const sb = createServerClient(
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
  const { data } = await sb.from('profiles').select('writing_dna').eq('id', userId).single()
  return data?.writing_dna || null
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const groqKey    = (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') || process.env.GROQ_API_KEY
  if (!groqKey) return NextResponse.json({ error:'No Groq API key. Add yours via the 🔑 button.' }, { status:401 })

  const body = await req.json().catch(() => null)
  if (!body?.text?.trim()) return NextResponse.json({ error:'No text provided.' }, { status:400 })

  const { text, algo='std', style='academic', tone='formal', useDna=true } = body
  if (text.length > 35000) return NextResponse.json({ error:'Text exceeds 5,000 word limit.' }, { status:400 })

  const wordCount   = text.trim().split(/\s+/).length
  const creditCheck = await checkCredits(wordCount)
  if (!creditCheck.ok) return creditCheck.response

  // Fetch Writing DNA if enabled
  const dna = useDna ? await getDNA(creditCheck.userId) : null

  const systemPrompt = buildHumanizerPrompt(algo, style, tone, dna)

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${groqKey}` },
    body:    JSON.stringify({
      model:       'llama-3.3-70b-versatile',
      messages:    [{ role:'system', content:systemPrompt }, { role:'user', content:text }],
      max_tokens:  2048,
      temperature: algo==='hyp'?0.95:algo==='pro'?0.85:0.75,
      stream:      true,
    }),
  })

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}))
    return NextResponse.json({ error:(err as any)?.error?.message||`Groq error ${groqRes.status}` }, { status:groqRes.status })
  }

  await consumeCredits(creditCheck.userId, wordCount)

  return new NextResponse(groqRes.body, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-DNA-Used':        dna ? 'true' : 'false',
    },
  })
}
