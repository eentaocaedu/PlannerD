import Link from 'next/link'
import { getPlans } from '@/app/actions/plans'
import { getClients } from '@/app/actions/clients'
import { CalendarDaysIcon, UserIcon, ChevronRightIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'
import DeletePlanButton from '@/components/DeletePlanButton'

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-muted border-border text-muted-foreground' },
  imported: { label: 'Importado', color: 'bg-blue-500/10 border-blue-500/20 text-blue-500' },
  awaiting_approval: { label: 'Aguardando Aprovação', color: 'bg-amber-500/10 border-amber-500/20 text-amber-500' },
  revision_requested: { label: 'Revisão Solicitada', color: 'bg-red-500/10 border-red-500/20 text-red-500' },
  approved: { label: 'Aprovado', color: 'bg-green-500/10 border-green-500/20 text-green-600' },
  archived: { label: 'Arquivado', color: 'bg-muted border-border text-muted-foreground opacity-50' },
}

export default async function PlanejamentosPage({
  searchParams: searchParamsPromise
}: {
  searchParams: Promise<{ client?: string, month?: string, year?: string }>
}) {
  const searchParams = await searchParamsPromise
  let plans: any[] = []
  let clients: any[] = []
  
  try {
    plans = await getPlans()
    clients = await getClients()

    if (searchParams.client) {
      plans = plans.filter((p: any) => p.client_id === searchParams.client)
    }
    if (searchParams.month) {
      plans = plans.filter((p: any) => p.month === parseInt(searchParams.month!))
    }
    if (searchParams.year) {
      plans = plans.filter((p: any) => p.year === parseInt(searchParams.year!))
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Planejamentos</h1>
          <p className="text-muted-foreground font-medium italic mt-1">Histórico e gestão de todos os calendários de conteúdo.</p>
        </div>
        <Link 
          href="/app/planejamentos/novo" 
          className="group flex items-center justify-center space-x-2 bg-primary text-primary-foreground rounded-2xl px-8 py-4 text-sm font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/10 active:scale-[0.98]"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Novo Planejamento</span>
        </Link>
      </header>

      {/* Filtros */}
      <div className="glass p-6 rounded-[2rem] flex flex-wrap items-center gap-4 border-border">
        <div className="flex items-center space-x-2 text-muted-foreground mr-2">
          <FunnelIcon className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
        </div>
        
        <form className="flex flex-wrap items-center gap-4 flex-1">
          <select 
            name="client"
            defaultValue={searchParams.client || ''}
            className="bg-muted/50 border border-border rounded-xl px-4 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[160px]"
          >
            <option value="">Todos os Clientes</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select 
            name="month"
            defaultValue={searchParams.month || ''}
            className="bg-muted/50 border border-border rounded-xl px-4 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[140px]"
          >
            <option value="">Todos os Meses</option>
            {monthNames.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>

          <select 
            name="year"
            defaultValue={searchParams.year || ''}
            className="bg-muted/50 border border-border rounded-xl px-4 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[100px]"
          >
            <option value="">Todos os Anos</option>
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button type="submit" className="bg-primary text-primary-foreground hover:opacity-90 px-6 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-primary/10">
            Filtrar
          </button>
          
          {(searchParams.client || searchParams.month || searchParams.year) && (
            <Link href="/app/planejamentos" className="text-xs font-bold text-muted-foreground hover:text-destructive transition-colors">
              Limpar
            </Link>
          )}
        </form>
      </div>

      <div className="glass rounded-[2.5rem] border-border overflow-hidden">
        {plans.length === 0 ? (
          <div className="py-24 text-center opacity-40">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border shadow-inner">
              <CalendarDaysIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-bold italic">Nenhum planejamento encontrado com esses filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted/20">
                  <th className="px-10 py-6 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Planejamento</th>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] hidden lg:table-cell">Cliente</th>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] hidden md:table-cell">Período</th>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Status</th>
                  <th className="px-10 py-6 text-right text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {plans.map((plan: any) => (
                  <tr key={plan.id} className="group hover:bg-muted/10 transition-colors">
                    <td className="px-10 py-6">
                      <Link href={`/app/planejamentos/${plan.id}`} className="block">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{plan.title}</p>
                        <p className="text-[10px] text-muted-foreground lg:hidden">{plan.clients?.name}</p>
                      </Link>
                    </td>
                    <td className="px-10 py-6 hidden lg:table-cell">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground/50" />
                        <span className="text-sm font-semibold text-muted-foreground">{plan.clients?.name}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 hidden md:table-cell">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-2.5 py-1 rounded-lg border border-border">
                        {monthNames[plan.month - 1]} / {plan.year}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        statusMap[plan.status]?.color || 'bg-muted text-muted-foreground'
                      }`}>
                        {statusMap[plan.status]?.label || plan.status}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end space-x-4">
                        <DeletePlanButton 
                          planId={plan.id} 
                          planTitle={plan.title} 
                          variant="icon"
                        />
                        <Link 
                          href={`/app/planejamentos/${plan.id}`}
                          className="inline-flex items-center space-x-2 text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors"
                        >
                          <span className="hidden sm:inline">Abrir</span>
                          <ChevronRightIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
