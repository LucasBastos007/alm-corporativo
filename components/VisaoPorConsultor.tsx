import { Consultor } from "@/lib/mock"

interface Props { consultores: Consultor[] }

export function VisaoPorConsultor({ consultores }: Props) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <p className="section-label">Visão por Consultor</p>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {consultores.map(c => {
          const metaPct     = Math.min(Math.round((c.vendas / c.meta) * 100), 100)
          const atdPct      = Math.round((c.atendimentos / Math.max(c.agendamentos, 1)) * 100)
          const convPct     = Math.round((c.vendas / Math.max(c.fichas, 1)) * 100)
          const bateu       = c.vendas >= c.meta

          return (
            <div key={c.id} className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: `${c.color}08`, border: `1px solid ${c.color}25` }}>
              {/* Header do consultor */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ background: `${c.color}22`, color: c.color, border: `2px solid ${c.color}50` }}>
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate" style={{ color: "var(--text)" }}>{c.nome}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {bateu
                      ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>🏆 Meta batida</span>
                      : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>{metaPct}% da meta</span>
                    }
                  </div>
                </div>
              </div>

              {/* Números principais */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Fichas",    val: c.fichas,        color: "#6366f1" },
                  { label: "Propostas", val: c.propostas,     color: "#f59e0b" },
                  { label: "Vendas",    val: c.vendas,        color: "#22c55e" },
                  { label: "Atend.",    val: c.atendimentos,  color: c.color   },
                ].map(k => (
                  <div key={k.label} className="rounded-xl py-2" style={{ background: `${k.color}10` }}>
                    <p className="text-xl font-black tabular-nums" style={{ color: k.color }}>{k.val}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Meta de vendas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Meta vendas</span>
                  <span className="text-[10px] font-black" style={{ color: bateu ? "#22c55e" : c.color }}>{c.vendas}/{c.meta}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${metaPct}%`, background: bateu ? "#22c55e" : c.color }} />
                </div>
              </div>

              {/* Taxa de conversão */}
              <div className="flex items-center justify-between text-[11px]">
                <span style={{ color: "var(--text-muted)" }}>Conversão geral</span>
                <span className="font-black" style={{ color: convPct >= 20 ? "#22c55e" : convPct >= 10 ? "#f59e0b" : "#ef4444" }}>{convPct}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span style={{ color: "var(--text-muted)" }}>Comparecimento</span>
                <span className="font-black" style={{ color: atdPct >= 70 ? "#22c55e" : atdPct >= 50 ? "#f59e0b" : "#ef4444" }}>{atdPct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
