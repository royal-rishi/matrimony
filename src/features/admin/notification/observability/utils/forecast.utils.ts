// ============================================================
// FORECAST UTILITIES — Phase 10
// Linear Regression, Moving Average, Confidence Intervals
// ============================================================

/**
 * Simple Ordinary Least Squares (OLS) linear regression.
 * Returns slope, intercept, and coefficient of determination (R²).
 */
export function linearRegression(
  xs: number[],
  ys: number[]
): { slope: number; intercept: number; r2: number } {
  const n = xs.length
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0 }

  const sumX = xs.reduce((a, x) => a + x, 0)
  const sumY = ys.reduce((a, y) => a + y, 0)
  const sumXY = xs.reduce((a, x, i) => a + x * (ys[i] ?? 0), 0)
  const sumXX = xs.reduce((a, x) => a + x * x, 0)

  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 }

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  // R² = 1 - SS_res / SS_tot
  const yMean = sumY / n
  const ssTot = ys.reduce((a, y) => a + (y - yMean) ** 2, 0)
  const ssRes = ys.reduce((a, y, i) => {
    const predicted = slope * (xs[i] ?? 0) + intercept
    return a + (y - predicted) ** 2
  }, 0)

  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot)

  return { slope, intercept, r2 }
}

/**
 * Forecast the next `futureSteps` values using linear regression
 * applied to the provided historical values.
 *
 * @param values   Historical data points (ordered oldest → newest)
 * @param futureSteps  Number of future data points to predict
 * @returns Array of predicted values
 */
export function forecastLinear(values: number[], futureSteps: number): number[] {
  if (values.length === 0) return Array(futureSteps).fill(0)

  const xs = values.map((_, i) => i)
  const { slope, intercept } = linearRegression(xs, values)

  const n = values.length
  return Array.from({ length: futureSteps }, (_, i) => {
    const predicted = slope * (n + i) + intercept
    return Math.max(0, predicted) // Clamp to non-negative
  })
}

/**
 * Simple moving average (SMA) over a fixed window.
 * First `window - 1` entries use partial windows.
 */
export function movingAverage(values: number[], window: number): number[] {
  if (window <= 0 || values.length === 0) return values.slice()
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1)
    const slice = values.slice(start, i + 1)
    return slice.reduce((a, v) => a + v, 0) / slice.length
  })
}

/**
 * Calculate a ±1 standard deviation confidence interval for a dataset.
 */
export function confidenceInterval(
  values: number[]
): { lower: number; upper: number; stdDev: number } {
  if (values.length === 0) return { lower: 0, upper: 0, stdDev: 0 }

  const mean = values.reduce((a, v) => a + v, 0) / values.length
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length
  const stdDev = Math.sqrt(variance)

  return {
    lower: Math.max(0, mean - stdDev),
    upper: mean + stdDev,
    stdDev,
  }
}

/**
 * Calculate period-over-period growth rate as a percentage.
 * Returns 0 if previous is 0.
 */
export function growthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Determine trend direction from a sequence of values.
 * Uses the slope of a linear regression across all values.
 */
export function trendDirection(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable'
  const xs = values.map((_, i) => i)
  const { slope } = linearRegression(xs, values)

  const mean = values.reduce((a, v) => a + v, 0) / values.length
  const relativeSlope = mean !== 0 ? Math.abs(slope / mean) : Math.abs(slope)

  if (relativeSlope < 0.02) return 'stable' // < 2% change per step = stable
  return slope > 0 ? 'up' : 'down'
}

/**
 * Normalise a forecast value to at least 0.
 */
export function clampPositive(value: number): number {
  return Math.max(0, value)
}

/**
 * Compute the exponential moving average (EMA) with a given smoothing factor.
 * alpha: 0–1 (higher = more weight on recent values)
 */
export function exponentialMovingAverage(values: number[], alpha: number = 0.3): number[] {
  if (values.length === 0) return []
  const result: number[] = [values[0] ?? 0]
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * (values[i] ?? 0) + (1 - alpha) * (result[i - 1] ?? 0))
  }
  return result
}

/**
 * Build ISO date strings for the next N days starting from tomorrow.
 */
export function futureDateLabels(days: number, from?: Date): string[] {
  const base = from ?? new Date()
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i + 1)
    return d.toISOString().split('T')[0] ?? ''
  })
}

/**
 * Build ISO date strings for the past N days (oldest first).
 */
export function pastDateLabels(days: number, until?: Date): string[] {
  const base = until ?? new Date()
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() - (days - i - 1))
    return d.toISOString().split('T')[0] ?? ''
  })
}
