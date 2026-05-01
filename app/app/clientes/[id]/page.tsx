import Link from 'next/link'
import { getClientById } from '@/app/actions/clients'
import { notFound } from 'next/navigation'
import { ChevronLeftIcon, UserIcon, CalendarIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  let client
  try {
    client = await getClientById(id)
  } catch (error) {
    return notFound()
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center gap-6">
        <Link 
          href="/app/clientes" 
          className="w-12 h-12 glass rounded-2xl flex items-center justify-center border-border text-muted-foreground hover:text-foreground transition-all shadow-sm group shrink-0"
        >
          <ChevronLeftIcon className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter truncate">{client.name}</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 w-fit ${
              client.status === 'active' 
                ? 'bg-green-500/10 text-green-600 border-green-500/20 shadow-sm shadow-green-500/5' 
                : 'bg-muted border-border text-muted-foreground opacity-50'
            }`}>
              {client.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <p className="text-muted-foreground font-medium italic mt-1">{client.company_name || 'Individual'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="glass p-8 rounded-[2rem] border-border transition-all hover:shadow-xl hover:shadow-primary/5">
            <div className="flex items-center space-x-3 mb-6 border-b border-border/50 pb-4">
              <UserIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-black text-foreground tracking-tight uppercase">Dados do Cliente</h2>
            </div>
            
            <dl className="space-y-6">
              <div className="space-y-1">
                <dt className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">E-mail</dt>
                <dd className="text-sm font-bold text-foreground truncate">{client.email || '-'}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">WhatsApp</dt>
                <dd className="text-sm font-bold text-foreground">{client.phone || '-'}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Instagram</dt>
                <dd className="text-sm font-bold text-foreground">{client.instagram ? `@${client.instagram.replace('@', '')}` : '-'}</dd>
              </div>
              <div className="space-y-2">
                <dt className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Notas Privadas</dt>
                <dd className="text-xs font-medium text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-4 border border-border italic">
                  {client.notes || 'Nenhuma nota registrada.'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-8 rounded-[2.5rem] border-border transition-all hover:shadow-xl hover:shadow-primary/5">
            <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-black text-foreground tracking-tight uppercase">Planejamentos</h2>
              </div>
              <Link href="/app/importar" className="text-[10px] font-black text-primary uppercase tracking-widest hover:opacity-70 transition-all">Novo Plano</Link>
            </div>
            <div className="text-center py-16 px-10 opacity-30">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border shadow-inner">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm font-bold leading-relaxed italic">
                Nenhum histórico disponível ainda.
              </p>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-border transition-all hover:shadow-xl hover:shadow-primary/5">
            <div className="flex items-center space-x-3 mb-6 border-b border-border/50 pb-4">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-black text-foreground tracking-tight uppercase">Feedback Recente</h2>
            </div>
            <div className="text-center py-16 px-10 opacity-30">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border shadow-inner">
                <ChatBubbleLeftEllipsisIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm font-bold leading-relaxed italic">
                Sem registros de alterações.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
