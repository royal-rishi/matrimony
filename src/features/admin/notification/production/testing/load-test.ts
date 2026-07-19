// ============================================================
// LOAD TEST UTILITY — Phase 11
// Simulates concurrent workloads across channels and compiles
// pipeline latencies, throughputs, and percentiles.
// ============================================================

export interface LoadTestResult {
  concurrency: number
  totalDispatched: number
  successCount: number
  failedCount: number
  avgLatencyMs: number
  p50Ms: number
  p95Ms: number
  p99Ms: number
  throughputPerSec: number
}

export class LoadTestRunner {
  /**
   * Run performance workload simulation
   */
  static async runSimulation(
    concurrency: number,
    channel: 'sms' | 'email' | 'whatsapp' | 'mixed'
  ): Promise<LoadTestResult> {
    const latencies: number[] = []
    let successCount = 0
    let failedCount = 0

    const start = Date.now()

    // Batched concurrent simulation loop
    const batchSize = Math.min(concurrency, 100)
    const batches = Math.ceil(concurrency / batchSize)

    for (let b = 0; b < batches; b++) {
      const activeSize = Math.min(batchSize, concurrency - b * batchSize)
      const tasks = Array.from({ length: activeSize }, async () => {
        const itemStart = Date.now()
        try {
          // Add random jitter representing network provider delay (e.g. 100-300ms)
          const delay = Math.random() * 200 + 100
          await new Promise((resolve) => setTimeout(resolve, delay))
          
          successCount++
          latencies.push(Date.now() - itemStart)
        } catch {
          failedCount++
        }
      })
      await Promise.all(tasks)
    }

    const elapsed = Date.now() - start
    latencies.sort((a, b) => a - b)
    const n = latencies.length

    const p50 = n > 0 ? latencies[Math.floor(n * 0.50)]! : 0
    const p95 = n > 0 ? latencies[Math.floor(n * 0.95)]! : 0
    const p99 = n > 0 ? latencies[Math.floor(n * 0.99)]! : 0
    const avg = n > 0 ? latencies.reduce((a, v) => a + v, 0) / n : 0

    return {
      concurrency,
      totalDispatched: successCount + failedCount,
      successCount,
      failedCount,
      avgLatencyMs: Math.round(avg),
      p50Ms: Math.round(p50),
      p95Ms: Math.round(p95),
      p99Ms: Math.round(p99),
      throughputPerSec: Number(((successCount + failedCount) / (elapsed / 1000)).toFixed(2)),
    }
  }
}
