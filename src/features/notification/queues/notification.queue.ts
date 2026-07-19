// ============================================================
// NOTIFICATION QUEUE — STUB
// Phase 2: Wire into a proper background job queue
// (e.g. BullMQ with Redis, Trigger.dev, or Inngest).
//
// Currently a simple in-memory promise queue for sequential
// processing — sufficient for Phase 1 in-app notifications
// since Supabase Realtime handles the delivery.
// ============================================================

import type { CreateNotificationInput, NotificationResult } from '../types/notification.types'
import { createNotificationService } from '../services/notification-service.factory'
import { NOTIFICATION_CONFIG } from '../config/notification.config'

type QueuedJob = {
  id: string
  input: CreateNotificationInput
  enqueuedAt: string
  retryCount: number
}

class NotificationQueue {
  private queue: QueuedJob[] = []
  private processing = false

  /**
   * Add a notification to the queue.
   */
  enqueue(input: CreateNotificationInput): string {
    const jobId = crypto.randomUUID()
    this.queue.push({
      id: jobId,
      input,
      enqueuedAt: new Date().toISOString(),
      retryCount: 0,
    })

    if (!this.processing) {
      // Start processing without blocking the caller
      void this.processNext()
    }

    return jobId
  }

  /**
   * Add multiple notifications to the queue.
   */
  enqueueBatch(inputs: CreateNotificationInput[]): string[] {
    return inputs.map((input) => this.enqueue(input))
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return
    this.processing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()!
      await this.processJob(job)
    }

    this.processing = false
  }

  private async processJob(job: QueuedJob): Promise<NotificationResult | null> {
    const service = createNotificationService()
    const maxRetries = NOTIFICATION_CONFIG.maxRetryAttempts
    const baseDelay = NOTIFICATION_CONFIG.retryBaseDelayMs

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await service.createAndSend(job.input)
        if (result.success) return result

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt) // exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      } catch (err) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          console.error(`[NotificationQueue] Job ${job.id} failed after ${maxRetries} retries:`, err)
        }
      }
    }

    return null
  }

  /** Returns the current queue depth (for monitoring) */
  get depth(): number {
    return this.queue.length
  }
}

/** Singleton queue instance */
export const notificationQueue = new NotificationQueue()
