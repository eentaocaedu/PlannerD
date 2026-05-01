import { z } from 'zod'

const emptyToNull = (val: any) => (val === "" ? null : val)

export const ParsedPlanItemSchema = z.object({
  date: z.preprocess(emptyToNull, z.string().nullable()),
  time: z.preprocess(emptyToNull, z.string().nullable()),
  channel: z.preprocess(emptyToNull, z.string().nullable()),
  format: z.preprocess(emptyToNull, z.string().nullable()),
  title: z.preprocess(emptyToNull, z.string().nullable()),
  caption: z.preprocess(emptyToNull, z.string().nullable()),
  creative_direction: z.preprocess(emptyToNull, z.string().nullable()),
  reference_url: z.preprocess(emptyToNull, z.string().nullable()),
  internal_notes: z.preprocess(emptyToNull, z.string().nullable())
}).refine(data => data.title || data.caption, {
  message: "Cada item precisa ter pelo menos um título ou legenda."
})

export const ParsedPlanWarningSchema = z.object({
  type: z.string(),
  message: z.string()
})

export const ParsedPlanSchema = z.object({
  client_name: z.string().nullable(),
  month: z.number().min(1).max(12).nullable(),
  year: z.number().min(2024).max(2100).nullable(),
  title: z.string().nullable(),
  items: z.array(ParsedPlanItemSchema),
  warnings: z.array(ParsedPlanWarningSchema)
})

export type ParsedPlan = z.infer<typeof ParsedPlanSchema>
export type ParsedPlanItem = z.infer<typeof ParsedPlanItemSchema>
export type ParsedPlanWarning = z.infer<typeof ParsedPlanWarningSchema>
