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

const R = 32
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
  const dashFill     = (metaPct / 100) * CIRC

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Área do Parceiro — gauge circular */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 28px", display: "flex", alignItems: "center", gap: 24, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        {/* Circular gauge */}
        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="7" />
            <circle
              cx="40" cy="40" r={R}
              fill="none"
              stroke={metaColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dashFill} ${CIRC}`}
              transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "var(--text)" }}>
            {loading ? "—" : `${metaPct}%`}
          </div>
        </div>

        {/* Texto */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", margin: 0 }}>
            Área do Parceiro — {data ? mesLabel(data.periodo.start) : "Mês atual"}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0", opacity: 0.7 }}>
            Base44 · Resultado acumulado da meta
          </p>
        </div>

        {syncAt && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>sync {syncAt}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} className="animate-pulse" />
              <span style={{ fontSize: 9, fontWeight: 700, color: "#16a34a" }}>Tempo real</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI cards: Volume | Adesionada | Linear */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

        {/* Volume Total Vendido */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", margin: "0 0 10px" }}>
            Volume Total Vendido
          </p>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#16a34a", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {loading ? "—" : brl(vd?.geral.total ?? 0)}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "8px 0 0", fontWeight: 500 }}>
            {loading ? "" : `${vd?.geral.count ?? 0} venda${(vd?.geral.count ?? 0) !== 1 ? "s" : ""} concluída${(vd?.geral.count ?? 0) !== 1 ? "s" : ""} no mês`}
          </p>
        </div>

        {/* Adesionada */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", margin: 0 }}>
              Adesionada
            </p>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: 99, border: "1px solid rgba(99,102,241,0.2)" }}>
              {loading ? "—" : `${vd?.adesionada.count ?? 0} venda${(vd?.adesionada.count ?? 0) !== 1 ? "s" : ""}`}
            </span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: "#6366f1", margin: "0 0 12px", lineHeight: 1, letterSpacing: "-0.02em" }}>
            {loading ? "—" : brl(vd?.adesionada.total ?? 0)}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>Meta mensal</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: metaColor }}>{brlFull(META_ADESIONADA)}</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: "rgba(99,102,241,0.1)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${metaPct}%`, background: metaColor, transition: "width 1s ease" }} />
          </div>
          <p style={{ fontSize: 9, fontWeight: 700, color: metaRestante > 0 ? "#d97706" : "#16a34a", margin: "5px 0 0" }}>
            {loading ? "" : metaRestante > 0 ? `Faltam ${brl(metaRestante)} para a meta` : "Meta atingida"}
          </p>
        </div>

        {/* Linear */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", margin: 0 }}>
              Linear
            </p>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#0ea5e9", background: "rgba(14,165,233,0.1)", padding: "2px 8px", borderRadius: 99, border: "1px solid rgba(14,165,233,0.2)" }}>
              {loading ? "—" : `${vd?.linear.count ?? 0} venda${(vd?.linear.count ?? 0) !== 1 ? "s" : ""}`}
            </span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: "#0ea5e9", margin: "0 0 12px", lineHeight: 1, letterSpacing: "-0.02em" }}>
            {loading ? "—" : brl(vd?.linear.total ?? 0)}
          </p>
          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            Carta de crédito linear
          </p>
        </div>

      </div>
    </div>
  )
}
