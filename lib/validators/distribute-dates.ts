import { z } from 'zod'

export const DistributeDatesResponseSchema = z.object({
  assignments: z.array(z.object({
    temp_id: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    channel: z.string().nullable(),
    reason: z.string()
  })),
  overflow_items: z.array(z.object({
    temp_id: z.string(),
    reason: z.string()
  })),
  warnings: z.array(z.object({
    type: z.enum(['info', 'warning', 'overflow']),
    message: z.string()
  }))
})

export type DistributeDatesResponse = z.infer<typeof DistributeDatesResponseSchema>
