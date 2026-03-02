import { useState } from 'react'

interface BarChartData {
  label: string
  value: number
}

interface BarChartProps {
  data: BarChartData[]
  height?: number
  barColor?: string
  formatValue?: (value: number) => string
  formatLabel?: (label: string) => string
}

const CHART_PADDING = { top: 10, right: 10, bottom: 40, left: 60 }

export function BarChart({
  data,
  height = 200,
  barColor = 'var(--color-primary)',
  formatValue = (v) => `$${v.toFixed(4)}`,
  formatLabel = (l) => l,
}: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (data.length === 0) return null

  const maxValue = Math.max(...data.map((d) => d.value), 0.0001)
  const width = Math.max(data.length * 40, 300)
  const chartWidth = width - CHART_PADDING.left - CHART_PADDING.right
  const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom
  const barWidth = Math.min(Math.max(chartWidth / data.length - 4, 8), 32)
  const barGap = (chartWidth - barWidth * data.length) / (data.length + 1)

  // Y-axis ticks (4 ticks)
  const yTicks = Array.from({ length: 4 }, (_, i) => (maxValue / 3) * i)

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={width}
        height={height}
        className="select-none"
        role="img"
        aria-label="Bar chart"
      >
        {/* Y-axis grid lines and labels */}
        {yTicks.map((tick, i) => {
          const y = CHART_PADDING.top + chartHeight - (tick / maxValue) * chartHeight
          return (
            <g key={i}>
              <line
                x1={CHART_PADDING.left}
                y1={y}
                x2={width - CHART_PADDING.right}
                y2={y}
                stroke="var(--color-border)"
                strokeDasharray="4 2"
              />
              <text
                x={CHART_PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-text-tertiary"
              >
                {formatValue(tick)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = Math.max((d.value / maxValue) * chartHeight, 1)
          const x = CHART_PADDING.left + barGap + i * (barWidth + barGap)
          const y = CHART_PADDING.top + chartHeight - barHeight

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={2}
                fill={hoveredIndex === i ? barColor : barColor + 'CC'}
                className="transition-colors"
              />

              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={CHART_PADDING.top + chartHeight + 16}
                textAnchor="middle"
                className="text-[10px] fill-text-tertiary"
                transform={`rotate(-30, ${x + barWidth / 2}, ${CHART_PADDING.top + chartHeight + 16})`}
              >
                {formatLabel(d.label)}
              </text>

              {/* Hover tooltip */}
              {hoveredIndex === i && (
                <g>
                  <rect
                    x={x + barWidth / 2 - 40}
                    y={y - 28}
                    width={80}
                    height={22}
                    rx={4}
                    fill="var(--color-surface)"
                    stroke="var(--color-border)"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 14}
                    textAnchor="middle"
                    className="text-[11px] fill-text-primary font-medium"
                  >
                    {formatValue(d.value)}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* X and Y axes */}
        <line
          x1={CHART_PADDING.left}
          y1={CHART_PADDING.top}
          x2={CHART_PADDING.left}
          y2={CHART_PADDING.top + chartHeight}
          stroke="var(--color-border)"
        />
        <line
          x1={CHART_PADDING.left}
          y1={CHART_PADDING.top + chartHeight}
          x2={width - CHART_PADDING.right}
          y2={CHART_PADDING.top + chartHeight}
          stroke="var(--color-border)"
        />
      </svg>
    </div>
  )
}
