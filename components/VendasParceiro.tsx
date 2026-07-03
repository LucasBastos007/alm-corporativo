"use client"
import { useCallback, useEffect, useState } from "react"

const META_ADESIONADA = 2_500_000

interface Vendas {
  adesionada: { count: number; total: number }
  linear:     { count: number; total: number }
  geral:      { count: number; total: number }
}
interface ApiData {
  vendas:  Vendas
  periodo: { start: string; end: string }
}

function brl(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`
  if (v >= 1_000)     return `R$ ${(v / 1_000).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K`
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
}
function brlFull(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
}
function mesLabel(start: string) {
  if (!start) return ""
  const [y, m] = start.split("-")
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  return `${meses[Number(m) - 1]} ${y}`
}

const R = 40
const CIRC = 2 * Math.PI * R

export function VendasParceiro() {
  const [data, setData]       = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncAt, setSyncAt]   = useState("")

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/parceiro", { cache: "no-store" })
      const json = await res.json()
      if (json.ok) { setData(json); setSyncAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })) }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(); const id = setInterval(load, 60_000); return () => clearInterval(id) }, [load])

  const vd           = data?.vendas
  const metaPct      = vd ? Math.min(Math.round((vd.adesionada.total / META_ADESIONADA) * 100), 100) : 0
  const metaRestante = vd ? Math.max(META_ADESIONADA - vd.adesionada.total, 0) : META_ADESIONADA
  const metaColor    = metaPct >= 100 ? "#16a34a" : metaPct >= 50 ? "#d97706" : "#6366f1"
  const dashOffset = CIRC * (1 - metaPct / 100)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Área do Parceiro — gauge circular */}
      <div style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 0.07)", borderRadius: 18, padding: "20px 28px", display: "flex", alignItems: "center", gap: 24, marginBottom: 8, boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)" }}>
        {/* Circular gauge — 96px, r=40, dashoffset approach */}
        <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
          <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="48" cy="48" r={R} fill="none" stroke="oklch(0 0 0 / 0.07)" strokeWidth="10" />
            <circle
              cx="48" cy="48" r={R}
              fill="none"
              stroke={metaColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "oklch(0.22 0.01 260)" }}>
              {loading ? "—" : `${metaPct}%`}
            </span>
          </div>
        </div>

        {/* Texto */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "oklch(0.55 0.01 260)", margin: 0 }}>
            Área do Parceiro — {data ? mesLabel(data.periodo.start) : "Mês atual"}
          </p>
          <p style={{ fontSize: 13, color: "oklch(0.5 0.01 260)", margin: "4px 0 0" }}>
            Base44 · Resultado acumulado da meta
          </p>
        </div>

        {syncAt && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: "oklch(0.55 0.01 260)" }}>sync {syncAt}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} className="animate-pulse" />
              <span style={{ fontSize: 9, fontWeight: 700, color: "#16a34a" }}>Tempo real</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI cards: Volume | Adesionada | Linear */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>

        {/* Volume Total Vendido */}
        <div style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 0.07)", borderRadius: 18, padding: 24, boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)", display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "oklch(0.55 0.01 260)" }}>
            Volume Total Vendido
          </span>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: "#16a34a", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {loading ? "—" : brl(vd?.geral.total ?? 0)}
          </div>
          <div style={{ fontSize: 12.5, color: "oklch(0.55 0.01 260)" }}>
            {loading ? "" : `${vd?.geral.count ?? 0} venda${(vd?.geral.count ?? 0) !== 1 ? "s" : ""} concluída${(vd?.geral.count ?? 0) !== 1 ? "s" : ""} no mês`}
          </div>
        </div>

        {/* Adesionada */}
        <div style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 0.07)", borderRadius: 18, padding: 24, boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "oklch(0.55 0.01 260)" }}>Adesionada</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: 99, border: "1px solid rgba(99,102,241,0.2)" }}>
              {loading ? "—" : `${vd?.adesionada.count ?? 0} venda${(vd?.adesionada.count ?? 0) !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: "#6366f1", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {loading ? "—" : brl(vd?.adesionada.total ?? 0)}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "oklch(0.5 0.01 260)", marginTop: 2 }}>
              <span>Meta mensal</span>
              <span style={{ fontWeight: 600, color: "oklch(0.32 0.01 260)" }}>{brlFull(META_ADESIONADA)}</span>
            </div>
            <div style={{ width: "100%", height: 6, borderRadius: 999, background: "oklch(0 0 0 / 0.07)", overflow: "hidden", marginTop: 6 }}>
              <div style={{ height: "100%", borderRadius: 999, width: `${metaPct}%`, background: metaColor, transition: "width 1.4s cubic-bezier(.16,1,.3,1)" }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "oklch(0.64 0.15 70)", marginTop: 4 }}>
              {loading ? "" : metaRestante > 0 ? `Faltam ${brl(metaRestante)} para a meta` : "Meta atingida"}
            </div>
          </div>
        </div>

        {/* Linear */}
        <div style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 0.07)", borderRadius: 18, padding: 24, boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "oklch(0.55 0.01 260)" }}>Linear</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#0ea5e9", background: "rgba(14,165,233,0.1)", padding: "2px 8px", borderRadius: 99, border: "1px solid rgba(14,165,233,0.2)" }}>
              {loading ? "—" : `${vd?.linear.count ?? 0} venda${(vd?.linear.count ?? 0) !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: "#0ea5e9", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {loading ? "—" : brl(vd?.linear.total ?? 0)}
          </div>
          <div style={{ fontSize: 12.5, color: "oklch(0.55 0.01 260)" }}>
            Carta de crédito linear
          </div>
        </div>

      </div>
    </div>
  )
}
