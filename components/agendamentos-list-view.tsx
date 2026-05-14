"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getAgendamentos,
  updateAgendamento,
  deleteAgendamento,
  getVendedores,
  type Agendamento,
  type Vendedor,
  ESTAGIO_AGENDAMENTO_LABELS,
  ESTAGIO_AGENDAMENTO_COLORS,
} from "@/lib/agendamentos"
import { getCurrentUser } from "@/lib/auth"
import { Search, Filter, Trash2, Edit2, Phone, Calendar, Clock, User } from "lucide-react"

export function AgendamentosListView() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [filteredAgendamentos, setFilteredAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstagio, setFilterEstagio] = useState("")
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [vendedores, setVendedores] = useState<Vendedor[]>([])

  const [formData, setFormData] = useState({
    modelo_veiculo: "",
    data_agendamento: "",
    hora_agendamento: "",
    id_vendedor: "",
    observacoes: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterAgendamentos()
  }, [agendamentos, searchTerm, filterEstagio])

  const loadData = async () => {
    const user = getCurrentUser()
    if (user) {
      const [agendamentosData, vendedoresData] = await Promise.all([
        getAgendamentos(user.id_empresa),
        getVendedores(user.id_empresa),
      ])
      setAgendamentos(agendamentosData)
      setVendedores(vendedoresData)
    }
    setLoading(false)
  }

  const filterAgendamentos = () => {
    let filtered = [...agendamentos]

    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.nome_lead.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.telefone?.includes(searchTerm) ||
          a.vendedor?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterEstagio && filterEstagio !== "all") {
      filtered = filtered.filter((a) => a.estagio_agendamento === filterEstagio)
    }

    setFilteredAgendamentos(filtered)
  }

  const handleOpenAgendamento = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento)
    setFormData({
      modelo_veiculo: agendamento.modelo_veiculo || "",
      data_agendamento: agendamento.data_agendamento || "",
      hora_agendamento: agendamento.hora_agendamento || "",
      id_vendedor: agendamento.id_vendedor?.toString() || "",
      observacoes: agendamento.observacoes || "",
    })
  }

  const handleSaveAgendamento = async () => {
    if (!selectedAgendamento) return

    await updateAgendamento(selectedAgendamento.id, {
      modelo_veiculo: formData.modelo_veiculo,
      data_agendamento: formData.data_agendamento,
      hora_agendamento: formData.hora_agendamento,
      id_vendedor: formData.id_vendedor ? Number.parseInt(formData.id_vendedor) : undefined,
      vendedor: vendedores.find((v) => v.id.toString() === formData.id_vendedor)?.vendedor,
      observacoes: formData.observacoes,
    })

    await loadData()
    setSelectedAgendamento(null)
  }

  const handleDeleteAgendamento = async (agendamentoId: number) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return

    await deleteAgendamento(agendamentoId)
    setAgendamentos((prev) => prev.filter((a) => a.id !== agendamentoId))

    if (selectedAgendamento && selectedAgendamento.id === agendamentoId) {
      setSelectedAgendamento(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, telefone ou vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterEstagio} onValueChange={setFilterEstagio}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estágio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estágios</SelectItem>
                {Object.entries(ESTAGIO_AGENDAMENTO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredAgendamentos.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum agendamento encontrado</p>
            ) : (
              filteredAgendamentos.map((agendamento) => (
                <Card key={agendamento.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">{agendamento.nome_lead}</h3>
                          <Badge
                            className={
                              ESTAGIO_AGENDAMENTO_COLORS[
                                agendamento.estagio_agendamento as keyof typeof ESTAGIO_AGENDAMENTO_COLORS
                              ]
                            }
                          >
                            {
                              ESTAGIO_AGENDAMENTO_LABELS[
                                agendamento.estagio_agendamento as keyof typeof ESTAGIO_AGENDAMENTO_LABELS
                              ]
                            }
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          {agendamento.telefone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {agendamento.telefone}
                            </div>
                          )}
                          {agendamento.modelo_veiculo && (
                            <div className="text-gray-700">Veículo: {agendamento.modelo_veiculo}</div>
                          )}
                          {agendamento.data_agendamento && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(agendamento.data_agendamento).toLocaleDateString("pt-BR")}
                              {agendamento.hora_agendamento && (
                                <>
                                  {" "}
                                  <Clock className="h-4 w-4" />
                                  {agendamento.hora_agendamento}
                                </>
                              )}
                            </div>
                          )}
                          {agendamento.vendedor && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {agendamento.vendedor}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenAgendamento(agendamento)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteAgendamento(agendamento.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={selectedAgendamento !== null} onOpenChange={() => setSelectedAgendamento(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedAgendamento?.nome_lead}</DialogTitle>
          </DialogHeader>

          {selectedAgendamento && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Modelo do Veículo</label>
                <Input
                  placeholder="Ex: Honda Civic"
                  value={formData.modelo_veiculo}
                  onChange={(e) => setFormData({ ...formData, modelo_veiculo: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Data</label>
                <Input
                  type="date"
                  value={formData.data_agendamento}
                  onChange={(e) => setFormData({ ...formData, data_agendamento: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Hora</label>
                <Input
                  type="time"
                  value={formData.hora_agendamento}
                  onChange={(e) => setFormData({ ...formData, hora_agendamento: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Vendedor</label>
                <Select
                  value={formData.id_vendedor}
                  onValueChange={(value) => setFormData({ ...formData, id_vendedor: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.vendedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Observações</label>
                <Input
                  placeholder="Adicione observações"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleSaveAgendamento} className="w-full">
                Salvar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
