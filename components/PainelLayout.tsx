"use client"
import { useEffect, useRef, useState } from "react"
import { VendasParceiro }  from "./VendasParceiro"
import { PipelineCRM }     from "./PipelineCRM"
import { FunilAoVivo }     from "./FunilAoVivo"
import { FunilIndividual } from "./FunilIndividual"
import { ControleFicha }   from "./ControleFicha"
import { Agenda }          from "./Agenda"

type Tab = "overview" | "pipeline" | "agenda"

const NAV: { id: Tab; label: string; hint: string; icon: string }[] = [
  { id: "overview", label: "Visão Geral",   hint: "Metas & volume",       icon: "◎" },
  { id: "pipeline", label: "Pipeline CRM",  hint: "Funil de vendas",      icon: "⬡" },
  { id: "agenda",   label: "Agenda",        hint: "Dia & semana",         icon: "▦" },
]

const ACCENT  = { color: "oklch(0.55 0.19 276)", bg: "oklch(0.55 0.19 276 / 0.09)" }
const PLEDGES: Record<Tab, string> = {
  overview: "Impossível não entregarmos esse resultado",
  pipeline: "Fazemos o que precisa ser feito",
  agenda:   "Você é o único responsável pelo seu resultado",
}

function clock() {
  const d = new Date()
  return {
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    date: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }),
  }
}

export function PainelLayout() {
  const [tab, setTab]         = useState<Tab>("overview")
  const [clk, setClk]         = useState(clock)
  const [collapsed, setCol]   = useState(false)
  const [entered, setEntered] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => setClk(clock()), 1000)
    setTimeout(() => setEntered(true), 80)
    return () => clearInterval(id)
  }, [])

  function switchTab(t: Tab) {
    setEntered(false)
    setTab(t)
    setTimeout(() => setEntered(true), 60)
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" })
  }

  const meta: Record<Tab, { title: string; sub: string }> = {
    overview: { title: "Visão Geral", sub: "Área do parceiro, metas e volume vendido" },
    pipeline: { title: "Pipeline — CRM de Consórcio", sub: "Funil geral e desempenho por consultor" },
    agenda:   { title: "Agenda", sub: "Compromissos do dia e semana" },
  }

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh", background: "oklch(0.97 0.003 260)", color: "oklch(0.22 0.01 260)", overflow: "hidden", fontFamily: "'Manrope', sans-serif" }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: collapsed ? 72 : 264, minWidth: collapsed ? 72 : 264,
        height: "100%", background: "oklch(0.995 0.002 260)",
        borderRight: "1px solid oklch(0 0 0 / 0.07)",
        display: "flex", flexDirection: "column",
        padding: collapsed ? "28px 10px" : "28px 18px",
        transition: "width 0.25s cubic-bezier(.16,1,.3,1), min-width 0.25s cubic-bezier(.16,1,.3,1), padding 0.25s",
        overflow: "hidden",
      }}>

        {/* Logo + collapse */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", marginBottom: 28, paddingInline: collapsed ? 0 : 8 }}>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "oklch(0.22 0.01 260)", letterSpacing: "-0.01em" }}>ALM</div>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.6 0.01 260)", marginTop: 1 }}>Painel Corporativo</div>
            </div>
          )}
          <button
            onClick={() => setCol(c => !c)}
            style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid oklch(0 0 0 / 0.08)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "oklch(0.55 0.01 260)", flexShrink: 0 }}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV.map(n => {
            const active = n.id === tab
            return (
              <button
                key={n.id}
                onClick={() => switchTab(n.id)}
                title={collapsed ? n.label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: collapsed ? "11px 0" : "11px 12px",
                  borderRadius: 12, border: "none", cursor: "pointer",
                  textAlign: "left", width: "100%",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active ? ACCENT.bg : "transparent",
                  color: active ? ACCENT.color : "oklch(0.42 0.01 260)",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
                {!collapsed && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{n.label}</span>
                    <span style={{ fontSize: 11, opacity: 0.65, fontWeight: 500 }}>{n.hint}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Relógio */}
        {!collapsed && (
          <div style={{ padding: "14px 12px", borderRadius: 14, background: "oklch(0.97 0.003 260)", border: "1px solid oklch(0 0 0 / 0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "oklch(0.58 0.14 155)", animation: "pulseDot 1.8s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "oklch(0.58 0.14 155)", textTransform: "uppercase" }}>Ao vivo</span>
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "oklch(0.22 0.01 260)" }}>{clk.time}</div>
            <div style={{ fontSize: 11, color: "oklch(0.6 0.01 260)", marginTop: 2 }}>{clk.date}</div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div ref={mainRef} style={{ flex: 1, height: "100%", overflowY: "auto", padding: "32px 40px 60px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: "oklch(0.2 0.01 260)", letterSpacing: "-0.01em" }}>
              {meta[tab].title}
            </div>
            <div style={{ fontSize: 13.5, color: "oklch(0.5 0.01 260)", marginTop: 4 }}>{meta[tab].sub}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 0.08)", fontSize: 12, color: "oklch(0.5 0.01 260)" }}>
              sync {clk.time}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999, background: ACCENT.bg, fontSize: 12, fontWeight: 700, color: ACCENT.color }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT.color, animation: "pulseDot 1.8s ease-in-out infinite" }} />
              Tempo real
            </div>
          </div>
        </div>

        {/* Views */}
        <div style={{ animation: entered ? "fadeSlideIn 0.35s cubic-bezier(.16,1,.3,1) both" : "none" }}>

          {/* Pledge banner */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 22px", borderRadius: 999, background: "linear-gradient(90deg, oklch(0.97 0.05 80), oklch(0.96 0.04 75))", border: "1px solid color-mix(in oklch, oklch(0.7 0.14 85) 40%, transparent)", marginBottom: 24, cursor: "pointer" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "oklch(0.6 0.14 75)", flexShrink: 0, animation: "pulseDot 1.6s ease-in-out infinite" }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "oklch(0.3 0.05 75)", letterSpacing: "0.01em" }}>{PLEDGES[tab]}</span>
          </div>

          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <VendasParceiro />
              <ControleFicha />
            </div>
          )}

          {tab === "pipeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <PipelineCRM />
              <FunilIndividual />
            </div>
          )}

          {tab === "agenda" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Agenda />
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
