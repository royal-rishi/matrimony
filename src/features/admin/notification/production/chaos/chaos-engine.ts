// ============================================================
// CHAOS ENGINE — Phase 11
// Simulates network delays, packet loss, provider disconnects,
// database blocks, and worker crash scenarios.
// ============================================================

export interface ChaosConfig {
  smsProviderDisabled: boolean
  emailProviderDisabled: boolean
  whatsappProviderDisabled: boolean
  dbLatencySimulated: boolean
  workerCrashed: boolean
  packetLossPercent: number // 0 - 100
}

export class ChaosEngine {
  private static config: ChaosConfig = {
    smsProviderDisabled: false,
    emailProviderDisabled: false,
    whatsappProviderDisabled: false,
    dbLatencySimulated: false,
    workerCrashed: false,
    packetLossPercent: 0,
  }

  static getStatus(): ChaosConfig {
    return { ...this.config }
  }

  static configure(updates: Partial<ChaosConfig>): ChaosConfig {
    this.config = { ...this.config, ...updates }
    return this.getStatus()
  }

  static reset(): ChaosConfig {
    this.config = {
      smsProviderDisabled: false,
      emailProviderDisabled: false,
      whatsappProviderDisabled: false,
      dbLatencySimulated: false,
      workerCrashed: false,
      packetLossPercent: 0,
    }
    return this.getStatus()
  }

  /**
   * Evaluates if a simulated network packet fails due to packet loss
   */
  static isPacketLost(): boolean {
    if (this.config.packetLossPercent <= 0) return false
    if (this.config.packetLossPercent >= 100) return true
    return Math.random() * 100 < this.config.packetLossPercent
  }

  /**
   * Injects network latency if database slowdown is active
   */
  static async injectDbSlowdown(): Promise<void> {
    if (this.config.dbLatencySimulated) {
      // Simulate heavy query block
      const delay = Math.random() * 1500 + 500
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  /**
   * Checks if a specific provider is temporarily disconnected under chaos testing
   */
  static isProviderOnline(provider: 'sms' | 'email' | 'whatsapp'): boolean {
    if (provider === 'sms' && this.config.smsProviderDisabled) return false
    if (provider === 'email' && this.config.emailProviderDisabled) return false
    if (provider === 'whatsapp' && this.config.whatsappProviderDisabled) return false
    return true
  }
}
