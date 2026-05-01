import { getPlanById } from '@/app/actions/plans'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon, CalendarDaysIcon, UserIcon } from '@heroicons/react/24/outline'
import PlanDetailClient from './PlanDetailClient'

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  let planWithItems
  try {
    planWithItems = await getPlanById(id)
  } catch (error) {
    return notFound()
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center gap-6">
        <Link 
          href="/app/planejamentos" 
          className="w-12 h-12 glass rounded-2xl flex items-center justify-center border-border text-muted-foreground hover:text-foreground transition-all group shrink-0"
        >
          <ChevronLeftIcon className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter truncate">{planWithItems.title}</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 w-fit ${
              planWithItems.status === 'approved' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
              planWithItems.status === 'revision_requested' ? 'bg-destructive/10 text-destructive border-destructive/20' :
              planWithItems.status === 'awaiting_approval' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
              'bg-blue-500/10 text-blue-500 border-blue-500/20'
            }`}>
              {planWithItems.status === 'approved' ? 'Aprovado' :
               planWithItems.status === 'revision_requested' ? 'Revisão Solicitada' :
               planWithItems.status === 'awaiting_approval' ? 'Aguardando Aprovação' :
               'Em Rascunho'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
            <div className="flex items-center space-x-2 text-muted-foreground/60 font-black text-[10px] uppercase tracking-[0.2em]">
              <UserIcon className="h-3.5 w-3.5" />
              <span>{planWithItems.clients?.name}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground/60 font-black text-[10px] uppercase tracking-[0.2em]">
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              <span>{planWithItems.month}/{planWithItems.year}</span>
            </div>
          </div>
        </div>
      </header>

      <PlanDetailClient initialPlan={planWithItems} />
    </div>
  )
}
