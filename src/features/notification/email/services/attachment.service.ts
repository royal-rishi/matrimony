// ============================================================
// EMAIL ATTACHMENT PROCESSING SERVICE
// ============================================================

import type { EmailAttachment } from '../types/email.types'

export class AttachmentService {
  private static readonly MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;  // 5 MB
  private static readonly MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  /**
   * Validates structure, MIME types, and total size of attachments.
   */
  static validateAttachments(attachments: EmailAttachment[]): { isValid: boolean; error?: string } {
    if (!attachments || attachments.length === 0) {
      return { isValid: true }
    }

    let totalSizeBytes = 0

    for (const att of attachments) {
      // 1. Check filename
      if (!att.filename) {
        return { isValid: false, error: 'Attachment filename is required.' }
      }

      // 2. Validate MIME type
      if (!this.ALLOWED_MIME_TYPES.includes(att.contentType)) {
        return {
          isValid: false,
          error: `MIME type ${att.contentType} for file ${att.filename} is not allowed.`,
        }
      }

      // 3. Validate base64 structure and size
      if (!att.content) {
        return { isValid: false, error: `Content payload missing for file ${att.filename}.` }
      }

      // Estimate byte size from base64 string
      const padding = (att.content.match(/=/g) || []).length
      const sizeBytes = (att.content.length * 3) / 4 - padding

      if (sizeBytes > this.MAX_FILE_SIZE_BYTES) {
        return {
          isValid: false,
          error: `File ${att.filename} exceeds maximum size limit of 5MB.`,
        }
      }

      totalSizeBytes += sizeBytes
    }

    if (totalSizeBytes > this.MAX_TOTAL_SIZE_BYTES) {
      return {
        isValid: false,
        error: `Total attachments size (${Math.round(totalSizeBytes / 1024 / 1024)}MB) exceeds maximum limit of 10MB.`,
      }
    }

    return { isValid: true }
  }

  /**
   * Helper to convert a Node Buffer into a Base64 EmailAttachment DTO.
   */
  static createAttachmentFromBuffer(
    buffer: Buffer,
    filename: string,
    contentType: string,
    cid?: string
  ): EmailAttachment {
    return {
      filename,
      content: buffer.toString('base64'),
      contentType,
      cid,
    }
  }
}
