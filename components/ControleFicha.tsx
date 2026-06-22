"use client"
import { useCallback, useEffect, useState } from "react"

interface ProdutoStats {
  fichas: number
  aprovados: number
  propostas: number
  contratos: number
}

interface Consultor {
  nome: string
  fichas: number
  aprovados: number
  propostas: number
  contratos: number
  imovel: number
  veiculo: number
}

interface ApiData {
  teamFunil: ProdutoStats
  produto:   { imovel: ProdutoStats; veiculo: ProdutoStats }
  consultores: Consultor[]
  periodo: { start: string; end: string }
}

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0
}

function pctColor(v: number) {
  return v >= 30 ? "#22c55e" : v >= 10 ? "#f59e0b" : v > 0 ? "#f97316" : "var(--text-muted)"
}

function Pill({ value, color }: { value: string; color: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, color, background: `${color}18`, padding: "2px 7px", borderRadius: 99, border: `1px solid ${color}30`, whiteSpace: "nowrap" }}>
      {value}
    </span>
  )
}

function KpiBox({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: 12, background: `${color}0d`, border: `1px solid ${color}25` }}>
      <p style={{ fontSize: 24, fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 9, fontWeight: 700, color, margin: "3px 0 0", opacity: 0.7 }}>{sub}</p>}
      <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "2px 0 0" }}>{label}</p>
    </div>
  )
}

function TipoCard({ label, icon, stats, color }: { label: string; icon: string; stats: ProdutoStats; color: string }) {
  const convFicha    = pct(stats.propostas, stats.fichas)
  const convProposta = pct(stats.contratos, stats.propostas)

  return (
    <div style={{ flex: 1, borderRadius: 14, padding: "14px 16px", background: `${color}08`, border: `1px solid ${color}25`, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{label}</span>
      </div>

      {/* Mini funil */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          { label: "Fichas",    count: stats.fichas,    color: color,      conv: null },
          { label: "Proposta",  count: stats.propostas, color: "#f97316",  conv: convFicha },
          { label: "Vendido",   count: stats.contratos, color: "#22c55e",  conv: convProposta },
        ].map((e, i) => (
          <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 56, fontSize: 9, color: "var(--text-muted)", fontWeight: 600, flexShrink: 0 }}>{e.label}</span>
            <div style={{ flex: 1, height: 22, borderRadius: 6, background: `${e.color}15`, border: `1px solid ${e.color}35`, display: "flex", alignItems: "center", paddingLeft: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: e.color }}>{e.count}</span>
            </div>
            {e.conv !== null ? (
              <span style={{ width: 30, fontSize: 9, fontWeight: 800, color: pctColor(e.conv), textAlign: "right", flexShrink: 0 }}>
                {e.conv}%
              </span>
            ) : <span style={{ width: 30 }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ControleFicha() {
  const [data, setData]       = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState("")
  const [syncAt, setSyncAt]   = useState("")

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/parceiro", { cache: "no-store" })
      const json = await res.json()
      if (json.ok) {
        setData(json)
        setSyncAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))
        setErro("")
      } else setErro(json.error ?? "Erro")
    } catch (e) { setErro(String(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(); const id = setInterval(load, 60_000); return () => clearInterval(id) }, [load])

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b flex-wrap gap-2"
        style={{ borderColor: "var(--border)" }}>
        <div>
          <p className="section-label">Controle de Ficha</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Fichas · Propostas · Vendas · Mês atual — Base44
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {syncAt && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>sync {syncAt}</span>}
          <span style={{ fontSize: 9, fontWeight: 700, color: "#f97316", background: "rgba(249,115,22,0.1)", padding: "2px 8px", borderRadius: 99, border: "1px solid rgba(249,115,22,0.25)" }}>
            Base44
          </span>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 40 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #f97316", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Carregando fichas...</span>
        </div>
      )}

      {!loading && erro && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: 20 }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, color: "#dc2626" }}>{erro}</span>
        </div>
      )}

      {!loading && !erro && data && (
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Funil principal: Fichas → Proposta → Vendido */}
          {(() => {
            const { fichas, aprovados, propostas, contratos } = data.teamFunil
            const convAprov = pct(aprovados, fichas)
            const convProp  = pct(propostas, aprovados)
            const convVenda = pct(contratos, propostas)
            const convGeral = pct(contratos, fichas)
            const stages = [
              { label: "Fichas",    count: fichas,    color: "#6366f1", icon: "📋" },
              { label: "Aprovados", count: aprovados, color: "#16a34a", icon: "✅" },
              { label: "Proposta",  count: propostas, color: "#f97316", icon: "📄" },
              { label: "Vendido",   count: contratos, color: "#22c55e", icon: "🏆" },
            ]
            const maxCount = fichas || 1
            const convs = [null, convAprov, convProp, convVenda]
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {stages.map((s, i) => (
                  <div key={s.label}>
                    {/* Seta de conversão */}
                    {i > 0 && (
                      <div style={{ display: "flex", alignItems: "center", height: 28, gap: 8, padding: "0 8px" }}>
                        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: pctColor(convs[i] ?? 0), whiteSpace: "nowrap" }}>
                          ↓ {convs[i]}% de conversão
                        </span>
                        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                      </div>
                    )}
                    {/* Barra */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 16, width: 24, flexShrink: 0 }}>{s.icon}</span>
                      <span style={{ width: 68, fontSize: 12, fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>{s.label}</span>
                      <div style={{ flex: 1, height: 44, borderRadius: 10, background: "rgba(0,0,0,0.04)", position: "relative", overflow: "hidden" }}>
                        <div style={{
                          position: "absolute", top: 0, left: 0, bottom: 0,
                          width: `${Math.max((s.count / maxCount) * 100, s.count > 0 ? 4 : 0)}%`,
                          background: `${s.color}20`, border: `1.5px solid ${s.color}50`,
                          borderRadius: 10, transition: "width 0.8s ease",
                          display: "flex", alignItems: "center", paddingLeft: 14,
                        }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.count}</span>
                        </div>
                        {s.count === 0 && (
                          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, fontWeight: 900, color: "var(--text-muted)" }}>0</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Conversão geral */}
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "10px 16px", borderRadius: 10, background: `${pctColor(convGeral)}0d`, border: `1px solid ${pctColor(convGeral)}25` }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Conversão geral fichas → vendas</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: pctColor(convGeral) }}>{convGeral}%</span>
                </div>
              </div>
            )
          })()}

          {/* Por tipo */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Por tipo de produto
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <TipoCard label="Imóvel"  icon="🏠" stats={data.produto.imovel}  color="#6366f1" />
              <TipoCard label="Veículo" icon="🚗" stats={data.produto.veiculo} color="#f59e0b" />
            </div>
          </div>

        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
