'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.')
      setLoading(false)
    } else {
      router.push('/app')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 selection:bg-primary/20">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] animate-pulse-subtle"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] animate-pulse-subtle delay-1000"></div>
      </div>

      <div className="max-w-md w-full relative animate-in fade-in zoom-in duration-1000">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-foreground tracking-tighter">Planner D</h1>
          <p className="text-muted-foreground mt-2 text-[10px] uppercase tracking-[0.4em] font-black opacity-50">Content Management System</p>
        </div>

        <div className="glass p-10 md:p-12 rounded-[3rem] border-border shadow-2xl">
          <div className="mb-10 text-center">
            <h2 className="text-xl font-black text-foreground tracking-tight uppercase">Acesso Restrito</h2>
            <p className="text-xs text-muted-foreground font-medium italic mt-1">Identifique-se para gerenciar seus planejamentos.</p>
          </div>
          
          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-2xl mb-8 text-xs font-bold flex items-center animate-in shake duration-500">
              <span className="mr-3 text-lg">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">E-mail</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-2xl p-4 pl-12 text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold placeholder:font-normal placeholder:text-muted-foreground/30"
                  placeholder="admin@plannerd.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Senha</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-2xl p-4 pl-12 text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold placeholder:font-normal placeholder:text-muted-foreground/30"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-2xl p-5 font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-2xl shadow-primary/20 disabled:opacity-50"
            >
              {loading ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
        
        <div className="mt-12 text-center space-y-4">
          <p className="text-muted-foreground/30 text-[9px] font-black uppercase tracking-[0.3em]">
            © 2026 Planner D • All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  )
}
