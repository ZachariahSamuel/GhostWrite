export const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
export const GROQ_MODEL    = 'llama-3.3-70b-versatile'

export const BYPASS_RATES = { std:'97.2%', pro:'98.8%', hyp:'99.4%' }
export const MODEL_NAMES  = { std:'PHANTOM-X', pro:'PHANTOM-PRO', hyp:'PHANTOM-HYPER' }

// Build the humanizer system prompt, optionally injecting Writing DNA
export function buildHumanizerPrompt(
  algo:  string,
  style: string,
  tone:  string,
  dna?:  Record<string,any> | null
): string {
  const base: Record<string,string> = {
    std: `Rewrite the following text to sound completely natural and human-written. Use a {style}, {tone} tone. Vary sentence length, use natural transitions, eliminate AI patterns. Output only the rewritten text.`,
    pro: `You are a skilled human writer. Rewrite this text to be completely undetectable as AI. Style: {style}, tone: {tone}. Break AI patterns: contractions, rhythm variation, natural hesitations, idiomatic language, varied paragraph length. Output only the rewritten text.`,
    hyp: `Transform this as a highly skilled human writer with {style} expertise and {tone} register. Aggressively restructure sentences, vary rhythm dramatically, introduce subtle imperfections, use authentic voice patterns. Make it impossible to distinguish from human writing. Output only the rewritten text.`,
  }

  let prompt = (base[algo] || base.std)
    .replace('{style}', style)
    .replace('{tone}',  tone)

  // Inject Writing DNA if available
  if (dna && dna.vocabularyFingerprint?.length > 0) {
    const dnaInstructions = [
      `\n\nWRITING DNA — match this author's style precisely:`,
      `- Avg sentence length: ~${dna.avgSentenceLength} words`,
      `- Avg paragraph length: ~${dna.avgParagraphLength} words`,
      `- Tone profile: ${dna.toneProfile}`,
      dna.commasPerSentence > 1.5 ? `- Uses commas frequently (${dna.commasPerSentence}/sentence)` : '',
      dna.dashesPerSentence > 0.3 ? `- Uses em-dashes for asides` : '',
      dna.questionRate > 0.2 ? `- Occasionally poses rhetorical questions` : '',
      dna.vocabularyFingerprint?.length > 0
        ? `- Naturally incorporates words like: ${dna.vocabularyFingerprint.slice(0,12).join(', ')}`
        : '',
    ].filter(Boolean).join('\n')

    prompt += dnaInstructions
  }

  return prompt
}

export const ALGO_PROMPTS: Record<string,string> = {
  std: buildHumanizerPrompt('std','academic','formal'),
  pro: buildHumanizerPrompt('pro','academic','formal'),
  hyp: buildHumanizerPrompt('hyp','academic','formal'),
}

export async function groqStream(
  messages: { role:string; content:string }[],
  apiKey:   string,
  onChunk:  (chunk:string, full:string) => void
): Promise<string> {
  const res = await fetch(GROQ_ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
    body:    JSON.stringify({
      model:       GROQ_MODEL,
      messages,
      max_tokens:  2048,
      temperature: 0.85,
      stream:      true,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any)?.error?.message || `API error ${res.status}`)
  }
  const reader = res.body!.getReader()
  const dec    = new TextDecoder()
  let full     = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = dec.decode(value).split('\n')
      .filter(l => l.startsWith('data: ') && l !== 'data: [DONE]')
    for (const line of lines) {
      try {
        const d     = JSON.parse(line.slice(6))
        const chunk = d.choices?.[0]?.delta?.content || ''
        if (chunk) { full += chunk; onChunk(chunk, full) }
      } catch {}
    }
  }
  return full
}
