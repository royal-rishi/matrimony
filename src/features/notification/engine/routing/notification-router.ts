// ============================================================
// PIPELINE ROUTER (Evaluates channel priorities, health & fallback routing)
// ============================================================

import type { PipelineContext } from '../types/engine.types'
import type { NotificationChannel } from '../../interfaces/notification-provider.interface'
import { createNotificationService } from '../../services/notification-service.factory'

export class NotificationRouter {
  /**
   * Routes channels, checking provider health status and substituting fallbacks.
   * WhatsApp <-> SMS failovers are triggered if a primary channel is unhealthy.
   */
  static async routeAndFailover(context: PipelineContext): Promise<PipelineContext> {
    if (context.isCancelled) return context

    const requested = context.payload.channels || ['in_app', 'email', 'whatsapp']
    const resolved: NotificationChannel[] = []

    // 1. Get health status of active providers
    const service = createNotificationService()
    const activeProviders = (service as any).providers || []

    const isProviderHealthy = async (channel: NotificationChannel): Promise<boolean> => {
      const provider = activeProviders.find((p: any) => p.channel === channel)
      if (!provider) return false
      try {
        const check = await provider.healthCheck()
        return check.isHealthy
      } catch {
        return false
      }
    }

    // 2. Evaluate targets
    for (const channel of requested) {
      // Must be allowed by preferences
      if (!context.allowedChannels.includes(channel)) {
        context.logs.push(`Router Stage: '${channel}' bypassed (disabled in user preferences).`)
        continue
      }

      const healthy = await isProviderHealthy(channel)

      if (healthy) {
        resolved.push(channel)
      } else {
        context.logs.push(`Router Stage: Provider for '${channel}' is UNHEALTHY. Initiating fallback checks...`)
        
        // WhatsApp fallback to SMS
        if (channel === 'whatsapp') {
          if (context.allowedChannels.includes('sms')) {
            const smsHealthy = await isProviderHealthy('sms')
            if (smsHealthy) {
              resolved.push('sms')
              context.logs.push(`Router Stage: Fallback routed WhatsApp -> SMS.`)
            } else {
              context.logs.push(`Router Stage: Failover SMS channel is also unhealthy.`)
            }
          } else {
            context.logs.push(`Router Stage: User opt-out prevents WhatsApp -> SMS fallback.`)
          }
        }
        // SMS fallback to WhatsApp
        else if (channel === 'sms') {
          if (context.allowedChannels.includes('whatsapp')) {
            const waHealthy = await isProviderHealthy('whatsapp')
            if (waHealthy) {
              resolved.push('whatsapp')
              context.logs.push(`Router Stage: Fallback routed SMS -> WhatsApp.`)
            } else {
              context.logs.push(`Router Stage: Failover WhatsApp channel is also unhealthy.`)
            }
          } else {
            context.logs.push(`Router Stage: User opt-out prevents SMS -> WhatsApp fallback.`)
          }
        }
      }
    }

    // Ensure we always have at least in_app delivery
    if (resolved.length === 0) {
      resolved.push('in_app')
      context.logs.push('Router Stage: No healthy channels resolved, fell back to in_app.')
    }

    context.allowedChannels = resolved
    return context
  }
}
