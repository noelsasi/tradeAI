interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}

function Icon({
  size = 16,
  strokeWidth = 1.8,
  className,
  style,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconUpload({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M12 16V4m0 0L7 9m5-5 5 5" />
      <path d="M5 19h14" />
    </Icon>
  )
}

export function IconFile({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M5 21V5a2 2 0 0 1 2-2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" />
    </Icon>
  )
}

export function IconCheck({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M5 12.5 10 17 19 7" />
    </Icon>
  )
}

export function IconAlert({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M12 9v4m0 4h.01" />
      <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
    </Icon>
  )
}

export function IconFlag({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M5 21V4m0 0 8 1 6-1v9l-6 1-8-1" />
    </Icon>
  )
}

export function IconArrowRight({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </Icon>
  )
}

export function IconChevron({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  )
}

export function IconClose({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  )
}

export function IconDownload({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
      <path d="M5 20h14" />
    </Icon>
  )
}

export function IconSend({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
      <path d="m22 2-11 11" />
    </Icon>
  )
}

export function IconCopy({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </Icon>
  )
}

export function IconShield({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
    </Icon>
  )
}

export function IconSearch({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  )
}

export function IconLink({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M9 15l6-6" />
      <path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1" />
      <path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1" />
    </Icon>
  )
}

export function IconWebhook({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M9 8a3 3 0 1 1 4 2.8L10.5 15" />
      <path d="M7 13a3 3 0 1 0 2 5.2h5" />
      <path d="M16 12a3 3 0 1 1-1.5 5.6L12 13" />
    </Icon>
  )
}

export function IconCode({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
    </Icon>
  )
}

export function IconFilter({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" />
    </Icon>
  )
}

export function IconClock({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  )
}

export function IconLayers({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </Icon>
  )
}

export function IconSpark({ size, strokeWidth, className, style }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} className={className} style={style}>
      <path d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5M18 6l-2.5 2.5M6 18l2.5-2.5M18 18l-2.5-2.5" />
    </Icon>
  )
}
