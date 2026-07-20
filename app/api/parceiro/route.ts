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

function brazilMonthRange(mes?: string) {
  const now   = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const today = now.toISOString().slice(0, 10)
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [y, m] = mes.split("-").map(Number)
    const pad    = (n: number) => String(n).padStart(2, "0")
    const start  = `${y}-${pad(m)}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const end    = `${y}-${pad(m)}-${pad(lastDay)}`
    return { start, end: end > today ? today : end }
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  return { start, end: today }
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const mes = searchParams.get("mes") ?? undefined
    const { start, end } = brazilMonthRange(mes)

    // limit=2000 garante que vendas confirmadas de meses anteriores não sejam cortadas pela paginação
    const res = await fetch(`${BASE44}/entities/Simulation?limit=2000&sort=-created_date&_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store", "Pragma": "no-cache" },
    })
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

    // Vendas do mês: pipeline_stage em pago/vendido/venda_concluida OU venda_confirmada_paga=true
    // Usa a data mais recente entre data_venda, updated_date e created_date para resistir a
    // diferenças de cache entre o servidor do Vercel (US) e a API Base44.
    const SOLD_STAGES = new Set(["pago", "vendido", "venda_concluida"])
    const confirmados  = all.filter(s => {
      if (!s || s.is_sample) return false
      if (!(s.venda_confirmada_paga || SOLD_STAGES.has(s.pipeline_stage as string))) return false
      const saleDate = [s.data_venda, s.updated_date, s.created_date]
        .map(d => ((d as string) ?? "").slice(0, 10))
        .filter(d => d >= "2020-01-01")
        .sort().reverse()[0] ?? ""
      return saleDate >= start && saleDate <= end
    })
    const propVal      = (arr: Sim[]) => arr.reduce((sum, s) => sum + (Number(s.property_value) || 0), 0)
    const confAdesion  = confirmados.filter(s => (s.qual_tipo_venda as string) === "adesionada")
    const confLinear   = confirmados.filter(s => (s.qual_tipo_venda as string) !== "adesionada")

    const vendas = {
      adesionada: { count: confAdesion.length, total: propVal(confAdesion) },
      linear:     { count: confLinear.length,  total: propVal(confLinear) },
      geral:      { count: confirmados.length, total: propVal(confirmados) },
    }

    // Debug temporário
    const { searchParams: sp } = new URL(req.url)
    if (sp.get("debug") === "vendas") {
      return Response.json({
        total_all: all.length,
        periodo: { start, end },
        confirmados: confirmados.map(s => ({
          id: (s.id as string)?.slice(0, 8),
          tipo: s.qual_tipo_venda,
          stage: s.pipeline_stage,
          val: s.property_value,
          data_venda: s.data_venda,
          updated_date: (s.updated_date as string)?.slice(0, 10),
          created_date: (s.created_date as string)?.slice(0, 10),
        })),
      })
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
