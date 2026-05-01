'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Client } from '@/types/plan'

export async function getClients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data as Client[]
}

export async function getClientById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Client
}

export async function createClientAction(formData: any) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('clients').insert({
    owner_id: user.id,
    name: formData.name,
    company_name: formData.company_name,
    email: formData.email,
    phone: formData.phone,
    instagram: formData.instagram,
    notes: formData.notes,
    status: 'active'
  })

  if (error) throw error
  
  revalidatePath('/app/clientes')
}

export async function updateClientAction(id: string, formData: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({
      name: formData.name,
      company_name: formData.company_name,
      email: formData.email,
      phone: formData.phone,
      instagram: formData.instagram,
      notes: formData.notes,
      status: formData.status
    })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/app/clientes')
  revalidatePath(`/app/clientes/${id}`)
}

export async function inactivateClientAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({ status: 'inactive' })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/app/clientes')
  revalidatePath(`/app/clientes/${id}`)
}
