import { NextRequest, NextResponse } from 'next/server'
import { checkCredits, consumeCredits } from '@/lib/credits'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const groqKey = (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') || process.env.GROQ_API_KEY
  if (!groqKey) return NextResponse.json({ error:'No Groq API key.' }, { status:401 })

  const body = await req.json().catch(() => null)
  if (!body?.topic?.trim()) return NextResponse.json({ error:'No topic provided.' }, { status:400 })

  const { topic, wordCount='1,500 words', citeStyle='APA 7', level='Undergraduate' } = body
  if (topic.length > 2000) return NextResponse.json({ error:'Topic too long.' }, { status:400 })

  // Estimate word cost from requested length
  const estimatedWords = parseInt(wordCount.replace(/\D/g,'')) || 1500
  const creditCheck = await checkCredits(estimatedWords)
  if (!creditCheck.ok) return creditCheck.response

  const system = `You are an expert academic writer. Write a well-structured ${wordCount} essay at ${level} level. Use ${citeStyle} citation style. Include: introduction with thesis, body paragraphs with evidence, strong conclusion. Academic language throughout. Include placeholder citations [Author, Year].`

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${groqKey}` },
    body: JSON.stringify({
      model:'llama-3.3-70b-versatile',
      messages:[{ role:'system', content:system },{ role:'user', content:`Write an essay about: ${topic}` }],
      max_tokens:3000, temperature:0.75, stream:true,
    }),
  })

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(()=>({}))
    return NextResponse.json({ error:(err as any)?.error?.message||`Groq error ${groqRes.status}` }, { status:groqRes.status })
  }

  await consumeCredits(creditCheck.userId, estimatedWords)

  return new NextResponse(groqRes.body, {
    headers:{ 'Content-Type':'text/event-stream','Cache-Control':'no-cache','X-Accel-Buffering':'no' }
  })
}
