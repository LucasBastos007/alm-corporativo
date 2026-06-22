"use client"
import { useCallback, useEffect, useState } from "react"

interface Etapa { label: string; count: number; color: string }

interface CrmData  { funil: Etapa[]; vendas: number }
interface B44Data  { ok: boolean; teamFunil: { fichas: number; aprovados: number; propostas: number; contratos: number } }

const CRM_ICONS = ["📋","💬","📅","🤝","✅"]
const B44_ICONS = ["📄","✅"]

export function FunilAoVivo() {
  const [crm, setCrm]       = useState<CrmData | null>(null)
  const [b44, setB44]       = useState<B44Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]     = useState("")

  const load = useCallback(async () => {
    try {
      const [crmRes, b44Res] = await Promise.all([
        fetch("/api/funil",    { cache: "no-store" }),
        fetch("/api/parceiro", { cache: "no-store" }),
      ])
      const crmJson = await crmRes.json()
      const b44Json = await b44Res.json()

      if (crmJson.ok) { setCrm(crmJson); setErro("") }
      else setErro(crmJson.error ?? "Erro CRM")

      if (b44Json.ok) setB44(b44Json)
    } catch (e) { setErro(String(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(); const id = setInterval(load, 30_000); return () => clearInterval(id) }, [load])

  if (loading) return (
    <div className="card p-5 flex items-center justify-center gap-3 h-48">
      <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>Carregando funil ao vivo...</span>
    </div>
  )

  if (erro) return (
    <div className="card p-5 flex items-center gap-3 h-48">
      <span className="text-2xl">⚠️</span>
      <p className="text-sm font-bold" style={{ color: "#dc2626" }}>{erro}</p>
    </div>
  )

  const funil = crm?.funil ?? []
  const b44tf = b44?.teamFunil
  const max   = funil[0]?.count || 1

  // Etapas Base44 que entram no funil depois do CRM
  const b44Etapas = b44tf ? [
    { label: "Proposta", count: b44tf.propostas, color: "#f97316" },
    { label: "Vendido",  count: b44tf.contratos, color: "#22c55e" },
  ] : []

  // Para calcular pct relativo ao máximo global (prospecção CRM)
  const globalMax = Math.max(max, 1)

  // Conversão entre última etapa CRM e primeira etapa B44
  const lastCrm  = funil[funil.length - 1]?.count ?? 0
  const firstB44 = b44Etapas[0]?.count ?? 0
  const convCrmToB44 = lastCrm > 0 && firstB44 >= 0 ? Math.round((firstB44 / lastCrm) * 100) : null

  // Taxa conversão geral (prospecção → vendido Base44)
  const convGeral = b44tf && funil[0]
    ? Math.round((b44tf.contratos / Math.max(funil[0].count, 1)) * 100)
    : Math.round(((funil[funil.length - 1]?.count ?? 0) / globalMax) * 100)

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="section-label">Funil ao Vivo</p>
        <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "#16a34a" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          Tempo real
        </div>
      </div>

      {/* Etapas CRM de Consórcio */}
      <div className="flex flex-col gap-2">
        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 36 }}>
          CRM de Consórcio
        </span>
        {funil.map((etapa, i) => {
          const pct  = (etapa.count / globalMax) * 100
          const taxa = i > 0 ? Math.round((etapa.count / Math.max(funil[i - 1].count, 1)) * 100) : 100
          return (
            <div key={etapa.label} className="flex items-center gap-3">
              <span className="text-base w-6 flex-shrink-0">{CRM_ICONS[i] ?? "📌"}</span>
              <div className="w-24 flex-shrink-0">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{etapa.label}</span>
              </div>
              <div className="flex-1 relative h-9 rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.04)" }}>
                <div className="absolute inset-y-1 left-0 rounded-lg flex items-center px-3 transition-all duration-700"
                  style={{ width: `${Math.max(pct, etapa.count > 0 ? 5 : 0)}%`, background: `${etapa.color}18`, border: `1px solid ${etapa.color}40` }}>
                  {etapa.count > 0 && (
                    <span className="text-sm font-black tabular-nums" style={{ color: etapa.color }}>{etapa.count}</span>
                  )}
                </div>
                {etapa.count === 0 && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-muted)" }}>0</span>
                )}
              </div>
              {i > 0 ? (
                <span className="text-[10px] font-bold w-10 text-right flex-shrink-0"
                  style={{ color: taxa >= 50 ? "#16a34a" : taxa >= 25 ? "#d97706" : "#dc2626" }}>
                  {taxa}%
                </span>
              ) : (
                <span className="text-[10px] w-10 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Conector CRM → Base44 */}
      {b44Etapas.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 -4px" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              {convCrmToB44 !== null ? `↓ ${convCrmToB44}%` : ""} Área do Parceiro
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Etapas Base44 */}
          <div className="flex flex-col gap-2">
            <span style={{ fontSize: 9, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 36 }}>
              Base44 — Fichas
            </span>
            {b44Etapas.map((etapa, i) => {
              const pct  = (etapa.count / globalMax) * 100
              const prev = i === 0 ? lastCrm : (b44Etapas[i - 1]?.count ?? 0)
              const taxa = i === 0 ? convCrmToB44 : (prev > 0 ? Math.round((etapa.count / prev) * 100) : 0)
              return (
                <div key={etapa.label} className="flex items-center gap-3">
                  <span className="text-base w-6 flex-shrink-0">{B44_ICONS[i] ?? "📌"}</span>
                  <div className="w-24 flex-shrink-0">
                    <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{etapa.label}</span>
                  </div>
                  <div className="flex-1 relative h-9 rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <div className="absolute inset-y-1 left-0 rounded-lg flex items-center px-3 transition-all duration-700"
                      style={{ width: `${Math.max(pct, etapa.count > 0 ? 5 : 0.5)}%`, background: `${etapa.color}18`, border: `1px solid ${etapa.color}40` }}>
                      {etapa.count > 0 && (
                        <span className="text-sm font-black tabular-nums" style={{ color: etapa.color }}>{etapa.count}</span>
                      )}
                    </div>
                    {etapa.count === 0 && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-muted)" }}>0</span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold w-10 text-right flex-shrink-0"
                    style={{ color: (taxa ?? 0) >= 50 ? "#16a34a" : (taxa ?? 0) >= 25 ? "#d97706" : "#dc2626" }}>
                    {taxa !== null ? `${taxa}%` : ""}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Rodapé */}
      <div className="pt-3 flex items-center gap-4 text-xs font-semibold flex-wrap" style={{ borderTop: "1px solid var(--border)" }}>
        <span style={{ color: "var(--text-muted)" }}>
          Conversão geral:{" "}
          <span className="font-black" style={{ color: "#22c55e" }}>{convGeral}%</span>
        </span>
        {b44tf && (
          <span style={{ color: "var(--text-muted)" }}>
            Vendidos (Base44):{" "}
            <span className="font-black" style={{ color: "#22c55e" }}>{b44tf.contratos}</span>
          </span>
        )}
        <span style={{ color: "var(--text-muted)" }}>
          Fichas este mês:{" "}
          <span className="font-black" style={{ color: "#f97316" }}>{b44tf?.fichas ?? "—"}</span>
        </span>
      </div>
    </div>
  )
}
