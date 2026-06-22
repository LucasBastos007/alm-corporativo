import { getCrmDados } from "@/lib/crm-consorcio"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const periodo = searchParams.get("periodo") ?? "mensal"
    const dados = await getCrmDados(periodo)

    // Cumulativo por consultor (etapa >= i)
    const consultores = dados.vendedores.map(v => {
      const e = v.etapas
      const total       = v.total
      const interagindo = Object.entries(e).filter(([k]) => Number(k) >= 1).reduce((s, [, c]) => s + c, 0)
      const qualificado = Object.entries(e).filter(([k]) => Number(k) >= 2).reduce((s, [, c]) => s + c, 0)
      const negociado   = Object.entries(e).filter(([k]) => Number(k) >= 3).reduce((s, [, c]) => s + c, 0)
      const vendido     = Object.entries(e).filter(([k]) => Number(k) >= 4).reduce((s, [, c]) => s + c, 0)
      return { nome: v.nome, total, interagindo, qualificado, negociado, vendido }
    })

    return Response.json({
      ok: true,
      funil:        dados.funil,   // [{label, count, color}] — 5 etapas cumulativas
      consultores,
      vendas:       dados.vendas,
      atualizadoEm: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[funil]", err)
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
