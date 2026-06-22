export const dynamic  = "force-dynamic"
export const revalidate = 0

const BASE44 = "https://areadoparceiroalm.base44.app/api"

const STAGE_RANK: Record<string, number> = {
  ficha:           0,
  analise:         1,
  pre_checagem:    2,
  aprovado:        3,
  proposta:        4,
  contrato:        5,
  checado:         5,
  pago:            6,
  vendido:         6,
  venda_concluida: 7,
}

type Sim = Record<string, unknown>

function brazilMonthRange() {
  const now   = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end   = now.toISOString().slice(0, 10)
  return { start, end }
}

function rank(s: Sim) { return STAGE_RANK[s.pipeline_stage as string] ?? -1 }

function tipo(s: Sim): "imovel" | "veiculo" {
  const st = (s.simulation_type as string ?? "").trim()
  if (st === "financiamento" || st === "mcmv") return "imovel"
  const months = Number(s.term_months ?? 0)
  return months > 0 && months <= 100 ? "veiculo" : "imovel"
}

function firstNome(s: string) {
  return (s ?? "").trim().split(/\s+/)[0].toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export async function GET() {
  try {
    const { start, end } = brazilMonthRange()

    const res = await fetch(`${BASE44}/entities/Simulation?limit=500&sort=-created_date`, { cache: "no-store" })
    if (!res.ok) return Response.json({ ok: false, error: `Base44: ${res.status}` }, { status: 502 })

    const all: Sim[] = await res.json()

    // Filtra mês atual e remove amostras
    const sims = all.filter(s => {
      const d = (s.created_date as string ?? "").slice(0, 10)
      return d >= start && d <= end && !s.is_sample
    })

    // Contagens totais da equipe
    const teamFunil = {
      fichas:    sims.length,
      aprovados: sims.filter(s => rank(s) >= STAGE_RANK.aprovado).length,
      propostas: sims.filter(s => rank(s) >= STAGE_RANK.proposta).length,
      contratos: sims.filter(s => rank(s) >= STAGE_RANK.pago).length,
    }

    // Por tipo de produto
    const imovelSims  = sims.filter(s => tipo(s) === "imovel")
    const veiculoSims = sims.filter(s => tipo(s) === "veiculo")

    const produto = {
      imovel: {
        fichas:    imovelSims.length,
        aprovados: imovelSims.filter(s => rank(s) >= STAGE_RANK.aprovado).length,
        propostas: imovelSims.filter(s => rank(s) >= STAGE_RANK.proposta).length,
        contratos: imovelSims.filter(s => rank(s) >= STAGE_RANK.pago).length,
      },
      veiculo: {
        fichas:    veiculoSims.length,
        aprovados: veiculoSims.filter(s => rank(s) >= STAGE_RANK.aprovado).length,
        propostas: veiculoSims.filter(s => rank(s) >= STAGE_RANK.proposta).length,
        contratos: veiculoSims.filter(s => rank(s) >= STAGE_RANK.pago).length,
      },
    }

    // Por consultor (agrupado pelo primeiro nome normalizado)
    const byConsultor: Record<string, { nomeCompleto: string; sims: Sim[] }> = {}
    for (const s of sims) {
      const nome = (s.consultant_name as string ?? "").trim()
      const key  = firstNome(nome)
      if (!byConsultor[key]) byConsultor[key] = { nomeCompleto: nome, sims: [] }
      byConsultor[key].sims.push(s)
    }

    const consultores = Object.values(byConsultor)
      .map(c => ({
        nome:      c.nomeCompleto,
        fichas:    c.sims.length,
        aprovados: c.sims.filter(s => rank(s) >= STAGE_RANK.aprovado).length,
        propostas: c.sims.filter(s => rank(s) >= STAGE_RANK.proposta).length,
        contratos: c.sims.filter(s => rank(s) >= STAGE_RANK.pago).length,
        imovel:    c.sims.filter(s => tipo(s) === "imovel").length,
        veiculo:   c.sims.filter(s => tipo(s) === "veiculo").length,
      }))
      .sort((a, b) => b.fichas - a.fichas)

    // Vendas: replica exatamente o cálculo da Área do Parceiro do Base44
    // Base44 usa: venda_confirmada_paga=true, property_value, SEM filtro de mês
    const confirmados  = all.filter(s => s.venda_confirmada_paga && !s.is_sample)
    const propVal      = (arr: Sim[]) => arr.reduce((sum, s) => sum + (Number(s.property_value) || 0), 0)
    const confAdesion  = confirmados.filter(s => (s.qual_tipo_venda as string) === "adesionada")
    const confLinear   = confirmados.filter(s => (s.qual_tipo_venda as string) !== "adesionada")

    const vendas = {
      adesionada: { count: confAdesion.length, total: propVal(confAdesion) },
      linear:     { count: confLinear.length,  total: propVal(confLinear) },
      geral:      { count: confirmados.length, total: propVal(confirmados) },
    }

    // Hoje
    const todaySims = sims.filter(s => (s.created_date as string ?? "").slice(0, 10) === end)
    const hoje = {
      fichas:    todaySims.length,
      aprovados: todaySims.filter(s => rank(s) >= STAGE_RANK.aprovado).length,
      propostas: todaySims.filter(s => rank(s) >= STAGE_RANK.proposta).length,
      contratos: todaySims.filter(s => rank(s) >= STAGE_RANK.pago).length,
    }

    // Evolução diária acumulada (fichas criadas por dia → cumulativo)
    const todayDay = parseInt(end.slice(8, 10), 10)
    const byDay: Record<number, Sim[]> = {}
    for (const s of sims) {
      const d = parseInt((s.created_date as string ?? "").slice(8, 10), 10)
      if (d > 0) { if (!byDay[d]) byDay[d] = []; byDay[d].push(s) }
    }
    let cumFichas = 0, cumProp = 0, cumVend = 0
    const evolucao = Array.from({ length: todayDay }, (_, i) => {
      const d = i + 1
      const ds = byDay[d] ?? []
      cumFichas += ds.length
      cumProp   += ds.filter(s => rank(s) >= STAGE_RANK.proposta).length
      cumVend   += ds.filter(s => rank(s) >= STAGE_RANK.pago).length
      return { day: d, novas: ds.length, fichas: cumFichas, propostas: cumProp, contratos: cumVend }
    })

    return Response.json({ ok: true, teamFunil, produto, consultores, vendas, hoje, evolucao, periodo: { start, end } })
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
