"use client"
import { useCallback, useEffect, useState } from "react"

interface ProdutoStats {
  fichas: number
  aprovados: number
  propostas: number
  contratos: number
}

interface ApiData {
  teamFunil: ProdutoStats
  produto:   { imovel: ProdutoStats; veiculo: ProdutoStats }
  periodo: { start: string; end: string }
}

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0
}

const ACCENT = "oklch(0.55 0.19 276)"
const R_FICHA = 58
const CIRC_FICHA = 2 * Math.PI * R_FICHA

export function ControleFicha() {
  const [data, setData]       = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/parceiro", { cache: "no-store" })
      const json = await res.json()
      if (json.ok) setData(json)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(); const id = setInterval(load, 60_000); return () => clearInterval(id) }, [load])

  const funil   = data?.teamFunil ?? { fichas: 0, aprovados: 0, propostas: 0, contratos: 0 }
  const { fichas, aprovados, propostas, contratos } = funil
  const maxCount    = fichas || 1
  const convGeral   = pct(contratos, fichas)
  const fichaOffset = CIRC_FICHA * (1 - convGeral / 100)
  const gaugeColor  = convGeral >= 20 ? "oklch(0.58 0.14 155)" : convGeral >= 10 ? "#f59e0b" : ACCENT

  const stages: { label: string; value: number; color: string; convFromPrev?: number }[] = [
    { label: "Fichas",    value: fichas,    color: ACCENT },
    { label: "Aprovados", value: aprovados, color: "oklch(0.5 0.14 155)", convFromPrev: pct(aprovados, fichas) },
    { label: "Propostas", value: propostas, color: "#f97316",              convFromPrev: pct(propostas, aprovados) },
    { label: "Contratos", value: contratos, color: "oklch(0.58 0.14 155)", convFromPrev: pct(contratos, propostas) },
  ]

  const imovel  = data?.produto.imovel  ?? { fichas: 0, aprovados: 0, propostas: 0, contratos: 0 }
  const veiculo = data?.produto.veiculo ?? { fichas: 0, aprovados: 0, propostas: 0, contratos: 0 }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.55 0.01 260)", marginBottom: 12 }}>
        Controle de Ficha — Fichas, propostas e vendas do mês
      </div>

      <div style={{ padding: "28px 24px", borderRadius: 18, background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 0.07)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)", marginBottom: 26, display: "flex", alignItems: "center", gap: 28 }}>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {stages.map(s => (
            <div key={s.label}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: `${Math.max((s.value / maxCount) * 100, s.value > 0 ? 8 : 4)}%`,
                  maxWidth: "100%",
                  height: 44,
                  borderRadius: 10,
                  background: s.color,
                  transition: "width 1.2s cubic-bezier(.16,1,.3,1)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "oklch(0.99 0 0)" }}>
                    {loading ? "—" : s.value}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "oklch(0.99 0 0 / 0.85)" }}>{s.label}</span>
                </div>
              </div>
              {s.convFromPrev !== undefined && (
                <div style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: "oklch(0.55 0.01 260)", padding: "6px 0" }}>
                  ↓ {s.convFromPrev}% de conversão
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ width: 1, alignSelf: "stretch", background: "oklch(0 0 0 / 0.07)", flexShrink: 0 }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "oklch(0.55 0.01 260)", textAlign: "center" }}>
            Conversão geral<br />fichas → vendas
          </div>
          <div style={{ position: "relative", width: 140, height: 140 }}>
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="70" cy="70" r={R_FICHA} fill="none" stroke="oklch(0 0 0 / 0.07)" strokeWidth="13" />
              <circle
                cx="70" cy="70" r={R_FICHA}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={CIRC_FICHA}
                strokeDashoffset={fichaOffset}
                style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: "oklch(0.22 0.01 260)" }}>
                {convGeral}%
              </span>
            </div>
          </div>
        </div>

      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.55 0.01 260)", marginBottom: 12 }}>
        Por tipo de produto
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
        {[{ name: "Imóvel", stats: imovel }, { name: "Veículo", stats: veiculo }].map(({ name, stats }) => (
          <div key={name} style={{ padding: "20px 22px", borderRadius: 16, background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 0.07)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "oklch(0.24 0.01 260)", marginBottom: 14 }}>{name}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "oklch(0.5 0.01 260)" }}>Fichas</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: ACCENT }}>
                  {loading ? "—" : stats.fichas}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "oklch(0.5 0.01 260)" }}>Proposta</span>
                <span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "oklch(0.64 0.15 70)" }}>
                    {loading ? "—" : stats.propostas}
                  </span>
                  {" "}
                  <span style={{ fontSize: 11.5, color: "oklch(0.55 0.01 260)" }}>
                    {loading ? "" : `${pct(stats.propostas, stats.fichas)}%`}
                  </span>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "oklch(0.5 0.01 260)" }}>Vendido</span>
                <span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "oklch(0.58 0.14 155)" }}>
                    {loading ? "—" : stats.contratos}
                  </span>
                  {" "}
                  <span style={{ fontSize: 11.5, color: "oklch(0.55 0.01 260)" }}>
                    {loading ? "" : `${pct(stats.contratos, stats.propostas)}%`}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
