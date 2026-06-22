"use client"
import { useCallback, useEffect, useState } from "react"

interface Etapa   { label: string; count: number; color: string }
interface Consultor { nome: string; total: number; interagindo: number; qualificado: number; negociado: number; vendido: number }
interface Data     { funil: Etapa[]; consultores: Consultor[]; vendas: number; atualizadoEm: string }

function ini(nome: string) {
  return nome.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

export function FunilCRM() {
  const [data, setData]       = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState("")

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/funil", { cache: "no-store" })
      const json = await res.json()
      if (json.ok) { setData(json); setErro("") }
      else setErro(json.error ?? "Erro")
    } catch (e) { setErro(String(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(); const id = setInterval(load, 30_000); return () => clearInterval(id) }, [load])

  if (loading) return (
    <div className="card p-5 flex items-center justify-center gap-3 h-48">
      <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>Carregando funil CRM...</span>
    </div>
  )
  if (erro) return (
    <div className="card p-5 flex items-center gap-3 h-48" style={{ borderColor: "rgba(220,38,38,0.2)" }}>
      <span className="text-2xl">⚠️</span>
      <div>
        <p className="text-sm font-bold" style={{ color: "#dc2626" }}>Erro ao carregar funil</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{erro}</p>
      </div>
    </div>
  )

  const { funil, consultores } = data!
  const maxFunil = funil[0]?.count || 1

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="section-label">Funil CRM — Consórcio</p>
        <div className="flex items-center gap-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", color: "#16a34a" }}>
            Mês atual
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "#16a34a" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Ao vivo
          </div>
        </div>
      </div>

      {/* Funil em barras horizontais */}
      <div className="flex flex-col gap-2">
        {funil.map((etapa, i) => {
          const pct  = (etapa.count / maxFunil) * 100
          const taxa = i > 0 ? Math.round((etapa.count / Math.max(funil[i - 1].count, 1)) * 100) : 100
          return (
            <div key={etapa.label} className="flex items-center gap-3">
              <span className="text-[11px] font-semibold w-24 text-right flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                {etapa.label}
              </span>
              <div className="flex-1 relative h-9 rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.04)" }}>
                <div className="absolute inset-y-1 left-0 rounded-lg flex items-center px-3 transition-all duration-700"
                  style={{ width: `${Math.max(pct, etapa.count > 0 ? 5 : 0)}%`, background: `${etapa.color}22`, border: `1px solid ${etapa.color}50` }}>
                  {etapa.count > 0 && (
                    <span className="text-sm font-black tabular-nums" style={{ color: etapa.color }}>{etapa.count}</span>
                  )}
                </div>
              </div>
              {i > 0 ? (
                <span className="text-[10px] font-bold w-10 text-right flex-shrink-0"
                  style={{ color: taxa >= 50 ? "#16a34a" : taxa >= 25 ? "#d97706" : "#dc2626" }}>
                  {taxa}%
                </span>
              ) : (
                <span className="text-[10px] w-10 flex-shrink-0 text-right font-bold" style={{ color: "var(--text-muted)" }}>100%</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Por consultor */}
      {consultores.length > 0 && (
        <div className="pt-3 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Por Consultor</p>
          {consultores.sort((a, b) => b.vendido - a.vendido || b.total - a.total).slice(0, 8).map((c, i) => {
            const COLORS = ["#6366f1","#ec4899","#f59e0b","#16a34a","#2563eb","#7c3aed","#dc2626","#0891b2"]
            const cor = COLORS[i % COLORS.length]
            const pct = Math.round((c.vendido / Math.max(c.total, 1)) * 100)
            return (
              <div key={c.nome} className="flex items-center gap-2">
                <span className="text-[10px] font-black w-4" style={{ color: "var(--text-muted)" }}>{i + 1}º</span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{ background: `${cor}15`, color: cor, border: `1.5px solid ${cor}40` }}>
                  {ini(c.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                      {c.nome.split(" ")[0]}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] flex-shrink-0 ml-2">
                      <span style={{ color: "#6366f1" }}>{c.total}</span>
                      <span style={{ color: "#7c3aed" }}>{c.qualificado}q</span>
                      <span className="font-black" style={{ color: "#22c55e" }}>{c.vendido}v</span>
                      <span style={{ color: "var(--text-muted)" }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.05)" }}>
                    <div style={{ width: `${(c.vendido   / Math.max(c.total, 1)) * 100}%`, background: "#22c55e" }} />
                    <div style={{ width: `${(c.negociado  / Math.max(c.total, 1)) * 100}%`, background: "#C9A84C60" }} />
                    <div style={{ width: `${(c.qualificado / Math.max(c.total, 1)) * 100}%`, background: "#7c3aed40" }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
