'use server'

import { createClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { ParsedPlan, ParsedPlanItem } from '@/types/plan'
import { revalidatePath } from 'next/cache'

/**
 * Normaliza campos removendo strings vazias e transformando em null
 */
function normalizeItemData(data: any) {
  const normalized: any = {}
  const fields = [
    'plan_id', 'date', 'time', 'channel', 'format', 
    'title', 'caption', 'creative_direction', 
    'reference_url', 'internal_notes', 'status', 'sort_order'
  ]

  fields.forEach(field => {
    if (data[field] === '' || data[field] === undefined) {
      normalized[field] = null
    } else {
      normalized[field] = data[field]
    }
  })

  // Garantir status default
  if (!normalized.status) normalized.status = 'draft'
  
  return normalized
}

export async function createPlanAction(data: {
  client_id: string
  title: string
  month: number
  year: number
  presentation_text?: string | null
  import_source_text?: string
  items: ParsedPlanItem[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado')

  // 1. Verificar se já existe plano para este cliente/mês/ano
  const { data: existing } = await supabase
    .from('plans')
    .select('id')
    .eq('client_id', data.client_id)
    .eq('month', data.month)
    .eq('year', data.year)
    .maybeSingle()

  if (existing) {
    return {
      success: false,
      code: 'PLAN_ALREADY_EXISTS',
      existingPlanId: existing.id,
      error: 'Já existe um planejamento para este cliente neste mês/ano.'
    } as any
  }

  // 2. Criar o Plano
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .insert({
      owner_id: user.id,
      client_id: data.client_id,
      title: data.title,
      month: data.month,
      year: data.year,
      presentation_text: data.presentation_text || null,
      status: 'imported'
    })
    .select()
    .single()

  if (planError) throw new Error(planError.message)

  // 3. Criar os Itens
  const itemsToInsert = data.items.map((item, index) => ({
    plan_id: plan.id,
    date: item.date || null,
    time: item.time || null,
    channel: item.channel || null,
    format: item.format || null,
    title: item.title || null,
    caption: item.caption || null,
    creative_direction: item.creative_direction || null,
    reference_url: item.reference_url || null,
    internal_notes: item.internal_notes || null,
    status: 'draft',
    sort_order: index
  }))

  const { error: itemsError } = await supabase
    .from('plan_items')
    .insert(itemsToInsert)

  if (itemsError) {
    await supabase.from('plans').delete().eq('id', plan.id)
    throw new Error(itemsError.message)
  }

  revalidatePath('/app/planejamentos')
  revalidatePath('/app')
  
  return { success: true, data: plan }
}

export async function getPlans() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plans')
    .select(`
      *,
      clients (name)
    `)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getPlanById(id: string) {
  const supabase = await createClient()
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select(`
      *,
      clients (*)
    `)
    .eq('id', id)
    .single()

  if (planError) throw new Error(planError.message)

  const { data: items, error: itemsError } = await supabase
    .from('plan_items')
    .select('*')
    .eq('plan_id', id)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (itemsError) throw new Error(itemsError.message)

  // Buscar comentários
  const { data: comments } = await supabase
    .from('plan_comments')
    .select('*')
    .eq('plan_id', id)
    .order('created_at', { ascending: true })

  // Buscar eventos
  const { data: events } = await supabase
    .from('approval_events')
    .select('*')
    .eq('plan_id', id)
    .order('created_at', { ascending: false })

  return { ...plan, items, comments: comments || [], events: events || [] }
}

export async function updatePlanPresentationAction(planId: string, text: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  const { error } = await supabase
    .from('plans')
    .update({ 
      presentation_text: text || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', planId)
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath(`/app/planejamentos/${planId}`)
  return true
}

export async function updatePlanItemAction(id: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  const normalized = normalizeItemData(data)
  delete normalized.plan_id
  
  // Buscar o item atual para checar o plano e status
  const { data: currentItem } = await supabase
    .from('plan_items')
    .select('plan_id, status')
    .eq('id', id)
    .single()

  if (!currentItem) throw new Error('Item não encontrado')

  // Se o post estava em ajuste, marcar como pronto ao salvar
  if (currentItem.status === 'needs_adjustment') {
    normalized.status = 'ready'
  }

  const { error } = await supabase
    .from('plan_items')
    .update(normalized)
    .eq('id', id)

  if (error) throw new Error(error.message)

  // Resolução automática de comentários do post
  await supabase
    .from('plan_comments')
    .update({ status: 'resolved' })
    .eq('plan_item_id', id)
    .neq('status', 'resolved')

  // Sincronizar status do plano
  await syncPlanStatusAfterAdjustment(currentItem.plan_id)

  revalidatePath(`/app/planejamentos/${currentItem.plan_id}`)
  return true
}

/**
 * Sincroniza o status do plano com base nos comentários pendentes.
 * Se não houver mais nenhum comentário pendente ou em progresso (geral ou post),
 * o plano volta para 'awaiting_approval'.
 */
export async function syncPlanStatusAfterAdjustment(planId: string) {
  const supabase = await createClient()
  
  // 1. Verificar se ainda há comentários não resolvidos
  const { data: pendingComments } = await supabase
    .from('plan_comments')
    .select('id')
    .eq('plan_id', planId)
    .neq('status', 'resolved')
    .limit(1)

  // 2. Se não houver pendências, e o status atual for 'revision_requested', voltar para 'awaiting_approval'
  if (!pendingComments || pendingComments.length === 0) {
    const { data: plan } = await supabase
      .from('plans')
      .select('status')
      .eq('id', planId)
      .single()

    if (plan?.status === 'revision_requested') {
      await supabase
        .from('plans')
        .update({ status: 'awaiting_approval' })
        .eq('id', planId)
      
      await supabase.from('approval_events').insert({
        plan_id: planId,
        event_type: 'sent',
        message: 'Ajustes concluídos. Aguardando nova revisão do cliente.'
      })
    }
  }
}

export async function createPlanItemAction(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado')

  // 1. Validar que o plano existe e pertence ao usuário
  if (!data.plan_id) throw new Error('plan_id é obrigatório')

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('id, owner_id')
    .eq('id', data.plan_id)
    .single()

  if (planError || !plan) throw new Error('Planejamento não encontrado')
  if (plan.owner_id !== user.id) throw new Error('Sem permissão para este planejamento')

  // 2. Normalizar dados (evitar strings vazias em tipos date/time)
  const normalizedData = normalizeItemData(data)

  // 3. Inserir
  const { error } = await supabase
    .from('plan_items')
    .insert(normalizedData)

  if (error) {
    console.error('Erro ao inserir item:', error)
    throw new Error(error.message)
  }

  revalidatePath('/app/planejamentos')
}

export async function deletePlanItemAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('plan_items')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/app/planejamentos')
}

export async function createManualPlanAction(data: {
  client_id: string
  title: string
  month: number
  year: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado')

  // Verificar se já existe plano para este cliente/mês/ano
  const { data: existing } = await supabase
    .from('plans')
    .select('id')
    .eq('client_id', data.client_id)
    .eq('month', data.month)
    .eq('year', data.year)
    .single()

  if (existing) {
    throw new Error('Já existe um planejamento para este cliente neste mês/ano.')
  }

  // Criar o Plano
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .insert({
      owner_id: user.id,
      client_id: data.client_id,
      title: data.title,
      month: data.month,
      year: data.year,
      status: 'draft'
    })
    .select()
    .single()

  if (planError) throw new Error(planError.message)

  revalidatePath('/app/planejamentos')
  revalidatePath('/app')
  
  return plan
}

export async function getAdjacentPlanAction(clientId: string, month: number, year: number, direction: 'prev' | 'next') {
  const supabase = await createClient()
  
  let targetMonth = month
  let targetYear = year

  if (direction === 'prev') {
    targetMonth = month === 1 ? 12 : month - 1
    targetYear = month === 1 ? year - 1 : year
  } else {
    targetMonth = month === 12 ? 1 : month + 1
    targetYear = month === 12 ? year + 1 : year
  }

  const { data, error } = await supabase
    .from('plans')
    .select('id')
    .eq('client_id', clientId) 
    .eq('month', targetMonth)
    .eq('year', targetYear)
    .single()
  if (error || !data) return null
  return data.id
}

export async function generatePublicLinkAction(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  // 1. Validar posse
  const { data: plan, error: fetchError } = await supabase
    .from('plans')
    .select('id, public_token, status, owner_id')
    .eq('id', planId)
    .single()

  if (fetchError || !plan) throw new Error('Planejamento não encontrado')
  if (plan.owner_id !== user.id) throw new Error('Sem permissão')

  let token = plan.public_token
  if (!token) {
    token = crypto.randomUUID()
  }

  console.log(`[GenerateLink] plan_id: ${planId}`)
  console.log(`[GenerateLink] public_token salvo status: ${!!token}`)
  console.log(`[GenerateLink] token salvo prefix: ${token?.substring(0, 8)}`)
  console.log(`[GenerateLink] token URL prefix: ${token?.substring(0, 8)}`)

  const updates: any = {
    public_token: token,
    status: 'awaiting_approval'
  }

  // Se for a primeira vez enviando, marcar a data
  const { data: sentEvent } = await supabase
    .from('approval_events')
    .select('id')
    .eq('plan_id', planId)
    .eq('event_type', 'sent')
    .single()

  if (!sentEvent) {
    updates.sent_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('plans')
    .update(updates)
    .eq('id', planId)

  if (updateError) throw new Error(updateError.message)

  // Criar evento se for novo envio
  if (!sentEvent) {
    await supabase.from('approval_events').insert({
      plan_id: planId,
      event_type: 'sent',
      message: 'Planejamento enviado para aprovação'
    })
  }

  revalidatePath(`/app/planejamentos/${planId}`)
  return token
}

/**
 * Ações Públicas (Não exigem auth de usuário, usam o token)
 */

export async function getPublicPlanByToken(token: string) {
  console.log(`[PublicPlan] token recebido prefix: ${token?.substring(0, 8)}`)
  
  const supabaseAdmin = createSupabaseAdmin()
  console.log(`[PublicPlan] service role existe: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`)
  
  // 1. Buscar plano pelo token usando admin client
  const { data: plan, error: planError } = await supabaseAdmin
    .from('plans')
    .select(`
      id, title, month, year, status, sent_at, approved_at, client_id, presentation_text
    `)
    .eq('public_token', token)
    .single()

  if (planError || !plan) {
    console.log(`[PublicPlan] plano encontrado: false`)
    if (planError) console.error(`[PublicPlan] erro Supabase (plan):`, planError.message)
    return null
  }

  console.log(`[PublicPlan] plano encontrado: true`)
  console.log(`[PublicPlan] plan id encontrado: ${plan.id}`)

  // 2. Buscar cliente separadamente para evitar complexidade de relacionamento no admin
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('name')
    .eq('id', plan.client_id)
    .single()

  // 3. Buscar itens (sem internal_notes)
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('plan_items')
    .select('id, plan_id, date, time, channel, format, title, caption, creative_direction, reference_url, status, sort_order')
    .eq('plan_id', plan.id)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (itemsError) {
    console.error(`[PublicPlan] erro Supabase (items):`, itemsError.message)
    return null
  }

  // 4. Buscar comentários públicos
  const { data: comments, error: commentsError } = await supabaseAdmin
    .from('plan_comments')
    .select('id, plan_id, plan_item_id, author_type, author_name, comment, status, created_at')
    .eq('plan_id', plan.id)
    .order('created_at', { ascending: true })

  if (commentsError) {
    console.error(`[PublicPlan] erro Supabase (comments):`, commentsError.message)
    return null
  }

  // Montar objeto de retorno seguro (sem owner_id, etc)
  return {
    id: plan.id,
    title: plan.title,
    month: plan.month,
    year: plan.year,
    status: plan.status,
    sent_at: plan.sent_at,
    approved_at: plan.approved_at,
    presentation_text: plan.presentation_text,
    clients: client,
    items: items || [],
    comments: comments || []
  }
}

export async function approvePlanAction(token: string) {
  const supabaseAdmin = createSupabaseAdmin()
  
  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('public_token', token)
    .single()

  if (!plan) throw new Error('Plano inválido')

  const { error } = await supabaseAdmin
    .from('plans')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString()
    })
    .eq('id', plan.id)

  if (error) throw new Error(error.message)

  await supabaseAdmin.from('approval_events').insert({
    plan_id: plan.id,
    event_type: 'approved',
    message: 'Planejamento aprovado pelo cliente'
  })

  // Opcional: Aprovar todos os itens
  await supabaseAdmin
    .from('plan_items')
    .update({ status: 'approved' })
    .eq('plan_id', plan.id)

  revalidatePath('/app/planejamentos')
  return true
}

export async function addPublicCommentAction(token: string, data: {
  item_id?: string | null,
  author_name: string,
  comment: string
}) {
  const supabaseAdmin = createSupabaseAdmin()
  
  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('public_token', token)
    .single()

  if (!plan) throw new Error('Plano inválido')

  // Inserir comentário
  const { error: commentError } = await supabaseAdmin
    .from('plan_comments')
    .insert({
      plan_id: plan.id,
      plan_item_id: data.item_id || null,
      author_type: 'client',
      author_name: data.author_name || 'Cliente',
      comment: data.comment,
      status: 'pending'
    })

  if (commentError) throw new Error(commentError.message)

  // Atualizar status do plano e item
  await supabaseAdmin
    .from('plans')
    .update({ status: 'revision_requested' })
    .eq('id', plan.id)

  if (data.item_id) {
    await supabaseAdmin
      .from('plan_items')
      .update({ status: 'needs_adjustment' })
      .eq('id', data.item_id)
  }

  await supabaseAdmin.from('approval_events').insert({
    plan_id: plan.id,
    event_type: 'revision_requested',
    message: data.item_id ? 'Alteração solicitada em um post' : 'Alteração geral solicitada'
  })

  revalidatePath('/app/planejamentos')
  return true
}

export async function updateCommentStatusAction(commentId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  // Buscar o plan_id antes de atualizar
  const { data: comment } = await supabase
    .from('plan_comments')
    .select('plan_id')
    .eq('id', commentId)
    .single()

  const { error } = await supabase
    .from('plan_comments')
    .update({ status })
    .eq('id', commentId)

  if (error) throw new Error(error.message)

  if (comment) {
    await syncPlanStatusAfterAdjustment(comment.plan_id)
  }

  return true
}
export async function getRevisionRequestedPlans() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  // Buscar todos os planos que têm comentários não resolvidos
  // Como o Supabase não faz subquery complexa facilmente aqui, 
  // buscamos os IDs dos planos com comentários pendentes primeiro.
  const { data: pendingComments } = await supabase
    .from('plan_comments')
    .select('plan_id')
    .neq('status', 'resolved')

  const planIds = Array.from(new Set(pendingComments?.map(c => c.plan_id) || []))

  // Buscar planos por ID ou por status
  const { data, error } = await supabase
    .from('plans')
    .select(`
      id, title, status, month, year,
      clients (name)
    `)
    .eq('owner_id', user.id)
    .or(`status.eq.revision_requested,id.in.(${planIds.length > 0 ? planIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function deletePlanAction(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado')

  // 1. Validar posse
  const { data: plan, error: fetchError } = await supabase
    .from('plans')
    .select('id, owner_id')
    .eq('id', planId)
    .single()

  if (fetchError || !plan) throw new Error('Planejamento não encontrado')
  if (plan.owner_id !== user.id) throw new Error('Sem permissão para excluir este planejamento')

  // 2. Excluir (o banco deve estar configurado com ON DELETE CASCADE)
  const { error: deleteError } = await supabase
    .from('plans')
    .delete()
    .eq('id', planId)

  if (deleteError) throw new Error(deleteError.message)

  revalidatePath('/app/planejamentos')
  revalidatePath('/app')
  
  return true
}

export async function findExistingPlanForImport(clientId: string, month: number, year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  const { data, error } = await supabase
    .from('plans')
    .select(`
      id, title, status, month, year, public_token, presentation_text,
      clients (name),
      plan_items (id)
    `)
    .eq('client_id', clientId)
    .eq('month', month)
    .eq('year', year)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return { exists: false }

  return {
    exists: true,
    plan: {
      id: data.id,
      title: data.title,
      status: data.status,
      month: data.month,
      year: data.year,
      public_token: data.public_token,
      presentation_text: data.presentation_text,
      clientName: (data.clients as any)?.name,
      itemsCount: Array.isArray(data.plan_items) ? data.plan_items.length : 0
    }
  }
}

export async function appendItemsToPlanAction(planId: string, items: ParsedPlanItem[], presentationText?: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  // 1. Validar posse e buscar status atual
  const { data: plan, error: fetchError } = await supabase
    .from('plans')
    .select('id, owner_id, status')
    .eq('id', planId)
    .single()

  if (fetchError || !plan) throw new Error('Planejamento não encontrado')
  if (plan.owner_id !== user.id) throw new Error('Sem permissão')

  // 2. Preparar itens
  const itemsToInsert = items.map((item, index) => ({
    plan_id: planId,
    date: item.date || null,
    time: item.time || null,
    channel: item.channel || null,
    format: item.format || null,
    title: item.title || null,
    caption: item.caption || null,
    creative_direction: item.creative_direction || null,
    reference_url: item.reference_url || null,
    internal_notes: item.internal_notes || null,
    status: 'draft',
    sort_order: 1000 + index // Garantir que fiquem no fim
  }))

  const { error: itemsError } = await supabase
    .from('plan_items')
    .insert(itemsToInsert)

  if (itemsError) throw new Error(itemsError.message)

  // 3. Atualizar status se necessário
  // Se aprovado, volta para aguardando aprovação
  const updates: any = { updated_at: new Date().toISOString() }
  if (plan.status === 'approved') {
    updates.status = 'awaiting_approval'
  }

  if (presentationText) {
    updates.presentation_text = presentationText
  }

  await supabase.from('plans').update(updates).eq('id', planId)

  // 4. Registrar evento
  await supabase.from('approval_events').insert({
    plan_id: planId,
    event_type: 'content_added',
    message: 'Novos conteúdos foram adicionados ao planejamento existente.'
  })

  revalidatePath(`/app/planejamentos/${planId}`)
  revalidatePath('/app/planejamentos')
  
  return true
}
