export interface Consultor {
  id: string
  nome: string
  avatar: string // initials
  color: string
  meta: number
  fichas: number
  propostas: number
  vendas: number
  agendamentos: number
  atendimentos: number
}

export interface Agendamento {
  id: string
  consultor: string
  cliente: string
  hora: string // "HH:MM"
  status: "agendado" | "compareceu" | "remarcou" | "nao_compareceu"
  confirmado: boolean
  telefone?: string
  nivel_interesse?: "Alto" | "Médio" | "Baixo"
}

export interface EmpresaKPIs {
  metaVendas: number
  vendasRealizadas: number
  metaAtendimentos: number
  atendimentosRealizados: number
  totalFichas: number
  totalPropostas: number
  totalVendas: number
  taxaFichaParaProposta: number
  taxaPropostaParaVenda: number
  taxaGeralConversao: number
  agendadosHoje: number
  agendadosSemana: number
  agendadosMes: number
}

const COLORS = ["#6366f1","#ec4899","#f59e0b","#22c55e","#3b82f6","#a855f7","#ef4444","#06b6d4"]

function ini(nome: string) {
  return nome.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()
}

export const consultores: Consultor[] = [
  { id: "1", nome: "Andressa Lima",   avatar: ini("Andressa Lima"),   color: COLORS[0], meta: 4, fichas: 31, propostas: 20, vendas: 7, agendamentos: 25, atendimentos: 20 },
  { id: "2", nome: "Carlos André",    avatar: ini("Carlos André"),    color: COLORS[1], meta: 4, fichas: 19, propostas: 10, vendas: 3, agendamentos: 14, atendimentos: 10 },
  { id: "3", nome: "Fernando Silva",  avatar: ini("Fernando Silva"),  color: COLORS[2], meta: 4, fichas: 22, propostas: 13, vendas: 4, agendamentos: 17, atendimentos: 13 },
  { id: "4", nome: "Whatylla Reis",   avatar: ini("Whatylla Reis"),   color: COLORS[3], meta: 4, fichas: 18, propostas:  8, vendas: 2, agendamentos: 11, atendimentos:  8 },
  { id: "5", nome: "Matheus Costa",   avatar: ini("Matheus Costa"),   color: COLORS[4], meta: 4, fichas: 16, propostas:  9, vendas: 2, agendamentos: 12, atendimentos:  9 },
  { id: "6", nome: "Daniel Martins",  avatar: ini("Daniel Martins"),  color: COLORS[5], meta: 4, fichas: 24, propostas: 14, vendas: 5, agendamentos: 18, atendimentos: 14 },
  { id: "7", nome: "Rayssa Soares",   avatar: ini("Rayssa Soares"),   color: COLORS[6], meta: 4, fichas: 28, propostas: 18, vendas: 6, agendamentos: 22, atendimentos: 18 },
]

const hoje = new Date().toISOString().slice(0, 10)

export const agendamentosHoje: Agendamento[] = [
  { id: "a1",  consultor: "Rayssa Soares",  cliente: "Marcos Ferreira",   hora: "08:30", status: "compareceu",      confirmado: true,  telefone: "63 98765-4321", nivel_interesse: "Alto"  },
  { id: "a2",  consultor: "Rayssa Soares",  cliente: "Graziele Oliveira", hora: "10:00", status: "agendado",        confirmado: false, telefone: "63 99123-4567", nivel_interesse: "Médio" },
  { id: "a3",  consultor: "Rayssa Soares",  cliente: "Jhenefer Santos",   hora: "14:00", status: "agendado",        confirmado: true,  telefone: "63 98234-5678", nivel_interesse: "Alto"  },
  { id: "a4",  consultor: "Daniel Martins", cliente: "Paulo Henrique",    hora: "09:00", status: "nao_compareceu",  confirmado: false, telefone: "63 99345-6789", nivel_interesse: "Médio" },
  { id: "a5",  consultor: "Daniel Martins", cliente: "Hilário Sousa",     hora: "11:30", status: "agendado",        confirmado: false, telefone: "63 98456-7890", nivel_interesse: "Baixo" },
  { id: "a6",  consultor: "Daniel Martins", cliente: "Wilke Albuquerque", hora: "15:30", status: "remarcou",        confirmado: false, telefone: "63 99567-8901", nivel_interesse: "Médio" },
  { id: "a7",  consultor: "Andressa Lima",  cliente: "Sirleia Mesquita",  hora: "09:30", status: "compareceu",      confirmado: true,  telefone: "63 98678-9012", nivel_interesse: "Alto"  },
  { id: "a8",  consultor: "Andressa Lima",  cliente: "francislene Costa", hora: "13:00", status: "agendado",        confirmado: false, telefone: "63 99789-0123", nivel_interesse: "Médio" },
  { id: "a9",  consultor: "Carlos André",   cliente: "Luna Carvalho",     hora: "08:40", status: "compareceu",      confirmado: true,  telefone: "63 98890-1234", nivel_interesse: "Alto"  },
  { id: "a10", consultor: "Carlos André",   cliente: "Camila Rodrigues",  hora: "10:30", status: "agendado",        confirmado: false, telefone: "63 99901-2345", nivel_interesse: "Alto"  },
  { id: "a11", consultor: "Fernando Silva",  cliente: "Romário Silva",     hora: "10:30", status: "agendado",        confirmado: false, telefone: "63 98012-3456", nivel_interesse: "Médio" },
  { id: "a12", consultor: "Fernando Silva",  cliente: "Pedro Alves",       hora: "11:30", status: "agendado",        confirmado: false, telefone: "63 99123-4560", nivel_interesse: "Alto"  },
  { id: "a14", consultor: "Whatylla Reis",   cliente: "Suely Barbosa",     hora: "09:00", status: "agendado",        confirmado: true,  telefone: "63 99234-5671", nivel_interesse: "Alto"  },
  { id: "a13", consultor: "Matheus Costa",  cliente: "Edinho Pereira",    hora: "17:00", status: "agendado",        confirmado: false, telefone: "63 98234-5670", nivel_interesse: "Baixo" },
]

export const empresaKPIs: EmpresaKPIs = {
  metaVendas:              24,
  vendasRealizadas:        27,
  metaAtendimentos:        80,
  atendimentosRealizados:  84,
  totalFichas:             140,
  totalPropostas:           84,
  totalVendas:              27,
  taxaFichaParaProposta:   60,
  taxaPropostaParaVenda:   32,
  taxaGeralConversao:      19,
  agendadosHoje:           13,
  agendadosSemana:         48,
  agendadosMes:           140,
}

export { hoje }
