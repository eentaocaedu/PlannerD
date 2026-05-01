'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getClients } from '@/app/actions/clients'
import { createPlanAction, findExistingPlanForImport, appendItemsToPlanAction, getPlanById } from '@/app/actions/plans'
import { Client, ParsedPlan, ParsedPlanItem } from '@/types/plan'
import { 
  ArrowUpTrayIcon, 
  UserIcon, 
  DocumentTextIcon, 
  SparklesIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ChevronLeftIcon,
  CalendarDaysIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function ImportarPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [parsedPlan, setParsedPlan] = useState<ParsedPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // AI Date Distribution States
  const [showDistributeModal, setShowDistributeModal] = useState(false)
  const [distributionInstructions, setDistributionInstructions] = useState('')
  const [allowOverflow, setAllowOverflow] = useState(false)
  const [distributionResult, setDistributionResult] = useState<any>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  
  // Debug states (Development only)
  const [rawText, setRawText] = useState<string>('')
  const [rawJson, setRawJson] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  
  // Incremental Import States
  const [existingPlan, setExistingPlan] = useState<any>(null)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)

  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await getClients()
        setClients(data.filter(c => c.status === 'active'))
      } catch (err) {
        console.error('Error fetching clients:', err)
      }
    }
    fetchClients()
  }, [])

  const handleProcess = async () => {
    if (!file || !selectedClientId) return
    
    setLoading(true)
    setError(null)
    
    try {
      setLoadingText('Extraindo texto do arquivo...')
      const formData = new FormData()
      formData.append('file', file)
      
      const importRes = await fetch('/api/import-docx', {
        method: 'POST',
        body: formData
      })
      
      const importData = await importRes.json()
      if (!importRes.ok) throw new Error(importData.error || 'Erro no upload.')
      
      setRawText(importData.text)

      setLoadingText('Organizando conteúdo com IA...')
      const geminiRes = await fetch('/api/gemini/parse-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: importData.text })
      })

      const contentType = geminiRes.headers.get("content-type") || ""
      
      if (!contentType.includes("application/json")) {
        const text = await geminiRes.text()
        console.error("[Import] Resposta não JSON da API:", text.slice(0, 1000))
        throw new Error("A API retornou uma resposta inválida (HTML). Verifique o terminal do servidor.")
      }

      const geminiData = await geminiRes.json()
      
      if (!geminiRes.ok || !geminiData.success) {
        throw new Error(geminiData.error || 'Erro no processamento da IA.')
      }

      setRawJson(geminiData.data)
      setParsedPlan(geminiData.data)
      setStep(4)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingText('')
    }
  }

  const updateItem = (index: number, field: keyof ParsedPlanItem, value: string) => {
    if (!parsedPlan) return
    const newItems = [...parsedPlan.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setParsedPlan({ ...parsedPlan, items: newItems })
  }

  const handleDistributeDates = async () => {
    if (!parsedPlan) return
    setModalError(null)

    if (!parsedPlan.month || !parsedPlan.year) {
      setModalError('Informe o mês e o ano do planejamento antes de organizar as datas.')
      return
    }

    if (!distributionInstructions.trim()) {
      setModalError('Descreva como deseja distribuir os posts.')
      return
    }

    if (parsedPlan.items.length === 0) {
      setModalError('Não há posts na prévia para distribuir.')
      return
    }

    setLoading(true)
    setLoadingText('Distribuindo datas com IA...')
    
    try {
      const res = await fetch('/api/gemini/distribute-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parsedPlan.month,
          year: parsedPlan.year,
          allow_overflow_to_next_month: allowOverflow,
          instructions: distributionInstructions,
          items: parsedPlan.items.map((item, index) => ({
            temp_id: index.toString(),
            order: index + 1,
            title: item.title,
            current_channel: item.channel,
            format: item.format,
            current_date: item.date,
            current_time: item.time
          }))
        })
      })

      const contentType = res.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) {
        const text = await res.text()
        console.error("[Distribute] Resposta não JSON da API:", text.slice(0, 1000))
        setModalError("A API retornou uma resposta inválida (HTML). Verifique o terminal.")
        setLoading(false)
        setLoadingText('')
        return
      }

      const data = await res.json()
      if (!res.ok || !data.success) {
        setModalError(data.error || 'Erro ao processar distribuição.')
        setLoading(false)
        setLoadingText('')
        return
      }

      setDistributionResult(data.data)
      
      // Aplicar as datas sugeridas
      const newItems = [...parsedPlan.items]
      data.data.assignments.forEach((assignment: any) => {
        const index = parseInt(assignment.temp_id)
        if (newItems[index]) {
          newItems[index].date = assignment.date
          
          if (assignment.time) {
            newItems[index].time = assignment.time
          }
          
          if (assignment.channel) {
            // Só sobrescreve canal se estiver vazio ou se a IA retornou um valor novo e explícito
            if (!newItems[index].channel || assignment.channel !== newItems[index].channel) {
              newItems[index].channel = assignment.channel
            }
          }
        }
      })

      setParsedPlan({ ...parsedPlan, items: newItems })
      
      // Se não houve overflow crítico sem permissão, fecha o modal ou mostra resultado
      if (data.data.overflow_items.length === 0) {
        setShowDistributeModal(false)
        setDistributionInstructions('')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
      setLoadingText('')
    }
  }

  const removeItem = (index: number) => {
    if (!parsedPlan) return
    const newItems = parsedPlan.items.filter((_, i) => i !== index)
    setParsedPlan({ ...parsedPlan, items: newItems })
  }

  const detectDuplicates = (newItems: ParsedPlanItem[], existingItems: any[]) => {
    const found: any[] = []
    
    newItems.forEach((newItem, index) => {
      const isDuplicate = existingItems.find(oldItem => {
        // 1. Mesmo título + mesma data
        if (newItem.title && oldItem.title && newItem.title === oldItem.title && newItem.date === oldItem.date) return true
        
        // 2. Mesmo título + mesma legenda
        if (newItem.title && oldItem.title && newItem.title === oldItem.title && newItem.caption === oldItem.caption) return true
        
        // 3. Mesma data + mesmo formato + mesmo canal
        if (newItem.date && oldItem.date && newItem.date === oldItem.date && 
            newItem.format === oldItem.format && newItem.channel === oldItem.channel) return true
            
        return false
      })

      if (isDuplicate) {
        found.push({ ...newItem, index })
      }
    })

    return found
  }

  const handleConfirm = async (bypassExistingCheck = false) => {
    if (!parsedPlan || !selectedClientId) return

    if (!parsedPlan.month || !parsedPlan.year || !parsedPlan.title) {
      alert('Por favor, preencha mês, ano e título antes de salvar.')
      return
    }

    if (parsedPlan.items.length === 0) {
      alert('O planejamento precisa ter pelo menos um post.')
      return
    }

    // 1. Checar se já existe planejamento (se não estiver ignorando)
    if (!bypassExistingCheck) {
      setLoading(true)
      setLoadingText('Verificando disponibilidade...')
      try {
        const result = await findExistingPlanForImport(selectedClientId, parsedPlan.month, parsedPlan.year)
        if (result.exists && result.plan) {
          // Buscar itens do existente para checar duplicidade
          const fullPlan = await getPlanById(result.plan.id)
          const dupes = detectDuplicates(parsedPlan.items, fullPlan.items)
          
          setExistingPlan(result.plan)
          setDuplicates(dupes)
          setShowDecisionModal(true)
          setLoading(false)
          return
        }
      } catch (err: any) {
        console.error('Erro ao checar existente:', err)
      }
    }

    setLoading(true)
    setLoadingText('Salvando planejamento...')
    setError(null)

    try {
      const result = await createPlanAction({
        client_id: selectedClientId,
        title: parsedPlan.title,
        month: parsedPlan.month,
        year: parsedPlan.year,
        items: parsedPlan.items
      })

      if (result.success) {
        router.push(`/app/planejamentos/${result.data.id}`)
      } else if (result.code === 'PLAN_ALREADY_EXISTS') {
        // Fallback: se a verificação prévia falhou mas a action detectou
        const fullPlan = await getPlanById(result.existingPlanId!)
        const dupes = detectDuplicates(parsedPlan.items, fullPlan.items)
        
        setExistingPlan({
          id: fullPlan.id,
          title: fullPlan.title,
          status: fullPlan.status,
          month: fullPlan.month,
          year: fullPlan.year,
          clientName: fullPlan.clients?.name,
          itemsCount: fullPlan.items.length
        })
        setDuplicates(dupes)
        setShowDecisionModal(true)
        setLoading(false)
      } else {
        throw new Error(result.error || 'Erro ao criar planejamento.')
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleAppend = async () => {
    if (!existingPlan || !parsedPlan) return
    
    setLoading(true)
    setLoadingText('Anexando itens ao planejamento...')
    setShowDecisionModal(false)
    setShowDuplicateWarning(false)

    try {
      await appendItemsToPlanAction(existingPlan.id, parsedPlan.items)
      router.push(`/app/planejamentos/${existingPlan.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-black text-foreground tracking-tighter">Importar Planejamento</h1>
        <p className="text-muted-foreground font-medium italic mt-1">Converta seu arquivo DOCX em um planejamento digital inteligente.</p>
      </header>

      {/* Progress Stepper */}
      <div className="glass p-6 md:p-8 rounded-[2rem] border-border overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-between min-w-[500px]">
          {[
            { id: 1, name: 'Cliente', icon: UserIcon },
            { id: 2, name: 'Upload', icon: ArrowUpTrayIcon },
            { id: 3, name: 'IA', icon: SparklesIcon },
            { id: 4, name: 'Prévia', icon: CheckCircleIcon },
          ].map((s) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none group">
              <div className={`flex flex-col items-center space-y-2 ${step >= s.id ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${
                  step === s.id ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110' : 
                  step > s.id ? 'border-green-500 bg-green-500 text-white' : 'border-border bg-muted/50'
                }`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{s.name}</span>
              </div>
              {s.id < 4 && (
                <div className={`flex-1 h-px mx-4 mb-6 transition-all duration-700 ${step > s.id ? 'bg-green-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-6 rounded-3xl border border-destructive/20 flex items-start space-x-3 animate-in shake duration-500">
          <ExclamationTriangleIcon className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-bold">Ocorreu um erro</p>
            <p className="text-sm">{error}</p>
            <button onClick={() => { setError(null); setStep(1); }} className="mt-2 text-xs font-black uppercase tracking-widest underline decoration-2">Tentar novamente</button>
          </div>
        </div>
      )}

      {/* Step 1: Cliente */}
      {step === 1 && (
        <div className="glass p-12 text-center space-y-8 rounded-[3rem] animate-in slide-in-from-bottom-8 duration-500">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-foreground tracking-tighter">Selecione o Cliente</h2>
            <p className="text-muted-foreground max-w-md mx-auto italic font-medium">Escolha um cliente ativo para vincular este planejamento.</p>
          </div>

          <div className="max-w-md mx-auto">
            {clients.length === 0 ? (
              <div className="bg-amber-500/10 text-amber-600 p-6 rounded-3xl border border-amber-500/20 text-sm">
                Nenhum cliente ativo encontrado. <Link href="/app/clientes" className="font-black underline decoration-2">Crie um cliente</Link> primeiro.
              </div>
            ) : (
              <div className="relative group">
                <select 
                  className="w-full bg-muted/50 border border-border rounded-2xl p-6 text-xl font-black tracking-tight focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none text-center text-foreground cursor-pointer group-hover:bg-muted"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button 
            disabled={!selectedClientId}
            onClick={() => setStep(2)}
            className="px-12 py-5 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/10 disabled:opacity-30 active:scale-[0.98] transition-all"
          >
            Próximo Passo
          </button>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && (
        <div className="glass p-12 text-center space-y-8 rounded-[3rem] animate-in slide-in-from-right-8 duration-500">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-foreground tracking-tighter">Upload do Arquivo</h2>
            <p className="text-muted-foreground max-w-md mx-auto italic font-medium">Envie o arquivo .docx que contém o cronograma bruto.</p>
          </div>

          <div className="max-w-md mx-auto">
            <label className="group block cursor-pointer">
              <div className={`border-2 border-dashed rounded-[2.5rem] p-16 transition-all duration-300 ${
                file ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/30 border-border group-hover:border-primary group-hover:bg-muted/50'
              }`}>
                <div className="flex flex-col items-center">
                  <DocumentTextIcon className={`h-16 w-16 mb-4 transition-colors ${file ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                  <p className="text-sm font-black text-foreground truncate max-w-full px-4">
                    {file ? file.name : 'Selecione o arquivo .docx ou .pdf'}
                  </p>
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mt-2">DOCX ou PDF (Texto)</p>
                  <p className="text-[10px] font-bold text-muted-foreground/60 italic mt-1">PDF escaneado/imagem ainda não é suportado.</p>
                </div>
              </div>
              <input 
                type="file" 
                className="hidden" 
                id="file-upload"
                accept=".docx,.pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => setStep(1)} className="px-8 py-5 border border-border rounded-2xl font-black text-muted-foreground hover:bg-muted transition-all">Voltar</button>
            <button 
              disabled={!file}
              onClick={handleProcess}
              className="px-12 py-5 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/10 disabled:opacity-30 active:scale-[0.98] transition-all"
            >
              Processar com IA
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Loading */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center animate-bounce mb-8 shadow-2xl shadow-primary/30">
            <SparklesIcon className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tighter mb-2">{loadingText}</h2>
          <p className="text-muted-foreground text-sm font-medium italic">Isso pode levar alguns segundos, a IA está trabalhando...</p>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 4 && parsedPlan && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          {/* Metadata Bar */}
          <div className="glass p-8 rounded-[2.5rem] border-border grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Cliente Selecionado</label>
              <div className="text-xl font-black text-foreground tracking-tight">{clients.find(c => c.id === selectedClientId)?.name}</div>
              {parsedPlan.client_name && parsedPlan.client_name.toLowerCase() !== clients.find(c => c.id === selectedClientId)?.name.toLowerCase() && (
                <div className="text-[10px] text-amber-600 font-bold uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md inline-block">Detectado no arquivo: {parsedPlan.client_name}</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Período (Mês/Ano)</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  value={parsedPlan.month || ''} 
                  onChange={(e) => setParsedPlan({ ...parsedPlan, month: parseInt(e.target.value) || null })}
                  placeholder="Mês"
                  className="w-16 bg-muted/50 border border-border rounded-xl p-3 text-sm font-black text-center focus:outline-none focus:border-primary transition-all"
                />
                <span className="text-muted-foreground opacity-30">/</span>
                <input 
                  type="number" 
                  value={parsedPlan.year || ''} 
                  onChange={(e) => setParsedPlan({ ...parsedPlan, year: parseInt(e.target.value) || null })}
                  placeholder="Ano"
                  className="w-24 bg-muted/50 border border-border rounded-xl p-3 text-sm font-black text-center focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Título do Planejamento</label>
              <input 
                type="text" 
                value={parsedPlan.title || ''} 
                onChange={(e) => setParsedPlan({ ...parsedPlan, title: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm font-black text-foreground focus:outline-none focus:border-primary transition-all"
                placeholder="Ex: Conteúdo Agosto 2024"
              />
            </div>
          </div>

          {/* Warnings */}
          {parsedPlan.warnings.length > 0 && (
            <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-[2rem] p-8 space-y-3">
              <div className="flex items-center space-x-2 text-amber-600">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Observações da IA</span>
              </div>
              <ul className="space-y-2 pl-1">
                {parsedPlan.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-foreground/80 italic font-medium">• {w.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-black text-foreground tracking-tighter uppercase">Posts Identificados ({parsedPlan.items.length})</h3>
              <button 
                onClick={() => setShowDistributeModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
              >
                <SparklesIcon className="h-4 w-4" />
                <span>Organizar datas com IA</span>
              </button>
            </div>

            <div className="space-y-4">
              {parsedPlan.items.map((item, index) => (
                <div key={index} className="glass p-6 md:p-10 rounded-[2.5rem] border-border group transition-all hover:bg-card/50 relative">
                  <button 
                    onClick={() => removeItem(index)}
                    className="absolute top-8 right-8 p-2.5 bg-muted/50 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Side Info */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Data</label>
                          <input 
                            type="date" 
                            value={item.date || ''} 
                            onChange={(e) => updateItem(index, 'date', e.target.value)}
                            className="w-full bg-muted/50 border border-border rounded-xl p-3 text-[10px] font-black text-foreground"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Hora</label>
                          <input 
                            type="time" 
                            value={item.time || ''} 
                            onChange={(e) => updateItem(index, 'time', e.target.value)}
                            className="w-full bg-muted/50 border border-border rounded-xl p-3 text-[10px] font-black text-foreground"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Canal</label>
                        <input 
                          type="text" 
                          value={item.channel || ''} 
                          onChange={(e) => updateItem(index, 'channel', e.target.value)}
                          placeholder="Instagram, etc."
                          className="w-full bg-muted/50 border border-border rounded-xl p-3 text-[10px] font-black text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Formato</label>
                        <input 
                          type="text" 
                          value={item.format || ''} 
                          onChange={(e) => updateItem(index, 'format', e.target.value)}
                          placeholder="Reels, Post, etc."
                          className="w-full bg-muted/50 border border-border rounded-xl p-3 text-[10px] font-black text-foreground"
                        />
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Título / Tema</label>
                        <input 
                          type="text" 
                          value={item.title || ''} 
                          onChange={(e) => updateItem(index, 'title', e.target.value)}
                          className="w-full bg-muted/50 border border-border rounded-xl p-4 text-sm font-black text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Legenda</label>
                        <textarea 
                          value={item.caption || ''} 
                          onChange={(e) => updateItem(index, 'caption', e.target.value)}
                          rows={4}
                          className="w-full bg-muted/50 border border-border rounded-xl p-4 text-sm text-foreground leading-relaxed italic scrollbar-hide"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Direção de Arte</label>
                          <textarea 
                            value={item.creative_direction || ''} 
                            onChange={(e) => updateItem(index, 'creative_direction', e.target.value)}
                            rows={5}
                            className="w-full bg-muted/50 border border-border rounded-xl p-4 text-xs text-muted-foreground italic leading-relaxed scrollbar-hide whitespace-pre-wrap"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Referência / URL</label>
                          <input 
                            type="text" 
                            value={item.reference_url || ''} 
                            onChange={(e) => updateItem(index, 'reference_url', e.target.value)}
                            placeholder="Link da referência"
                            className="w-full bg-muted/50 border border-border rounded-xl p-4 text-[11px] text-primary font-bold truncate"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-10 border-t border-border gap-4">
            <button 
              onClick={() => { setStep(2); setFile(null); }}
              className="w-full sm:w-auto px-10 py-5 border border-border rounded-2xl font-black text-muted-foreground hover:bg-muted active:scale-[0.98] transition-all"
            >
              Reiniciar Importação
            </button>
            <button 
              onClick={() => handleConfirm()}
              className="w-full sm:w-auto px-16 py-5 bg-primary text-primary-foreground rounded-2xl font-black shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all text-lg"
            >
              Confirmar e Criar Planejamento
            </button>
          </div>
        </div>
      )}
      {/* Debug Area (Dev Only) */}
      {isDev && (rawText || rawJson) && (
        <div className="mt-20 pt-10 border-t border-dashed border-border opacity-50 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4"
          >
            {showDebug ? '[-] Esconder Debug IA' : '[+] Mostrar Debug IA'}
          </button>
          
          {showDebug && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-foreground">Texto Extraído (Mammoth)</h4>
                <div className="bg-muted/30 rounded-2xl p-6 text-[11px] font-mono whitespace-pre-wrap overflow-y-auto max-h-[400px] border border-border">
                  {rawText}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-foreground">JSON Bruto (Gemini)</h4>
                <div className="bg-muted/30 rounded-2xl p-6 text-[11px] font-mono whitespace-pre-wrap overflow-y-auto max-h-[400px] border border-border">
                  {JSON.stringify(rawJson, null, 2)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Distribution Modal */}
      <DistributionModal 
        isOpen={showDistributeModal}
        onClose={() => {
          setShowDistributeModal(false)
          setModalError(null)
          setDistributionResult(null)
        }}
        instructions={distributionInstructions}
        setInstructions={setDistributionInstructions}
        allowOverflow={allowOverflow}
        setAllowOverflow={setAllowOverflow}
        onConfirm={handleDistributeDates}
        result={distributionResult}
        loading={loading}
        month={parsedPlan?.month}
        year={parsedPlan?.year}
        error={modalError}
      />

      <DecisionModal 
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        existingPlan={existingPlan}
        onAppend={duplicates.length > 0 ? () => { setShowDecisionModal(false); setShowDuplicateWarning(true); } : handleAppend}
        onOpen={() => router.push(`/app/planejamentos/${existingPlan.id}`)}
        newCount={parsedPlan?.items.length || 0}
      />

      <DuplicateWarning 
        isOpen={showDuplicateWarning}
        onClose={() => setShowDuplicateWarning(false)}
        duplicates={duplicates}
        onConfirm={handleAppend}
      />
    </div>
  )
}

function DistributionModal({ 
  isOpen, 
  onClose, 
  instructions, 
  setInstructions, 
  allowOverflow, 
  setAllowOverflow, 
  onConfirm,
  result,
  loading,
  month,
  year,
  error
}: any) {
  if (!isOpen) return null

  const overflowCount = result?.overflow_items?.length || 0
  const monthName = month ? new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' }) : 'mês'

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[210] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="glass w-full max-w-2xl rounded-[3rem] border-border overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="p-8 border-b border-border flex justify-between items-center bg-muted/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tighter">Organizar datas com IA</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Defina as regras de distribuição</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all">
            <XMarkIcon className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-2xl border border-destructive/20 flex items-start space-x-2 animate-in shake duration-500">
              <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Instruções de Distribuição</label>
            <textarea 
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Postar todas as segundas e quartas às 18:00, começando dia 05..."
              className="w-full bg-muted/50 border border-border rounded-2xl p-6 text-sm italic focus:outline-none focus:border-primary transition-all min-h-[120px]"
            />
            <p className="text-[10px] text-muted-foreground font-medium italic">
              Dica: Você pode ser específico sobre dias da semana, horários e ordem.
            </p>
          </div>

          <div className="bg-muted/30 p-6 rounded-2xl border border-border flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-black text-foreground">Regra de Overflow</p>
              <p className="text-xs text-muted-foreground italic">Permitir que a IA utilize datas do próximo mês se necessário.</p>
            </div>
            <button 
              onClick={() => setAllowOverflow(!allowOverflow)}
              className={`w-14 h-8 rounded-full transition-all relative ${allowOverflow ? 'bg-primary' : 'bg-muted border border-border'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${allowOverflow ? 'right-1' : 'left-1 shadow-sm'}`} />
            </button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest">
            Por padrão, o Planner D distribui apenas dentro de {monthName} {year}.
          </p>

          {overflowCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-4">
              <div className="flex items-center space-x-2 text-amber-600">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="font-black text-sm">{overflowCount} posts não couberam dentro de {monthName} {year}.</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 bg-white/50 hover:bg-white border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Manter sem data
                </button>
                <button 
                  onClick={() => setInstructions(instructions + " Pode passar para o próximo mês.")}
                  className="px-4 py-2 bg-white/50 hover:bg-white border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Tentar novamente com outra regra
                </button>
                <button 
                  onClick={() => { setAllowOverflow(true); setTimeout(onConfirm, 100); }}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Permitir próximo mês
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-border bg-muted/30 flex justify-end">
          <button 
            disabled={!instructions || loading}
            onClick={onConfirm}
            className="px-12 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/20 disabled:opacity-30 active:scale-[0.98] transition-all"
          >
            {loading ? 'Processando...' : 'Aplicar Distribuição'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DecisionModal({ isOpen, onClose, existingPlan, onAppend, onOpen, newCount }: any) {
  if (!isOpen || !existingPlan) return null

  const monthName = new Date(existingPlan.year, existingPlan.month - 1).toLocaleString('pt-BR', { month: 'long' })

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="glass w-full max-w-md rounded-[3rem] border-border p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
            <CalendarDaysIcon className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-foreground tracking-tighter">Já existe um planejamento para este mês</h3>
          <p className="text-sm text-muted-foreground italic font-medium leading-relaxed">
            O cliente <strong>{existingPlan.clientName}</strong> já possui o planejamento <strong>"{existingPlan.title}"</strong> para {monthName}/{existingPlan.year}.
          </p>
        </div>

        <div className="bg-muted/30 rounded-2xl p-6 border border-border space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-bold uppercase tracking-widest">Posts existentes</span>
            <span className="font-black text-foreground">{existingPlan.itemCount}</span>
          </div>
          <div className="h-px bg-border/50" />
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-bold uppercase tracking-widest text-primary">+ Novos posts da prévia</span>
            <span className="font-black text-primary">{newCount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onAppend}
            className="w-full py-5 bg-primary text-primary-foreground rounded-2xl text-sm font-black shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Adicionar ao Planejamento Existente
          </button>
          <button 
            onClick={onOpen}
            className="w-full py-4 text-xs font-black uppercase text-foreground tracking-widest hover:bg-muted rounded-2xl transition-all"
          >
            Abrir Planejamento Atual
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 text-xs font-black uppercase text-muted-foreground tracking-widest hover:text-destructive transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function DuplicateWarning({ isOpen, onClose, duplicates, onConfirm }: any) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[310] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="glass w-full max-w-lg rounded-[3rem] border-border p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto border border-destructive/20">
            <ExclamationTriangleIcon className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">Possíveis posts duplicados</h3>
          <p className="text-sm text-muted-foreground italic font-medium leading-relaxed">
            Alguns conteúdos deste DOCX parecem já existir neste planejamento. Deseja importar mesmo assim?
          </p>
        </div>

        <div className="max-h-[300px] overflow-y-auto scrollbar-hide space-y-3 pr-2">
          {duplicates.map((item: any, i: number) => (
            <div key={i} className="p-4 bg-muted/30 rounded-xl border border-border flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border">
                <span className="text-[10px] font-black">{item.index + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-foreground truncate">{item.title || 'Sem título'}</p>
                <div className="flex items-center space-x-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  <span>{item.date || 'Sem data'}</span>
                  <span>•</span>
                  <span>{item.format || 'Sem formato'}</span>
                  <span>•</span>
                  <span>{item.channel || 'Sem canal'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button 
            onClick={onConfirm}
            className="w-full py-5 bg-destructive text-white rounded-2xl text-sm font-black shadow-xl shadow-destructive/20 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Importar Mesmo Assim
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 text-xs font-black uppercase text-muted-foreground tracking-widest hover:text-foreground transition-all"
          >
            Voltar para a prévia e revisar
          </button>
        </div>
      </div>
    </div>
  )
}
