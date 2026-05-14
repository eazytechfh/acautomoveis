"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getHistoricoVisitas, getVendedores, type HistoricoVisita, type Vendedor } from "@/lib/agendamentos"
import { getCurrentUser } from "@/lib/auth"
import { Search, Calendar, User, Clock, Phone, Filter, FileText } from "lucide-react"

const STATUS_LABELS = {
  realizou_visita: "Realizou Visita",
  nao_realizou_visita: "Não Realizou Visita",
  nao_fechou: "Não Fechou",
  desmarcou: "Desmarcou",
}

const STATUS_COLORS = {
  realizou_visita: "bg-green-100 text-green-800",
  nao_realizou_visita: "bg-red-100 text-red-800",
  nao_fechou: "bg-orange-100 text-orange-800",
  desmarcou: "bg-gray-100 text-gray-800",
}

export function HistoricoVisitasTable() {
  const [historico, setHistorico] = useState<HistoricoVisita[]>([])
  const [filteredHistorico, setFilteredHistorico] = useState<HistoricoVisita[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    busca: "",
    vendedor: "",
    status: "",
    dataInicio: "",
    dataFim: "",
    quickFilter: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [historico, filters])

  const loadData = async () => {
    const user = getCurrentUser()
    if (user) {
      const [historicoData, vendedoresData] = await Promise.all([
        getHistoricoVisitas(user.id_empresa),
        getVendedores(user.id_empresa),
      ])
      setHistorico(historicoData)
      setVendedores(vendedoresData)
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...historico]

    // Filtro rápido
    if (filters.quickFilter === "hoje") {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      filtered = filtered.filter((h) => new Date(h.data_hora_acao) >= hoje)
    } else if (filters.quickFilter === "7dias") {
      const seteDiasAtras = new Date()
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
      filtered = filtered.filter((h) => new Date(h.data_hora_acao) >= seteDiasAtras)
    }

    // Filtro por período
    if (filters.dataInicio) {
      const dataInicio = new Date(filters.dataInicio)
      filtered = filtered.filter((h) => new Date(h.data_hora_acao) >= dataInicio)
    }

    if (filters.dataFim) {
      const dataFim = new Date(filters.dataFim)
      dataFim.setHours(23, 59, 59, 999)
      filtered = filtered.filter((h) => new Date(h.data_hora_acao) <= dataFim)
    }

    // Filtro por vendedor
    if (filters.vendedor) {
      filtered = filtered.filter((h) => h.vendedor === filters.vendedor)
    }

    // Filtro por status
    if (filters.status) {
      filtered = filtered.filter((h) => h.status_visita === filters.status)
    }

    // Filtro por busca
    if (filters.busca) {
      const busca = filters.busca.toLowerCase()
      filtered = filtered.filter(
        (h) =>
          h.nome_lead.toLowerCase().includes(busca) ||
          h.telefone?.toLowerCase().includes(busca) ||
          h.vendedor?.toLowerCase().includes(busca),
      )
    }

    setFilteredHistorico(filtered)
  }

  const handleQuickFilter = (quickFilter: string) => {
    setFilters((prev) => ({ ...prev, quickFilter, dataInicio: "", dataFim: "" }))
  }

  const clearFilters = () => {
    setFilters({
      busca: "",
      vendedor: "",
      status: "",
      dataInicio: "",
      dataFim: "",
      quickFilter: "",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
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
        <CardContent className="space-y-4">
          {/* Filtros rápidos */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filters.quickFilter === "hoje" ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickFilter("hoje")}
            >
              Hoje
            </Button>
            <Button
              variant={filters.quickFilter === "7dias" ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickFilter("7dias")}
            >
              Últimos 7 dias
            </Button>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome, telefone..."
                  value={filters.busca}
                  onChange={(e) => setFilters((prev) => ({ ...prev, busca: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Data Início */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data Início</label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters((prev) => ({ ...prev, dataInicio: e.target.value, quickFilter: "" }))}
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data Fim</label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters((prev) => ({ ...prev, dataFim: e.target.value, quickFilter: "" }))}
              />
            </div>

            {/* Vendedor */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Vendedor</label>
              <Select
                value={filters.vendedor}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, vendedor: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={v.vendedor}>
                      {v.vendedor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="realizou_visita">Realizou Visita</SelectItem>
                  <SelectItem value="nao_realizou_visita">Não Realizou Visita</SelectItem>
                  <SelectItem value="nao_fechou">Não Fechou</SelectItem>
                  <SelectItem value="desmarcou">Desmarcou</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico ({filteredHistorico.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora da Ação</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Data Agendamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuário Ação</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistorico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      Nenhuma visita encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistorico.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(item.data_hora_acao).toLocaleDateString("pt-BR")}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(item.data_hora_acao).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.nome_lead}</TableCell>
                      <TableCell>
                        {item.telefone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {item.telefone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.vendedor && (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-gray-400" />
                            {item.vendedor}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.data_agendamento && (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <div>
                              {new Date(item.data_agendamento).toLocaleDateString("pt-BR")}
                              {item.hora_agendamento && <span className="ml-1">{item.hora_agendamento}</span>}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[item.status_visita as keyof typeof STATUS_COLORS]}>
                          {STATUS_LABELS[item.status_visita as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.usuario_acao || "-"}</TableCell>
                      <TableCell>
                        {item.motivo ? (
                          <div className="flex items-start gap-1 text-sm text-gray-600 max-w-xs">
                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{item.motivo}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
