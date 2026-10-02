import './PixelProgress.css'

interface PixelProgressProps {
  /** Filled segments. */
  value: number
  total: number
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

  return (
    <span className={`pixel-progress ${className}`} {...a11y}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={i === current ? 'current' : i < value ? 'on' : undefined}
        />
      ))}
    </span>
  )
}

export default PixelProgress
