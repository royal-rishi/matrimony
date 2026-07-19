// ============================================================
// NOTIFICATION ENGINE DI FACTORY
// ============================================================

import { NotificationOrchestrator } from '../orchestrator/notification-orchestrator'
import { NotificationScheduler } from '../scheduler/notification-scheduler'

export class NotificationFactory {
  /**
   * Builds and resolves a fully-wired orchestrator.
   */
  static createOrchestrator(): NotificationOrchestrator {
    return new NotificationOrchestrator()
  }

  /**
   * Builds and resolves a scheduler.
   */
  static createScheduler(): NotificationScheduler {
    return new NotificationScheduler()
  }
}
