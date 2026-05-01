'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  updatePlanItemAction, 
  deletePlanItemAction, 
  createPlanItemAction,
  getAdjacentPlanAction,
  generatePublicLinkAction,
  updateCommentStatusAction
} from '@/app/actions/plans'
import { 
  PencilSquareIcon, 
  TrashIcon, 
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  CalendarIcon,
  LinkIcon,
  ChatBubbleBottomCenterIcon,
  QueueListIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShareIcon,
  CheckIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import DeletePlanButton from '@/components/DeletePlanButton'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

type Props = {
  initialPlan: any
}

export default function PlanDetailClient({ initialPlan }: Props) {
  const [items, setItems] = useState(initialPlan.items)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adjacentPlans, setAdjacentPlans] = useState<{ prev: string | null, next: string | null }>({ prev: null, next: null })
  const [publicToken, setPublicToken] = useState(initialPlan.public_token)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleGenerateLink = async () => {
    setLoading(true)
    try {
      const token = await generatePublicLinkAction(initialPlan.id)
      setPublicToken(token)
      const link = `${window.location.origin}/aprovar/${token}`
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      alert('Erro ao gerar link')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCommentStatus = async (commentId: string, status: string) => {
    try {
      await updateCommentStatusAction(commentId, status)
      window.location.reload()
    } catch (err) {
      alert('Erro ao atualizar status do comentário')
    }
  }

  useEffect(() => {
    async function checkAdjacent() {
      const prevId = await getAdjacentPlanAction(initialPlan.client_id, initialPlan.month, initialPlan.year, 'prev')
      const nextId = await getAdjacentPlanAction(initialPlan.client_id, initialPlan.month, initialPlan.year, 'next')
      setAdjacentPlans({ prev: prevId, next: nextId })
    }
    checkAdjacent()
  }, [initialPlan])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const hasPendingAdjustments = initialPlan.comments?.some((c: any) => c.plan_item_id === editingItem.id && c.status !== 'resolved')
      await updatePlanItemAction(editingItem.id, editingItem)
      if (hasPendingAdjustments) {
        alert('Post atualizado e ajustes marcados como resolvidos.')
      }
      setEditingItem(null)
      window.location.reload()
    } catch (err) {
      alert('Erro ao atualizar post')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newItemData = { ...editingItem, plan_id: initialPlan.id }
      await createPlanItemAction(newItemData)
      window.location.reload()
    } catch (err) {
      alert('Erro ao adicionar post')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este post?')) {
      try {
        await deletePlanItemAction(id)
        setItems(items.filter((item: any) => item.id !== id))
      } catch (err) {
        alert('Erro ao excluir post')
      }
    }
  }

  // Calendar Logic
  const month = initialPlan.month
  const year = initialPlan.year
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay() // 0 = Sunday

  const calendarDays = []
  
  // Previous month padding
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      key: `prev-${prevMonthLastDay - i}`
    })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      key: `curr-${i}`
    })
  }

  // Next month padding to fill the 7-column grid (up to 42 cells for 6 rows)
  const remainingSlots = 42 - calendarDays.length
  for (let i = 1; i <= remainingSlots; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      key: `next-${i}`
    })
  }

  const itemsByDay = items.reduce((acc: any, item: any) => {
    if (item.date) {
      const day = new Date(item.date + 'T12:00:00').getDate()
      if (!acc[day]) acc[day] = []
      acc[day].push(item)
    }
    return acc
  }, {})

  const itemsWithoutDate = items.filter((item: any) => !item.date)

  const openAddModal = (day?: number) => {
    let dateStr = ''
    if (day) {
      const d = new Date(year, month - 1, day)
      dateStr = d.toISOString().split('T')[0]
    }
    setEditingItem({
      date: dateStr,
      time: '',
      channel: '',
      format: '',
      title: '',
      caption: '',
      creative_direction: '',
      reference_url: '',
      internal_notes: '',
      status: 'draft'
    })
    setIsAdding(true)
  }

  const navigateAdjacent = (direction: 'prev' | 'next') => {
    const id = adjacentPlans[direction]
    if (id) {
      router.push(`/app/planejamentos/${id}`)
    } else {
      // Calcular mês/ano alvo para sugerir na criação
      let targetMonth = month
      let targetYear = year
      if (direction === 'prev') {
        targetMonth = month === 1 ? 12 : month - 1
        targetYear = month === 1 ? year - 1 : year
      } else {
        targetMonth = month === 12 ? 1 : month + 1
        targetYear = month === 12 ? year + 1 : year
      }

      if (confirm(`Não existe planejamento para ${MONTH_NAMES[targetMonth - 1]} ${targetYear}. Deseja criar um novo?`)) {
        router.push(`/app/planejamentos/novo?clientId=${initialPlan.client_id}&month=${targetMonth}&year=${targetYear}`)
      }
    }
  }

  return (
    <div className="space-y-10">
      {/* Calendar Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 glass p-8 rounded-[2.5rem]">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => navigateAdjacent('prev')}
            className="p-3 hover:bg-accent rounded-2xl transition-colors group"
          >
            <ChevronLeftIcon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
          </button>
          <div className="text-center min-w-[160px]">
            <h2 className="text-xl font-black text-foreground tracking-tighter uppercase">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            {!adjacentPlans.prev && !adjacentPlans.next && (
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Único plano ativo</p>
            )}
          </div>
          <button 
            onClick={() => navigateAdjacent('next')}
            className="p-3 hover:bg-accent rounded-2xl transition-colors group"
          >
            <ChevronRightIcon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleGenerateLink}
            disabled={loading}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 border rounded-2xl px-6 py-4 text-sm font-bold transition-all active:scale-[0.98] ${
              copied ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-background border-border text-foreground hover:bg-accent'
            }`}
          >
            {copied ? <CheckIcon className="h-5 w-5" /> : <ShareIcon className="h-5 w-5" />}
            <span>{copied ? 'Link Copiado!' : 'Gerar Link de Aprovação'}</span>
          </button>
          <DeletePlanButton 
            planId={initialPlan.id} 
            planTitle={initialPlan.title} 
            variant="button"
            redirectAfter={true}
          />
          <button
            onClick={() => openAddModal()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-primary text-primary-foreground rounded-2xl px-6 py-4 text-sm font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/10 active:scale-[0.98]"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Adicionar Post</span>
          </button>
        </div>
      </div>

      {/* Ajustes Gerais */}
      {initialPlan.comments?.some((c: any) => c.plan_item_id === null) && (
        <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center space-x-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Ajustes Gerais</h3>
            <div className="h-px bg-border flex-1"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialPlan.comments?.filter((c: any) => c.plan_item_id === null).map((comment: any) => (
              <div key={comment.id} className="glass p-6 rounded-3xl flex items-start space-x-4 group">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-foreground">{comment.author_name}</span>
                    <select 
                      value={comment.status}
                      onChange={(e) => handleUpdateCommentStatus(comment.id, e.target.value)}
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border transition-all focus:outline-none ${
                        comment.status === 'resolved' ? 'bg-muted border-border text-muted-foreground' :
                        comment.status === 'in_progress' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                        'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      }`}
                    >
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em Ajuste</option>
                      <option value="resolved">Resolvido</option>
                    </select>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">{comment.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Calendário Mensal</h3>
          <p className="text-[10px] text-muted-foreground font-medium italic hidden md:block">Clique em um dia para adicionar posts.</p>
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
              className={`min-h-[160px] p-3 rounded-[1.5rem] border transition-all group ${
                isCurrentMonth ? 'glass bg-background/40 hover:bg-background/80' : 'bg-transparent border-transparent opacity-20 pointer-events-none'
              }`}
            >
              {isCurrentMonth && (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-xl border transition-all ${
                      new Date().getDate() === day && new Date().getMonth() + 1 === month && new Date().getFullYear() === year 
                      ? 'text-primary-foreground bg-primary border-primary shadow-lg shadow-primary/20 scale-110' 
                      : 'text-muted-foreground border-transparent font-medium'
                    }`}>
                      {day}
                    </span>
                    <button 
                      onClick={() => openAddModal(day)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[110px] scrollbar-hide">
                    {itemsByDay[day]?.map((item: any) => {
                      const itemComments = initialPlan.comments?.filter((c: any) => c.plan_item_id === item.id && c.status !== 'resolved') || []
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setEditingItem(item)
                            setIsAdding(false)
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border text-[10px] transition-all hover:scale-[1.02] active:scale-95 flex flex-col gap-1 relative group/post ${
                            item.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                            item.status === 'ready' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
                            item.status === 'needs_adjustment' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                            'bg-card border-border text-foreground shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-center font-black uppercase tracking-tighter opacity-80">
                            <span>{item.channel}</span>
                            <div className="flex items-center space-x-1">
                              {itemComments.length > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                              <span>{item.time}</span>
                            </div>
                          </div>
                          <p className="font-bold truncate leading-tight group-hover/post:whitespace-normal group-hover/post:overflow-visible">{item.title || 'Sem título'}</p>
                          {itemComments.length > 0 && (
                            <div className="flex items-center space-x-1 mt-0.5 text-red-500 font-black uppercase text-[8px] tracking-tighter">
                              <ChatBubbleOvalLeftEllipsisIcon className="h-2.5 w-2.5" />
                              <span>{itemComments.length}</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
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
              <div className="flex items-center space-x-3 px-2">
                <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl border ${
                   new Date().getDate() === day && new Date().getMonth() + 1 === month && new Date().getFullYear() === year 
                   ? 'text-primary-foreground bg-primary border-primary shadow-lg' 
                   : 'text-foreground bg-accent border-border font-medium'
                }`}>{day}</span>
                <div className="h-px bg-border flex-1 opacity-50"></div>
                <button onClick={() => openAddModal(day)} className="text-[10px] font-black uppercase text-primary tracking-widest">+ Adicionar</button>
              </div>
              
              <div className="grid grid-cols-1 gap-2 pl-11">
                {itemsByDay[day] && itemsByDay[day].length > 0 ? (
                  itemsByDay[day].map((item: any) => {
                    const itemComments = initialPlan.comments?.filter((c: any) => c.plan_item_id === item.id && c.status !== 'resolved') || []
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setEditingItem(item)
                          setIsAdding(false)
                        }}
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
                        {itemComments.length > 0 && (
                          <div className="bg-red-500 text-white text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-lg shadow-lg shadow-red-500/20">
                            {itemComments.length}
                          </div>
                        )}
                      </button>
                    )
                  })
                ) : (
                  <p className="text-[10px] text-muted-foreground font-medium italic py-2">Nenhum post planejado.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Posts Without Date */}
      {itemsWithoutDate.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center space-x-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Posts sem data</h3>
            <div className="h-px bg-border flex-1"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {itemsWithoutDate.map((item: any) => (
              <div key={item.id} className="glass p-8 rounded-[2rem] group transition-all hover:shadow-xl hover:shadow-primary/5 border-border">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 px-2 py-1 rounded text-gray-500">
                      {item.channel || 'Sem canal'}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded">
                      {item.format || 'Sem formato'}
                    </span>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingItem(item); setIsAdding(false); }} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-all"><PencilSquareIcon className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-all"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 truncate">{item.title || 'Post sem título'}</h4>
                <p className="text-xs text-gray-500 line-clamp-2 italic mb-4">{item.caption || 'Sem legenda...'}</p>
                <button 
                  onClick={() => { setEditingItem(item); setIsAdding(false); }}
                  className="w-full py-2 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Definir data
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Edição/Adição */}
      {editingItem && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-[200] flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="bg-card backdrop-blur-2xl rounded-none md:rounded-[3rem] shadow-2xl border border-border w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col">
            <header className="p-6 md:p-8 border-b border-border flex justify-between items-center bg-card/50">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tighter">
                  {isAdding ? 'Novo Post' : 'Editar Post'}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground font-medium italic mt-1">Ajuste os detalhes do conteúdo.</p>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:rotate-90"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              <form onSubmit={isAdding ? handleAdd : handleUpdate} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 lg:border-r border-border scrollbar-hide">
                {/* Alerta de Ajustes Pendentes */}
                {!isAdding && editingItem?.id && initialPlan.comments?.some((c: any) => c.plan_item_id === editingItem.id && c.status !== 'resolved') && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center space-x-3 text-amber-600 animate-pulse-subtle">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Este post possui ajustes pendentes do cliente.</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Data de Publicação</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-4 h-5 w-5 text-muted-foreground/40" />
                      <input 
                        type="date"
                        className="w-full bg-muted/50 border border-border rounded-2xl p-4 pl-12 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-foreground"
                        value={editingItem.date || ''}
                        onChange={e => setEditingItem({...editingItem, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Horário</label>
                    <div className="relative">
                      <ClockIcon className="absolute left-4 top-4 h-5 w-5 text-muted-foreground/40" />
                      <input 
                        type="time"
                        className="w-full bg-muted/50 border border-border rounded-2xl p-4 pl-12 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-foreground"
                        value={editingItem.time || ''}
                        onChange={e => setEditingItem({...editingItem, time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Canal</label>
                    <input 
                      type="text"
                      placeholder="Instagram, LinkedIn, etc."
                      className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-foreground"
                      value={editingItem.channel || ''}
                      onChange={e => setEditingItem({...editingItem, channel: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Formato</label>
                    <input 
                      type="text"
                      placeholder="Reels, Carrossel, Post estático..."
                      className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-foreground"
                      value={editingItem.format || ''}
                      onChange={e => setEditingItem({...editingItem, format: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Status do Post</label>
                    <select 
                      className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none text-foreground"
                      value={editingItem.status || 'draft'}
                      onChange={e => setEditingItem({...editingItem, status: e.target.value})}
                    >
                      <option value="draft">Rascunho</option>
                      <option value="ready">Pronto para Aprovação</option>
                      <option value="needs_adjustment">Ajuste Solicitado</option>
                      <option value="approved">Aprovado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Título / Tema Principal</label>
                  <input 
                    type="text"
                    placeholder="Qual o foco deste post?"
                    className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-black text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                    value={editingItem.title || ''}
                    onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Legenda (Copy)</label>
                  <textarea 
                    rows={6}
                    placeholder="Escreva ou cole a legenda aqui..."
                    className="w-full bg-muted/50 border border-border rounded-2xl p-5 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all scrollbar-hide"
                    value={editingItem.caption || ''}
                    onChange={e => setEditingItem({...editingItem, caption: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Direção de Arte / Visual</label>
                    <textarea 
                      rows={6}
                      placeholder="Descrição do que deve ser criado..."
                      className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-xs font-medium text-muted-foreground italic focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all whitespace-pre-wrap"
                      value={editingItem.creative_direction || ''}
                      onChange={e => setEditingItem({...editingItem, creative_direction: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Referência (URL)</label>
                    <input 
                      type="text"
                      placeholder="https://..."
                      className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-xs font-medium text-blue-500 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                      value={editingItem.reference_url || ''}
                      onChange={e => setEditingItem({...editingItem, reference_url: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Notas Internas (Não visível ao cliente)</label>
                  <input 
                    type="text"
                    placeholder="Observações para a equipe..."
                    className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-xs text-muted-foreground/60 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                    value={editingItem.internal_notes || ''}
                    onChange={e => setEditingItem({...editingItem, internal_notes: e.target.value})}
                  />
                </div>
              </form>

              <aside className="w-full lg:w-80 bg-muted/30 flex flex-col overflow-hidden">
                <header className="p-6 border-b border-border bg-card/50">
                  <div className="flex items-center space-x-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <ChatBubbleBottomCenterIcon className="h-3.5 w-3.5" />
                    <span>Comentários do cliente</span>
                  </div>
                </header>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                  {(initialPlan.comments?.filter((c: any) => c.plan_item_id === editingItem?.id).length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
                      <ChatBubbleBottomCenterIcon className="h-8 w-8 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">Nenhum comentário<br/>neste post ainda.</p>
                    </div>
                  ) : (
                    initialPlan.comments?.filter((c: any) => c.plan_item_id === editingItem?.id).map((comment: any) => (
                      <div key={comment.id} className={`p-4 rounded-2xl border transition-all ${comment.status === 'resolved' ? 'bg-muted/50 border-border opacity-50' : 'bg-card border-amber-500/20 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-black uppercase text-foreground">{comment.author_name}</span>
                          <select 
                            value={comment.status}
                            onChange={(e) => handleUpdateCommentStatus(comment.id, e.target.value)}
                            className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border transition-all focus:outline-none ${
                              comment.status === 'resolved' ? 'bg-muted border-border text-muted-foreground' :
                              comment.status === 'in_progress' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                              'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            }`}
                          >
                            <option value="pending">Pendente</option>
                            <option value="in_progress">Fazendo</option>
                            <option value="resolved">Feito</option>
                          </select>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">{comment.comment}</p>
                        <div className="mt-2 text-[8px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                          {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </aside>
            </div>

            <footer className="p-6 md:p-8 border-t border-border bg-muted/20 flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4">
              <button 
                onClick={() => setEditingItem(null)}
                className="w-full sm:w-auto px-8 py-4 border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:bg-card hover:border-foreground transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button 
                onClick={isAdding ? handleAdd : handleUpdate}
                disabled={loading}
                className="w-full sm:w-auto px-12 py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:opacity-90 shadow-xl shadow-primary/10 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'Salvando...' : isAdding ? 'Criar Post' : 'Salvar Alterações'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
