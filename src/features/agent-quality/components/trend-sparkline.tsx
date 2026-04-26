import { useMemo } from 'react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { DotItemDotProps } from 'recharts/types/util/types'

export interface TrendSparklinePoint {
  date: string // YYYY-MM-DD
  value: number | null
}

export interface TrendSparklineProps {
  data: TrendSparklinePoint[]
  label: string
  tooltipFormat?: (value: number | null, date: string) => string
  onPointClick?: (date: string, value: number | null) => void
  className?: string
  height?: number
}

/**
 * Custom dot render function for the Line component.
 *
 * Click-handler approach: function-as-dot (DotType render function).
 * We receive DotItemDotProps which includes `cx`, `cy`, `payload`, and `index`.
 * Since DotItemDotProps extends SVGPropsNoEvents (events stripped), we cannot
 * rely on spread-based onClick — instead we render a plain <circle> SVG element
 * with a native React onClick attached directly. This passes tsc cleanly and
 * gives precise per-dot click targets.
 */
function makeDotRenderer(
  onPointClick: ((date: string, value: number | null) => void) | undefined,
) {
  return function CustomDot(props: DotItemDotProps) {
    const { cx, cy, payload } = props as DotItemDotProps & {
      cx?: number
      cy?: number
      payload: { date: string; value: number | null }
    }

    // Skip rendering dots for null values (they appear as gap segments)
    if (payload.value == null || cx == null || cy == null) return null

    const handleClick = onPointClick
      ? () => onPointClick(payload.date, payload.value)
      : undefined

    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1}
        cursor={onPointClick ? 'pointer' : 'default'}
        onClick={handleClick}
      />
    )
  }
}

export function TrendSparkline({
  data,
  label,
  tooltipFormat,
  onPointClick,
  className,
  height = 80,
}: TrendSparklineProps) {
  const chartData = useMemo(
    () => data.map((d) => ({ date: d.date, value: d.value })),
    [data],
  )

  const allNull = chartData.every((d) => d.value == null)

  const dotRenderer = useMemo(
    () => makeDotRenderer(onPointClick),
    [onPointClick],
  )

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {allNull && (
          <span className="text-xs text-muted-foreground">Veri yok</span>
        )}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
          >
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[0, 'dataMax']} />
            <Tooltip
              formatter={(v: number) =>
                tooltipFormat
                  ? tooltipFormat(v, '')
                  : `${(v * 100).toFixed(2)}%`
              }
              labelFormatter={(lbl: string) => lbl}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="currentColor"
              strokeWidth={2}
              dot={dotRenderer}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
