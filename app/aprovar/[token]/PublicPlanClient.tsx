'use client'

import { useState } from 'react'
import { 
  addPublicCommentAction, 
  approvePlanAction 
} from '@/app/actions/plans'
import { 
  XMarkIcon,
  ClockIcon,
  ChatBubbleBottomCenterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  SparklesIcon,
  LinkIcon,
  ChatBubbleOvalLeftEllipsisIcon
} from '@heroicons/react/24/outline'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function PublicPlanClient({ initialPlan, token }: { initialPlan: any, token: string }) {
  const [items] = useState(initialPlan.items)
  const [viewingItem, setViewingItem] = useState<any>(null)
  const [showApproval, setShowApproval] = useState(false)
  const [commentModal, setCommentModal] = useState<any>(null) // { item_id: string | null }
  const [authorName, setAuthorName] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const handleApprove = async () => {
    setLoading(true)
    try {
      await approvePlanAction(token)
      setSuccess('Aprovado')
    } catch (err) {
      alert('Erro ao aprovar')
    } finally {
      setLoading(false)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addPublicCommentAction(token, {
        item_id: commentModal.item_id,
        author_name: authorName,
        comment: comment
      })
      setSuccess('Comentário enviado')
      setCommentModal(null)
      setComment('')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      alert('Erro ao enviar comentário')
    } finally {
      setLoading(false)
    }
  }

  // Calendar Logic
  const month = initialPlan.month
  const year = initialPlan.year
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

  const calendarDays = []
  // Fill empty days at the beginning
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ day: null, isCurrentMonth: false, key: `empty-${i}` })
  }
  // Fill actual days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true, key: `day-${i}` })
  }

  const itemsByDay = items.reduce((acc: any, item: any) => {
    if (item.date) {
      const d = new Date(item.date + 'T12:00:00')
      const dayNum = d.getDate()
      if (!acc[dayNum]) acc[dayNum] = []
      acc[dayNum].push(item)
    }
    return acc
  }, {})

  const itemsWithoutDate = items.filter((item: any) => !item.date)

  if (success === 'Aprovado' || initialPlan.status === 'approved') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass p-12 text-center max-w-md rounded-[3rem] animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
            <CheckBadgeIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tighter">Planejamento Aprovado!</h2>
          <p className="text-muted-foreground font-medium italic mt-4 leading-relaxed">Obrigado pela sua aprovação. Nossa equipe já foi notificada e começará a produção.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 font-sans selection:bg-primary/10">
      {/* Public Header */}
      <header className="glass sticky top-0 z-[100] border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{initialPlan.clients?.name}</span>
              <span className="w-1 h-1 bg-border rounded-full" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{MONTH_NAMES[month - 1]} {year}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">{initialPlan.title}</h1>
          </div>
          
          {initialPlan.status !== 'approved' && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button 
                onClick={() => setCommentModal({ item_id: null })}
                className="w-full sm:w-auto px-6 py-3 border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-[0.98]"
              >
                Solicitar Ajuste Geral
              </button>
              <button 
                onClick={() => setShowApproval(true)}
                className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:opacity-90 shadow-xl shadow-primary/10 active:scale-[0.98] transition-all"
              >
                Aprovar Planejamento
              </button>
            </div>
          )}
          {initialPlan.status === 'approved' && (
            <div className="flex items-center space-x-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-xl border border-green-500/20">
              <CheckBadgeIcon className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-widest">Aprovado</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12 space-y-12 animate-in fade-in duration-700">
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-[2rem] text-green-600 text-sm font-bold flex items-center space-x-3 animate-bounce">
            <CheckBadgeIcon className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Calendário Mensal</h3>
            <p className="text-[10px] text-muted-foreground font-medium italic hidden md:block">Clique em um post para ver detalhes.</p>
          </div>

          {/* Desktop Grid View */}
          <div className="hidden md:grid grid-cols-7 gap-3">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {day}
              </div>
            ))}
            
            {calendarDays.map(({ day, isCurrentMonth, key }) => (
              <div 
                key={key}
                className={`min-h-[160px] p-3 rounded-[1.5rem] border transition-all ${
                  isCurrentMonth ? 'glass bg-background/40 hover:bg-background/80' : 'bg-transparent border-transparent opacity-10 pointer-events-none'
                }`}
              >
                {isCurrentMonth && (
                  <>
                    <div className="mb-1">
                      <span className="text-xs font-black text-muted-foreground opacity-50">{day}</span>
                    </div>
                    
                    <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[110px] scrollbar-hide">
                      {day && itemsByDay[day]?.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => setViewingItem(item)}
                          className={`w-full text-left p-2.5 rounded-xl border text-[10px] transition-all hover:scale-[1.02] active:scale-95 flex flex-col gap-1 relative ${
                            item.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                            item.status === 'ready' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
                            item.status === 'needs_adjustment' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                            'bg-card border-border text-foreground shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-center font-black uppercase tracking-tighter opacity-80">
                            <span>{item.channel}</span>
                            <span>{item.time}</span>
                          </div>
                          <p className="font-bold truncate leading-tight">{item.title || 'Sem título'}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Mobile List View */}
          <div className="md:hidden space-y-4">
            {calendarDays.filter(d => d.isCurrentMonth).map(({ day, key }) => (
              <div key={key} className="space-y-3">
                {day && itemsByDay[day] && itemsByDay[day].length > 0 && (
                  <>
                    <div className="flex items-center space-x-3 px-2">
                      <span className="text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl bg-accent border border-border text-foreground">{day}</span>
                      <div className="h-px bg-border flex-1 opacity-50"></div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 pl-11">
                      {day && itemsByDay[day].map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => setViewingItem(item)}
                          className={`flex items-center justify-between p-4 rounded-2xl border text-sm transition-all ${
                            item.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                            item.status === 'ready' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
                            item.status === 'needs_adjustment' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                            'bg-card border-border text-foreground shadow-sm'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                              <span>{item.time}</span>
                              <span>•</span>
                              <span>{item.channel}</span>
                            </div>
                            <p className="font-bold truncate">{item.title || 'Sem título'}</p>
                          </div>
                          <ChevronRightIcon className="h-4 w-4 opacity-40" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Posts Without Date */}
        {itemsWithoutDate.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center space-x-4">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Posts sem data</h3>
              <div className="h-px bg-border flex-1"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemsWithoutDate.map((item: any) => (
                <div key={item.id} className="glass p-8 rounded-[2rem] border-border group">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-accent px-2 py-1 rounded text-muted-foreground">{item.channel}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded">{item.format}</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground mb-4 leading-snug">{item.title || 'Post sem título'}</h4>
                  <button 
                    onClick={() => setViewingItem(item)}
                    className="w-full py-3 bg-accent text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    Ver detalhes
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Viewing Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-[200] flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="bg-card backdrop-blur-2xl rounded-none md:rounded-[3rem] shadow-2xl border border-border w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col">
            <header className="p-6 md:p-8 border-b border-border flex justify-between items-center bg-card/50">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tighter">{viewingItem.title || 'Detalhes do Post'}</h3>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-accent px-3 py-1 rounded-lg text-muted-foreground">{viewingItem.channel}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-lg">{viewingItem.format}</span>
                  {viewingItem.time && (
                    <div className="flex items-center space-x-1 text-muted-foreground/60 ml-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold">{viewingItem.time}</span>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setViewingItem(null)} 
                className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:rotate-90"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col lg:flex-row gap-10 scrollbar-hide">
              <div className="flex-1 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Legenda (Copy)</label>
                  <div className="bg-muted/30 p-6 rounded-[2rem] text-sm md:text-base text-foreground leading-relaxed italic whitespace-pre-wrap border border-border">
                    {viewingItem.caption || 'Nenhuma legenda definida para este post.'}
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-80 space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <SparklesIcon className="h-3.5 w-3.5" />
                      <span>Direção de Arte</span>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground bg-muted/20 p-4 rounded-xl border border-border italic leading-relaxed whitespace-pre-wrap">
                      {viewingItem.creative_direction || 'Nenhuma orientação visual definida.'}
                    </div>
                  </div>
                  
                  {viewingItem.reference_url && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span>Referência</span>
                      </div>
                      <a 
                        href={viewingItem.reference_url} 
                        target="_blank" 
                        className="text-xs font-bold text-primary hover:underline block truncate bg-primary/5 p-3 rounded-xl border border-primary/10"
                      >
                        {viewingItem.reference_url}
                      </a>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setCommentModal({ item_id: viewingItem.id })}
                  className="w-full py-5 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-xl shadow-primary/10 hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  Solicitar Ajuste neste Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment/Revision Modal */}
      {commentModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-[300] flex items-center justify-center p-0 md:p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-card rounded-none md:rounded-[3rem] shadow-2xl border border-border w-full max-w-lg p-8 md:p-10 space-y-8 h-full md:h-auto">
            <header className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tighter">
                  {commentModal.item_id ? 'Ajustar este post' : 'Ajuste Geral'}
                </h3>
                <p className="text-xs text-muted-foreground font-medium italic mt-1">Diga-nos o que precisa ser alterado.</p>
              </div>
              <button onClick={() => setCommentModal(null)} className="text-muted-foreground hover:text-foreground transition-all"><XMarkIcon className="h-6 w-6" /></button>
            </header>

            <form onSubmit={handleComment} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Seu Nome (Opcional)</label>
                <input 
                  type="text"
                  className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-foreground"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">O que mudar?</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-muted/50 border border-border rounded-2xl p-5 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Descreva as alterações necessárias..."
                />
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-xl shadow-primary/10 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
                <button 
                  type="button"
                  onClick={() => setCommentModal(null)}
                  className="md:hidden py-4 text-xs font-black uppercase text-muted-foreground tracking-widest"
                >
                  Voltar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApproval && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-[300] flex items-center justify-center p-0 md:p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-card rounded-none md:rounded-[3rem] shadow-2xl border border-border w-full max-w-lg p-8 md:p-12 text-center space-y-8 h-full md:h-auto flex flex-col justify-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
              <CheckBadgeIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">Confirmar Aprovação?</h3>
              <p className="text-sm text-muted-foreground font-medium italic mt-2 leading-relaxed">Ao aprovar, o planejamento será marcado como pronto para produção pela nossa equipe.</p>
            </div>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={handleApprove}
                disabled={loading}
                className="w-full py-5 bg-green-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-green-600/20 hover:bg-green-700 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Sim, Aprovar Agora'}
              </button>
              <button onClick={() => setShowApproval(false)} className="py-4 text-xs font-black uppercase text-muted-foreground tracking-widest hover:text-foreground transition-all">Cancelar e Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
