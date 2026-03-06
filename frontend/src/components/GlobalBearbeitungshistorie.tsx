'use client'

import { useState, useEffect } from 'react'
import { Employee } from '@/types/employee'
import { Button } from '@/components/ui/button'
import { Search, Calendar, User, FileText, Filter } from 'lucide-react'

interface GlobalBearbeitungshistorieProps {
  employees: Employee[]
}

interface HistoryItem {
  id_registro: number
  fecha: string
  usuario_login: string
  nombre_completo?: string
  id_empleado: number | null
  empleado_nombre?: string
  empleado_apellido?: string
  anio: number | null
  mes: number | null
  accion: string
  objeto: string
  detalles: any
}

export default function GlobalBearbeitungshistorie({ employees }: GlobalBearbeitungshistorieProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState<string>('')
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [filterEmployee, setFilterEmployee] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [filterYear, filterMonth, filterEmployee])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = `https://salary-management.azurewebsites.net/bearbeitungslog`

      const params = new URLSearchParams()
      if (filterYear) params.append('anio', filterYear)
      if (filterMonth) params.append('mes', filterMonth)
      if (filterEmployee) params.append('id_empleado', filterEmployee)
      params.append('limit', '500')

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data.items || [])
      } else {
        console.error('Error al obtener el historial de procesamiento')
        setHistory([])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = history.filter(item => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      item.usuario_login?.toLowerCase().includes(searchLower) ||
      item.nombre_completo?.toLowerCase().includes(searchLower) ||
      item.accion?.toLowerCase().includes(searchLower) ||
      item.objeto?.toLowerCase().includes(searchLower) ||
      `${item.empleado_nombre} ${item.empleado_apellido}`.toLowerCase().includes(searchLower) ||
      (item.id_empleado && item.id_empleado.toString().includes(searchLower)) ||
      (item.anio && item.anio.toString().includes(searchLower)) ||
      (item.mes && item.mes.toString().includes(searchLower))
    )
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      'create': 'Creado',
      'update': 'Actualizado',
      'delete': 'Eliminado'
    }
    return actionMap[action] || action
  }

  const getObjectText = (object: string) => {
    const objectMap: Record<string, string> = {
      'employee': 'Empleado',
      'salary': 'Salario',
      'ingresos': 'Ingresos brutos',
      'deducciones': 'Deducciones',
      'ingresos_mensuales': 'Ingresos brutos mensuales',
      'deducciones_mensuales': 'Deducciones mensuales'
    }
    return objectMap[object] || object
  }

  const renderDetails = (details: any) => {
    if (!details) return null

    try {
      const detailsObj = typeof details === 'string' ? JSON.parse(details) : details

      return (
        <div className="mt-2 text-xs text-gray-600">
          <div className="bg-gray-50 rounded p-2 max-h-48 overflow-y-auto">
            {Object.entries(detailsObj).map(([key, value]) => {
              // Check if this is a change object with old/new values
              if (typeof value === 'object' && value !== null && 'old' in value && 'new' in value) {
                const oldValue = value.old
                const newValue = value.new

                return (
                  <div key={key} className="mb-2 p-2 bg-card rounded border border-border">
                    <div className="font-medium text-foreground mb-1">{key}:</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-destructive">Antes:</span>
                        <span className="text-destructive bg-destructive/10 px-2 py-1 rounded font-mono text-xs">
                          {typeof oldValue === 'object' ? JSON.stringify(oldValue, null, 2) : String(oldValue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-500">Después:</span>
                        <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded font-mono text-xs">
                          {typeof newValue === 'object' ? JSON.stringify(newValue, null, 2) : String(newValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }

              // Regular key-value pair
              return (
                <div key={key} className="mb-1">
                  <span className="font-medium text-foreground">{key}:</span>{' '}
                  <span className="text-muted-foreground">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    } catch (e) {
      return (
        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 max-h-32 overflow-y-auto">
          {typeof details === 'string' ? details : JSON.stringify(details)}
        </div>
      )
    }
  }

  const clearFilters = () => {
    setFilterYear('')
    setFilterMonth('')
    setFilterEmployee('')
    setSearchTerm('')
  }

  const activeFiltersCount = [filterYear, filterMonth, filterEmployee, searchTerm].filter(f => f).length

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>

          {activeFiltersCount > 0 && (
            <Button onClick={clearFilters} variant="ghost" size="sm">
              Limpiar todo
            </Button>
          )}
        </div>

        <div className="flex-1 min-w-64">
          <label className="block text-sm font-medium text-muted-foreground mb-1">Buscar</label>
          <div className="relative">
            <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en historial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <Button onClick={fetchHistory} variant="outline" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-primary/10 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Año</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 border border-border bg-background text-foreground rounded-md"
            >
              <option value="">Todos los años</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Mes</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-border bg-background text-foreground rounded-md focus:ring-primary"
            >
              <option value="">Todos los meses</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Empleado</label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="px-3 py-2 border border-border bg-background text-foreground rounded-md min-w-48 focus:ring-primary"
            >
              <option value="">Todos los empleados</option>
              {employees.map((employee) => (
                <option key={employee.id_empleado} value={employee.id_empleado}>
                  {employee.apellido}, {employee.nombre} (ID: {employee.id_empleado})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* History List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-lg text-muted-foreground">Cargando historial de procesamiento...</div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground/60">
          {searchTerm || filterYear || filterMonth || filterEmployee ? 'No se encontraron entradas' : 'No hay historial de procesamiento disponible'}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground mb-2">
            {filteredHistory.length} Entrada{filteredHistory.length !== 1 ? 's' : ''}
          </div>

          {filteredHistory.map((item) => (
            <div key={item.id_registro} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors bg-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-muted-foreground/60" />
                    <span className="font-medium text-foreground">
                      {item.nombre_completo || item.usuario_login}
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.fecha)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-700">
                        {getObjectText(item.objeto)}
                      </span>
                    </div>

                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.accion === 'create' ? 'bg-green-500/10 text-green-500' :
                      item.accion === 'update' ? 'bg-blue-500/10 text-blue-500' :
                        item.accion === 'delete' ? 'bg-red-500/10 text-red-500' :
                          'bg-muted text-muted-foreground'
                      }`}>
                      {getActionText(item.accion)}
                    </span>

                    {item.id_empleado && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>
                          {item.empleado_nombre && item.empleado_apellido
                            ? `${item.empleado_apellido}, ${item.empleado_nombre}`
                            : `ID: ${item.id_empleado}`
                          }
                        </span>
                      </div>
                    )}

                    {(item.anio || item.mes) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {item.anio && <span>{item.anio}</span>}
                        {item.mes && <span>/{item.mes.toString().padStart(2, '0')}</span>}
                      </div>
                    )}
                  </div>

                  {item.detalles && renderDetails(item.detalles)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
