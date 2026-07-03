import { getCrmDados } from "@/lib/crm-consorcio"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Variações de nome no CRM → nome canônico do time
// Nomes reais do CRM (debug 2026-07-03):
//   "Matheus Carvalho Silva", "Whatyla da silva ribeiro", "CARLOS ANDRE", "ANDRESSA",
//   "Fernando Santos", "Rayssa Soares", "Clenildo Silva"
const NOME_CANON: Record<string, string> = {
  "matheus":  "Mateus",
  "mateus":   "Mateus",
  "andressa": "Andressa",
  "carlos":   "Carlos",
  "fernando": "Fernando",
  "whatylla": "Whatylla",
  "whatyla":  "Whatylla",   // CRM usa "Whatyla" (1 l)
  "rayssa":   "Rayssa",
  "clenildo": "Clenildo",
}

function primNome(s: string): string {
  return s.trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/\s+/)[0]
}

function normNome(raw: string): string {
  const first = primNome(raw)
  return NOME_CANON[first] ?? raw.trim()
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const periodo = searchParams.get("periodo") ?? "mensal"
    const mes     = searchParams.get("mes") ?? undefined
    const dados = await getCrmDados(periodo, mes)

    // Agrupa por nome canônico (Matheus → Mateus, etc.) antes de calcular o funil
    const byName: Record<string, { total: number; etapas: Record<number, number> }> = {}
    for (const v of dados.vendedores) {
      const name = normNome(v.nome)
      if (!byName[name]) byName[name] = { total: 0, etapas: {} }
      byName[name].total += v.total
      for (const [k, c] of Object.entries(v.etapas)) {
        const n = Number(k)
        byName[name].etapas[n] = (byName[name].etapas[n] ?? 0) + (c as number)
      }
    }

    // Cumulativo por consultor (etapa >= i)
    const consultores = Object.entries(byName).map(([nome, v]) => {
      const e = v.etapas
      const total       = v.total
      const interagindo = Object.entries(e).filter(([k]) => Number(k) >= 1).reduce((s, [, c]) => s + c, 0)
      const qualificado = Object.entries(e).filter(([k]) => Number(k) >= 2).reduce((s, [, c]) => s + c, 0)
      const negociado   = Object.entries(e).filter(([k]) => Number(k) >= 3).reduce((s, [, c]) => s + c, 0)
      const vendido     = Object.entries(e).filter(([k]) => Number(k) >= 4).reduce((s, [, c]) => s + c, 0)
      return { nome, total, interagindo, qualificado, negociado, vendido }
    })

    const debug = searchParams.get("debug") === "1"

    return Response.json({
      ok: true,
      funil:        dados.funil,   // [{label, count, color}] — 5 etapas cumulativas
      consultores,
      vendas:       dados.vendas,
      atualizadoEm: new Date().toISOString(),
      ...(debug ? { _rawVendedores: dados.vendedores.map(v => ({ nome: v.nome, total: v.total })) } : {}),
    })
  } catch (err) {
    console.error("[funil]", err)
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
