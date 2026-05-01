import Link from 'next/link'
import { getPlans, getRevisionRequestedPlans } from '@/app/actions/plans'
import { ArrowUpTrayIcon, ChatBubbleBottomCenterTextIcon, CalendarDaysIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline'

export default async function AppHome() {
  const [recentPlans, revisionPlans] = await Promise.all([
    getPlans().then(plans => plans.slice(0, 5)),
    getRevisionRequestedPlans()
  ])

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Dashboard</h1>
          <p className="text-muted-foreground font-medium italic">Gestão simplificada de planejamentos mensais.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href="/app/planejamentos/novo" 
            className="flex items-center justify-center space-x-2 bg-card border border-border rounded-2xl px-6 py-4 text-sm font-bold text-foreground hover:bg-accent transition-all shadow-sm active:scale-[0.98]"
          >
            <PlusIcon className="h-5 w-5 text-muted-foreground" />
            <span>Novo planejamento</span>
          </Link>
          <Link 
            href="/app/importar" 
            className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground rounded-2xl px-6 py-4 text-sm font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/10 active:scale-[0.98]"
          >
            <ArrowUpTrayIcon className="h-5 w-5 text-primary-foreground/70" />
            <span>Importar planejamento</span>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Planejamentos Recentes */}
        <div className="glass p-8 md:p-10 flex flex-col min-h-[340px] transition-all hover:shadow-xl hover:shadow-primary/5 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-primary rounded-xl">
                <CalendarDaysIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Últimos planejamentos</h2>
            </div>
            <Link href="/app/planejamentos" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">
              Ver todos
            </Link>
          </div>
          
          <div className="flex-1 space-y-4">
            {recentPlans.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-40">
                <div className="w-16 h-16 bg-muted/50 rounded-3xl flex items-center justify-center mb-5 border border-border">
                  <CalendarDaysIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm font-semibold leading-relaxed italic">
                  Nenhum planejamento ativo.<br />
                  Comece importando um novo arquivo DOCX.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentPlans.map((plan: any) => (
                  <Link 
                    key={plan.id} 
                    href={`/app/planejamentos/${plan.id}`}
                    className="flex items-center justify-between py-4 group"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{plan.title}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{plan.clients?.name} • {plan.month}/{plan.year}</p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alterações Pendentes */}
        <div className="glass p-8 md:p-10 flex flex-col min-h-[340px] transition-all hover:shadow-xl hover:shadow-primary/5 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-primary rounded-xl">
                <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Ajustes pendentes</h2>
            </div>
            <Link href="/app/planejamentos" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">
              Ver planejamentos
            </Link>
          </div>
          
          <div className="flex-1 space-y-4">
            {revisionPlans.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-40">
                <div className="w-16 h-16 bg-muted/50 rounded-3xl flex items-center justify-center mb-5 border border-border">
                  <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm font-semibold leading-relaxed italic">
                  Tudo em dia.<br />
                  Nenhum comentário ou pedido de ajuste.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {revisionPlans.map((plan: any) => (
                  <Link 
                    key={plan.id} 
                    href={`/app/planejamentos/${plan.id}`}
                    className="flex items-center justify-between py-4 group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-bold text-foreground group-hover:text-amber-600 transition-colors">{plan.title}</p>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{plan.clients?.name}</p>
                    </div>
                    <div className="flex items-center space-x-2 text-amber-600">
                      <span className="text-[10px] font-black uppercase tracking-widest">Revisar</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
