'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePlanAction } from '@/app/actions/plans'
import { TrashIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

type Props = {
  planId: string
  planTitle: string
  variant?: 'icon' | 'button'
  redirectAfter?: boolean
}

export default function DeletePlanButton({ planId, planTitle, variant = 'icon', redirectAfter = false }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (confirmText !== 'EXCLUIR') return

    setLoading(true)
    try {
      await deletePlanAction(planId)
      setIsOpen(false)
      if (redirectAfter) {
        router.push('/app/planejamentos')
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir planejamento')
      setLoading(false)
    }
  }

  return (
    <>
      {variant === 'icon' ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
          title="Excluir Planejamento"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-6 py-4 border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-2xl text-sm font-bold transition-all"
        >
          <TrashIcon className="h-5 w-5" />
          <span>Excluir Planejamento</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 md:p-10 space-y-8 animate-in zoom-in duration-300">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20">
                <ExclamationTriangleIcon className="h-6 w-6 text-destructive" />
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-all">
                <XMarkIcon className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">Excluir Planejamento?</h3>
              <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                Tem certeza que deseja excluir <strong>{planTitle}</strong>? 
                Essa ação removerá posts, comentários e histórico vinculados. Não será possível desfazer.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                Digite <span className="text-destructive font-black">EXCLUIR</span> para confirmar
              </label>
              <input 
                type="text"
                className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-center font-black tracking-widest text-foreground focus:outline-none focus:ring-4 focus:ring-destructive/5 focus:border-destructive transition-all"
                placeholder="..."
                value={confirmText}
                onChange={e => setConfirmText(e.target.value.toUpperCase())}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                disabled={confirmText !== 'EXCLUIR' || loading}
                onClick={handleDelete}
                className="w-full py-5 bg-destructive text-destructive-foreground rounded-2xl text-sm font-black shadow-xl shadow-destructive/10 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-30"
              >
                {loading ? 'Excluindo...' : 'Excluir Definitivamente'}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="py-4 text-xs font-black uppercase text-muted-foreground tracking-widest hover:text-foreground transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
