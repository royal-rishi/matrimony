import { z } from 'zod'

export const CASE_STAGES = [
  'new',
  'requirement_collection',
  'searching',
  'profiles_shared',
  'interested',
  'family_discussion',
  'meeting_scheduled',
  'meeting_completed',
  'engagement',
  'marriage_completed',
  'closed',
] as const

export const CASE_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const
export const MEETING_TYPES = ['virtual', 'in_person', 'phone'] as const
export const CLIENT_RESPONSES = ['pending', 'interested', 'not_interested', 'maybe'] as const

export const createCaseSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid client User ID' }),
  associateId: z.string().uuid({ message: 'Invalid Associate ID' }),
  priority: z.enum(CASE_PRIORITIES).default('normal'),
  requirementNotes: z.string().optional(),
  targetMatchBy: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid target match date format',
  }),
})

export const updateCaseStageSchema = z.object({
  caseId: z.string().uuid({ message: 'Invalid Case ID' }),
  status: z.enum(CASE_STAGES),
  notes: z.string().min(1, { message: 'Notes are required for stage transition audit log' }),
})

export const addNoteSchema = z.object({
  caseId: z.string().uuid({ message: 'Invalid Case ID' }),
  note: z.string().min(3, { message: 'Note must be at least 3 characters long' }),
})

export const attendeeSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  role: z.string().min(2, { message: 'Role is required' }),
  confirmed: z.boolean().default(false),
})

export const scheduleMeetingSchema = z.object({
  caseId: z.string().uuid({ message: 'Invalid Case ID' }),
  title: z.string().min(3, { message: 'Meeting title must be at least 3 characters' }),
  meetingType: z.enum(MEETING_TYPES).default('virtual'),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid meeting schedule date',
  }),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  attendees: z.array(attendeeSchema).default([]),
  meetingLink: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  notes: z.string().optional(),
})

export const completeMeetingSchema = z.object({
  meetingId: z.string().uuid({ message: 'Invalid Meeting ID' }),
  outcome: z.string().min(5, { message: 'Please record meeting outcome details (min 5 chars)' }),
  notes: z.string().optional(),
})

export const addReminderSchema = z.object({
  caseId: z.string().uuid({ message: 'Invalid Case ID' }),
  title: z.string().min(3, { message: 'Reminder title must be at least 3 characters' }),
  body: z.string().optional(),
  dueAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid reminder due date',
  }),
})

export const shareProfileSchema = z.object({
  caseId: z.string().uuid({ message: 'Invalid Case ID' }),
  sharedProfileId: z.string().uuid({ message: 'Invalid Shared Profile ID' }),
  notes: z.string().optional(),
})

export const updateShareResponseSchema = z.object({
  shareId: z.string().uuid({ message: 'Invalid Share ID' }),
  clientResponse: z.enum(CLIENT_RESPONSES),
  notes: z.string().optional(),
})
