'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getClients } from '@/app/actions/clients'
import { createManualPlanAction } from '@/app/actions/plans'
import { Client } from '@/types/plan'
import { ChevronLeftIcon, CalendarDaysIcon, UserIcon, CheckIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

function NovoPlanejamentoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState(searchParams.get('clientId') || '')
  const [month, setMonth] = useState(parseInt(searchParams.get('month') || '') || new Date().getMonth() + 1)
  const [year, setYear] = useState(parseInt(searchParams.get('year') || '') || new Date().getFullYear())
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      const data = await getClients()
      setClients(data.filter(c => c.status === 'active'))
    }
    fetchClients()
  }, [])

  useEffect(() => {
    if (!title || title.startsWith('Planejamento ')) {
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ]
      setTitle(`Planejamento ${monthNames[month - 1]} ${year}`)
    }
  }, [month, year])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const plan = await createManualPlanAction({
        client_id: selectedClientId,
        title,
        month,
        year
      })
      router.push(`/app/planejamentos/${plan.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center gap-6">
        <Link 
          href="/app/planejamentos" 
          className="w-12 h-12 glass rounded-2xl flex items-center justify-center border-border text-muted-foreground hover:text-foreground transition-all group shrink-0"
        >
          <ChevronLeftIcon className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Novo Planejamento</h1>
          <p className="text-muted-foreground font-medium italic mt-1">Crie um calendário do zero para o seu cliente.</p>
        </div>
      </header>

      <div className="glass p-8 md:p-12 rounded-[2.5rem] border-border shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-destructive/10 text-destructive p-6 rounded-2xl border border-destructive/20 text-sm font-bold animate-in shake duration-500">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center space-x-2">
                <UserIcon className="h-3 w-3" />
                <span>Cliente</span>
              </label>
              <select 
                required
                className="w-full bg-muted/50 border border-border rounded-2xl p-5 text-sm font-black text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none cursor-pointer"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center space-x-2">
                  <CalendarDaysIcon className="h-3 w-3" />
                  <span>Mês de Referência</span>
                </label>
                <select 
                  required
                  className="w-full bg-muted/50 border border-border rounded-2xl p-5 text-sm font-black text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none cursor-pointer"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i, 1).toLocaleString('pt-BR', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center space-x-2">
                  <CalendarDaysIcon className="h-3 w-3" />
                  <span>Ano</span>
                </label>
                <input 
                  required
                  type="number"
                  className="w-full bg-muted/50 border border-border rounded-2xl p-5 text-sm font-black text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min={2024}
                  max={2100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center space-x-2">
                <CheckIcon className="h-3 w-3" />
                <span>Título do Planejamento</span>
              </label>
              <input 
                required
                type="text"
                placeholder="Ex: Estratégia de Conteúdo Maio"
                className="w-full bg-muted/50 border border-border rounded-2xl p-5 text-sm font-black text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-end gap-3">
            <Link 
              href="/app/planejamentos"
              className="px-8 py-4 border border-border rounded-2xl text-sm font-bold text-muted-foreground text-center hover:bg-muted transition-all"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading || !selectedClientId}
              className="px-12 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/10 disabled:opacity-30 active:scale-[0.98] transition-all"
            >
              {loading ? 'Processando...' : 'Criar Planejamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NovoPlanejamentoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-20 text-muted-foreground font-black uppercase tracking-widest">Carregando...</div>}>
      <NovoPlanejamentoContent />
    </Suspense>
  )
}
