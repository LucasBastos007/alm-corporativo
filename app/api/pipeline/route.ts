import { getCrmDados } from "@/lib/crm-consorcio"

export const dynamic = "force-dynamic"
export const revalidate = 0

const SB_URL  = process.env.SUPABASE_URL!
const SB_KEY  = process.env.SUPABASE_ANON_KEY!
const SB_HDRS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }

function brazilDate(offsetDays = 0): string {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000 + offsetDays * 86_400_000)
  return d.toISOString().slice(0, 10)
}

async function countAgendamentos(start: string, end: string): Promise<number> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/agenda?select=id&criado_em=gte.${start}&criado_em=lt.${end}&status=neq.cancelado`,
      { headers: { ...SB_HDRS, "Prefer": "count=exact", "Range": "0-0" }, cache: "no-store" }
    )
    const range = res.headers.get("content-range") ?? ""
    const total = parseInt(range.split("/")[1] ?? "0", 10)
    return isNaN(total) ? 0 : total
  } catch {
    return 0
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const periodo = searchParams.get("periodo") === "mensal" ? "mensal" : "dia"

    const today    = brazilDate()
    const tomorrow = brazilDate(1)
    const br       = new Date(Date.now() - 3 * 60 * 60 * 1000)
    const monthStart = `${br.getUTCFullYear()}-${String(br.getUTCMonth() + 1).padStart(2, "0")}-01`

    // criado_em is UTC; Brazil = UTC-3, so midnight Brazil = 03:00 UTC
    const agStart = periodo === "dia" ? `${today}T03:00:00Z` : `${monthStart}T03:00:00Z`
    const agEnd   = `${tomorrow}T03:00:00Z`

    const [dados, agendamento] = await Promise.all([
      getCrmDados(periodo),
      countAgendamentos(agStart, agEnd),
    ])

    const src = (periodo === "dia" && dados.funilDia) ? dados.funilDia : dados.funil

    const ligacao   = src[0]?.count ?? 0
    const interacao = src[1]?.count ?? 0

    const etapas = [
      { id: "ligacao",     label: "Ligação",     cor: "#6366f1", total: ligacao,     crmEtapa: "Prospectando" },
      { id: "interacao",   label: "Interação",   cor: "#a855f7", total: interacao,   crmEtapa: "Interagindo"  },
      { id: "agendamento", label: "Agendamento", cor: "#22c55e", total: agendamento, crmEtapa: "Qualificado"  },
    ]

    return Response.json({
      ok: true,
      etapas,
      totalPipeline: ligacao,
      vendas:        dados.vendas,
      atualizadoEm:  new Date().toISOString(),
    })
  } catch (err) {
    console.error("[pipeline]", err)
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
