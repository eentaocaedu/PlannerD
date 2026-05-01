import { Database } from './database'

export type Client = Database['public']['Tables']['clients']['Row']

export type Plan = {
  id: string
  owner_id: string
  client_id: string
  title: string
  month: number
  year: number
  status: string
  public_token: string | null
  import_source_text: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
  approved_at: string | null
  presentation_text: string | null
}

export type PlanItem = {
  id: string
  plan_id: string
  date: string | null
  time: string | null
  channel: string | null
  format: string | null
  title: string | null
  caption: string | null
  creative_direction: string | null
  reference_url: string | null
  internal_notes: string | null
  status: string
  sort_order: number
  created_at: string
  updated_at: string
}

export type PlanComment = {
  id: string
  plan_id: string
  plan_item_id: string | null
  author_type: 'owner' | 'client'
  author_name: string | null
  comment: string
  status: string
  created_at: string
}

export type ApprovalEvent = {
  id: string
  plan_id: string
  event_type: string
  message: string | null
  created_at: string
}

export type ParsedPlanItem = {
  date: string | null
  time: string | null
  channel: string | null
  format: string | null
  title: string | null
  caption: string | null
  creative_direction: string | null
  reference_url: string | null
  internal_notes: string | null
}

export type ParsedPlanWarning = {
  type: string
  message: string
}

export type ParsedPlan = {
  client_name: string | null
  month: number | null
  year: number | null
  title: string | null
  presentation_text: string | null
  items: ParsedPlanItem[]
  warnings: ParsedPlanWarning[]
}
