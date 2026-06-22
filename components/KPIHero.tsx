import { EmpresaKPIs } from "@/lib/mock"

interface Props { kpis: EmpresaKPIs }

export function KPIHero({ kpis }: Props) {
  const metaPct = Math.min((kpis.vendasRealizadas / kpis.metaVendas) * 100, 100)
  const atdPct  = Math.min((kpis.atendimentosRealizados / kpis.metaAtendimentos) * 100, 100)
  const bateu   = kpis.vendasRealizadas >= kpis.metaVendas

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>

      {/* Meta vs Realizado */}
      <div className="card p-5" style={{ gridColumn: "span 2" }}>
        <p className="section-label mb-4">Meta do Mês vs Realizado</p>
        <div className="grid grid-cols-2 gap-6">
          {/* Vendas */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Vendas</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-black tabular-nums" style={{ color: bateu ? "var(--green)" : "var(--gold)" }}>{kpis.vendasRealizadas}</span>
                  <span className="text-lg font-bold" style={{ color: "var(--text-muted)" }}>/ {kpis.metaVendas}</span>
                </div>
              </div>
              {bateu && <span className="text-2xl">🏆</span>}
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${metaPct}%`, background: bateu ? "var(--green)" : "var(--gold)" }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{Math.round(metaPct)}% da meta</span>
              <span className="text-[10px] font-bold" style={{ color: bateu ? "var(--green)" : "var(--gold)" }}>
                {bateu ? `+${kpis.vendasRealizadas - kpis.metaVendas} acima` : `${kpis.metaVendas - kpis.vendasRealizadas} restam`}
              </span>
            </div>
          </div>
          {/* Atendimentos */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Atendimentos</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-black tabular-nums" style={{ color: atdPct >= 100 ? "var(--green)" : "var(--blue)" }}>{kpis.atendimentosRealizados}</span>
                  <span className="text-lg font-bold" style={{ color: "var(--text-muted)" }}>/ {kpis.metaAtendimentos}</span>
                </div>
              </div>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${atdPct}%`, background: atdPct >= 100 ? "var(--green)" : "var(--blue)" }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{Math.round(atdPct)}% da meta</span>
              <span className="text-[10px] font-bold" style={{ color: atdPct >= 100 ? "var(--green)" : "var(--blue)" }}>
                {atdPct >= 100 ? "Meta batida!" : `${kpis.metaAtendimentos - kpis.atendimentosRealizados} restam`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pills de agendamento */}
      {[
        { label: "Hoje",   val: kpis.agendadosHoje,   color: "var(--gold)",   bg: "rgba(184,134,11,0.07)",  border: "rgba(184,134,11,0.18)" },
        { label: "Semana", val: kpis.agendadosSemana,  color: "var(--blue)",   bg: "rgba(37,99,235,0.06)",   border: "rgba(37,99,235,0.15)"  },
        { label: "Mês",    val: kpis.agendadosMes,     color: "var(--purple)", bg: "rgba(124,58,237,0.06)",  border: "rgba(124,58,237,0.15)" },
      ].map(k => (
        <div key={k.label} className="card p-5 flex flex-col gap-1" style={{ background: k.bg, border: `1px solid ${k.border}` }}>
          <p className="section-label">{k.label}</p>
          <p className="text-4xl font-black tabular-nums mt-1" style={{ color: k.color }}>{k.val}</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>agendamentos</p>
        </div>
      ))}
    </div>
  )
}
