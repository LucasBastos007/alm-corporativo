"use client"
import { useCallback, useEffect, useState } from "react"

const META_ADESIONADA = 1_500_000

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

  return (
    <div style={{
      borderRadius: 16,
      border: "1px solid var(--border)",
      background: "var(--card)",
      overflow: "hidden",
    }}>
      {/* Topo: label + meta */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        padding: "14px 24px",
        borderBottom: "1px solid var(--border)",
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Área do Parceiro — {data ? mesLabel(data.periodo.start) : "Mês atual"}
            </p>
            <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "2px 0 0", opacity: 0.6 }}>Base44 · Resultado acumulado</p>
          </div>
          {/* Meta pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 99, background: `${metaColor}0d`, border: `1px solid ${metaColor}30` }}>
            <div style={{ width: 80, height: 4, borderRadius: 99, background: `${metaColor}20`, overflow: "hidden" }}>
              <div style={{ width: `${metaPct}%`, height: "100%", background: metaColor, borderRadius: 99, transition: "width 1s ease" }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: metaColor, whiteSpace: "nowrap" }}>
              {loading ? "—" : `${metaPct}% da meta`}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {syncAt && <span style={{ fontSize: 9, color: "var(--text-muted)" }}>sync {syncAt}</span>}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} className="animate-pulse" />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#16a34a" }}>Tempo real</span>
          </div>
        </div>
      </div>

      {/* Corpo: 3 colunas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr" }}>

        {/* Total Geral */}
        <div style={{ padding: "20px 28px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Volume Total Vendido
          </p>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#16a34a", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {loading ? "—" : brl(vd?.geral.total ?? 0)}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "6px 0 0", fontWeight: 500 }}>
            {loading ? "" : `${vd?.geral.count ?? 0} venda${(vd?.geral.count ?? 0) !== 1 ? "s" : ""} concluída${(vd?.geral.count ?? 0) !== 1 ? "s" : ""} no mês`}
          </p>
        </div>

        {/* Divider */}
        <div style={{ background: "var(--border)", margin: "16px 0" }} />

        {/* Adesionada */}
        <div style={{ padding: "20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Adesionada
            </p>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: 99, border: "1px solid rgba(99,102,241,0.2)" }}>
              {loading ? "—" : `${vd?.adesionada.count ?? 0} venda${(vd?.adesionada.count ?? 0) !== 1 ? "s" : ""}`}
            </span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: "#6366f1", margin: "0 0 12px", lineHeight: 1, letterSpacing: "-0.02em" }}>
            {loading ? "—" : brl(vd?.adesionada.total ?? 0)}
          </p>
          {/* Meta */}
          <div>
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
        </div>

        {/* Divider */}
        <div style={{ background: "var(--border)", margin: "16px 0" }} />

        {/* Linear */}
        <div style={{ padding: "20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
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
