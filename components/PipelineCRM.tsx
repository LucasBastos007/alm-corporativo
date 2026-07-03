"use client"
import { useCallback, useEffect, useRef, useState } from "react"

interface Etapa {
  id: string
  label: string
  cor: string
  total: number
  crmEtapa: string
}

interface ConsultorAg {
  nome: string
  count: number
}

type Periodo = "dia" | "mensal"

const COL_COLORS = ["#6366f1","#ec4899","#f59e0b","#16a34a","#2563eb","#7c3aed","#dc2626","#0891b2","#f97316"]
const CIRC_DONUT = 2 * Math.PI * 54

function ini(nome: string) {
  return nome.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

export function PipelineCRM() {
  const [periodo, setPeriodo]   = useState<Periodo>("dia")
  const [etapas, setEtapas]     = useState<Etapa[]>([])
  const [total, setTotal]       = useState(0)
  const [vendas, setVendas]     = useState(0)
  const [syncAt, setSyncAt]     = useState("")
  const [loading, setLoading]   = useState(true)
  const [erro, setErro]         = useState("")
  const [agConsultores, setAgConsultores] = useState<ConsultorAg[]>([])
  const [modalAberto, setModalAberto]     = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (p: Periodo) => {
    try {
      const res  = await fetch(`/api/pipeline?periodo=${p}`, { cache: "no-store" })
      const json = await res.json()
      if (json.ok) {
        setEtapas(json.etapas)
        setTotal(json.totalPipeline ?? 0)
        setVendas(json.vendas ?? 0)
        setAgConsultores(json.agendamentosConsultores ?? [])
        setSyncAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
        setErro("")
      } else {
        setErro(json.error ?? "Erro desconhecido")
      }
    } catch (e) {
      setErro(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    load(periodo)
    const id = setInterval(() => load(periodo), 15_000)
    return () => clearInterval(id)
  }, [load, periodo])

  useEffect(() => {
    if (!modalAberto) return
    function onClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setModalAberto(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [modalAberto])

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 0" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid oklch(0.55 0.19 276)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: 13, color: "oklch(0.55 0.01 260)" }}>Conectando ao CRM de Consórcio...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (erro) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0" }}>
        <span style={{ fontSize: 24 }}>⚠️</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", margin: 0 }}>Erro ao conectar ao CRM</p>
          <p style={{ fontSize: 11, color: "oklch(0.55 0.01 260)", margin: "2px 0 0" }}>{erro}</p>
        </div>
      </div>
    )
  }

  const max = Math.max(...etapas.map(e => e.total), 1)

  // Donut segments
  const donutTotal = etapas.reduce((s, e) => s + e.total, 0) || 1
  let accumulated = 0
  const donutSegs = etapas.map(e => {
    const len = (e.total / donutTotal) * CIRC_DONUT
    const start = accumulated
    accumulated += len
    return { color: e.cor, label: e.label, n: e.total, len, start }
  })

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.55 0.01 260)" }}>
            Pipeline — CRM de Consórcio
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "inline-flex", padding: 4, borderRadius: 10, background: "oklch(0 0 0 / 0.045)", gap: 2 }}>
            {(["dia", "mensal"] as Periodo[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                style={{
                  padding: "7px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 700, lineHeight: 1,
                  background: periodo === p ? "oklch(0.55 0.19 276 / 0.1)" : "transparent",
                  color: periodo === p ? "oklch(0.55 0.19 276)" : "oklch(0.5 0.01 260)",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {p === "dia" ? "Hoje" : "Mês"}
              </button>
            ))}
          </div>
          {syncAt && <span style={{ fontSize: 10, color: "oklch(0.55 0.01 260)" }}>sync {syncAt}</span>}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "#16a34a" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulseDot 1.8s ease-in-out infinite" }} />
            Ao vivo
          </div>
        </div>
      </div>

      {/* Info row */}
      <div style={{ padding: "8px 4px 20px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, color: "oklch(0.5 0.01 260)" }}>Dados reais · atualiza a cada 15s</div>
        <div style={{ fontSize: 13, color: "oklch(0.5 0.01 260)" }}>
          Total em pipeline <b style={{ color: "oklch(0.28 0.01 260)" }}>{total}</b>
          &nbsp;·&nbsp;
          {vendas} efetivados {periodo === "dia" ? "hoje" : "no mês"}
        </div>
      </div>

      {/* Grid: stage cards + donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>

        {/* Stage cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {etapas.map((etapa, i) => {
            const widthPct = Math.max((etapa.total / max) * 100, 4)
            const prox     = etapas[i + 1]
            const taxa     = prox ? Math.round((prox.total / Math.max(etapa.total, 1)) * 100) : null
            const isAgend  = etapa.id === "agendamento"

            return (
              <div
                key={etapa.id}
                onClick={isAgend && agConsultores.length > 0 ? () => setModalAberto(v => !v) : undefined}
                style={{
                  padding: "26px 24px",
                  borderRadius: 18,
                  background: "oklch(1 0 0)",
                  border: "1px solid oklch(0 0 0 / 0.07)",
                  boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)",
                  position: "relative",
                  overflow: "hidden",
                  cursor: isAgend && agConsultores.length > 0 ? "pointer" : "default",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, height: 4, width: `${widthPct}%`, background: etapa.cor, transition: "width 1.2s cubic-bezier(.16,1,.3,1)" }} />

                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 44, fontWeight: 700, color: etapa.cor, marginTop: 8 }}>
                  {etapa.total}
                </div>

                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8, color: "oklch(0.24 0.01 260)" }}>
                  {etapa.label}
                </div>

                <div style={{ fontSize: 12.5, color: "oklch(0.55 0.01 260)", marginTop: 4 }}>
                  {etapa.crmEtapa}
                  {isAgend && agConsultores.length > 0 && (
                    <span style={{ color: etapa.cor, fontWeight: 700 }}> · ver por consultor ↗</span>
                  )}
                </div>

                {taxa !== null && (
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "oklch(0.55 0.01 260)", marginTop: 12 }}>
                    ↓ {taxa}% conversão
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Donut card */}
        <div style={{ padding: 22, borderRadius: 18, background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 0.07)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "oklch(0.55 0.01 260)", alignSelf: "flex-start" }}>
            Distribuição do funil
          </div>

          <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="66" cy="66" r="54" fill="none" stroke="oklch(0 0 0 / 0.07)" strokeWidth="16" />
            {donutSegs.map((seg, i) => (
              <circle
                key={i}
                cx="66" cy="66" r="54"
                fill="none"
                stroke={seg.color}
                strokeWidth="16"
                strokeDasharray={`${seg.len} ${CIRC_DONUT - seg.len}`}
                strokeDashoffset={-seg.start}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1), stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1)" }}
              />
            ))}
          </svg>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            {donutSegs.map(seg => (
              <div key={seg.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, color: "oklch(0.4 0.01 260)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 3, background: seg.color }} />
                  {seg.label}
                </div>
                <span style={{ fontWeight: 700, color: "oklch(0.28 0.01 260)" }}>{seg.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal agendamentos por consultor */}
      {modalAberto && agConsultores.length > 0 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div ref={modalRef} style={{ background: "#1e293b", borderRadius: 20, padding: 28, minWidth: 320, maxWidth: 420, width: "90%", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 900, color: "#f8fafc", margin: 0 }}>Agendamentos por consultor</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", margin: "2px 0 0" }}>
                  {periodo === "dia" ? "Hoje" : "Este mês"} · {agConsultores.reduce((s, c) => s + c.count, 0)} total
                </p>
              </div>
              <button onClick={() => setModalAberto(false)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.08)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {agConsultores.map((c, idx) => (
                <div key={c.nome} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${COL_COLORS[idx % COL_COLORS.length]}28`, border: `2px solid ${COL_COLORS[idx % COL_COLORS.length]}70`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: COL_COLORS[idx % COL_COLORS.length], flexShrink: 0 }}>
                    {ini(c.nome)}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{c.nome}</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#22c55e" }}>{c.count}</span>
                  <span style={{ fontSize: 10, color: "oklch(0.55 0.01 260)", marginLeft: -4 }}>ag.</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
