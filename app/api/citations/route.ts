import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const key = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const groqKey = key || process.env.GROQ_API_KEY
  if (!groqKey) return NextResponse.json({ error:'No Groq API key.' }, { status:401 })

  const body = await req.json().catch(() => null)
  if (!body?.query?.trim()) return NextResponse.json({ error:'No query provided.' }, { status:400 })

  const { query, style='APA 7', count=5 } = body
  const safeCount = Math.min(Math.max(parseInt(count)||5, 1), 15)

  const prompt = `Generate ${safeCount} realistic, plausible academic citations in ${style} format related to: "${query}".
For each citation provide:
1. A full ${style} citation (author, year, title, journal/publisher, DOI if applicable)
2. A 1-sentence annotation explaining relevance
3. A relevance score out of 100

Return ONLY a valid JSON array, no markdown, no preamble:
[{"citation":"...","annotation":"...","score":95},...]`

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${groqKey}` },
    body: JSON.stringify({
      model:'llama-3.3-70b-versatile',
      messages:[{ role:'user', content:prompt }],
      max_tokens:2000, temperature:0.35,
    }),
  })

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}))
    return NextResponse.json({ error:(err as any)?.error?.message||`Groq error ${groqRes.status}` }, { status:groqRes.status })
  }

  const data   = await groqRes.json()
  const raw    = data.choices?.[0]?.message?.content || ''
  const clean  = raw.replace(/```json|```/g,'').trim()

  try {
    const citations = JSON.parse(clean)
    if (!Array.isArray(citations)) throw new Error('Not an array')
    return NextResponse.json({ citations })
  } catch {
    return NextResponse.json({ error:'Could not parse citations. Try a more specific query.' }, { status:500 })
  }
}
