import { createClient } from "@/utils/supabase/client"

export interface Agendamento {
  id: number
  id_empresa: number
  id_lead: number
  nome_lead: string
  telefone?: string
  email?: string
  modelo_veiculo?: string
  data_agendamento?: string
  hora_agendamento?: string
  vendedor?: string
  id_vendedor?: number
  estagio_agendamento: string
  observacoes?: string
  data_acao?: string
  usuario_acao?: string
  motivo_nao_fechou?: string
  created_at: string
  updated_at: string
}

export interface Vendedor {
  id: number
  vendedor: string
  telefone?: string
  id_empresa?: string
}

export const ESTAGIO_AGENDAMENTO_LABELS = {
  agendar: "Agendar",
  agendado: "Agendado",
  realizou_visita: "Realizou a Visita",
  vendedor_vitor: "Vendedor Vitor",
  vendedor_anderson: "Vendedor Anderson",
  desmarcou: "Desmarcou",
  fechou: "Fechou",
  nao_fechou: "Não Fechou",
}

export const ESTAGIO_AGENDAMENTO_COLORS = {
  agendar: "bg-blue-100 text-blue-800",
  agendado: "bg-cyan-100 text-cyan-800",
  realizou_visita: "bg-purple-100 text-purple-800",
  vendedor_vitor: "bg-indigo-100 text-indigo-800",
  vendedor_anderson: "bg-violet-100 text-violet-800",
  desmarcou: "bg-gray-100 text-gray-800",
  fechou: "bg-emerald-100 text-emerald-800",
  nao_fechou: "bg-red-100 text-red-800",
}

export const VALID_ESTAGIOS_AGENDAMENTO = [
  "agendar",
  "agendado",
  "realizou_visita",
  "vendedor_vitor",
  "vendedor_anderson",
  "desmarcou",
  "fechou",
  "nao_fechou",
]

export async function getAgendamentos(idEmpresa: number): Promise<Agendamento[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("AGENDAMENTOS")
    .select(`
      id,
      id_empresa,
      id_lead,
      nome_lead,
      telefone,
      email,
      modelo_veiculo,
      data_agendamento,
      hora_agendamento,
      id_vendedor,
      estagio_agendamento,
      observacoes,
      data_acao,
      usuario_acao,
      motivo_nao_fechou,
      created_at,
      updated_at,
      VENDEDORES!left (
        vendedor
      )
    `)
    .eq("id_empresa", idEmpresa)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching agendamentos:", error)
    return []
  }

  // Map the joined vendor data correctly
  return (data || []).map((item: any) => ({
    ...item,
    vendedor: item.VENDEDORES?.vendedor || item.vendedor || null,
  }))
}

export async function syncLeadsToAgendamentos(idEmpresa: number): Promise<boolean> {
  const supabase = createClient()

  try {
    // Get all leads in "em_negociacao" stage
    const { data: leads, error: leadsError } = await supabase
      .from("BASE_DE_LEADS")
      .select("*")
      .eq("id_empresa", idEmpresa)
      .eq("estagio_lead", "em_negociacao")

    if (leadsError) {
      console.error("[v0] Error fetching leads for sync:", leadsError)
      return false
    }

    if (!leads || leads.length === 0) {
      console.log("[v0] No leads in em_negociacao stage to sync")
      return true
    }

    // Check existing agendamentos to avoid duplicates
    const { data: existingAgendamentos, error: agendamentosError } = await supabase
      .from("AGENDAMENTOS")
      .select("id_lead")
      .eq("id_empresa", idEmpresa)
      .eq("estagio_agendamento", "agendar")

    if (agendamentosError) {
      console.error("[v0] Error fetching existing agendamentos:", agendamentosError)
      return false
    }

    const existingLeadIds = new Set((existingAgendamentos || []).map((a: any) => a.id_lead))

    // Create agendamentos for leads that don't have one yet
    const newAgendamentos = leads
      .filter((lead: any) => !existingLeadIds.has(lead.id))
      .map((lead: any) => ({
        id_empresa: lead.id_empresa,
        id_lead: lead.id,
        nome_lead: lead.nome_lead,
        telefone: lead.telefone,
        email: lead.email,
        modelo_veiculo: lead.veiculo_interesse,
        vendedor: lead.vendedor,
        estagio_agendamento: "agendar",
      }))

    if (newAgendamentos.length > 0) {
      const { error: insertError } = await supabase.from("AGENDAMENTOS").insert(newAgendamentos)

      if (insertError) {
        console.error("[v0] Error creating agendamentos:", insertError)
        return false
      }

      console.log(`[v0] Successfully synced ${newAgendamentos.length} leads to agendamentos`)
    }

    return true
  } catch (error) {
    console.error("[v0] Unexpected error in syncLeadsToAgendamentos:", error)
    return false
  }
}

export async function getAgendamentosByLead(idLead: number): Promise<Agendamento[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("AGENDAMENTOS")
    .select("*")
    .eq("id_lead", idLead)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching agendamentos by lead:", error)
    return []
  }

  return data || []
}

export async function createAgendamento(
  agendamento: Omit<Agendamento, "id" | "created_at" | "updated_at">,
): Promise<Agendamento | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("AGENDAMENTOS").insert([agendamento]).select()

    if (error) {
      console.error("Error creating agendamento:", error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error("Unexpected error creating agendamento:", error)
    return null
  }
}

export async function updateAgendamento(id: number, updates: Partial<Agendamento>): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("AGENDAMENTOS")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating agendamento:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating agendamento:", error)
    return false
  }
}

export async function updateAgendamentoStage(id: number, novoEstagio: string): Promise<boolean> {
  if (!VALID_ESTAGIOS_AGENDAMENTO.includes(novoEstagio)) {
    console.error("Invalid agendamento stage:", novoEstagio)
    return false
  }

  return updateAgendamento(id, { estagio_agendamento: novoEstagio })
}

export async function deleteAgendamento(id: number): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("AGENDAMENTOS").delete().eq("id", id)

    if (error) {
      console.error("Error deleting agendamento:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error deleting agendamento:", error)
    return false
  }
}

export async function getVendedores(idEmpresa: string | number): Promise<Vendedor[]> {
  const supabase = createClient()
  const empresaId = typeof idEmpresa === "string" ? Number.parseInt(idEmpresa, 10) : idEmpresa

  const { data, error } = await supabase
    .from("VENDEDORES")
    .select("id, vendedor, telefone")
    .eq("ID EMPRESA", empresaId.toString())
    .order("vendedor", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching vendedores:", error)
    return []
  }

  return data || []
}

export async function updateAgendamentoWithAction(
  id: number,
  novoEstagio: string,
  usuarioAcao: string,
  motivo?: string,
): Promise<boolean> {
  if (!VALID_ESTAGIOS_AGENDAMENTO.includes(novoEstagio)) {
    console.error("Invalid agendamento stage:", novoEstagio)
    return false
  }

  const updates: Partial<Agendamento> = {
    estagio_agendamento: novoEstagio,
    data_acao: new Date().toISOString(),
    usuario_acao: usuarioAcao,
  }

  if (motivo) {
    updates.motivo_nao_fechou = motivo
  }

  return updateAgendamento(id, updates)
}

export interface HistoricoVisita {
  id: number
  id_empresa: number
  id_agendamento: number
  id_lead: number
  nome_lead: string
  telefone?: string
  vendedor?: string
  data_agendamento?: string
  hora_agendamento?: string
  status_visita: string
  data_hora_acao: string
  usuario_acao?: string
  motivo?: string
  created_at: string
}

export async function createHistoricoVisita(data: {
  id_empresa: number
  id_agendamento: number
  id_lead: number
  nome_lead: string
  telefone?: string
  vendedor?: string
  data_agendamento?: string
  hora_agendamento?: string
  status_visita: string
  usuario_acao: string
  motivo?: string
}): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("HISTORICO_VISITAS").insert([
      {
        id_empresa: data.id_empresa,
        id_agendamento: data.id_agendamento,
        id_lead: data.id_lead,
        nome_lead: data.nome_lead,
        telefone: data.telefone,
        vendedor: data.vendedor,
        data_agendamento: data.data_agendamento,
        hora_agendamento: data.hora_agendamento,
        status_visita: data.status_visita,
        data_hora_acao: new Date().toISOString(),
        usuario_acao: data.usuario_acao,
        motivo: data.motivo,
      },
    ])

    if (error) {
      console.error("[v0] Error creating historico visita:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Unexpected error creating historico visita:", error)
    return false
  }
}

export async function getHistoricoVisitas(
  idEmpresa: number,
  filters?: {
    dataInicio?: string
    dataFim?: string
    vendedor?: string
    status?: string
    busca?: string
  },
): Promise<HistoricoVisita[]> {
  const supabase = createClient()

  let query = supabase
    .from("HISTORICO_VISITAS")
    .select("*")
    .eq("id_empresa", idEmpresa)
    .order("data_hora_acao", { ascending: false })

  if (filters?.dataInicio) {
    query = query.gte("data_hora_acao", filters.dataInicio)
  }

  if (filters?.dataFim) {
    query = query.lte("data_hora_acao", filters.dataFim)
  }

  if (filters?.vendedor) {
    query = query.eq("vendedor", filters.vendedor)
  }

  if (filters?.status) {
    query = query.eq("status_visita", filters.status)
  }

  if (filters?.busca) {
    query = query.or(`nome_lead.ilike.%${filters.busca}%,telefone.ilike.%${filters.busca}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching historico visitas:", error)
    return []
  }

  return data || []
}
