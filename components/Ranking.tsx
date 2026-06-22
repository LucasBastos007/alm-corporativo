import { Consultor } from "@/lib/mock"

interface Props { consultores: Consultor[] }

const MEDALS = ["🥇","🥈","🥉"]

export function Ranking({ consultores }: Props) {
  const sorted = [...consultores].sort((a, b) => b.vendas - a.vendas)
  const top3   = sorted.slice(0, 3)
  const rest   = sorted.slice(3)
  const maxVendas = sorted[0]?.vendas || 1

  const PODIUM_ORDER = [top3[1], top3[0], top3[2]].filter(Boolean)
  const PODIUM_H     = [52, 80, 36]
  const PODIUM_SCALE = [false, true, false]

  return (
    <div className="card p-5 flex flex-col gap-4">
      <p className="section-label">Ranking — Mês Atual</p>

      {/* Pódio */}
      <div className="flex items-end justify-center gap-2 px-2">
        {PODIUM_ORDER.map((c, i) => {
          if (!c) return <div key={i} style={{ flex: 1 }} />
          const realIdx = i === 0 ? 1 : i === 1 ? 0 : 2
          const color   = c.color
          const scale   = PODIUM_SCALE[i]
          const podH    = PODIUM_H[i]
          const medal   = MEDALS[realIdx]
          const metaPct = Math.min(Math.round((c.vendas / c.meta) * 100), 100)
          const bateu   = c.vendas >= c.meta

          return (
            <div key={c.id} style={{ flex: 1 }} className="flex flex-col items-center">
              <div className="w-full flex flex-col items-center gap-1 px-1 py-3 rounded-2xl mb-1.5"
                style={{
                  background: `${color}08`,
                  border: `1px solid ${color}25`,
                  transform: scale ? "scale(1.04)" : "scale(1)",
                  boxShadow: scale ? `0 4px 20px ${color}18` : "none",
                }}>
                <span className="text-xl">{medal}</span>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                  style={{ background: `${color}15`, color, border: `2px solid ${color}40` }}>
                  {c.avatar}
                </div>
                <span className="text-[11px] font-bold text-center leading-tight mt-0.5 px-1" style={{ color: "var(--text)" }}>
                  {c.nome.split(" ")[0]}
                </span>
                <span className="text-2xl font-black tabular-nums" style={{ color }}>{c.vendas}</span>
                <span className="text-[9px] font-bold" style={{ color: "var(--text-muted)" }}>vendas</span>
                {bateu && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>
                    Meta ✓
                  </span>
                )}
                <div className="w-full h-1 rounded-full mt-1" style={{ background: "rgba(0,0,0,0.06)" }}>
                  <div className="h-1 rounded-full" style={{ width: `${metaPct}%`, background: color }} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[9px]" style={{ color: "var(--text-muted)" }}>
                  <span>{c.fichas}f</span>
                  <span>{c.propostas}p</span>
                  <span style={{ color: "#16a34a" }}>{c.atendimentos}at</span>
                </div>
              </div>
              <div className="w-full rounded-t-xl flex items-center justify-center"
                style={{ height: podH, background: `linear-gradient(180deg, ${color}18 0%, ${color}06 100%)`, border: `1px solid ${color}25`, borderBottom: "none" }}>
                <span className="text-sm font-black" style={{ color: `${color}70` }}>{realIdx + 1}º</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 4º+ */}
      {rest.length > 0 && (
        <div className="flex flex-col gap-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          {rest.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <span className="text-[11px] font-black w-5 text-right flex-shrink-0" style={{ color: "var(--text-muted)" }}>{i + 4}º</span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                style={{ background: `${c.color}12`, color: c.color, border: `1.5px solid ${c.color}35` }}>
                {c.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{c.nome.split(" ")[0]}</span>
                  <div className="flex items-center gap-2 text-[10px] ml-2 flex-shrink-0">
                    <span style={{ color: "var(--text-muted)" }}>{c.atendimentos}at</span>
                    <span className="font-black" style={{ color: c.color }}>{c.vendas}v</span>
                  </div>
                </div>
                <div className="h-1 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                  <div className="h-1 rounded-full" style={{ width: `${(c.vendas / maxVendas) * 100}%`, background: c.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
