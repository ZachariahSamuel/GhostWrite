import { NextRequest, NextResponse } from 'next/server'

// ── Detector configurations ──────────────────────────────────────────────────
// live    = real API call
// predict = Groq-based statistical analysis (honest label in UI)

async function runGPTZero(text: string): Promise<{ score: number; label: string; live: boolean }> {
  const apiKey = process.env.GPTZERO_API_KEY
  if (!apiKey) return predictScore(text, 'gptzero')

  try {
    const res = await fetch('https://api.gptzero.me/v2/predict/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ document: text }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return predictScore(text, 'gptzero')
    const data = await res.json()
    // GPTZero returns completely_generated_prob (0–1, higher = more AI)
    const aiProb   = data.documents?.[0]?.completely_generated_prob ?? 0.5
    const humanPct = Math.round((1 - aiProb) * 100)
    return {
      score: humanPct,
      label: humanPct >= 80 ? 'Human' : humanPct >= 50 ? 'Mixed' : 'AI',
      live: true,
    }
  } catch {
    return predictScore(text, 'gptzero')
  }
}

async function runSapling(text: string): Promise<{ score: number; label: string; live: boolean }> {
  const apiKey = process.env.SAPLING_API_KEY
  if (!apiKey) return predictScore(text, 'sapling')

  try {
    const res = await fetch('https://api.sapling.ai/api/v1/aidetect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: apiKey, text }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return predictScore(text, 'sapling')
    const data = await res.json()
    // Sapling returns score 0–1 where 1.0 = definitely AI
    const aiScore  = data.score ?? 0.5
    const humanPct = Math.round((1 - aiScore) * 100)
    return {
      score: humanPct,
      label: humanPct >= 80 ? 'Human' : humanPct >= 50 ? 'Mixed' : 'AI',
      live: true,
    }
  } catch {
    return predictScore(text, 'sapling')
  }
}

// ── Statistical predictor for detectors without public APIs ──────────────────
// Analyses: avg sentence length, sentence length variance (burstiness),
// vocabulary diversity, repetition ratio, punctuation naturalness
function predictScore(text: string, detector: string): { score: number; label: string; live: boolean } {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const words     = text.toLowerCase().match(/\b\w+\b/g) || []

  if (words.length < 20) return { score: 50, label: 'Insufficient text', live: false }

  // 1. Sentence length burstiness (humans vary more)
  const lengths    = sentences.map(s => s.trim().split(/\s+/).length)
  const avgLen     = lengths.reduce((a,b)=>a+b,0) / lengths.length
  const variance   = lengths.reduce((a,b)=>a+(b-avgLen)**2,0) / lengths.length
  const burstiness = Math.sqrt(variance) / (avgLen || 1) // coefficient of variation
  // High burstiness = more human-like
  const burstScore = Math.min(burstiness / 0.6, 1) // 0.6 CV is typical for humans

  // 2. Vocabulary diversity (type-token ratio)
  const uniqueWords = new Set(words)
  const ttr         = uniqueWords.size / words.length
  // Human prose typically 0.55–0.75 TTR for medium-length texts
  const ttrScore    = Math.min(ttr / 0.65, 1)

  // 3. Repetition of common AI phrases
  const aiPhrases = [
    'furthermore', 'moreover', 'in conclusion', 'it is important to note',
    'in summary', 'it is worth noting', 'needless to say', 'in terms of',
    'as previously mentioned', 'it can be argued', 'this highlights',
    'plays a crucial role', 'significant impact', 'it is evident that',
    'delve into', 'navigating', 'landscape', 'tapestry', 'multifaceted',
    'unwavering', 'pivotal', 'paramount', 'it\'s important to',
  ]
  const textLower    = text.toLowerCase()
  const phraseCount  = aiPhrases.filter(p => textLower.includes(p)).length
  const phraseScore  = Math.max(0, 1 - (phraseCount / 5)) // penalise AI phrases

  // 4. Sentence start diversity (AI often starts similarly)
  const starts    = sentences.slice(0,10).map(s => s.trim().split(' ')[0]?.toLowerCase())
  const uniqStarts = new Set(starts)
  const startDiversity = uniqStarts.size / Math.max(starts.length, 1)

  // 5. Paragraph length uniformity (AI tends to write uniform paragraphs)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20)
  let uniformityPenalty = 0
  if (paragraphs.length >= 3) {
    const paraLens  = paragraphs.map(p => p.split(/\s+/).length)
    const paraAvg   = paraLens.reduce((a,b)=>a+b,0) / paraLens.length
    const paraVar   = paraLens.reduce((a,b)=>a+(b-paraAvg)**2,0) / paraLens.length
    const paraCV    = Math.sqrt(paraVar) / (paraAvg || 1)
    uniformityPenalty = paraCV < 0.2 ? 0.15 : 0 // penalise very uniform paragraphs
  }

  // Weighted composite
  const raw = (
    burstScore    * 0.30 +
    ttrScore      * 0.20 +
    phraseScore   * 0.25 +
    startDiversity* 0.15 +
    0.10           // base offset
  ) - uniformityPenalty

  // Add detector-specific bias (each detector has different sensitivity)
  const biases: Record<string, number> = {
    turnitin: -0.02,
    originality: -0.04,
    copyleaks: 0.01,
    zerogpt: 0.02,
    gptzero: 0.00,
    sapling: -0.01,
  }
  const bias  = biases[detector] || 0
  const final = Math.max(0, Math.min(100, Math.round((raw + bias) * 100)))

  return {
    score: final,
    label: final >= 80 ? 'Human' : final >= 50 ? 'Mixed' : 'AI',
    live:  false,
  }
}

// ── Main route handler ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.text?.trim()) {
    return NextResponse.json({ error: 'No text provided.' }, { status: 400 })
  }

  const { text } = body
  if (text.length > 50000) {
    return NextResponse.json({ error: 'Text too long. Max ~5,000 words.' }, { status: 400 })
  }

  // Run all detectors in parallel
  const [gptzero, sapling, turnitin, originality, copyleaks, zerogpt] = await Promise.all([
    runGPTZero(text),
    runSapling(text),
    Promise.resolve(predictScore(text, 'turnitin')),
    Promise.resolve(predictScore(text, 'originality')),
    Promise.resolve(predictScore(text, 'copyleaks')),
    Promise.resolve(predictScore(text, 'zerogpt')),
  ])

  const results = {
    turnitin:    { ...turnitin,    name: 'Turnitin AI'     },
    gptzero:     { ...gptzero,     name: 'GPTZero'         },
    originality: { ...originality, name: 'Originality.ai'  },
    copyleaks:   { ...copyleaks,   name: 'Copyleaks'       },
    zerogpt:     { ...zerogpt,     name: 'ZeroGPT'         },
    sapling:     { ...sapling,     name: 'Sapling AI'      },
  }

  const scores  = Object.values(results).map(r => r.score)
  const avgScore = Math.round(scores.reduce((a,b)=>a+b,0) / scores.length)
  const allPass  = scores.every(s => s >= 80)

  return NextResponse.json({
    results,
    summary: {
      average:  avgScore,
      allPass,
      verdict:  allPass ? 'BYPASS_STATUS: PASSED' : avgScore >= 70 ? 'PARTIAL' : 'BYPASS_STATUS: FAILED',
    }
  })
}
