import { EmpresaKPIs } from "@/lib/mock"

interface Props { kpis: EmpresaKPIs }

export function KPIBar({ kpis }: Props) {
  const metaPct = Math.round((kpis.vendasRealizadas / kpis.metaVendas) * 100)
  const atdPct  = Math.round((kpis.atendimentosRealizados / kpis.metaAtendimentos) * 100)
  const bateu   = kpis.vendasRealizadas >= kpis.metaVendas

  const pills = [
    { label: "Vendas",       val: `${kpis.vendasRealizadas}/${kpis.metaVendas}`, sub: `${metaPct}% meta`, color: bateu ? "#16a34a" : "#b8860b", icon: bateu ? "🏆" : "🎯" },
    { label: "Atendimentos", val: `${kpis.atendimentosRealizados}/${kpis.metaAtendimentos}`, sub: `${atdPct}% meta`, color: "#2563eb", icon: "🤝" },
    { label: "Hoje",         val: String(kpis.agendadosHoje),   sub: "agend.",  color: "#b8860b", icon: "📅" },
    { label: "Semana",       val: String(kpis.agendadosSemana), sub: "agend.",  color: "#7c3aed", icon: "📆" },
    { label: "Mês",          val: String(kpis.agendadosMes),    sub: "agend.",  color: "#0891b2", icon: "🗓" },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {pills.map(p => (
        <div key={p.label} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
          style={{ background: `${p.color}08`, border: `1px solid ${p.color}20` }}>
          <span className="text-base leading-none">{p.icon}</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{p.label}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black tabular-nums leading-none" style={{ color: p.color }}>{p.val}</span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{p.sub}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
