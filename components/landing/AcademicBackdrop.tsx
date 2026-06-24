// Drifting academic motifs (books, grad caps, quills, quotes) behind the paper
// surface — Iconoir line set, inked at low opacity. Ties the page to study/writing.
import {
  OpenBook, GraduationCap, EditPencil, Quote, BookStack, Page,
  PageEdit, Bookmark, LightBulb, Language, Type, Journal,
} from 'iconoir-react'

const ICONS = [
  OpenBook, GraduationCap, EditPencil, Quote, BookStack, Page,
  PageEdit, Bookmark, LightBulb, Language, Type, Journal,
]

// hand-scattered placements (top%, left%, size, rotate, opacity, duration)
const SPOTS = [
  { t: 8,  l: 6,  s: 46, r: -12, o: 0.10, d: 14 },
  { t: 14, l: 84, s: 38, r: 10,  o: 0.08, d: 16 },
  { t: 30, l: 22, s: 30, r: 8,   o: 0.07, d: 12 },
  { t: 24, l: 60, s: 54, r: -8,  o: 0.07, d: 18 },
  { t: 46, l: 90, s: 34, r: 14,  o: 0.08, d: 15 },
  { t: 52, l: 4,  s: 42, r: -6,  o: 0.08, d: 13 },
  { t: 66, l: 30, s: 30, r: 12,  o: 0.07, d: 17 },
  { t: 70, l: 72, s: 46, r: -10, o: 0.08, d: 14 },
  { t: 84, l: 14, s: 36, r: 6,   o: 0.07, d: 16 },
  { t: 88, l: 56, s: 30, r: -14, o: 0.07, d: 12 },
  { t: 92, l: 88, s: 40, r: 8,   o: 0.08, d: 18 },
  { t: 40, l: 46, s: 28, r: -4,  o: 0.06, d: 15 },
]

export default function AcademicBackdrop({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {SPOTS.map((p, i) => {
        const Icon = ICONS[i % ICONS.length]
        return (
          <Icon
            key={i}
            className="absolute text-ink drift"
            strokeWidth={1.6}
            style={{
              top: `${p.t}%`, left: `${p.l}%`,
              width: p.s, height: p.s, opacity: p.o,
              // @ts-expect-error custom props for the drift keyframe
              '--r': `${p.r}deg`, '--d': `${p.d}s`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        )
      })}
    </div>
  )
}
