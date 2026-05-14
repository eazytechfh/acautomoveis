"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getAgendamentos,
  updateAgendamentoStage,
  deleteAgendamento,
  getVendedores,
  updateAgendamentoWithAction,
  createHistoricoVisita,
  type Agendamento,
  type Vendedor,
  ESTAGIO_AGENDAMENTO_LABELS,
  VALID_ESTAGIOS_AGENDAMENTO,
  updateAgendamento,
} from "@/lib/agendamentos"
import { getCurrentUser } from "@/lib/auth"
import {
  Search,
  Filter,
  Phone,
  Calendar,
  Clock,
  User,
  Trash2,
  AlertTriangle,
  Move,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const COLUNAS_KANBAN_AGENDAMENTOS = [
  "agendar",
  "agendado",
  "realizou_visita",
  "vendedor_vitor",
  "vendedor_anderson",
  "desmarcou",
  "fechou",
  "nao_fechou",
]

export function AgendamentosKanban() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [filteredAgendamentos, setFilteredAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [movingAgendamento, setMovingAgendamento] = useState<number | null>(null)
  const [deletingAgendamento, setDeletingAgendamento] = useState<number | null>(null)
  const [showNaoRealizouModal, setShowNaoRealizouModal] = useState(false)
  const [agendamentoAcao, setAgendamentoAcao] = useState<Agendamento | null>(null)
  const [motivoNaoFechou, setMotivoNaoFechou] = useState("")

  const [formData, setFormData] = useState({
    modelo_veiculo: "",
    data_agendamento: "",
    hora_agendamento: "",
    id_vendedor: "",
    observacoes: "",
  })

  useEffect(() => {
    loadData()

    const intervalId = setInterval(() => {
      console.log("[v0] Auto-refreshing agendamentos...")
      loadData()
    }, 30000) // 30 seconds

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    filterAgendamentos()
  }, [agendamentos, searchTerm])

  const loadData = async () => {
    const user = getCurrentUser()
    if (user) {
      const { syncLeadsToAgendamentos } = await import("@/lib/agendamentos")
      await syncLeadsToAgendamentos(user.id_empresa)

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

    setFilteredAgendamentos(filtered)
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (source.droppableId === destination.droppableId) return

    const agendamentoId = Number.parseInt(draggableId)
    const newStage = destination.droppableId
    const oldStage = source.droppableId

    if (!VALID_ESTAGIOS_AGENDAMENTO.includes(newStage)) {
      setStatusMessage({
        type: "error",
        text: `Estágio inválido: ${newStage}`,
      })
      setTimeout(() => setStatusMessage(null), 5000)
      return
    }

    setMovingAgendamento(agendamentoId)

    setAgendamentos((prev) =>
      prev.map((a) =>
        a.id === agendamentoId ? { ...a, estagio_agendamento: newStage, updated_at: new Date().toISOString() } : a,
      ),
    )

    try {
      const success = await updateAgendamentoStage(agendamentoId, newStage)

      if (!success) {
        setAgendamentos((prev) =>
          prev.map((a) => (a.id === agendamentoId ? { ...a, estagio_agendamento: oldStage } : a)),
        )

        setStatusMessage({
          type: "error",
          text: "Erro ao mover o agendamento",
        })
      } else {
        setStatusMessage({
          type: "success",
          text: "Agendamento movido com sucesso!",
        })
      }
    } catch (error) {
      setAgendamentos((prev) => prev.map((a) => (a.id === agendamentoId ? { ...a, estagio_agendamento: oldStage } : a)))
      setStatusMessage({
        type: "error",
        text: "Erro ao mover o agendamento",
      })
    } finally {
      setMovingAgendamento(null)
      setTimeout(() => setStatusMessage(null), 5000)
    }
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

    const success = await updateAgendamento(selectedAgendamento.id, {
      modelo_veiculo: formData.modelo_veiculo,
      data_agendamento: formData.data_agendamento,
      hora_agendamento: formData.hora_agendamento,
      id_vendedor: formData.id_vendedor ? Number.parseInt(formData.id_vendedor) : undefined,
      vendedor: vendedores.find((v) => v.id.toString() === formData.id_vendedor)?.vendedor,
      observacoes: formData.observacoes,
    })

    if (success) {
      await loadData()
      setSelectedAgendamento(null)
      setStatusMessage({
        type: "success",
        text: "Agendamento atualizado com sucesso!",
      })
    } else {
      setStatusMessage({
        type: "error",
        text: "Erro ao atualizar agendamento",
      })
    }

    setTimeout(() => setStatusMessage(null), 5000)
  }

  const handleDeleteAgendamento = async (agendamentoId: number) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return

    setDeletingAgendamento(agendamentoId)

    try {
      const success = await deleteAgendamento(agendamentoId)

      if (success) {
        setAgendamentos((prev) => prev.filter((a) => a.id !== agendamentoId))

        if (selectedAgendamento && selectedAgendamento.id === agendamentoId) {
          setSelectedAgendamento(null)
        }

        setStatusMessage({
          type: "success",
          text: "Agendamento excluído com sucesso!",
        })
      } else {
        setStatusMessage({
          type: "error",
          text: "Erro ao excluir agendamento",
        })
      }
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: "Erro inesperado ao excluir agendamento",
      })
    } finally {
      setDeletingAgendamento(null)
      setTimeout(() => setStatusMessage(null), 5000)
    }
  }

  const handleRealizouVisita = async (agendamento: Agendamento, e: React.MouseEvent) => {
    e.stopPropagation()
    const user = getCurrentUser()
    if (!user) return

    setMovingAgendamento(agendamento.id)

    const success = await updateAgendamentoWithAction(agendamento.id, "realizou_visita", user.nome_usuario)

    if (success) {
      // Criar registro no histórico
      await createHistoricoVisita({
        id_empresa: agendamento.id_empresa,
        id_agendamento: agendamento.id,
        id_lead: agendamento.id_lead,
        nome_lead: agendamento.nome_lead,
        telefone: agendamento.telefone,
        vendedor: agendamento.vendedor,
        data_agendamento: agendamento.data_agendamento,
        hora_agendamento: agendamento.hora_agendamento,
        status_visita: "realizou_visita",
        usuario_acao: user.nome_usuario,
      })

      await loadData()
      setStatusMessage({
        type: "success",
        text: "Visita marcada como realizada!",
      })
    } else {
      setStatusMessage({
        type: "error",
        text: "Erro ao atualizar visita",
      })
    }

    setMovingAgendamento(null)
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const handleNaoRealizouVisita = async (agendamento: Agendamento, e: React.MouseEvent) => {
    e.stopPropagation()
    setAgendamentoAcao(agendamento)
    setShowNaoRealizouModal(true)
  }

  const handleDesmarcou = async () => {
    if (!agendamentoAcao) return
    const user = getCurrentUser()
    if (!user) return

    setMovingAgendamento(agendamentoAcao.id)

    const success = await updateAgendamentoWithAction(agendamentoAcao.id, "desmarcou", user.nome_usuario)

    if (success) {
      await createHistoricoVisita({
        id_empresa: agendamentoAcao.id_empresa,
        id_agendamento: agendamentoAcao.id,
        id_lead: agendamentoAcao.id_lead,
        nome_lead: agendamentoAcao.nome_lead,
        telefone: agendamentoAcao.telefone,
        vendedor: agendamentoAcao.vendedor,
        data_agendamento: agendamentoAcao.data_agendamento,
        hora_agendamento: agendamentoAcao.hora_agendamento,
        status_visita: "desmarcou",
        usuario_acao: user.nome_usuario,
      })

      await loadData()
      setStatusMessage({
        type: "success",
        text: "Agendamento desmarcado!",
      })
    } else {
      setStatusMessage({
        type: "error",
        text: "Erro ao desmarcar agendamento",
      })
    }

    setMovingAgendamento(null)
    setShowNaoRealizouModal(false)
    setAgendamentoAcao(null)
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const handleNaoFechou = async () => {
    if (!agendamentoAcao) return
    const user = getCurrentUser()
    if (!user) return

    setMovingAgendamento(agendamentoAcao.id)

    const success = await updateAgendamentoWithAction(
      agendamentoAcao.id,
      "nao_fechou",
      user.nome_usuario,
      motivoNaoFechou,
    )

    if (success) {
      await createHistoricoVisita({
        id_empresa: agendamentoAcao.id_empresa,
        id_agendamento: agendamentoAcao.id,
        id_lead: agendamentoAcao.id_lead,
        nome_lead: agendamentoAcao.nome_lead,
        telefone: agendamentoAcao.telefone,
        vendedor: agendamentoAcao.vendedor,
        data_agendamento: agendamentoAcao.data_agendamento,
        hora_agendamento: agendamentoAcao.hora_agendamento,
        status_visita: "nao_fechou",
        usuario_acao: user.nome_usuario,
        motivo: motivoNaoFechou,
      })

      await loadData()
      setStatusMessage({
        type: "success",
        text: "Visita marcada como não fechou!",
      })
    } else {
      setStatusMessage({
        type: "error",
        text: "Erro ao atualizar visita",
      })
    }

    setMovingAgendamento(null)
    setShowNaoRealizouModal(false)
    setAgendamentoAcao(null)
    setMotivoNaoFechou("")
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const getAgendamentosByStage = (stage: string) => {
    return filteredAgendamentos.filter((a) => a.estagio_agendamento === stage)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {COLUNAS_KANBAN_AGENDAMENTOS.map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
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
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, telefone ou vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Message */}
      {statusMessage && (
        <Alert
          className={`${statusMessage.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className={statusMessage.type === "success" ? "text-green-700" : "text-red-700"}>
            {statusMessage.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {COLUNAS_KANBAN_AGENDAMENTOS.map((stage) => (
              <Droppable key={stage} droppableId={stage}>
                {(provided, snapshot) => (
                  <Card
                    className={`w-80 min-h-[500px] flex-shrink-0 transition-all duration-200 ${
                      snapshot.isDraggingOver
                        ? "bg-gradient-to-b from-blue-50 to-blue-100 border-blue-300 shadow-lg"
                        : "hover:shadow-md"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {snapshot.isDraggingOver && <Move className="h-4 w-4 text-blue-500 animate-pulse" />}
                          {ESTAGIO_AGENDAMENTO_LABELS[stage as keyof typeof ESTAGIO_AGENDAMENTO_LABELS]}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getAgendamentosByStage(stage).length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                      {getAgendamentosByStage(stage).map((agendamento, index) => (
                        <Draggable key={agendamento.id} draggableId={agendamento.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                snapshot.isDragging
                                  ? "shadow-2xl rotate-3 scale-105 bg-white border-blue-300 z-50"
                                  : "hover:shadow-md hover:-translate-y-1"
                              } ${movingAgendamento === agendamento.id ? "opacity-50" : ""}`}
                              onClick={() => handleOpenAgendamento(agendamento)}
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {agendamento.nome_lead}
                                </div>
                                <div className="space-y-1 text-xs text-gray-600">
                                  {agendamento.telefone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {agendamento.telefone}
                                    </div>
                                  )}
                                  {agendamento.data_agendamento && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(agendamento.data_agendamento).toLocaleDateString("pt-BR")}
                                    </div>
                                  )}
                                  {agendamento.hora_agendamento && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {agendamento.hora_agendamento}
                                    </div>
                                  )}
                                  {agendamento.vendedor && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {agendamento.vendedor}
                                    </div>
                                  )}
                                </div>

                                {stage === "agendado" && (
                                  <div className="flex gap-2 mt-3 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      size="sm"
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                      onClick={(e) => handleRealizouVisita(agendamento, e)}
                                      disabled={movingAgendamento === agendamento.id}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Realizou
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="flex-1"
                                      onClick={(e) => handleNaoRealizouVisita(agendamento, e)}
                                      disabled={movingAgendamento === agendamento.id}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Não Realizou
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Modal de Detalhes */}
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

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveAgendamento} className="flex-1">
                  Salvar
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteAgendamento(selectedAgendamento.id)}
                  disabled={deletingAgendamento === selectedAgendamento.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNaoRealizouModal} onOpenChange={setShowNaoRealizouModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Não Realizou Visita</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">O que aconteceu com esta visita?</p>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={handleDesmarcou}
                disabled={movingAgendamento !== null}
              >
                Desmarcou
              </Button>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={handleNaoFechou}
                  disabled={movingAgendamento !== null}
                >
                  Não Fechou
                </Button>
                <Textarea
                  placeholder="Motivo (opcional)"
                  value={motivoNaoFechou}
                  onChange={(e) => setMotivoNaoFechou(e.target.value)}
                  className="text-sm"
                  rows={3}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowNaoRealizouModal(false)
                setAgendamentoAcao(null)
                setMotivoNaoFechou("")
              }}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
