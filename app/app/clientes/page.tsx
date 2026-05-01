'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getClients, inactivateClientAction } from '@/app/actions/clients'
import { Client } from '@/types/plan'
import ClientForm from './ClientForm'
import { PlusIcon, UserIcon, PencilIcon, NoSymbolIcon, ChevronRightIcon, UserGroupIcon } from '@heroicons/react/24/outline'

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()

  const fetchClients = async () => {
    setLoading(true)
    try {
      const data = await getClients()
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleInactivate = async (id: string) => {
    if (confirm('Tem certeza que deseja inativar este cliente?')) {
      try {
        await inactivateClientAction(id)
        fetchClients()
      } catch (error) {
        alert('Erro ao inativar cliente')
      }
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Clientes</h1>
          <p className="text-muted-foreground font-medium italic mt-1">Gerencie sua base de clientes e seus planejamentos.</p>
        </div>
        <button
          onClick={() => {
            setEditingClient(undefined)
            setShowForm(true)
          }}
          className="group flex items-center justify-center space-x-2 bg-primary text-primary-foreground rounded-2xl px-8 py-4 text-sm font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/10 active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Novo Cliente</span>
        </button>
      </header>

      {showForm && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-[200] flex items-center justify-center p-0 md:p-4 animate-in fade-in zoom-in duration-300">
          <div className="max-w-2xl w-full h-full md:h-auto overflow-y-auto scrollbar-hide">
            <ClientForm
              client={editingClient}
              onSuccess={() => {
                setShowForm(false)
                fetchClients()
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      <div className="glass rounded-[2.5rem] border-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="bg-muted/20">
                <th className="px-10 py-6 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Nome do Cliente</th>
                <th className="px-10 py-6 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] hidden sm:table-cell">Empresa</th>
                <th className="px-10 py-6 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Status</th>
                <th className="px-10 py-6 text-right text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-10 py-16 text-center text-sm text-muted-foreground italic font-medium opacity-40">Carregando base de clientes...</td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center opacity-40">
                    <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border shadow-inner">
                      <UserGroupIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-bold italic">Nenhum cliente cadastrado ainda.</p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="group hover:bg-muted/10 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center border border-border group-hover:scale-110 transition-all shadow-sm">
                          <UserIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{client.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium sm:hidden">{client.company_name || 'Sem empresa'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 hidden sm:table-cell">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {client.company_name || '-'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                        client.status === 'active' 
                          ? 'bg-green-500/10 text-green-600 border-green-500/20 shadow-sm shadow-green-500/5' 
                          : 'bg-muted border-border text-muted-foreground opacity-50'
                      }`}>
                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditingClient(client)
                          setShowForm(true)
                        }}
                        className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {client.status === 'active' && (
                        <button
                          onClick={() => handleInactivate(client.id)}
                          className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                          title="Inativar"
                        >
                          <NoSymbolIcon className="h-5 w-5" />
                        </button>
                      )}
                      <Link 
                        href={`/app/planejamentos?client=${client.id}`}
                        className="p-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all inline-block"
                        title="Ver Planejamentos"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
