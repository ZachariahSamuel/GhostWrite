import { NextRequest, NextResponse } from 'next/server'
import { MODELS, GHOST_ALL_MODELS, GROQ_ENDPOINT, OPENROUTER_ENDPOINT } from '@/lib/models'
import { checkCredits, consumeCredits } from '@/lib/credits'

const SYS = 'You are GhostWrite, an AI writing assistant for African students and professionals. Invisible craft. Visible results. Be helpful, direct, and produce high-quality writing immediately.'

async function callModel(
  modelKey: string,
  messages: any[],
  groqKey: string,
  openrouterKey: string
): Promise<string> {
  const cfg = MODELS[modelKey]
  if (!cfg) throw new Error(`Unknown model: ${modelKey}`)

  const isGroq        = cfg.provider === 'groq'
  const key           = isGroq ? groqKey : openrouterKey
  const endpoint      = isGroq ? GROQ_ENDPOINT : OPENROUTER_ENDPOINT

  if (!key) throw new Error(`No API key for ${cfg.label}`)

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      ...(isGroq ? {} : { 'HTTP-Referer': 'https://ghostwrite.app', 'X-Title': 'GhostWrite' }),
    },
    body: JSON.stringify({
      model:       cfg.id,
      messages:    [{ role:'system', content:SYS }, ...messages],
      max_tokens:  1024,
      temperature: 0.80,
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any)?.error?.message || `${cfg.label} error ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function ghostAll(
  messages: any[],
  groqKey: string,
  openrouterKey: string
): Promise<string> {
  // Run all free Groq models in parallel, synthesize best response
  const results = await Promise.allSettled(
    GHOST_ALL_MODELS.map(m => callModel(m, messages, groqKey, openrouterKey))
  )

  const successful = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && r.value.trim().length > 0)
    .map(r => r.value)

  if (successful.length === 0) throw new Error('All models failed')
  if (successful.length === 1) return successful[0]

  // Use Groq to synthesize the best composite response
  const synthPrompt = `You received these ${successful.length} AI responses to the same question. Synthesize the most accurate, complete, and well-written single response. Keep the best ideas from each. Be concise.

${successful.map((r, i) => `Response ${i+1}:\n${r}`).join('\n\n---\n\n')}

Synthesized response:`

  const synthRes = await fetch(GROQ_ENDPOINT, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${groqKey}` },
    body: JSON.stringify({
      model:'llama-3.3-70b-versatile',
      messages:[{ role:'user', content:synthPrompt }],
      max_tokens:1500, temperature:0.5,
    }),
  })

  if (!synthRes.ok) return successful[0] // fallback to best single response
  const synthData = await synthRes.json()
  return synthData.choices?.[0]?.message?.content || successful[0]
}

export async function POST(req: NextRequest) {
  const authHeader      = req.headers.get('authorization') || ''
  const groqKey         = (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') || process.env.GROQ_API_KEY || ''
  const openrouterKey   = req.headers.get('x-openrouter-key') || process.env.OPENROUTER_API_KEY || ''

  if (!groqKey) return NextResponse.json({ error:'No Groq API key.' }, { status:401 })

  const body = await req.json().catch(() => null)
  if (!body?.messages?.length) return NextResponse.json({ error:'No messages.' }, { status:400 })

  const { messages, model = 'ghostall' } = body
  const lastMsg   = messages[messages.length-1]?.content || ''
  const wordCost  = Math.ceil(lastMsg.split(/\s+/).length * 1.5)

  const creditCheck = await checkCredits(wordCost)
  if (!creditCheck.ok) return creditCheck.response

  try {
    let reply: string

    if (model === 'ghostall') {
      reply = await ghostAll(messages, groqKey, openrouterKey)
    } else {
      const cfg = MODELS[model]
      if (!cfg) return NextResponse.json({ error:`Unknown model: ${model}` }, { status:400 })
      if (cfg.provider === 'openrouter' && !openrouterKey) {
        // Fallback to Groq with explanation
        reply = await callModel('llama3', messages, groqKey, '')
        reply = `[Note: ${cfg.label} requires an OpenRouter key. Responding with Llama 3.3 instead.]\n\n${reply}`
      } else {
        reply = await callModel(model, messages, groqKey, openrouterKey)
      }
    }

    await consumeCredits(creditCheck.userId, wordCost)
    return NextResponse.json({ reply, model })

  } catch(e: any) {
    return NextResponse.json({ error: e.message || 'Chat failed' }, { status:500 })
  }
}
