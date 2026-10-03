import type { ChallengeState } from '../progression/progress.ts'
import './PixelProgress.css'

interface PixelProgressProps {
  /** Filled segments. */
  value: number
  total: number
  /** Saved state per segment; overrides `value` when given. */
  segments?: readonly ChallengeState[]
  /** Highlights one segment as "you are here". */
  current?: number
  /** When set, exposes the bar as a progressbar with this name. */
  label?: string
  valueText?: string
  className?: string
}

/** Segmented retro progress bar: [■■■□□□□]. */
function PixelProgress({
  value,
  total,
  segments,
  current,
  label,
  valueText,
  className = '',
}: PixelProgressProps) {
  const a11y = label
    ? {
        role: 'progressbar',
        'aria-label': label,
        'aria-valuemin': 0,
        'aria-valuemax': total,
        'aria-valuenow': current !== undefined ? current + 1 : value,
        'aria-valuetext': valueText,
      }
    : { 'aria-hidden': true }

  function segmentClass(i: number) {
    if (i === current) return 'current'
    if (!segments) return i < value ? 'on' : undefined
    if (segments[i] === 'mastered') return 'on mastered'
    return segments[i] === 'completed' ? 'on' : undefined
  }

  return (
    <span className={`pixel-progress ${className}`} {...a11y}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={segmentClass(i)} />
      ))}
    </span>
  )
}

export default PixelProgress
