'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  UsersIcon, 
  ArrowUpTrayIcon, 
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  PowerIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

const menuItems = [
  { name: 'Início', href: '/app', icon: HomeIcon },
  { name: 'Clientes', href: '/app/clientes', icon: UsersIcon },
  { name: 'Importar', href: '/app/importar', icon: ArrowUpTrayIcon },
  { name: 'Planejamentos', href: '/app/planejamentos', icon: CalendarIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navContent = (
    <div className="flex flex-col h-full font-sans">
      <div className="p-8 pb-10">
        <h1 className="text-2xl font-black text-foreground tracking-tighter uppercase">Planner D</h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-primary font-black mt-1 opacity-50">
          Agency System
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 px-4 py-4 rounded-2xl text-sm font-bold transition-all duration-300 relative group ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              <span className="tracking-tight">{item.name}</span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground/50 rounded-full blur-[2px]" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-2xl border border-border">
          <ThemeToggle />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Tema</span>
        </div>
        
        <div className="p-4 bg-accent/30 rounded-3xl border border-border/50 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-black shadow-lg">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-foreground truncate uppercase tracking-tight">Admin User</p>
              <p className="text-[10px] text-muted-foreground truncate font-medium italic">Agency Manager</p>
            </div>
            <form action="/auth/signout" method="post">
               <button type="submit" className="text-muted-foreground/40 hover:text-destructive transition-colors">
                  <PowerIcon className="h-4 w-4" />
               </button>
            </form>
          </div>
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-6 left-6 z-[60] p-3.5 bg-background border border-border rounded-2xl shadow-2xl lg:hidden active:scale-90 transition-transform"
      >
        <Bars3Icon className="h-6 w-6 text-foreground" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 glass z-50 hidden lg:flex flex-col border-r border-border">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-background/60 backdrop-blur-md z-[70] lg:hidden animate-in fade-in duration-300" 
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-screen w-72 glass-dark z-[80] lg:hidden animate-in slide-in-from-left duration-500 border-r border-border/20">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-8 right-6 p-2 text-muted-foreground hover:text-foreground transition-all hover:rotate-90"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            {navContent}
          </aside>
        </>
      )}
    </>
  )
}
