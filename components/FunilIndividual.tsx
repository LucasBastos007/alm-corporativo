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

const CONSULTORES_FIXOS = ["Andressa","Carlos","Fernando","Whatylla","Matheus","Daniel","Rayssa","Ariovaldo"]
const COL_COLORS = ["#6366f1","#ec4899","#f59e0b","#16a34a","#2563eb","#7c3aed","#dc2626","#0891b2"]

function primNome(s: string) {
  return s.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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

function convColor(v: number) {
  return v >= 30 ? "#22c55e" : v >= 15 ? "#f59e0b" : "#dc2626"
}

function CardFunil({ nome, colIdx, data }: { nome: string; colIdx: number; data: ConsultorFunil | null }) {
  const colColor = COL_COLORS[colIdx % COL_COLORS.length]
  const counts   = data ? [data.total, data.interagindo, data.qualificado, data.negociado, data.vendido] : [0,0,0,0,0]
  const max      = counts[0] || 1
  const convGeral = counts[0] > 0 ? Math.round((counts[4] / counts[0]) * 100) : 0

  return (
    <div className="card flex flex-col gap-3 p-4">
      {/* Cabeçalho do consultor */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${colColor}18`, border: `2px solid ${colColor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: colColor, flexShrink: 0 }}>
          {ini(nome)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: 0 }}>{nome}</p>
          <p style={{ fontSize: 9, color: "var(--text-muted)", margin: 0 }}>
            {counts[0]} leads · <span style={{ color: "#22c55e", fontWeight: 800 }}>{counts[4]} vendas</span>
          </p>
        </div>
        {/* Conversão geral */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 20, fontWeight: 900, margin: 0, color: convGeral > 0 ? "#22c55e" : "var(--text-muted)", lineHeight: 1 }}>{convGeral}%</p>
          <p style={{ fontSize: 8, color: "var(--text-muted)", margin: "2px 0 0" }}>conversão</p>
        </div>
      </div>

      {/* Funil desenhado */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {counts.map((count, i) => {
          const pct  = max > 0 ? (count / max) * 100 : 0
          const barW = Math.max(pct, count > 0 ? 10 : 2)
          const conv = i > 0 && counts[i - 1] > 0
            ? Math.round((count / counts[i - 1]) * 100)
            : null
          const { label, color } = ETAPAS[i]
          const isFirst = i === 0
          const isLast  = i === ETAPAS.length - 1

          return (
            <div key={label}>
              {/* Seta de conversão entre etapas */}
              {i > 0 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 18, gap: 4 }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: conv !== null ? convColor(conv) : "var(--text-muted)", whiteSpace: "nowrap", padding: "0 4px" }}>
                    {conv !== null ? `↓ ${conv}%` : "↓ 0%"}
                  </span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
              )}

              {/* Barra do funil — centralizada para criar efeito funil */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {/* Label à esquerda */}
                <span style={{ width: 70, fontSize: 9, fontWeight: 600, color: "var(--text-muted)", flexShrink: 0, textAlign: "right" }}>
                  {label}
                </span>

                {/* Barra centralizada */}
                <div style={{ flex: 1, display: "flex", justifyContent: "center", height: 28 }}>
                  <div style={{
                    width: `${barW}%`,
                    height: "100%",
                    background: `${color}20`,
                    border: `1.5px solid ${color}50`,
                    borderRadius: isFirst ? "6px 6px 2px 2px" : isLast ? "2px 2px 6px 6px" : "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "width 0.7s ease",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color, whiteSpace: "nowrap" }}>
                      {count}
                    </span>
                  </div>
                </div>

                {/* Espaço à direita (simetria) */}
                <span style={{ width: 70, flexShrink: 0 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type Periodo = "mensal" | "semana1" | "semana2" | "semana3" | "semana4" | "semana5"

function semanaLabel(semana: number): string {
  const br = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const year = br.getUTCFullYear()
  const month = br.getUTCMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const start = (semana - 1) * 7 + 1
  const end   = Math.min(semana * 7, daysInMonth)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(start)}/${pad(month)} – ${pad(end)}/${pad(month)}`
}

function numSemanas(): number {
  const br = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const daysInMonth = new Date(br.getUTCFullYear(), br.getUTCMonth() + 1, 0).getDate()
  return Math.ceil(daysInMonth / 7)
}

export function FunilIndividual() {
  const [data, setData]       = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState("")
  const [syncAt, setSyncAt]   = useState("")
  const [periodo, setPeriodo] = useState<Periodo>("mensal")

  const load = useCallback(async (p: Periodo) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/funil?periodo=${p}`, { cache: "no-store" })
      const json = await res.json()
      if (json.ok) { setData(json); setSyncAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })); setErro("") }
      else setErro(json.error ?? "Erro")
    } catch (e) { setErro(String(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load(periodo)
    const id = setInterval(() => load(periodo), 60_000)
    return () => clearInterval(id)
  }, [load, periodo])

  const totalSemanas = numSemanas()
  const PERIODOS: { key: Periodo; label: string; sub?: string }[] = [
    { key: "mensal", label: "Mês" },
    ...Array.from({ length: totalSemanas }, (_, i) => ({
      key: `semana${i + 1}` as Periodo,
      label: `Sem. ${i + 1}`,
      sub: semanaLabel(i + 1),
    })),
  ]

  const periodoAtual = PERIODOS.find(p => p.key === periodo)
  const subLabel = periodo === "mensal"
    ? "Mês atual · taxas de conversão por etapa"
    : `${periodoAtual?.sub ?? ""} · taxas de conversão por etapa`

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b flex-wrap gap-3"
        style={{ borderColor: "var(--border)" }}>
        <div>
          <p className="section-label">Funil Individual — Por Consultor</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{subLabel}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Seletor de período */}
          <div style={{ display: "flex", gap: 3, background: "rgba(0,0,0,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "3px 4px" }}>
            {PERIODOS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriodo(p.key)}
                title={p.sub}
                style={{
                  padding: "4px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontSize: 10, fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap",
                  background: periodo === p.key ? "var(--text)" : "transparent",
                  color: periodo === p.key ? "var(--bg)" : "var(--text-muted)",
                  transition: "all 0.15s",
                }}
              >{p.label}</button>
            ))}
          </div>
          {syncAt && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>sync {syncAt}</span>}
          <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "#16a34a" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Tempo real
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 40 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Carregando funis...</span>
        </div>
      )}

      {!loading && erro && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: 20 }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, color: "#dc2626" }}>{erro}</span>
        </div>
      )}

      {!loading && !erro && data && (
        <div style={{ padding: "16px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {CONSULTORES_FIXOS.map((nome, idx) => {
            const match = data.consultores.find(c => matchConsultor(c.nome, nome)) ?? null
            return <CardFunil key={nome} nome={nome} colIdx={idx} data={match} />
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
