interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  rounded?: boolean
}

export function Skeleton({ width = '100%', height = 16, className = '', rounded = false }: SkeletonProps) {
  return (
    <div
      className={`ta-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded ? 999 : 6,
      }}
    />
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {['Line', 'Product Description', 'HS Code', 'Confidence', 'Risk', 'Action'].map((h) => (
            <th
              key={h}
              style={{
                textAlign: 'left',
                padding: '11px 15px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                borderBottom: '1px solid #E2E8F0',
                background: '#F8FAFC',
                whiteSpace: 'nowrap',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
            <td style={{ padding: '12px 15px' }}>
              <Skeleton width={24} height={14} />
            </td>
            <td style={{ padding: '12px 15px', maxWidth: 360 }}>
              <Skeleton width="85%" height={14} className="mb-1.5" />
              <Skeleton width="45%" height={11} />
            </td>
            <td style={{ padding: '12px 15px' }}>
              <Skeleton width={100} height={14} className="mb-1" />
              <Skeleton width={140} height={11} />
            </td>
            <td style={{ padding: '12px 15px' }}>
              <Skeleton width={52} height={20} rounded />
            </td>
            <td style={{ padding: '12px 15px' }}>
              <Skeleton width={64} height={22} rounded />
            </td>
            <td style={{ padding: '12px 15px', textAlign: 'right' }}>
              <Skeleton width={60} height={14} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
