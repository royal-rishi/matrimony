// ============================================================
// PIPELINE MIDDLEWARE CONTEXT RUNNER
// ============================================================

import type { PipelineContext, PipelineStage } from '../types/engine.types'
import { NotificationMiddleware } from '../middleware/notification-middleware'
import { NotificationResolver } from '../resolver/notification-resolver'
import { NotificationRouter } from '../routing/notification-router'

export class NotificationPipeline {
  private stages: PipelineStage[] = []

  constructor() {
    // Seed default sequential middleware stages
    this.stages = [
      NotificationMiddleware.validatePayload,
      NotificationMiddleware.preventDuplicates,
      NotificationMiddleware.enforceRateLimit,
      NotificationResolver.resolveUserAndPreferences,
      NotificationRouter.routeAndFailover,
    ]
  }

  /**
   * Registers custom middleware stage.
   */
  use(stage: PipelineStage): this {
    this.stages.push(stage)
    return this
  }

  /**
   * Runs the context payload through the pipeline.
   */
  async execute(context: PipelineContext): Promise<PipelineContext> {
    let current = context

    for (const stage of this.stages) {
      if (current.isCancelled) {
        break
      }
      current = await stage(current)
    }

    return current
  }
}
