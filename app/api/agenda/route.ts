export const dynamic = "force-dynamic"
export const revalidate = 0

const SB_URL = process.env.SUPABASE_URL!
const SB_KEY = process.env.SUPABASE_ANON_KEY!

function brazilDate() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

const SB_HEADERS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const data = searchParams.get("data") ?? brazilDate()

    const res = await fetch(
      `${SB_URL}/rest/v1/agenda?select=*&data=eq.${data}&order=hora.asc`,
      { headers: SB_HEADERS, cache: "no-store" }
    )

    if (!res.ok) {
      const err = await res.text()
      return Response.json({ ok: false, error: err }, { status: 500 })
    }

    const rows = await res.json()
    if (!Array.isArray(rows)) return Response.json({ ok: true, agendamentos: [], data })

    const filtered = rows.filter((r: Record<string, unknown>) => r.status !== "cancelado")

    // Para remarcados: a própria data/hora do registro já é a nova data (o app atualiza o registro ao remarcar)
    const agendamentos = filtered.map((r: Record<string, unknown>) => ({
      id:              r.id,
      consultor:       r.consultor,
      cliente:         r.cliente,
      hora:            r.hora,
      status:          r.status,
      confirmado:      r.confirmado ?? false,
      nivel_interesse: r.nivel_interesse ?? "",
      telefone:        r.telefone ?? "",
      tipo:            r.tipo ?? "",
      modalidade:      r.modalidade ?? "",
      visita_numero:   r.visita_numero ?? 1,
      nova_data:       r.status === "remarcado" ? (r.data as string) : null,
      nova_hora:       r.status === "remarcado" ? (r.hora as string) : null,
    }))

    return Response.json({ ok: true, agendamentos, data })
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
