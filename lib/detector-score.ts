// ─────────────────────────────────────────────────────────────────────────────
// GhostWrite — shared AI-likelihood scoring engine
//
// This module is the SINGLE SOURCE OF TRUTH for statistical AI-detection scoring.
// It is intentionally dependency-free and runtime-agnostic so it can run in BOTH:
//   • the browser  → powers the live, zero-latency "as-you-type" detector gauge
//   • the server   → /api/detect reuses it for the authoritative multi-detector scan
//
// Higher humanScore = more human-like / safer to pass detectors.
// ─────────────────────────────────────────────────────────────────────────────

export type SignalKey =
  | 'burstiness' | 'vocabulary' | 'aiPhrases' | 'startDiversity' | 'paragraphRhythm'

export type DetectorSignal = {
  key:    SignalKey
  label:  string
  /** 0–1 normalised contribution, higher = more human-like */
  value:  number
  weight: number
  hint:   string
}

export type Verdict = 'human' | 'mixed' | 'ai' | 'insufficient'

export type ScoreResult = {
  /** 0–100, higher = more human-like */
  humanScore: number
  verdict:    Verdict
  signals:    DetectorSignal[]
  wordCount:  number
  /** the single most-improvable signal — drives the gauge's coaching tip */
  weakest:    DetectorSignal | null
}

// AI-tell phrases — over-represented in unedited LLM prose.
export const AI_PHRASES = [
  'furthermore', 'moreover', 'in conclusion', 'it is important to note',
  'in summary', 'it is worth noting', 'needless to say', 'in terms of',
  'as previously mentioned', 'it can be argued', 'this highlights',
  'plays a crucial role', 'significant impact', 'it is evident that',
  'delve into', 'navigating', 'landscape', 'tapestry', 'multifaceted',
  'unwavering', 'pivotal', 'paramount', "it's important to",
]

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

function verdictFor(score: number): Verdict {
  if (score >= 80) return 'human'
  if (score >= 50) return 'mixed'
  return 'ai'
}

/**
 * Core analysis. Returns the composite human score plus the individual
 * statistical signals so the UI can show a transparent breakdown.
 */
export function analyzeText(text: string): ScoreResult {
  const trimmed   = (text || '').trim()
  const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || (trimmed ? [trimmed] : [])
  const words     = trimmed.toLowerCase().match(/\b[\w']+\b/g) || []

  if (words.length < 20) {
    return {
      humanScore: 0,
      verdict: 'insufficient',
      signals: [],
      wordCount: words.length,
      weakest: null,
    }
  }

  // 1 ─ Sentence-length burstiness (humans vary their rhythm; AI is uniform)
  const lengths    = sentences.map(s => s.trim().split(/\s+/).length).filter(Boolean)
  const avgLen     = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1)
  const variance   = lengths.reduce((a, b) => a + (b - avgLen) ** 2, 0) / (lengths.length || 1)
  const burstiness = Math.sqrt(variance) / (avgLen || 1)            // coefficient of variation
  const burstScore = clamp01(burstiness / 0.6)                     // ~0.6 CV is typical human

  // 2 ─ Vocabulary diversity (type–token ratio)
  const ttr      = new Set(words).size / words.length
  const ttrScore = clamp01(ttr / 0.65)                            // ~0.55–0.75 human range

  // 3 ─ AI-phrase density
  const lower       = trimmed.toLowerCase()
  const phraseHits  = AI_PHRASES.filter(p => lower.includes(p)).length
  const phraseScore = clamp01(1 - phraseHits / 5)

  // 4 ─ Sentence-start diversity (AI repeats sentence openings)
  const starts        = sentences.slice(0, 12).map(s => s.trim().split(/\s+/)[0]?.toLowerCase())
  const startDiversity = new Set(starts).size / Math.max(starts.length, 1)

  // 5 ─ Paragraph rhythm (AI writes uniform paragraph lengths)
  const paragraphs = trimmed.split(/\n\n+/).filter(p => p.trim().split(/\s+/).length > 20)
  let paragraphRhythm = 0.8 // neutral-positive default for short single-paragraph text
  if (paragraphs.length >= 3) {
    const lens = paragraphs.map(p => p.split(/\s+/).length)
    const a    = lens.reduce((x, y) => x + y, 0) / lens.length
    const v    = lens.reduce((x, y) => x + (y - a) ** 2, 0) / lens.length
    const cv   = Math.sqrt(v) / (a || 1)
    paragraphRhythm = clamp01(cv / 0.35)
  }

  const signals: DetectorSignal[] = [
    { key: 'burstiness',      label: 'Sentence rhythm',  value: burstScore,      weight: 0.30, hint: 'Vary sentence lengths — mix short punches with longer lines.' },
    { key: 'aiPhrases',       label: 'AI tell-words',    value: phraseScore,     weight: 0.25, hint: phraseHits ? `Found ${phraseHits} AI cliché${phraseHits > 1 ? 's' : ''} (e.g. "furthermore", "delve into").` : 'No common AI clichés detected.' },
    { key: 'vocabulary',      label: 'Word variety',     value: ttrScore,        weight: 0.20, hint: 'Reach for less predictable word choices.' },
    { key: 'startDiversity',  label: 'Opening variety',  value: startDiversity,  weight: 0.15, hint: 'Start sentences differently — avoid repeated openers.' },
    { key: 'paragraphRhythm', label: 'Paragraph flow',   value: paragraphRhythm, weight: 0.10, hint: 'Let paragraph lengths breathe naturally.' },
  ]

  const raw = signals.reduce((sum, s) => sum + s.value * s.weight, 0)
  const humanScore = Math.round(clamp01(raw) * 100)

  const weakest = [...signals].sort((a, b) => a.value - b.value)[0] ?? null

  return {
    humanScore,
    verdict: verdictFor(humanScore),
    signals,
    wordCount: words.length,
    weakest,
  }
}

// Per-detector sensitivity bias — each engine flags AI text slightly differently.
const DETECTOR_BIAS: Record<string, number> = {
  turnitin:    -2,
  originality: -4,
  copyleaks:    1,
  zerogpt:      2,
  gptzero:      0,
  sapling:     -1,
}

export type DetectorScore = { score: number; label: string; live: boolean }

const labelFor = (score: number): string =>
  score >= 80 ? 'Human' : score >= 50 ? 'Mixed' : 'AI'

/**
 * Server-side statistical predictor for a single detector (no live API).
 * Built on top of analyzeText so server + client never disagree.
 */
export function predictDetector(text: string, detector: string): DetectorScore {
  const { humanScore, wordCount } = analyzeText(text)
  if (wordCount < 20) return { score: 50, label: 'Insufficient text', live: false }
  const biased = Math.max(0, Math.min(100, humanScore + (DETECTOR_BIAS[detector] ?? 0)))
  return { score: biased, label: labelFor(biased), live: false }
}

export { labelFor }
