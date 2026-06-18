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

// Analyse text samples to extract writing DNA profile
function extractDNA(samples: string[]): Record<string, any> {
  const allText  = samples.join('\n\n')
  const words    = allText.toLowerCase().match(/\b\w+\b/g) || []
  const sentences= allText.match(/[^.!?]+[.!?]+/g) || []

  // 1. Average sentence length
  const sentLens = sentences.map(s => s.trim().split(/\s+/).length)
  const avgSentLen = sentLens.length
    ? Math.round(sentLens.reduce((a,b)=>a+b,0)/sentLens.length)
    : 15

  // 2. Vocabulary fingerprint — top 30 non-stopword words
  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for',
    'of','with','by','from','is','was','are','were','be','been','have','has','had',
    'do','does','did','will','would','could','should','may','might','this','that',
    'these','those','it','its','they','them','their','we','our','i','my','you','your'])
  const freq: Record<string,number> = {}
  words.forEach(w => { if (!stopWords.has(w) && w.length > 3) freq[w] = (freq[w]||0)+1 })
  const topWords = Object.entries(freq)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,30)
    .map(([w]) => w)

  // 3. Punctuation habits
  const commaRate   = (allText.match(/,/g)   || []).length / Math.max(sentences.length, 1)
  const dashRate    = (allText.match(/—|–|-/g)|| []).length / Math.max(sentences.length, 1)
  const questionRate= (allText.match(/\?/g)  || []).length / Math.max(sentences.length, 1)

  // 4. Sentence starters
  const starters = sentences.slice(0, 20)
    .map(s => s.trim().split(' ').slice(0,2).join(' ').toLowerCase())
    .filter(Boolean)

  // 5. Paragraph length preference
  const paragraphs = allText.split(/\n\n+/).filter(p => p.trim().length > 20)
  const avgParaLen = paragraphs.length
    ? Math.round(paragraphs.map(p=>p.split(/\s+/).length).reduce((a,b)=>a+b,0)/paragraphs.length)
    : 80

  // 6. Tone markers
  const firstPerson  = (allText.match(/\b(i|i'm|i've|i'd|i'll|we|we're)\b/gi)||[]).length
  const hedging      = (allText.match(/\b(perhaps|maybe|seems|appears|suggests|likely|often)\b/gi)||[]).length
  const assertive    = (allText.match(/\b(clearly|certainly|obviously|undoubtedly|always|never)\b/gi)||[]).length
  const toneBalance  = firstPerson > sentences.length*0.1 ? 'personal'
    : assertive > hedging ? 'assertive' : 'measured'

  return {
    avgSentenceLength: avgSentLen,
    avgParagraphLength: avgParaLen,
    vocabularyFingerprint: topWords,
    commasPerSentence: Math.round(commaRate * 10) / 10,
    dashesPerSentence: Math.round(dashRate  * 10) / 10,
    questionRate: Math.round(questionRate * 10) / 10,
    commonStarters: [...new Set(starters)].slice(0,10),
    toneProfile: toneBalance,
    sampleCount: samples.length,
    wordCount: words.length,
    builtAt: new Date().toISOString(),
  }
}

// GET — fetch existing DNA profile
export async function GET(req: NextRequest) {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  const { data } = await sb.from('profiles').select('writing_dna').eq('id', user.id).single()
  return NextResponse.json({ dna: data?.writing_dna || null })
}

// POST — build DNA from provided samples or recent documents
export async function POST(req: NextRequest) {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  const body = await req.json().catch(() => null)
  let samples: string[] = body?.samples || []

  // If no samples provided, pull from last 10 humanized documents
  if (samples.length === 0) {
    const { data: docs } = await sb
      .from('documents')
      .select('content')
      .eq('user_id', user.id)
      .eq('type', 'humanized')
      .order('created_at', { ascending:false })
      .limit(10)
    samples = (docs || []).map(d => d.content).filter(Boolean)
  }

  if (samples.length === 0) {
    return NextResponse.json({
      error: 'No writing samples found. Humanize some documents first, or paste sample text.',
    }, { status:400 })
  }

  const dna = extractDNA(samples)

  // Persist to profile
  await sb.from('profiles').update({ writing_dna: dna }).eq('id', user.id)

  return NextResponse.json({ dna, message:`DNA profile built from ${samples.length} sample(s).` })
}

// DELETE — clear DNA profile
export async function DELETE(req: NextRequest) {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })

  await sb.from('profiles').update({ writing_dna: null }).eq('id', user.id)
  return NextResponse.json({ success:true })
}
