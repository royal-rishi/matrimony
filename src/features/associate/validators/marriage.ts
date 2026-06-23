import { z } from 'zod'

export const recordMarriageSuccessSchema = z.object({
  caseId: z.string().uuid({ message: 'Invalid Case ID' }).optional().nullable(),
  groomId: z.string().uuid({ message: 'Invalid Groom Profile ID' }),
  brideId: z.string().uuid({ message: 'Invalid Bride Profile ID' }),
  marriageDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid marriage date',
  }),
  engagementDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid engagement date',
  }),
  successStory: z.string().min(50, { message: 'Success story must be at least 50 characters long' }),
  photos: z.array(z.string()).min(1, { message: 'At least one photo is required' }),
})
