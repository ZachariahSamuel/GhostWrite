// GhostWrite brand lockup — Campus Press.
// Casper sits inside a brutalist ink-bordered riso coin (hard offset shadow);
// the wordmark is Clash Display with a sun-highlighter swipe under "Write".
import Link from 'next/link'

export function CasperMark({
  size = 38,
  textSize = 20,
  tone = 'ink',          // 'ink' on paper, 'paper' on ink backgrounds
  href = '/',
  showText = true,
  className = '',
}: {
  size?: number
  textSize?: number
  tone?: 'ink' | 'paper'
  href?: string | null
  showText?: boolean
  className?: string
}) {
  const wordColor = tone === 'paper' ? '#F4EFE6' : '#1A1A17'

  const emblem = (
    <img
      src="/casper-logo.png"
      alt=""
      width={Math.round(size * 1.1)} height={Math.round(size * 1.1)}
      className="object-contain shrink-0"
      style={{ filter: 'drop-shadow(0 2px 3px rgba(26,26,23,0.20))' }}
    />
  )

  const inner = (
    <>
      {emblem}
      {showText && (
        <span
          className="font-display font-semibold leading-none"
          style={{ fontSize: textSize, color: wordColor, letterSpacing: '-0.01em' }}
        >
          Ghost<span className="mark-hi">Write</span>
        </span>
      )}
    </>
  )

  const cls = `inline-flex items-center gap-2.5 ${className}`
  return href
    ? <Link href={href} className={cls}>{inner}</Link>
    : <span className={cls}>{inner}</span>
}

export default CasperMark
