'use client'

import { useState } from 'react'
import { createClientAction, updateClientAction } from '@/app/actions/clients'
import { Client } from '@/types/plan'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ClientFormProps {
  client?: Client
  onSuccess: () => void
  onCancel: () => void
}

export default function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: client?.name || '',
    company_name: client?.company_name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    instagram: client?.instagram || '',
    notes: client?.notes || '',
    status: client?.status || 'active'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (client) {
        await updateClientAction(client.id, formData)
      } else {
        await createClientAction(formData)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Erro ao salvar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card backdrop-blur-2xl p-8 md:p-12 rounded-none md:rounded-[3rem] border border-border shadow-2xl space-y-10 relative overflow-hidden h-full md:h-auto animate-in zoom-in duration-300">
      <button 
        type="button" 
        onClick={onCancel}
        className="absolute top-8 right-8 p-2 text-muted-foreground hover:text-foreground transition-all hover:rotate-90 z-10"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>

      <div>
        <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase">{client ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <p className="text-muted-foreground font-medium italic mt-2">Preencha os dados essenciais da conta do cliente.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Nome Completo *</label>
          <input
            required
            type="text"
            placeholder="Ex: João da Silva"
            className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Empresa / Marca</label>
          <input
            type="text"
            placeholder="Ex: Agência D"
            className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
            value={formData.company_name}
            onChange={e => setFormData({ ...formData, company_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">E-mail de Contato</label>
          <input
            type="email"
            placeholder="contato@empresa.com"
            className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">WhatsApp</label>
          <input
            type="text"
            placeholder="(00) 00000-0000"
            className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Instagram (@)</label>
          <input
            type="text"
            placeholder="@perfil"
            className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
            value={formData.instagram}
            onChange={e => setFormData({ ...formData, instagram: e.target.value })}
          />
        </div>
        {client && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Status da Conta</label>
            <select
              className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none cursor-pointer"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Observações Privadas</label>
        <textarea
          placeholder="Notas extras para sua equipe..."
          className="w-full bg-muted/50 border border-border rounded-2xl p-5 text-sm font-medium text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all resize-none italic"
          rows={3}
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-4 border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted active:scale-[0.98] transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-12 py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:opacity-90 shadow-xl shadow-primary/10 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'Salvando...' : client ? 'Atualizar Cliente' : 'Criar Cliente'}
        </button>
      </div>
    </form>
  )
}
