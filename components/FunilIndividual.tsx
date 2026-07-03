"use client"
import { useCallback, useEffect, useState } from "react"

interface ConsultorFunil {
  nome: string
  total: number
  interagindo: number
  qualificado: number
  negociado: number
  vendido: number
}

interface ApiData {
  funil: { label: string; count: number; color: string }[]
  consultores: ConsultorFunil[]
}

const ETAPAS = [
  { label: "Prospecção",  color: "#6366f1" },
  { label: "Interagindo", color: "#8b5cf6" },
  { label: "Qualificado", color: "#f59e0b" },
  { label: "Negociado",   color: "#f97316" },
  { label: "Vendido",     color: "#22c55e" },
]

const CONSULTORES_FIXOS = ["Andressa","Carlos","Fernando","Whatylla","Mateus","Rayssa","Clenildo"]
const COL_COLORS = ["#6366f1","#ec4899","#f59e0b","#16a34a","#2563eb","#7c3aed","#dc2626"]
const MESES_PT   = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

const R_SMALL   = 22
const CIRC_SMALL = 2 * Math.PI * R_SMALL

function brazilNow() { return new Date(Date.now() - 3 * 60 * 60 * 1000) }
function mesAtual()  { const d = brazilNow(); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}` }
function mesPrev(mes: string) {
  const [y, m] = mes.split("-").map(Number)
  return m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,"0")}`
}
function mesNext(mes: string) {
  const [y, m] = mes.split("-").map(Number)
  return m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,"0")}`
}
function mesLabel(mes: string) {
  const [y, m] = mes.split("-").map(Number)
  return `${MESES_PT[m-1]} ${y}`
}

function numSemanas(mes: string): number {
  const [y, m] = mes.split("-").map(Number)
  return Math.ceil(new Date(y, m, 0).getDate() / 7)
}

function semanaLabel(semana: number, mes: string): string {
  const [y, m] = mes.split("-").map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const start = (semana - 1) * 7 + 1
  const end   = Math.min(semana * 7, daysInMonth)
  const pad   = (n: number) => String(n).padStart(2, "0")
  return `${pad(start)}/${pad(m)} – ${pad(end)}/${pad(m)}`
}

function primNome(s: string) {
  return s.trim().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/\s+/)[0]
}

function matchConsultor(nomeDb: string, nomeFixo: string) {
  const db   = primNome(nomeDb)
  const fixo = primNome(nomeFixo)
  if (db === fixo) return true
  if (db.includes(fixo) || fixo.includes(db)) return true
  const len = Math.min(5, db.length, fixo.length)
  return len >= 4 && db.slice(0, len) === fixo.slice(0, len)
}

function ini(nome: string) {
  return nome.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0
}

function CardFunil({ nome, colIdx, data }: { nome: string; colIdx: number; data: ConsultorFunil | null }) {
  const colColor  = COL_COLORS[colIdx % COL_COLORS.length]
  const counts    = data ? [data.total, data.interagindo, data.qualificado, data.negociado, data.vendido] : [0,0,0,0,0]
  const max       = counts[0] || 1
  const convGeral = counts[0] > 0 ? Math.round((counts[4] / counts[0]) * 100) : 0

  return (
    <div style={{ padding: "20px 22px", borderRadius: 16, background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 0.07)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${colColor}18`, border: `2px solid ${colColor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: colColor, flexShrink: 0 }}>
            {ini(nome)}
          </div>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: "oklch(0.26 0.01 260)" }}>{nome}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "oklch(0.5 0.01 260)" }}>{convGeral}%</span>
      </div>

      <div style={{ fontSize: 11.5, color: "oklch(0.5 0.01 260)", marginBottom: 12 }}>
        {counts[0]} leads · {counts[4]} vendas
      </div>

      {/* Stage bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {counts.map((count, i) => {
          const barW = max > 0 ? (count / max) * 100 : 0
          const { label, color } = ETAPAS[i]
          return (
            <div key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "oklch(0.5 0.01 260)", width: 78, flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: 20, borderRadius: 6, background: "oklch(0 0 0 / 0.055)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    borderRadius: 6,
                    background: color,
                    width: `${Math.max(barW, count > 0 ? 6 : 0)}%`,
                    transition: "width 1.2s cubic-bezier(.16,1,.3,1)",
                    display: "flex", alignItems: "center", paddingLeft: 8,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "oklch(0.99 0 0)" }}>{count}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type Periodo = "dia" | "mensal" | "semana1" | "semana2" | "semana3" | "semana4" | "semana5"

export function FunilIndividual() {
  const [data, setData]       = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState("")
  const [syncAt, setSyncAt]   = useState("")
  const [periodo, setPeriodo] = useState<Periodo>("dia")
  const [mes, setMes]         = useState(mesAtual)

  const isAtual = mes === mesAtual()

  const load = useCallback(async (p: Periodo, m: string) => {
    setLoading(true)
    try {
      const isCurrent = m === mesAtual()
      const qs = isCurrent ? `?periodo=${p}` : `?periodo=${p}&mes=${m}`
      const res  = await fetch(`/api/funil${qs}`, { cache: "no-store" })
      const json = await res.json()
      if (json.ok) {
        setData(json)
        setSyncAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))
        setErro("")
      } else setErro(json.error ?? "Erro")
    } catch (e) { setErro(String(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load(periodo, mes)
    if (!isAtual) return
    const id = setInterval(() => load(periodo, mes), 60_000)
    return () => clearInterval(id)
  }, [load, periodo, mes, isAtual])

  function handleSetMes(fn: (m: string) => string) {
    setMes(m => { const next = fn(m); setPeriodo("mensal"); return next })
  }

  const isDia = periodo === "dia"
  const totalSemanas = numSemanas(mes)
  const PERIODOS: { key: Periodo; label: string; sub?: string }[] = [
    { key: "dia",    label: "Dia" },
    { key: "mensal", label: "Mês" },
    ...Array.from({ length: totalSemanas }, (_, i) => ({
      key: `semana${i + 1}` as Periodo,
      label: `Sem. ${i + 1}`,
      sub: semanaLabel(i + 1, mes),
    })),
  ]

  // Summary stats from funil
  const funilFichas  = data?.funil[0]?.count ?? 0
  const funilVendidos = data?.funil[data ? data.funil.length - 1 : 0]?.count ?? 0
  const funilConv    = pct(funilVendidos, funilFichas)
  const smallOffset  = CIRC_SMALL * (1 - funilConv / 100)
  const ACCENT       = "oklch(0.55 0.19 276)"

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* Section label + controls */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.55 0.01 260)", paddingTop: 2 }}>
          Funil individual por consultor
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

          {!isDia && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, background: "oklch(0 0 0 / 0.04)", border: "1px solid oklch(0 0 0 / 0.07)", borderRadius: 10, padding: "3px 4px" }}>
              <button
                onClick={() => handleSetMes(mesPrev)}
                style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "oklch(0.55 0.01 260)" }}
              >‹</button>
              <span style={{ fontSize: 10, fontWeight: 800, color: "oklch(0.22 0.01 260)", minWidth: 60, textAlign: "center" }}>
                {mesLabel(mes)}
              </span>
              <button
                onClick={() => handleSetMes(mesNext)}
                disabled={isAtual}
                style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "transparent", cursor: isAtual ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: isAtual ? "oklch(0 0 0 / 0.15)" : "oklch(0.55 0.01 260)" }}
              >›</button>
            </div>
          )}

          <div style={{ display: "flex", gap: 2, background: "oklch(0 0 0 / 0.04)", border: "1px solid oklch(0 0 0 / 0.07)", borderRadius: 10, padding: "3px 4px" }}>
            {PERIODOS.map(p => (
              <button
                key={p.key}
                onClick={() => { if (p.key === "dia") setMes(mesAtual()); setPeriodo(p.key) }}
                title={p.sub}
                style={{
                  padding: "4px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontSize: 10, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap",
                  background: periodo === p.key ? "oklch(0.22 0.01 260)" : "transparent",
                  color: periodo === p.key ? "oklch(1 0 0)" : "oklch(0.55 0.01 260)",
                  transition: "all 0.15s",
                }}
              >{p.label}</button>
            ))}
          </div>

          {syncAt && <span style={{ fontSize: 10, color: "oklch(0.55 0.01 260)" }}>sync {syncAt}</span>}

          {isAtual ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "#16a34a" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulseDot 1.8s ease-in-out infinite" }} />
              Tempo real
            </div>
          ) : (
            <button
              onClick={() => { setMes(mesAtual()); setPeriodo("mensal") }}
              style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 7, border: "1px solid oklch(0 0 0 / 0.07)", background: "transparent", cursor: "pointer", color: "oklch(0.55 0.01 260)" }}
            >
              Ao vivo
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 40 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "oklch(0.55 0.01 260)" }}>Carregando funis...</span>
        </div>
      )}

      {!loading && erro && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: 20 }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, color: "#dc2626" }}>{erro}</span>
        </div>
      )}

      {!loading && !erro && data && (
        <>
          {/* Summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 24, marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 28, alignItems: "center", padding: "0 4px" }}>
              <div>
                <span style={{ fontSize: 12.5, color: "oklch(0.5 0.01 260)" }}>Conversão geral </span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "oklch(0.58 0.14 155)" }}>{funilConv}%</span>
              </div>
              <div>
                <span style={{ fontSize: 12.5, color: "oklch(0.5 0.01 260)" }}>Vendidos </span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "oklch(0.58 0.14 155)" }}>{funilVendidos}</span>
              </div>
              <div>
                <span style={{ fontSize: 12.5, color: "oklch(0.5 0.01 260)" }}>Fichas no período </span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: ACCENT }}>{funilFichas}</span>
              </div>
            </div>

            <div style={{ padding: "14px 18px", borderRadius: 16, background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 0.07)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="28" cy="28" r={R_SMALL} fill="none" stroke="oklch(0 0 0 / 0.07)" strokeWidth="7" />
                  <circle
                    cx="28" cy="28" r={R_SMALL}
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={CIRC_SMALL}
                    strokeDashoffset={smallOffset}
                    style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: "oklch(0.22 0.01 260)" }}>{funilConv}%</span>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: "oklch(0.5 0.01 260)", lineHeight: 1.4 }}>
                Leads convertidos<br />no período
              </div>
            </div>
          </div>

          {/* Consultant grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {CONSULTORES_FIXOS.map((nome, idx) => {
              const match = data.consultores.find(c => matchConsultor(c.nome, nome)) ?? null
              return <CardFunil key={nome} nome={nome} colIdx={idx} data={match} />
            })}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
