import { NextRequest, NextResponse } from 'next/server'
import { predictDetector, labelFor } from '@/lib/detector-score'

// ── Detector configurations ──────────────────────────────────────────────────
// live    = real API call
// predict = shared statistical analysis (honest label in UI)
// The statistical predictor lives in lib/detector-score.ts so the browser gauge
// and this route always produce identical scores.

async function runGPTZero(text: string): Promise<{ score: number; label: string; live: boolean }> {
  const apiKey = process.env.GPTZERO_API_KEY
  if (!apiKey) return predictDetector(text, 'gptzero')

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
    if (!res.ok) return predictDetector(text, 'gptzero')
    const data = await res.json()
    // GPTZero returns completely_generated_prob (0–1, higher = more AI)
    const aiProb   = data.documents?.[0]?.completely_generated_prob ?? 0.5
    const humanPct = Math.round((1 - aiProb) * 100)
    return { score: humanPct, label: labelFor(humanPct), live: true }
  } catch {
    return predictDetector(text, 'gptzero')
  }
}

async function runSapling(text: string): Promise<{ score: number; label: string; live: boolean }> {
  const apiKey = process.env.SAPLING_API_KEY
  if (!apiKey) return predictDetector(text, 'sapling')

  try {
    const res = await fetch('https://api.sapling.ai/api/v1/aidetect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: apiKey, text }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return predictDetector(text, 'sapling')
    const data = await res.json()
    // Sapling returns score 0–1 where 1.0 = definitely AI
    const aiScore  = data.score ?? 0.5
    const humanPct = Math.round((1 - aiScore) * 100)
    return { score: humanPct, label: labelFor(humanPct), live: true }
  } catch {
    return predictDetector(text, 'sapling')
  }
}

// The statistical predictor now lives in lib/detector-score.ts (predictDetector)
// so the live browser gauge and this route share one identical implementation.

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
    Promise.resolve(predictDetector(text, 'turnitin')),
    Promise.resolve(predictDetector(text, 'originality')),
    Promise.resolve(predictDetector(text, 'copyleaks')),
    Promise.resolve(predictDetector(text, 'zerogpt')),
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
