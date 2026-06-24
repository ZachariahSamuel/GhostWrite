'use client'
// Interactive landing demo — visitors watch the real detector engine score their
// text live, before they ever sign up. Campus Press styling.
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'iconoir-react'
import LiveDetectorGauge from '@/components/ghost/LiveDetectorGauge'
import { analyzeText, type ScoreResult } from '@/lib/detector-score'

const SAMPLE = `Artificial intelligence represents a transformative technological advancement that is fundamentally altering the landscape of multiple industries. Furthermore, the implementation of machine learning algorithms has demonstrated significant efficacy in processing vast quantities of data. Moreover, it is important to note that these systems play a crucial role in navigating an increasingly complex digital tapestry.`

export default function LiveDemo() {
  const [text,   setText]   = useState(SAMPLE)
  const [live,   setLive]   = useState<ScoreResult>(() => analyzeText(SAMPLE))
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    setTyping(true)
    const t = setTimeout(() => { setLive(analyzeText(text)); setTyping(false) }, 200)
    return () => clearTimeout(t)
  }, [text])

  return (
    <div className="max-w-5xl mx-auto relative">
      <div className="b-card relative rounded-xl3 p-5 md:p-8 grid md:grid-cols-[1fr_auto] gap-7 items-center">
        {/* editor */}
        <div className="flex flex-col">
          <label htmlFor="demo-text" className="eyebrow text-blue mb-2">
            your text
          </label>
          <textarea
            id="demo-text"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={9}
            spellCheck={false}
            className="w-full rounded-xl2 px-4 py-3.5 text-ink text-[14px] leading-[1.7] font-body
              bg-paper border-2 border-ink outline-none resize-none transition-colors
              focus:bg-paper3 placeholder:text-mute"
            placeholder="Paste any AI-generated text…"
          />
          <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
            <button
              onClick={() => setText(SAMPLE)}
              className="btn btn-ghost px-3.5 py-1.5 text-[12px] rounded-full">
              Reset sample
            </button>
            <Link
              href="/register"
              className="btn btn-coral group px-6 py-2.5 text-[13px] rounded-full">
              Fix this, fr <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
            </Link>
          </div>
        </div>

        {/* live gauge */}
        <div className="flex justify-center md:border-l-2 md:border-ink/15 md:pl-7">
          <LiveDetectorGauge
            score={live.humanScore}
            verdict={live.verdict}
            live={typing && text.trim().length > 0}
            signals={live.signals}
            tip={live.weakest?.hint}
            size={210}
          />
        </div>
      </div>
    </div>
  )
}
