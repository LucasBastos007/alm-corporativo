"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { PainelAgenda } from "./PainelAgenda"

interface AgItem {
  id: string
  cliente: string
  consultor: string
  data: string
  hora: string
  status: string
  confirmado: boolean
  modalidade?: string
  visita_numero?: number
}

interface SemanaStats {
  feitos: number
  realizados: number
  desmarcados: number
  remarcados: number
  pendentes: number
  lista: AgItem[]
  periodo: { inicio: string; ate: string }
}

type FiltroSemana = "agendados" | "realizados" | "pendentes" | "remarcados" | "desmarcados"

interface Agendamento {
  id: string
  consultor: string
  cliente: string
  hora: string
  status: string
  confirmado: boolean
  nivel_interesse?: string
  telefone?: string
  tipo?: string
  modalidade?: string
  visita_numero?: number
  nova_data?: string | null
  nova_hora?: string | null
}

const CONSULTORES = ["Andressa","Carlos","Fernando","Mateus","Rayssa"]
const COLORS = ["#6366f1","#ec4899","#f59e0b","#16a34a","#2563eb","#7c3aed","#dc2626","#0891b2","#f97316"]

function primNome(s: string) {
  return s.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)[0]
}

// Variações salvas no banco → primeiro nome canônico
const NOME_ALIAS: Record<string, string> = {
  "matheus": "mateus",
}

function canonFirst(nome: string): string {
  const first = primNome(nome)
  return NOME_ALIAS[first] ?? first
}

function matchConsultor(nomeDb: string, nomeFixo: string) {
  if (canonFirst(nomeDb) === canonFirst(nomeFixo)) return true
  const db   = primNome(nomeDb)
  const fixo = primNome(nomeFixo)
  if (db === fixo) return true
  if (db.includes(fixo) || fixo.includes(db)) return true
  const len = Math.min(5, db.length, fixo.length)
  return len >= 4 && db.slice(0, len) === fixo.slice(0, len)
}

function brazilDate() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00")
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function fmtData(d: string) {
  if (!d) return ""
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
}

function fmtDataCurta(d: string) {
  if (!d) return ""
  const dt = new Date(d + "T12:00:00")
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function ini(nome: string) {
  return nome.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

function ordinal(n: number) { return `${n}º atend.` }

function statusConfig(status: string, confirmado: boolean) {
  if (status === "desmarcado")
    return { bg: "rgba(107,114,128,0.1)", border: "2px solid rgba(107,114,128,0.3)", accent: "#6b7280", label: "Desmarcado", dot: "#6b7280" }
  if (status === "remarcado")
    return { bg: "rgba(59,130,246,0.1)",  border: "2px solid rgba(59,130,246,0.3)",  accent: "#3b82f6", label: "Remarcado",  dot: "#3b82f6" }
  if (confirmado)
    return { bg: "rgba(34,197,94,0.1)",   border: "2px solid rgba(34,197,94,0.3)",   accent: "#16a34a", label: "Confirmado", dot: "#22c55e" }
  return   { bg: "rgba(251,191,36,0.1)",  border: "2px solid rgba(251,191,36,0.3)",  accent: "#d97706", label: "Pendente",   dot: "#fbbf24" }
}

const LEGEND = [
  { label: "Pendente",   dot: "#fbbf24" },
  { label: "Confirmado", dot: "#22c55e" },
  { label: "Remarcado",  dot: "#3b82f6" },
  { label: "Desmarcado", dot: "#6b7280" },
]

export function Agenda() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading]           = useState(true)
  const [erro, setErro]                 = useState("")
  const [syncAt, setSyncAt]             = useState("")
  const [selectedDate, setSelectedDate] = useState(brazilDate)
  const [semana, setSemana]             = useState<SemanaStats | null>(null)
  const [filtroAberto, setFiltroAberto] = useState<FiltroSemana | null>(null)
  const [painelAberto, setPainelAberto] = useState(false)
  const [viewMode, setViewMode]         = useState<"dia" | "semana">("dia")
  const drawerRef = useRef<HTMLDivElement>(null)

  const hoje = brazilDate()
  const isHoje = selectedDate === hoje

  const load = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/agenda?data=${date}`, { cache: "no-store" })
      const json = await res.json()
      if (json.ok) {
        setAgendamentos(json.agendamentos ?? [])
        setSyncAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))
        setErro("")
      } else {
        setErro(json.error ?? "Erro ao carregar agenda")
      }
    } catch (e) {
      setErro(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSemana = useCallback(async () => {
    try {
      const res  = await fetch("/api/agenda/semana", { cache: "no-store" })
      const json = await res.json()
      if (json.ok) setSemana(json)
    } catch { /* silencioso */ }
  }, [])

  // Auto-refresh only when viewing today
  useEffect(() => {
    load(selectedDate)
    if (!isHoje) return
    const id = setInterval(() => load(selectedDate), 30_000)
    return () => clearInterval(id)
  }, [load, selectedDate, isHoje])

  // Carrega stats da semana ao montar e a cada 60s
  useEffect(() => {
    loadSemana()
    const id = setInterval(loadSemana, 60_000)
    return () => clearInterval(id)
  }, [loadSemana])

  // Fechar drawer ao clicar fora
  useEffect(() => {
    if (!filtroAberto) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setFiltroAberto(null) }
    function onClickOut(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setFiltroAberto(null)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClickOut)
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClickOut) }
  }, [filtroAberto])

  const navDate = (n: number) => setSelectedDate(prev => addDays(prev, n))

  // Ranking da semana computado a partir de semana.lista
  const ranking = CONSULTORES.map((nome, idx) => {
    const appts      = (semana?.lista ?? []).filter(a => matchConsultor(a.consultor, nome))
    const total      = appts.length
    const realizados = appts.filter(a => a.confirmado && a.status !== "desmarcado" && a.status !== "remarcado").length
    const desmarcados= appts.filter(a => a.status === "desmarcado").length
    const remarcados = appts.filter(a => a.status === "remarcado").length
    const pct        = total > 0 ? Math.round(realizados / total * 100) : 0
    return { nome, total, realizados, desmarcados, remarcados, pct, color: COLORS[idx % COLORS.length] }
  }).sort((a, b) => b.total - a.total)

  const maisAgendou  = ranking[0]?.total > 0 ? ranking[0].nome : null
  const menosAgendou = ranking.filter(r => r.total > 0).at(-1)?.nome ?? null
  const maisPresenca = [...ranking].sort((a, b) => b.pct - a.pct)[0]?.total > 0 ? [...ranking].sort((a, b) => b.pct - a.pct)[0].nome : null
  const maisRemarcou = [...ranking].sort((a, b) => b.remarcados - a.remarcados)[0]?.remarcados > 0 ? [...ranking].sort((a, b) => b.remarcados - a.remarcados)[0].nome : null

  return (
    <div className="card overflow-hidden flex flex-col">

      {/* Toggle Dia / Semana */}
      <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, background: "oklch(0 0 0 / 0.045)", gap: 2, margin: "16px 20px 0", alignSelf: "flex-start" }}>
        {(["dia", "semana"] as const).map(v => (
          <button
            key={v}
            onClick={() => { setViewMode(v); setFiltroAberto(null) }}
            style={{
              padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, lineHeight: 1,
              background: viewMode === v ? "oklch(0.55 0.19 276 / 0.1)" : "transparent",
              color: viewMode === v ? "oklch(0.55 0.19 276)" : "oklch(0.5 0.01 260)",
              transition: "background 0.2s, color 0.2s",
            }}
          >{v === "dia" ? "Dia" : "Semana"}</button>
        ))}
      </div>

      {/* ── Dia ── */}
      {viewMode === "dia" && (<>
        {/* Header com data e nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-wrap gap-3"
          style={{ borderColor: "var(--border)" }}>
          <div>
            <p className="section-label">Agenda do Dia — por Consultor</p>
            <p className="text-[10px] mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>
            {fmtData(selectedDate)}
            {!loading && !erro && (() => {
              const total      = agendamentos.filter(a => a.status !== "desmarcado" && a.status !== "cancelado").length
              const remarcados = agendamentos.filter(a => a.status === "remarcado").length
              return total > 0 ? (
                <span className="ml-2 font-bold" style={{ color: "var(--gold)" }}>
                  {total} agendamento{total !== 1 ? "s" : ""}
                  {remarcados > 0 && (
                    <span style={{ fontWeight: 600, color: "#3b82f6", marginLeft: 6 }}>
                      ({remarcados} remarcado{remarcados !== 1 ? "s" : ""})
                    </span>
                  )}
                </span>
              ) : null
            })()}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Navegação de data */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "3px 4px" }}>
            <button
              onClick={() => navDate(-1)}
              style={{ padding: "4px 10px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", fontWeight: 700, lineHeight: 1 }}
              title="Dia anterior"
            >‹</button>

            <button
              onClick={() => setSelectedDate(hoje)}
              style={{
                padding: "4px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 10, fontWeight: 800, lineHeight: 1,
                background: isHoje ? "var(--text)" : "transparent",
                color: isHoje ? "var(--bg)" : "var(--text-muted)",
              }}
            >Hoje</button>

            <button
              onClick={() => navDate(1)}
              style={{ padding: "4px 10px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", fontWeight: 700, lineHeight: 1 }}
              title="Próximo dia"
            >›</button>
          </div>

          {syncAt && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>sync {syncAt}</span>}

          {LEGEND.map(l => (
            <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.dot, display: "inline-block", flexShrink: 0 }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 40 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Carregando agenda...</span>
        </div>
      )}

      {!loading && erro && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: 20 }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, color: "#dc2626" }}>{erro}</span>
        </div>
      )}

      {!loading && !erro && agendamentos.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, fontSize: 13, color: "var(--text-muted)" }}>
          Nenhum agendamento para {isHoje ? "hoje" : fmtDataCurta(selectedDate)}
        </div>
      )}

      {!loading && !erro && agendamentos.length > 0 && (
        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 520 }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${CONSULTORES.length}, minmax(0, 1fr))`, width: "100%", padding: "12px 10px", gap: 6, alignItems: "flex-start" }}>
            {CONSULTORES.map((nome, idx) => {
              const color = COLORS[idx % COLORS.length]
              const appts = agendamentos
                .filter(a => matchConsultor(a.consultor, nome))
                .sort((a, b) => a.hora.localeCompare(b.hora))
              const novosCount = appts.filter(a => a.status !== "desmarcado" && a.status !== "cancelado").length

              return (
                <div key={nome} style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 4px 10px" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${color}18`, border: `2px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color }}>
                      {ini(nome)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{nome}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, padding: "2px 10px", borderRadius: 99, border: `1px solid ${color}30` }}>
                      {novosCount} ag.
                    </span>
                  </div>
                  {appts.length === 0 ? (
                    <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-muted)", padding: "14px 4px", borderRadius: 8, border: "1px dashed rgba(128,128,128,0.2)" }}>
                      livre
                    </div>
                  ) : (
                    appts.map(ag => {
                      const sc = statusConfig(ag.status, ag.confirmado)
                      const isDesmarcado = ag.status === "desmarcado"
                      const isRemarcado  = ag.status === "remarcado"
                      const modalIcon = ag.modalidade?.toLowerCase().includes("video") || ag.modalidade?.toLowerCase().includes("vídeo")
                        ? "📹" : ag.modalidade ? "🏢" : null
                      return (
                        <div key={ag.id} style={{ borderRadius: 10, padding: "9px 11px", display: "flex", flexDirection: "column", gap: 4, background: sc.bg, border: sc.border, opacity: isDesmarcado ? 0.6 : 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: sc.accent, textDecoration: isDesmarcado ? "line-through" : "none" }}>{ag.hora}</span>
                            <span style={{ fontSize: 8, fontWeight: 800, color: sc.accent, background: `${sc.accent}18`, padding: "2px 6px", borderRadius: 99, whiteSpace: "nowrap", border: `1px solid ${sc.accent}30` }}>{sc.label}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: isDesmarcado ? "line-through" : "none" }}>{ag.cliente}</span>
                          {isRemarcado && ag.nova_data && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 7px", borderRadius: 6, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}>
                              <span style={{ fontSize: 9, color: "#3b82f6" }}>→</span>
                              <span style={{ fontSize: 9, fontWeight: 800, color: "#3b82f6" }}>{fmtDataCurta(ag.nova_data)}{ag.nova_hora ? ` às ${String(ag.nova_hora).slice(0, 5)}` : ""}</span>
                            </div>
                          )}
                          {isRemarcado && !ag.nova_data && (
                            <span style={{ fontSize: 9, color: "#3b82f6", opacity: 0.6 }}>Data não definida</span>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            {modalIcon && ag.modalidade && (
                              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 2 }}>{modalIcon} {ag.modalidade}</span>
                            )}
                            {ag.visita_numero != null && (
                              <span style={{ fontSize: 9, fontWeight: 800, color: sc.accent, background: `${sc.accent}15`, padding: "1px 6px", borderRadius: 99, border: `1px solid ${sc.accent}25` }}>{ordinal(ag.visita_numero)}</span>
                            )}
                          </div>
                          {ag.nivel_interesse && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)" }}>
                              {ag.nivel_interesse === "Alto" ? "🟢" : ag.nivel_interesse === "Médio" ? "🟠" : "🟡"} {ag.nivel_interesse}
                            </span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </>)}

      {/* ── Semana ── */}
      {viewMode === "semana" && (<>
        {!semana ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 40 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Carregando semana...</span>
          </div>
        ) : (<>
          {/* 4 Stats cards */}
          <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {([
              { label: "Total Agendado", value: semana.feitos,      color: "#6366f1" },
              { label: "Realizado",      value: semana.realizados,  color: "#16a34a" },
              { label: "Desmarcado",     value: semana.desmarcados, color: "#6b7280" },
              { label: "Remarcado",      value: semana.remarcados,  color: "#3b82f6" },
            ] as const).map(s => (
              <div key={s.label} style={{ background: "oklch(0.985 0.003 260)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>{s.label}</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Ranking da semana por consultor */}
          <div style={{ padding: "0 20px 16px" }}>
            <p className="section-label" style={{ marginBottom: 14 }}>Ranking da semana por consultor</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ranking.map((r, i) => {
                const badges: { label: string; icon: string; color: string }[] = []
                if (r.nome === maisAgendou)  badges.push({ label: "Mais agendou",  icon: "🏆", color: "#d97706" })
                if (r.nome === maisPresenca) badges.push({ label: "Mais presença", icon: "✅", color: "#16a34a" })
                if (r.nome === maisRemarcou) badges.push({ label: "Mais remarcou", icon: "↕",  color: "#3b82f6" })
                if (r.nome === menosAgendou && r.nome !== maisAgendou) badges.push({ label: "Menos agendou", icon: "↓", color: "#6b7280" })
                return (
                  <div key={r.nome} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "oklch(0.985 0.003 260)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <span style={{ width: 24, textAlign: "center", fontSize: 13, fontWeight: 800, color: "var(--text-muted)", flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${r.color}18`, border: `2px solid ${r.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: r.color, flexShrink: 0 }}>
                      {ini(r.nome)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{r.nome}</div>
                      {badges.length > 0 && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
                          {badges.map(b => (
                            <span key={b.label} style={{ fontSize: 9, fontWeight: 700, color: b.color, background: `${b.color}15`, padding: "2px 8px", borderRadius: 99, border: `1px solid ${b.color}25` }}>
                              {b.icon} {b.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {([
                      { v: r.total,       label: "total",      c: "var(--text)" },
                      { v: r.realizados,  label: "realizado",  c: "#16a34a"     },
                      { v: r.desmarcados, label: "desmarcado", c: "#6b7280"     },
                      { v: r.remarcados,  label: "remarcado",  c: "#3b82f6"     },
                    ] as const).map(s => (
                      <div key={s.label} style={{ textAlign: "center", flexShrink: 0, minWidth: 42 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                    <div style={{ flexShrink: 0, width: 80 }}>
                      <div style={{ height: 4, borderRadius: 99, background: "rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 4 }}>
                        <div style={{ height: "100%", width: `${r.pct}%`, background: "#16a34a", borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#16a34a" }}>{r.pct}% presença</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Links para lista filtrada */}
          <div style={{ padding: "12px 20px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 2 }}>
            {([
              { key: "agendados"  as FiltroSemana, label: "Todos os agendamentos da semana", value: semana.feitos,     color: "#6366f1" },
              { key: "realizados" as FiltroSemana, label: "REALIZADOS — DETALHES DO LEAD",   value: semana.realizados, color: "#16a34a" },
            ] as const).map(s => (
              <button
                key={s.key}
                onClick={() => setFiltroAberto(filtroAberto === s.key ? null : s.key)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: s.color, marginLeft: "auto" }}>{s.value}</span>
              </button>
            ))}
            <button
              onClick={() => setPainelAberto(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", marginTop: 4 }}
            >
              <span style={{ fontSize: 12 }}>📊</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Ver painel completo</span>
            </button>
          </div>
        </>)}
      </>)}

      {/* Drawer: lista da semana filtrada (Semana view) */}
      {filtroAberto && semana && (() => {
        const CONF: Record<FiltroSemana, { label: string; color: string; filter: (a: AgItem) => boolean }> = {
          agendados:   { label: "Todos os agendamentos da semana", color: "#6366f1", filter: () => true },
          realizados:  { label: "Realizados na semana",            color: "#16a34a", filter: a => a.confirmado && a.status !== "desmarcado" && a.status !== "remarcado" },
          pendentes:   { label: "Pendentes na semana",             color: "#d97706", filter: a => !a.confirmado && a.status !== "desmarcado" && a.status !== "remarcado" },
          remarcados:  { label: "Remarcados na semana",            color: "#3b82f6", filter: a => a.status === "remarcado" },
          desmarcados: { label: "Desmarcados na semana",           color: "#6b7280", filter: a => a.status === "desmarcado" },
        }
        const conf  = CONF[filtroAberto]
        const lista = semana.lista.filter(conf.filter)

        function scItem(a: AgItem) {
          if (a.status === "desmarcado") return { color: "#6b7280", label: "Desmarcado" }
          if (a.status === "remarcado")  return { color: "#3b82f6", label: "Remarcado" }
          if (a.confirmado)              return { color: "#16a34a", label: "Realizado" }
          return { color: "#d97706", label: "Pendente" }
        }

        const DIAS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]
        function fmtDia(d: string) {
          const dt = new Date(d + "T12:00:00")
          return `${DIAS_PT[dt.getDay()]} ${dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`
        }

        return (
          <div ref={drawerRef} style={{ borderTop: `2px solid ${conf.color}30`, background: "var(--card)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: conf.color }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{conf.label}</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: conf.color, background: `${conf.color}15`, padding: "2px 10px", borderRadius: 99 }}>{lista.length}</span>
              </div>
              <button onClick={() => setFiltroAberto(null)} style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", fontSize: 14, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            {lista.length === 0 ? (
              <div style={{ padding: "24px 20px", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>Nenhum registro</div>
            ) : (
              <div style={{ maxHeight: 320, overflowY: "auto", padding: "10px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
                {lista.map(a => {
                  const sc = scItem(a)
                  return (
                    <div key={a.id} style={{ borderRadius: 10, padding: "10px 14px", border: `1px solid ${sc.color}25`, background: `${sc.color}07`, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.cliente}</span>
                        <span style={{ fontSize: 8, fontWeight: 800, color: sc.color, background: `${sc.color}18`, padding: "2px 7px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>{sc.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>{NOME_ALIAS[primNome(a.consultor ?? "")] ? "Mateus" : a.consultor}</span>
                        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>·</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: conf.color }}>{fmtDia(a.data)}</span>
                        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>·</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>{String(a.hora).slice(0,5)}</span>
                        {a.visita_numero != null && (
                          <span style={{ fontSize: 8, fontWeight: 800, color: sc.color, background: `${sc.color}15`, padding: "1px 6px", borderRadius: 99 }}>{a.visita_numero}º atend.</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {painelAberto && semana && (
        <PainelAgenda
          lista={semana.lista}
          periodo={semana.periodo}
          onClose={() => setPainelAberto(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
