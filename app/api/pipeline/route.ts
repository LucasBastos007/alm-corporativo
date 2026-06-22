import { getCrmDados } from "@/lib/crm-consorcio"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Mapeamento das etapas do CRM de Consórcio para os 3 estágios do painel
// etapa >= 0 → Ligação    (Prospectando)
// etapa >= 1 → Interação  (Interagindo)
// etapa >= 2 → Agendamento (Qualificado)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const periodo = searchParams.get("periodo") === "mensal" ? "mensal" : "dia"
    const dados = await getCrmDados(periodo)

    // Para "dia": usa funilDia (calculado dos campos de desempenho: leadsRecebidos,
    // leadsPendentesContato, kpisTempoReal) — mesma fonte que o ALM Dashboard.
    // Para "mensal": usa funil (cumulativo por etapaFunil >= i nos leads brutos).
    const src = (periodo === "dia" && dados.funilDia) ? dados.funilDia : dados.funil

    const ligacao     = src[0]?.count ?? 0
    const interacao   = src[1]?.count ?? 0
    const agendamento = src[2]?.count ?? 0

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
