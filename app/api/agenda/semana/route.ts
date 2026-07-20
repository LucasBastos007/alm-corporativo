export const dynamic = "force-dynamic"
export const revalidate = 0

const SB_URL = process.env.SUPABASE_URL!
const SB_KEY = process.env.SUPABASE_ANON_KEY!
const SB_HEADERS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }

function brazilDate(offsetDays = 0): string {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000 + offsetDays * 86_400_000)
  return d.toISOString().slice(0, 10)
}

function inicioSemana(): string {
  const hoje = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const dow  = hoje.getUTCDay()
  const diffToMon = dow === 0 ? -6 : 1 - dow
  return brazilDate(diffToMon)
}

export async function GET() {
  try {
    const inicio = inicioSemana()
    const hoje   = brazilDate()

    const res = await fetch(
      `${SB_URL}/rest/v1/agenda?select=id,cliente,consultor,data,hora,status,confirmado,modalidade,visita_numero&data=gte.${inicio}&data=lte.${hoje}&order=data.asc,hora.asc`,
      { headers: SB_HEADERS, cache: "no-store" }
    )

    if (!res.ok) {
      const err = await res.text()
      return Response.json({ ok: false, error: err }, { status: 500 })
    }

    type Row = { id: string; cliente: string; consultor: string; data: string; hora: string; status: string; confirmado: boolean; modalidade: string; visita_numero: number }
    const rows: Row[] = await res.json()
    if (!Array.isArray(rows)) {
      return Response.json({ ok: true, feitos: 0, realizados: 0, desmarcados: 0, remarcados: 0, pendentes: 0, lista: [], periodo: { inicio, ate: hoje } })
    }

    const validos     = rows.filter(r => r.status !== "cancelado")
    const feitos      = validos.length
    const realizados  = validos.filter(r => r.confirmado && r.status !== "desmarcado" && r.status !== "remarcado").length
    const desmarcados = validos.filter(r => r.status === "desmarcado").length
    const remarcados  = validos.filter(r => r.status === "remarcado").length
    const pendentes   = validos.filter(r => !r.confirmado && r.status !== "desmarcado" && r.status !== "remarcado").length

    return Response.json({
      ok: true,
      feitos,
      realizados,
      desmarcados,
      remarcados,
      pendentes,
      lista: validos,
      periodo: { inicio, ate: hoje },
    })
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
