"use client"
import { useCallback, useEffect, useState } from "react"

interface Etapa {
  id: string
  label: string
  cor: string
  total: number
  crmEtapa: string
}

type Periodo = "dia" | "mensal"

export function PipelineCRM() {
  const [periodo, setPeriodo]   = useState<Periodo>("dia")
  const [etapas, setEtapas]     = useState<Etapa[]>([])
  const [total, setTotal]       = useState(0)
  const [vendas, setVendas]     = useState(0)
  const [syncAt, setSyncAt]     = useState("")
  const [loading, setLoading]   = useState(true)
  const [erro, setErro]         = useState("")

  const load = useCallback(async (p: Periodo) => {
    try {
      const res  = await fetch(`/api/pipeline?periodo=${p}`, { cache: "no-store" })
      const json = await res.json()
      if (json.ok) {
        setEtapas(json.etapas)
        setTotal(json.totalPipeline ?? 0)
        setVendas(json.vendas ?? 0)
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

  if (loading) {
    return (
      <div className="card p-5 flex items-center justify-center gap-3 h-28">
        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>Conectando ao CRM de Consórcio...</span>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="card p-5 flex items-center gap-3 h-28" style={{ borderColor: "rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.03)" }}>
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="text-sm font-bold" style={{ color: "#dc2626" }}>Erro ao conectar ao CRM</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{erro}</p>
        </div>
      </div>
    )
  }

  const max = Math.max(...etapas.map(e => e.total), 1)

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="section-label">Pipeline — CRM de Consórcio</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Dados reais · atualiza a cada 15s</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Hoje / Mês */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            {(["dia", "mensal"] as Periodo[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className="px-3 py-1 text-[11px] font-bold transition-colors"
                style={{
                  background: periodo === p ? "var(--gold)" : "transparent",
                  color:      periodo === p ? "#fff"        : "var(--text-muted)",
                }}
              >
                {p === "dia" ? "Hoje" : "Mês"}
              </button>
            ))}
          </div>

          {syncAt && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>sync {syncAt}</span>}
          <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "#16a34a" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Ao vivo
          </div>
        </div>
      </div>

      {/* 3 etapas */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {etapas.map((etapa, i) => {
          const widthPct = Math.max((etapa.total / max) * 100, 4)
          const prox     = etapas[i + 1]
          const taxa     = prox ? Math.round((prox.total / Math.max(etapa.total, 1)) * 100) : null

          return (
            <div key={etapa.id} className="relative rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: `${etapa.cor}08`, border: `1px solid ${etapa.cor}20` }}>

              {taxa !== null && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-black" style={{ color: etapa.cor }}>{taxa}%</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8h12M9 4l4 4-4 4" stroke={etapa.cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5"/>
                  </svg>
                </div>
              )}

              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${widthPct}%`, background: etapa.cor }} />
              </div>

              <div>
                <span className="text-5xl font-black tabular-nums leading-none" style={{ color: etapa.cor }}>
                  {etapa.total}
                </span>
              </div>

              <div>
                <p className="text-sm font-black" style={{ color: "var(--text)" }}>{etapa.label}</p>
                <p className="text-[10px] mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>
                  CRM: <span style={{ color: etapa.cor }}>{etapa.crmEtapa}</span>
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rodapé */}
      <div className="flex items-center gap-4 pt-3 flex-wrap text-xs font-semibold" style={{ borderTop: "1px solid var(--border)" }}>
        <span style={{ color: "var(--text-muted)" }}>
          Total em pipeline: <span className="font-black" style={{ color: "var(--text)" }}>{total}</span>
        </span>
        <div className="w-px h-4" style={{ background: "var(--border)" }} />
        <span style={{ color: "#16a34a" }}>
          ✅ {vendas} efetivados {periodo === "dia" ? "hoje" : "no mês"}
        </span>
      </div>
    </div>
  )
}
