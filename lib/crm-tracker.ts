// Rastreia avanços de etapa e cliques no CRM de Consórcio
// Compara snapshots entre polls para detectar mudanças

export interface CrmEvent {
  type: "stage_advance" | "call_click" | "whatsapp_click"
  leadId: string
  vendedor: string
  fromStage?: number
  toStage?: number
  ts: number   // timestamp ms
}

interface LeadState {
  etapa: number
  calls: number      // contagem de ligações no lead
  vendedor: string
}

// Estado em memória — persiste enquanto o processo rodar
let snapshot: Record<string, LeadState> = {}
let events: CrmEvent[] = []
let lastPoll = 0

export function getEventsSince(sinceMs: number): CrmEvent[] {
  return events.filter(e => e.ts > sinceMs)
}

export function getTodayEvents(): CrmEvent[] {
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  return events.filter(e => e.ts >= midnight.getTime())
}

export function processSnapshot(leads: Array<{
  id: string
  etapaFunil: number
  vendedor: string
  ligacoes?: number
}>) {
  const now = Date.now()
  const newEvents: CrmEvent[] = []

  for (const lead of leads) {
    const id = lead.id
    const etapa = lead.etapaFunil ?? 0
    const calls = lead.ligacoes ?? 0
    const vendedor = lead.vendedor ?? "Sem consultor"
    const prev = snapshot[id]

    if (prev) {
      // Detecta avanço de etapa
      if (etapa > prev.etapa) {
        newEvents.push({ type: "stage_advance", leadId: id, vendedor, fromStage: prev.etapa, toStage: etapa, ts: now })
      }
      // Detecta novo clique de ligação
      if (calls > prev.calls) {
        for (let i = 0; i < calls - prev.calls; i++) {
          newEvents.push({ type: "call_click", leadId: id, vendedor, ts: now })
        }
      }
    }

    snapshot[id] = { etapa, calls, vendedor }
  }

  // Guarda apenas eventos dos últimos 24h para não crescer indefinidamente
  const cutoff = now - 24 * 60 * 60_000
  events = [...events.filter(e => e.ts > cutoff), ...newEvents]
  lastPoll = now

  return newEvents
}

export function getLastPoll() { return lastPoll }

// Conta eventos do dia por tipo
export function countTodayByType() {
  const todayEvts = getTodayEvents()
  return {
    stageAdvances: todayEvts.filter(e => e.type === "stage_advance").length,
    callClicks:    todayEvts.filter(e => e.type === "call_click").length,
    waClicks:      todayEvts.filter(e => e.type === "whatsapp_click").length,
  }
}
