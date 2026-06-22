"use client"
import { useEffect, useState } from "react"

export function Header() {
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
      setDate(now.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-card)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: "var(--gold-glow)", border: "1px solid var(--gold-border)", color: "var(--gold)" }}>
          A
        </div>
        <div>
          <p className="text-sm font-black tracking-tight" style={{ color: "var(--text)" }}>ALM Empreendimentos</p>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Painel Corporativo</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xl font-black tabular-nums" style={{ color: "var(--gold)" }}>{time}</p>
          <p className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>{date}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", color: "#16a34a" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          AO VIVO
        </div>
      </div>
    </header>
  )
}
