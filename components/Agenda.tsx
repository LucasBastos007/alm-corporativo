"use client"
import { useCallback, useEffect, useState } from "react"

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

const CONSULTORES = ["Andressa","Carlos","Fernando","Whatylla","Matheus","Daniel","Rayssa","Ariovaldo","Clenildo"]
const COLORS = ["#6366f1","#ec4899","#f59e0b","#16a34a","#2563eb","#7c3aed","#dc2626","#0891b2","#f97316"]

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

  // Auto-refresh only when viewing today
  useEffect(() => {
    load(selectedDate)
    if (!isHoje) return
    const id = setInterval(() => load(selectedDate), 30_000)
    return () => clearInterval(id)
  }, [load, selectedDate, isHoje])

  const navDate = (n: number) => setSelectedDate(prev => addDays(prev, n))

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b flex-wrap gap-3"
        style={{ borderColor: "var(--border)" }}>
        <div>
          <p className="section-label">Agenda do Dia — por Consultor</p>
          <p className="text-[10px] mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>
            {fmtData(selectedDate)}
            {!loading && !erro && (() => {
              const novos = agendamentos.filter(a => a.status !== "remarcado" && a.status !== "desmarcado").length
              return novos > 0 ? (
                <span className="ml-2 font-bold" style={{ color: "var(--gold)" }}>
                  {novos} agendamento{novos !== 1 ? "s" : ""}
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
              // Só conta novos agendamentos (exclui remarcado e desmarcado)
              const novosCount = appts.filter(a => a.status !== "remarcado" && a.status !== "desmarcado").length

              return (
                <div key={nome} style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>

                  {/* Consultor header */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 4px 10px" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${color}18`, border: `2px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color }}>
                      {ini(nome)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{nome}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, padding: "2px 10px", borderRadius: 99, border: `1px solid ${color}30` }}>
                      {novosCount} ag.
                    </span>
                  </div>

                  {/* Cards */}
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

                          {/* Hora + status badge */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: sc.accent, textDecoration: isDesmarcado ? "line-through" : "none" }}>
                              {ag.hora}
                            </span>
                            <span style={{ fontSize: 8, fontWeight: 800, color: sc.accent, background: `${sc.accent}18`, padding: "2px 6px", borderRadius: 99, whiteSpace: "nowrap", border: `1px solid ${sc.accent}30` }}>
                              {sc.label}
                            </span>
                          </div>

                          {/* Nome do cliente */}
                          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: isDesmarcado ? "line-through" : "none" }}>
                            {ag.cliente}
                          </span>

                          {/* Data de remarcação */}
                          {isRemarcado && ag.nova_data && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 7px", borderRadius: 6, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}>
                              <span style={{ fontSize: 9, color: "#3b82f6" }}>→</span>
                              <span style={{ fontSize: 9, fontWeight: 800, color: "#3b82f6" }}>
                                {fmtDataCurta(ag.nova_data)}{ag.nova_hora ? ` às ${String(ag.nova_hora).slice(0, 5)}` : ""}
                              </span>
                            </div>
                          )}
                          {isRemarcado && !ag.nova_data && (
                            <span style={{ fontSize: 9, color: "#3b82f6", opacity: 0.6 }}>Data não definida</span>
                          )}

                          {/* Modalidade + nº atendimento */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            {modalIcon && ag.modalidade && (
                              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 2 }}>
                                {modalIcon} {ag.modalidade}
                              </span>
                            )}
                            {ag.visita_numero != null && (
                              <span style={{ fontSize: 9, fontWeight: 800, color: sc.accent, background: `${sc.accent}15`, padding: "1px 6px", borderRadius: 99, border: `1px solid ${sc.accent}25` }}>
                                {ordinal(ag.visita_numero)}
                              </span>
                            )}
                          </div>

                          {/* Nível de interesse */}
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
    </div>
  )
}
