"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        className="h-10 w-10 rounded-xl border border-zinc-200/70 bg-white/50 dark:border-white/10 dark:bg-zinc-900/50"
        aria-label="Alternar tema"
      />
    )
  }

  const isDark = resolvedTheme === "dark" || theme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 text-zinc-700 shadow-sm transition hover:bg-white/80 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800/70"
      aria-label="Alternar tema"
      title={isDark ? "Modo claro" : "Modo escuro"}
    >
      {isDark ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  )
}
