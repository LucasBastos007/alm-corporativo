"use client"
import { useRef } from "react"

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

interface Props {
  lista: AgItem[]
  periodo: { inicio: string; ate: string }
  onClose: () => void
}

const NOME_ALIAS: Record<string, string> = { matheus: "Mateus" }
function primNome(s: string) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/\s+/)[0]
}
function nomeDisplay(raw: string) {
  const first = primNome(raw ?? "")
  return NOME_ALIAS[first] ? "Mateus" : (raw ?? "").split(/\s+/)[0]
}

function statusItem(a: AgItem): "realizado" | "pendente" | "remarcado" | "desmarcado" {
  if (a.status === "desmarcado") return "desmarcado"
  if (a.status === "remarcado")  return "remarcado"
  if (a.confirmado)              return "realizado"
  return "pendente"
}

const STATUS_COLORS = {
  realizado:  "#22c55e",
  pendente:   "#fbbf24",
  remarcado:  "#3b82f6",
  desmarcado: "#6b7280",
}
const STATUS_LABELS = {
  realizado:  "Realizado",
  pendente:   "Pendente",
  remarcado:  "Remarcado",
  desmarcado: "Desmarcado",
}
const DIAS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]

type StatusKey = keyof typeof STATUS_COLORS

function fmtDia(d: string) {
  const dt = new Date(d + "T12:00:00")
  return `${DIAS_PT[dt.getDay()]} ${dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`
}

// Gráfico de barras empilhadas horizontais
function BarraEmpilhada({
  label, counts, total, maxTotal, colors
}: {
  label: string
  counts: Record<StatusKey, number>
  total: number
  maxTotal: number
  colors: typeof STATUS_COLORS
}) {
  const barW = maxTotal > 0 ? (total / maxTotal) * 100 : 0
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <span style={{ width: 80, fontSize: 11, fontWeight: 800, color: "var(--text)", flexShrink: 0, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 22, borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.06)", display: "flex" }}>
        {(["realizado","pendente","remarcado","desmarcado"] as StatusKey[]).map(s => {
          const w = total > 0 ? (counts[s] / total) * barW : 0
          return counts[s] > 0 ? (
            <div key={s} style={{ width: `${w}%`, background: colors[s], transition: "width 0.6s ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {counts[s] > 0 && w > 5 && (
                <span style={{ fontSize: 9, fontWeight: 900, color: "#fff" }}>{counts[s]}</span>
              )}
            </div>
          ) : null
        })}
      </div>
      <span style={{ width: 28, fontSize: 13, fontWeight: 900, color: "var(--text)", textAlign: "right", flexShrink: 0 }}>{total}</span>
    </div>
  )
}

export function PainelAgenda({ lista, periodo, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // ── Agrupamento por consultor ────────────────────────────────
  const byConsultor: Record<string, Record<StatusKey, number> & { total: number }> = {}
  for (const a of lista) {
    const nome = nomeDisplay(a.consultor)
    if (!byConsultor[nome]) byConsultor[nome] = { realizado: 0, pendente: 0, remarcado: 0, desmarcado: 0, total: 0 }
    byConsultor[nome][statusItem(a)]++
    byConsultor[nome].total++
  }
  const consultores = Object.entries(byConsultor).sort((a, b) => b[1].total - a[1].total)
  const maxConsultor = Math.max(...consultores.map(c => c[1].total), 1)

  // ── Agrupamento por dia ──────────────────────────────────────
  const byDia: Record<string, Record<StatusKey, number> & { total: number }> = {}
  for (const a of lista) {
    const d = a.data
    if (!byDia[d]) byDia[d] = { realizado: 0, pendente: 0, remarcado: 0, desmarcado: 0, total: 0 }
    byDia[d][statusItem(a)]++
    byDia[d].total++
  }
  const dias = Object.entries(byDia).sort((a, b) => a[0].localeCompare(b[0]))
  const maxDia = Math.max(...dias.map(d => d[1].total), 1)

  // ── KPIs globais ────────────────────────────────────────────
  const total       = lista.length
  const realizados  = lista.filter(a => statusItem(a) === "realizado").length
  const desmarcados = lista.filter(a => statusItem(a) === "desmarcado").length
  const remarcados  = lista.filter(a => statusItem(a) === "remarcado").length
  const txReal      = total > 0 ? Math.round((realizados / total) * 100) : 0
  const txDesm      = total > 0 ? Math.round((desmarcados / total) * 100) : 0

  // ── Rankings ────────────────────────────────────────────────
  const topAgendou   = [...consultores].sort((a, b) => b[1].total - a[1].total)[0]
  const topRealizado = [...consultores].sort((a, b) => b[1].realizado - a[1].realizado)[0]
  const topRemarcado = [...consultores].sort((a, b) => b[1].remarcado - a[1].remarcado)[0]
  const topDesmarcado= [...consultores].sort((a, b) => b[1].desmarcado - a[1].desmarcado)[0]
  const topDia       = [...dias].sort((a, b) => b[1].realizado - a[1].realizado)[0]
  const topDiaDesm   = [...dias].sort((a, b) => b[1].desmarcado - a[1].desmarcado)[0]

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ background: "var(--card)", borderRadius: 20, width: "100%", maxWidth: 860, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.4)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--card)", zIndex: 1, borderRadius: "20px 20px 0 0" }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 900, color: "var(--text)", margin: 0 }}>Painel de Agenda — Semana</p>
            <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0" }}>
              {new Date(periodo.inicio + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} – {new Date(periodo.ate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · {total} agendamentos
            </p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", fontSize: 18, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {[
              { label: "Total agendados", value: total,      color: "var(--text)",  sub: "na semana" },
              { label: "Realizados",      value: realizados, color: "#22c55e",      sub: `${txReal}% de taxa` },
              { label: "Pendentes",       value: lista.filter(a => statusItem(a) === "pendente").length, color: "#f59e0b", sub: "aguardando" },
              { label: "Remarcados",      value: remarcados, color: "#3b82f6",      sub: "reagendados" },
              { label: "Desmarcados",     value: desmarcados,color: "#6b7280",      sub: `${txDesm}% de taxa` },
            ].map(k => (
              <div key={k.label} style={{ borderRadius: 12, padding: "14px 16px", border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
                <p style={{ fontSize: 28, fontWeight: 900, color: k.color, margin: 0, lineHeight: 1 }}>{k.value}</p>
                <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text)", margin: "4px 0 2px" }}>{k.label}</p>
                <p style={{ fontSize: 9, color: "var(--text-muted)", margin: 0 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Rankings */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
            {[
              { icon: "🏆", label: "Mais agendou",   nome: topAgendou?.[0],    valor: topAgendou?.[1].total,      color: "#f59e0b" },
              { icon: "✅", label: "Mais realizados", nome: topRealizado?.[0],  valor: topRealizado?.[1].realizado, color: "#22c55e" },
              { icon: "🔁", label: "Mais remarcados", nome: topRemarcado?.[0],  valor: topRemarcado?.[1].remarcado, color: "#3b82f6" },
              { icon: "❌", label: "Mais desmarcados",nome: topDesmarcado?.[0], valor: topDesmarcado?.[1].desmarcado,color: "#6b7280" },
              { icon: "📅", label: "Dia mais ativo",  nome: topDia ? fmtDia(topDia[0]) : "–", valor: topDia?.[1].realizado, color: "#22c55e" },
              { icon: "😬", label: "Dia mais faltou", nome: topDiaDesm ? fmtDia(topDiaDesm[0]) : "–", valor: topDiaDesm?.[1].desmarcado, color: "#6b7280" },
            ].map(r => (
              <div key={r.label} style={{ borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.label}</p>
                  <p style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nome ?? "–"}</p>
                </div>
                {r.valor != null && (
                  <span style={{ fontSize: 18, fontWeight: 900, color: r.color, flexShrink: 0 }}>{r.valor}</span>
                )}
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {(Object.keys(STATUS_COLORS) as StatusKey[]).map(s => (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_COLORS[s], display: "inline-block" }} />
                {STATUS_LABELS[s]}
              </span>
            ))}
          </div>

          {/* Gráfico por consultor */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 900, color: "var(--text)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Por consultor</p>
            {consultores.map(([nome, counts]) => (
              <BarraEmpilhada key={nome} label={nome} counts={counts} total={counts.total} maxTotal={maxConsultor} colors={STATUS_COLORS} />
            ))}
          </div>

          {/* Gráfico por dia */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 900, color: "var(--text)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Por dia da semana</p>
            {dias.map(([data, counts]) => (
              <BarraEmpilhada key={data} label={fmtDia(data)} counts={counts} total={counts.total} maxTotal={maxDia} colors={STATUS_COLORS} />
            ))}
          </div>

          {/* Tabela detalhada por consultor */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 900, color: "var(--text)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Detalhamento por consultor</p>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.04)" }}>
                    {["Consultor","Total","Realizados","Pendentes","Remarcados","Desmarcados","Taxa real."].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: h === "Consultor" ? "left" : "center", fontWeight: 800, color: "var(--text-muted)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consultores.map(([nome, c], i) => {
                    const taxa = c.total > 0 ? Math.round((c.realizado / c.total) * 100) : 0
                    return (
                      <tr key={nome} style={{ borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)" }}>
                        <td style={{ padding: "9px 12px", fontWeight: 800, color: "var(--text)" }}>{nome}</td>
                        <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 900, color: "var(--text)" }}>{c.total}</td>
                        <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, color: "#22c55e" }}>{c.realizado}</td>
                        <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, color: "#f59e0b" }}>{c.pendente}</td>
                        <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, color: "#3b82f6" }}>{c.remarcado}</td>
                        <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, color: "#6b7280" }}>{c.desmarcado}</td>
                        <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 900, color: taxa >= 50 ? "#22c55e" : taxa >= 30 ? "#f59e0b" : "#dc2626" }}>{taxa}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
