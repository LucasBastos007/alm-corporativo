// Integração com crmdeconsorcio.com.br
// Autenticação via cookie ASP.NET Identity

const CRM_BASE = "https://app.crmdeconsorcio.com.br"

// Cache de sessão em memória (válido enquanto o servidor estiver rodando)
let sessionCookie: string | null = null

async function login(): Promise<void> {
  const res = await fetch(`${CRM_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.CRM_CONSORCIO_USER,
      password: process.env.CRM_CONSORCIO_PASS,
    }),
    cache: "no-store",
  })

  if (!res.ok) throw new Error(`CRM login falhou: ${res.status}`)

  const setCookie = res.headers.get("set-cookie") ?? ""
  const match = setCookie.match(/\.AspNetCore\.Identity\.Application=([^;]+)/)
  if (!match) throw new Error("CRM login: cookie não encontrado na resposta")
  sessionCookie = match[1]
}

async function fetchCRM(path: string): Promise<Response> {
  if (!sessionCookie) await login()

  const doFetch = () =>
    fetch(`${CRM_BASE}${path}`, {
      headers: { Cookie: `.AspNetCore.Identity.Application=${sessionCookie}` },
      redirect: "manual", // detecta 302 sem seguir
      cache: "no-store",
    })

  let res = await doFetch()

  // 302 = sessão expirada (CRM redireciona para login)
  if (res.status === 302 || res.status === 301 || res.status === 0) {
    await login()
    res = await doFetch()
  }

  // Fallback: se veio HTML em vez de JSON (redirect seguido de alguma forma)
  if (!((res.headers.get("content-type") ?? "").includes("json"))) {
    await login()
    res = await doFetch()
  }

  return res
}

// ── Tipos dos dados retornados ──────────────────────────────────
export interface CrmLeadDia {
  data: string   // "2026-05-19"
  label: string  // "19"
  total: number
}

export interface CrmVendedorStats {
  nome: string
  total: number
  etapas: Record<number, number>
}

export interface CrmOrigemStats {
  nome: string
  quantidade: number
  percentual: number
}

export interface CrmFunilEtapa {
  label: string
  count: number
  color: string
}

// Mapeamento de etapas do CRM → funil SDR
// 0 = Prospecção | 1 = Interagindo (conversou) | 2 = Qualificado (agendou)
// 3 = Negociado (foi ao escritório) | 4 = Contrato | 5 = Vendido
export interface CrmSdrConsultor {
  nome: string
  ligacoes: number       // discar clicado (quantidadeLigacoes)
  conversas: number      // etapa >= 1 (Interagindo)
  agendamentos: number   // etapa >= 2 (Qualificado)
  atendimentos: number   // etapa >= 3 (Negociado = foi ao escritório)
  contratos: number      // etapa >= 4 (Contrato/Vendido)
  vendidos: number       // etapa >= 5 (Vendido)
}

export interface CrmDados {
  leadsTotal: number
  leadsHoje: number
  leadsSemana: number
  porDia: CrmLeadDia[]
  funil: CrmFunilEtapa[]
  funilDia?: CrmFunilEtapa[]
  vendedores: CrmVendedorStats[]
  origens: CrmOrigemStats[]
  conversaoGeral: string
  tempoMedio: string
  vendas: number
  valorVendido: number
  sdrs: CrmSdrConsultor[]
}

// Etapa 4 do CRM = "Contrato Pago" = venda concluída para fins do dashboard
const FUNIL_CONFIG = [
  { label: "Prospecção",  color: "#6366f1" },
  { label: "Interagindo", color: "#7c3aed" },
  { label: "Qualificado", color: "#a78bfa" },
  { label: "Negociado",   color: "#C9A84C" },
  { label: "Vendido",     color: "#22c55e" },
]

// CRM de Consórcio opera no fuso de Brasília (UTC-3, sem horário de verão).
// Após 21h em Brasília o UTC já virou o dia seguinte — usar UTC diretamente
// faz "hoje" apontar para amanhã e zera todos os dados do dia.
function brazilDate(offsetDays = 0): string {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000 + offsetDays * 86400_000)
  return d.toISOString().slice(0, 10)
}

function dateRange(periodo: string): { start: string; end: string } {
  const today = brazilDate()
  if (periodo === "dia") return { start: today, end: today }
  if (periodo === "semana") return { start: brazilDate(-6), end: today }

  const br    = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const year  = br.getUTCFullYear()
  const month = br.getUTCMonth() + 1
  const pad   = (n: number) => String(n).padStart(2, "0")
  const mm    = pad(month)

  // semana1..semana5: semanas fixas do mês (1-7, 8-14, 15-21, 22-28, 29-fim)
  if (/^semana[1-5]$/.test(periodo)) {
    const weekNum    = parseInt(periodo[6])
    const dayStart   = (weekNum - 1) * 7 + 1
    const daysInMonth = new Date(year, month, 0).getDate()
    const dayEnd     = Math.min(weekNum * 7, daysInMonth)
    // Se a semana ainda não começou, retorna o mês inteiro (sem dados futuros)
    const todayDay   = br.getUTCDate()
    if (dayStart > todayDay) return { start: `${year}-${mm}-${pad(todayDay)}`, end: today }
    const end = `${year}-${mm}-${pad(Math.min(dayEnd, todayDay))}`
    return { start: `${year}-${mm}-${pad(dayStart)}`, end }
  }

  // mensal: primeiro dia do mês
  return { start: `${year}-${mm}-01`, end: today }
}

export async function getCrmDados(periodo: string = "mensal"): Promise<CrmDados> {
  const { start, end } = dateRange(periodo)
  const today    = brazilDate()
  const tomorrow = brazilDate(1) // dataFinal exclusivo: usar amanhã inclui leads de hoje

  // Primeiro dia do mês no fuso de Brasília (para o tracker)
  const br = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const monthStart = `${br.getUTCFullYear()}-${String(br.getUTCMonth() + 1).padStart(2, "0")}-01`

  const isDay = periodo === "dia"

  // DadosAnaliticosLeads filtra por dataEtapa com end EXCLUSIVO.
  // Passando dataFinal=amanhã, os leads criados hoje (dataEtapa=hoje) ficam incluídos
  // e o ranking por consultor fica disponível para todos os períodos, incluindo "Hoje".
  const [desempenhoRes, periodRes, monthRes, todayDesempRes] = await Promise.all([
    fetchCRM(`/api/v1/dashboards/desempenho?tipoPeriodo=0&dataInicial=${start}&dataFinal=${end}`),
    fetchCRM(`/api/v1/Dashboards/DadosAnaliticosLeads?dataInicial=${start}&dataFinal=${tomorrow}&tipoPeriodo=0`),
    isDay
      ? fetchCRM(`/api/v1/Dashboards/DadosAnaliticosLeads?dataInicial=${monthStart}&dataFinal=${tomorrow}&tipoPeriodo=0`)
      : Promise.resolve(null),
    !isDay
      ? fetchCRM(`/api/v1/dashboards/desempenho?tipoPeriodo=0&dataInicial=${today}&dataFinal=${today}`)
      : Promise.resolve(null),
  ])

  const desempenhoJson = desempenhoRes.ok ? await desempenhoRes.json() : null
  const desempenho: Record<string, unknown> = desempenhoJson?.data ?? {}
  const periodJson = periodRes.ok ? await periodRes.json() : null
  const periodRaw: Record<string, unknown>[] = periodJson?.data ?? []
  const monthJson = isDay && monthRes?.ok ? await monthRes.json() : null
  const monthRaw: Record<string, unknown>[] = monthJson?.data ?? periodRaw
  const todayDesempJson = !isDay && todayDesempRes?.ok ? await todayDesempRes.json() : null
  const todayDesempenho: Record<string, unknown> = todayDesempJson?.data ?? (isDay ? desempenho : {})

  // ── Tracker: snapshot do mês inteiro ────────────────────────────────────
  let advancedTodayIds = new Set<string>()
  try {
    const { processSnapshot, getTodayEvents } = await import("./crm-tracker")
    processSnapshot(
      monthRaw
        .map(l => ({
          id:         (l.id ?? l.leadId ?? "") as string,
          etapaFunil: (l.etapaFunil ?? 0) as number,
          vendedor:   (l.vendedor ?? "Sem consultor") as string,
          ligacoes:   (l.quantidadeLigacoes ?? l.ligacoes ?? 0) as number,
        }))
        .filter(l => l.id !== "")
    )
    advancedTodayIds = new Set(
      getTodayEvents()
        .filter(e => e.type === "stage_advance")
        .map(e => e.leadId)
    )
  } catch { /* tracker não crítico */ }

  // ── displayRaw: leads do período + os que avançaram etapa hoje (sem duplicar) ─
  let displayRaw = periodRaw
  if (isDay && advancedTodayIds.size > 0) {
    const advancedInMonth = monthRaw.filter(l => advancedTodayIds.has((l.id ?? l.leadId ?? "") as string))
    const seen = new Set(periodRaw.map(l => (l.id ?? l.leadId ?? "") as string))
    for (const l of advancedInMonth) {
      const id = (l.id ?? l.leadId ?? "") as string
      if (id && !seen.has(id)) { seen.add(id); displayRaw = [...displayRaw, l] }
    }
  }

  // ── Agregar ────────────────────────────────────────────────────────────
  const diaMap:      Record<string, number> = {}
  const vendedorMap: Record<string, { total: number; etapas: Record<number, number> }> = {}
  const origemMap:   Record<string, number> = {}
  const sdrFunilMap: Record<string, { ligacoes: number; conversas: number; agendamentos: number; atendimentos: number; contratos: number; vendidos: number }> = {}

  for (const l of periodRaw) {
    const dia = (l.dataEtapa as string ?? "").slice(0, 10)
    if (dia) diaMap[dia] = (diaMap[dia] ?? 0) + 1
  }

  for (const l of displayRaw) {
    const nome  = (l.vendedor ?? "Sem consultor") as string
    const etapa = (l.etapaFunil ?? 0) as number
    const orig  = (l.origem  ?? "Outro") as string

    if (!vendedorMap[nome]) vendedorMap[nome] = { total: 0, etapas: {} }
    vendedorMap[nome].total++
    vendedorMap[nome].etapas[etapa] = (vendedorMap[nome].etapas[etapa] ?? 0) + 1

    origemMap[orig] = (origemMap[orig] ?? 0) + 1

    if (!sdrFunilMap[nome]) sdrFunilMap[nome] = { ligacoes: 0, conversas: 0, agendamentos: 0, atendimentos: 0, contratos: 0, vendidos: 0 }
    const sf = sdrFunilMap[nome]
    sf.ligacoes += (l.quantidadeLigacoes ?? l.ligacoes ?? 0) as number
    if (etapa >= 1) sf.conversas++
    if (etapa >= 2) sf.agendamentos++
    if (etapa >= 3) sf.atendimentos++
    if (etapa >= 4) sf.contratos++
    if (etapa >= 4) sf.vendidos++
  }

  const sdrs: CrmSdrConsultor[] = Object.entries(sdrFunilMap)
    .map(([nome, f]) => ({ nome, ...f }))
    .filter(s => s.ligacoes + s.conversas + s.agendamentos > 0)
    .sort((a, b) => b.ligacoes - a.ligacoes || b.conversas - a.conversas)

  // ── Série diária ─────────────────────────────────────────────────────────
  // Usa métodos UTC para evitar bug de timezone (new Date("YYYY-MM-DD") = meia-noite UTC)
  const startDate = new Date(start + "T00:00:00Z")
  const endDate   = new Date(end   + "T00:00:00Z")
  const porDia: CrmLeadDia[] = []
  for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
    const key   = d.toISOString().slice(0, 10)
    const count = diaMap[key] ?? 0
    if (count > 0 || periodo !== "mensal") {
      porDia.push({ data: key, label: String(d.getUTCDate()).padStart(2, "0"), total: count })
    }
  }

  // Para "dia": desempenho.leadsRecebidos é a fonte autoritativa (conta por criação,
  // não por dataEtapa). Sobrescreve o diaMap que pode ter contagem ligeiramente diferente.
  if (isDay && porDia.length === 1) {
    porDia[0].total = (desempenho.leadsRecebidos as number) ?? porDia[0].total
  }

  // Negociado (etapa >= 3) e Vendido (etapa >= 4): usa displayRaw em todos os períodos.
  // displayRaw = leads com dataEtapa no período + leads que avançaram etapa hoje (via tracker).
  // Consistente com o modo não-dia que também usa displayRaw.filter(etapa >= i).
  const negociadosCount = displayRaw.filter(l => ((l.etapaFunil as number) ?? 0) >= 3).length
  const vendidosCount   = displayRaw.filter(l => ((l.etapaFunil as number) ?? 0) >= 4).length

  // ── Funil pipeline ──────────────────────────────────────────────────────────
  const funil: CrmFunilEtapa[] = FUNIL_CONFIG.map((cfg, i) => ({
    ...cfg,
    count: displayRaw.filter(l => ((l.etapaFunil as number) ?? 0) >= i).length,
  }))

  const vendedores: CrmVendedorStats[] = Object.entries(vendedorMap)
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.total - a.total)

  const totalOrigens = Object.values(origemMap).reduce((a, b) => a + b, 0) || 1
  const origens: CrmOrigemStats[] = Object.entries(origemMap)
    .map(([nome, quantidade]) => ({ nome, quantidade, percentual: Math.round((quantidade / totalOrigens) * 100) }))
    .sort((a, b) => b.quantidade - a.quantidade)

  const weekAgo    = new Date(Date.now() - 3 * 60 * 60 * 1000 - 6 * 86400_000)
  const weekAgoStr = weekAgo.toISOString().slice(0, 10)
  // leadsHoje: desempenho.leadsRecebidos é mais preciso que diaMap para contar leads do dia
  const leadsHoje   = isDay
    ? ((desempenho.leadsRecebidos as number) ?? 0)
    : ((todayDesempenho.leadsRecebidos as number) ?? (diaMap[today] ?? 0))
  const leadsSemana = Object.entries(diaMap).filter(([d]) => d >= weekAgoStr).reduce((a, [, v]) => a + v, 0)

  // ── Funil de hoje (fluxo do dia — métricas diárias do desempenho) ─────────────
  // kpisTempoReal: emQualificacaoAtual + qualificadosAtual = total qualificados do dia
  // (leadsQualificados conta apenas "totalmente qualificados", ignorando "em qualificação")
  const funilDia: CrmFunilEtapa[] | undefined = isDay ? (() => {
    const recebidos   = (desempenho.leadsRecebidos        as number) ?? 0
    const pendentes   = (desempenho.leadsPendentesContato as number) ?? 0
    const interagindo = Math.max(0, recebidos - pendentes)
    const agendamentosCount = displayRaw.filter(l => ((l.etapaFunil as number) ?? 0) >= 2).length
    return [
      { label: "Recebidos",   color: "#6366f1", count: recebidos },
      { label: "Interagindo", color: "#7c3aed", count: interagindo },
      { label: "Qualificado", color: "#a78bfa", count: agendamentosCount },
      { label: "Negociado",   color: "#C9A84C", count: negociadosCount },
      { label: "Vendido",     color: "#22c55e", count: vendidosCount },
    ]
  })() : undefined

  // Para "dia": origens vêm de desempenho.origensDetalhadas (mais preciso que origemMap)
  const origensDetalhadas = isDay
    ? ((desempenho.origensDetalhadas as { nome: string; quantidade: number; percentual: number }[] | undefined) ?? [])
    : []
  const origensFinais: CrmOrigemStats[] = origensDetalhadas.length > 0
    ? origensDetalhadas.map(o => ({ nome: o.nome, quantidade: o.quantidade, percentual: Math.round(o.percentual) }))
    : origens

  return {
    leadsTotal: isDay ? ((desempenho.leadsTotal as number) ?? 0) : periodRaw.length,
    leadsHoje,
    leadsSemana,
    porDia,
    funil,
    ...(funilDia ? { funilDia } : {}),
    vendedores,
    origens: origensFinais,
    conversaoGeral: (desempenho.conversaoConversaoGeral as string) ?? "—",
    tempoMedio:     (desempenho.tempoMedio as string) ?? "—",
    vendas:         vendidosCount,
    valorVendido:   (desempenho.totalVendido as number) ?? 0,
    sdrs,
  }
}
