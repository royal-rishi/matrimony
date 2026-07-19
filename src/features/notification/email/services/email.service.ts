// ============================================================
// EMAIL SERVICE (Orchestrator)
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { IEmailProvider } from '../interfaces/email-provider.interface'
import { EmailTemplateResolver } from './email-template.resolver'
import { EmailPreferenceResolver } from './email-preference.resolver'
import { EmailValidator } from '../validators/email.validator'
import { EmailLogger } from '../utils/email.logger'
import { EmailRenderer } from './email-renderer'
import { AttachmentService } from './attachment.service'
import { TrackingService } from './tracking.service'
import type { EmailSendResult, EmailPayload, EmailAttachment } from '../types/email.types'
import { EMAIL_CONFIG } from '../config/email.config'
import { ANALYTICS_CONFIG } from '../config/analytics.config'
import type { NotificationPriority, QueueStatus } from '../../types/notification-database.types'

export class EmailService {
  private readonly templateResolver = new EmailTemplateResolver()
  private readonly preferenceResolver = new EmailPreferenceResolver()
  private readonly validator = new EmailValidator()

  constructor(public readonly provider: IEmailProvider) {}

  /**
   * Orchestrates the complete email dispatch flow: validations, preferences,
   * template compilation, HTML rendering, tracking injection, attachments checking,
   * database queueing, and gateway transport.
   */
  async sendEmail(
    toEmail: string,
    eventType: string,
    templateVariables: Record<string, string | number | boolean> = {},
    options: {
      userId?: string
      notificationId?: string
      priority?: NotificationPriority
      scheduledFor?: Date
      attachments?: EmailAttachment[]
      fromEmail?: string
      fromName?: string
      replyTo?: string
    } = {}
  ): Promise<EmailSendResult> {
    try {
      // 1. Syntax Validation
      if (!this.validator.isValidEmail(toEmail)) {
        return { success: false, status: 'failed', error: 'Invalid email syntax format.' }
      }

      // 2. Google Workspace domain check (if fromEmail specified)
      const fromEmail = options.fromEmail || EMAIL_CONFIG.fromEmail
      if (options.fromEmail && !this.validator.isDomainAllowed(options.fromEmail)) {
        return { success: false, status: 'failed', error: 'Sender email domain not allowed.' }
      }

      // 3. User preference check
      if (options.userId) {
        const prefAllowed = await this.preferenceResolver.isEmailAllowed(options.userId, eventType)
        if (!prefAllowed.allowed) {
          return { success: false, status: 'cancelled', error: prefAllowed.reason || 'Email preference opt-out.' }
        }
      }

      // 4. Resolve Template
      const template = await this.templateResolver.resolveTemplate(eventType)
      if (!template) {
        return { success: false, status: 'failed', error: `Template not resolved for event: ${eventType}` }
      }

      // 5. Anti-spam Duplicate Check
      const renderedSubject = this.templateResolver.renderString(template.subject, templateVariables)
      const isDup = await this.validator.isDuplicateSend(toEmail, renderedSubject)
      if (isDup) {
        return { success: false, status: 'cancelled', error: 'Duplicate email detected. Suppressed by spam filter.' }
      }

      // 6. Validate Attachments
      if (options.attachments && options.attachments.length > 0) {
        const attachmentValidation = AttachmentService.validateAttachments(options.attachments)
        if (!attachmentValidation.isValid) {
          return { success: false, status: 'failed', error: attachmentValidation.error }
        }
      }

      // 7. Render layout with blocks & variables
      const maskedVars = this.validator.maskSensitiveData(templateVariables)
      const renderedBody = this.templateResolver.renderString(template.body, maskedVars)
      const ctaText = template.ctaText ? this.templateResolver.renderString(template.ctaText, maskedVars) : undefined
      const ctaUrl = template.ctaUrl ? this.templateResolver.renderString(template.ctaUrl, maskedVars) : undefined

      const compiledHtml = EmailRenderer.render(renderedBody, renderedSubject, {
        theme: template.theme,
        ctaText,
        ctaUrl,
      })

      // 8. Persist to email_queue
      const supabase = await createClient()

      let finalNotificationId = options.notificationId
      if (!finalNotificationId && options.userId) {
        const { data: newNotif, error: notifErr } = await supabase
          .from('notifications')
          .insert({
            user_id: options.userId,
            type: eventType,
            title: renderedSubject,
            body: renderedBody.replace(/<[^>]*>/g, ''), // Strip tags for preview body
            priority: options.priority || 'normal',
            channels: ['email'],
            status: 'pending',
          })
          .select('id')
          .maybeSingle()

        if (notifErr || !newNotif) {
          console.error('[EmailService] Failed to insert parent notification:', notifErr)
          return { success: false, status: 'failed', error: 'Failed to record parent notification.' }
        }
        finalNotificationId = newNotif.id
      } else if (!finalNotificationId) {
        return { success: false, status: 'failed', error: 'Missing userId or notificationId to link email.' }
      }

      const isScheduled = options.scheduledFor && options.scheduledFor.getTime() > Date.now()
      const initialStatus: QueueStatus = isScheduled ? 'scheduled' : 'pending'
      const scheduledTimeStr = options.scheduledFor ? options.scheduledFor.toISOString() : new Date().toISOString()

      const { data: queueRow, error: queueErr } = await supabase
        .from('email_queue')
        .insert({
          notification_id: finalNotificationId as string,
          to_email: toEmail,
          to_name: options.userId ? 'Valued Member' : undefined,
          from_email: fromEmail,
          from_name: options.fromName || EMAIL_CONFIG.fromName,
          reply_to: options.replyTo || EMAIL_CONFIG.replyTo,
          subject: renderedSubject,
          html_body: compiledHtml,
          text_body: renderedBody.replace(/<[^>]*>/g, ''),
          template_id: template.templateId || null,
          template_variables: templateVariables,
          priority: options.priority || 'normal',
          status: initialStatus,
          scheduled_for: scheduledTimeStr,
          provider: this.provider.providerId,
          attempts: 0,
          max_attempts: 5,
          attachments: options.attachments || [],
        })
        .select('id')
        .maybeSingle()

      if (queueErr || !queueRow) {
        console.error('[EmailService] Failed to write to email_queue:', queueErr)
        return { success: false, status: 'failed', error: 'Database queue write failure.' }
      }

      // 9. tracking Injection
      const finalHtmlWithTracking = TrackingService.injectOpenTrackingPixel(
        TrackingService.wrapLinks(compiledHtml, queueRow.id),
        queueRow.id
      )

      // Update queue row HTML with tracking links
      await supabase
        .from('email_queue')
        .update({ html_body: finalHtmlWithTracking })
        .eq('id', queueRow.id)

      // Write initial audit log
      const logId = await EmailLogger.logAction({
        notificationId: finalNotificationId as string,
        userId: options.userId || '00000000-0000-0000-0000-000000000000',
        event: eventType,
        status: isScheduled ? 'pending' : 'sent',
        provider: this.provider.providerId,
        recipientEmail: toEmail,
        requestPayload: { to: toEmail, subject: renderedSubject, hasAttachments: !!options.attachments },
        retryCount: 0,
        costUnits: ANALYTICS_CONFIG.defaultCostPerEmail,
      })

      if (isScheduled) {
        return {
          success: true,
          emailQueueId: queueRow.id,
          status: 'scheduled',
        }
      }

      // 10. Update queue status -> 'processing'
      await supabase
        .from('email_queue')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', queueRow.id)

      // 11. Dispatch via provider
      const payload: EmailPayload = {
        toEmail,
        toName: options.userId ? 'Valued Member' : undefined,
        subject: renderedSubject,
        htmlBody: finalHtmlWithTracking,
        fromEmail,
        fromName: options.fromName || EMAIL_CONFIG.fromName,
        replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
        attachments: options.attachments,
        templateId: template.templateId,
        variables: templateVariables,
      }

      const dispatchResult = await this.provider.send(payload)

      if (dispatchResult.success) {
        // Update database queue completed
        await supabase
          .from('email_queue')
          .update({
            status: 'completed',
            sent_at: new Date().toISOString(),
            provider_message_id: dispatchResult.providerMessageId,
            provider_response: dispatchResult.providerResponse,
            attempts: 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', queueRow.id)

        if (logId) {
          await EmailLogger.markDelivered(logId, finalNotificationId as string, dispatchResult.providerMessageId || '', dispatchResult.providerResponse)
        }

        return {
          success: true,
          emailQueueId: queueRow.id,
          providerMessageId: dispatchResult.providerMessageId,
          status: 'sent',
        }
      } else {
        // Update database queue failed
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            last_error: dispatchResult.error || 'Provider send failed',
            provider_response: dispatchResult.providerResponse,
            attempts: 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', queueRow.id)

        if (logId) {
          await EmailLogger.markFailed(logId, finalNotificationId as string, dispatchResult.error || 'Provider dispatch failed', 'PROVIDER_ERROR', this.provider.providerId)
        }

        return {
          success: false,
          emailQueueId: queueRow.id,
          status: 'failed',
          error: dispatchResult.error || 'Provider send failed',
        }
      }
    } catch (err) {
      console.error('[EmailService] Send email exception:', err)
      return {
        success: false,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown internal error',
      }
    }
  }
}
