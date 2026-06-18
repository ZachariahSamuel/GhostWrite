'use client'
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

export type GhostState = 'idle' | 'writing' | 'loading' | 'success' | 'error'

export interface GhostRiveHandle {
  setState: (s: GhostState) => void
  getState: () => GhostState
}

interface Props {
  width?: number
  height?: number
  riv?: string
  logoSrc?: string
  initialState?: GhostState
  className?: string
  onStateChange?: (from: GhostState, to: GhostState) => void
}

const GhostRive = forwardRef<GhostRiveHandle, Props>(({
  width = 200, height = 200,
  riv, logoSrc,
  initialState = 'idle',
  className = '',
  onStateChange,
}, ref) => {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const instanceRef = useRef<any>(null)

  useImperativeHandle(ref, () => ({
    setState: (s: GhostState) => instanceRef.current?.setState(s),
    getState: () => instanceRef.current?.getState() ?? 'idle',
  }))

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current

    // Dynamically load ghostwrite-rive.js
    const init = () => {
      const GR = (window as any).GhostRive
      if (!GR) return
      const g = new GR(canvas, { riv: riv || null, logoSrc: logoSrc || null })
      g.setState(initialState)
      if (onStateChange) g.onStateChange = onStateChange
      instanceRef.current = g
    }

    if ((window as any).GhostRive) {
      init()
    } else {
      const s = document.createElement('script')
      s.src = '/ghostwrite-rive.js'
      s.onload = init
      document.head.appendChild(s)
    }

    return () => { instanceRef.current?.stop?.() }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ display: 'block' }}
    />
  )
})

GhostRive.displayName = 'GhostRive'
export default GhostRive
