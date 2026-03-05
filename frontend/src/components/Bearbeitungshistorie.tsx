'use client'

import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import { ArrowLeft, Download, Users, FileText, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import EmployeeTable from '@/components/EmployeeTable'
import { Button } from '@/components/ui/button'

interface DashboardProps {
  user?: any
  onLogout: () => void
}

function DashboardComponent({ user, onLogout }: DashboardProps) {
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number | null>(null)
  const [exportType, setExportType] = useState<'yearly' | 'monthly'>('yearly')
  const [exportFormat, setExportFormat] = useState<'nomina_total' | 'asiento_nomina' | 'irpf'>('nomina_total')
  const [exportExtra, setExportExtra] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    fetchEmployeeStats()
  }, [])

  const fetchEmployeeStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://salary-management.azurewebsites.net/employees?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const employees = await response.json()
      
      const total = employees.length
      const active = employees.filter((emp: any) => emp.activo).length
      const inactive = total - active

      setEmployeeStats({ total, active, inactive })
    } catch (error) {
      console.error('Error fetching employee stats:', error)
    }
  }

  const handleBack = () => {
    router.push('/')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    onLogout()
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Asiento Nomina requiere exportación mensual
      if (exportFormat === 'asiento_nomina' && (!currentMonth || exportType !== 'monthly')) {
        alert('La exportación de Asiento Nomina requiere selección mensual')
        return
      }
      
      let url: string
      if (exportFormat === 'asiento_nomina') {
        // Asiento Nomina API Endpunkt
        url = `https://salary-management.azurewebsites.net/export/asiento_nomina/${currentYear}/${currentMonth}`
      } else if (exportFormat === 'irpf') {
        const isExtraEligible = exportType === 'monthly' && (currentMonth === 6 || currentMonth === 12)
        const extraQuery = exportExtra && isExtraEligible ? '?extra=1' : ''
        url = exportType === 'monthly' && currentMonth
          ? `https://salary-management.azurewebsites.net/export/irpf/${currentYear}/${currentMonth}${extraQuery}`
          : `https://salary-management.azurewebsites.net/export/irpf/${currentYear}`
      } else {
        const isExtraEligible = exportType === 'monthly' && (currentMonth === 6 || currentMonth === 12)
        const extraQuery = exportExtra && isExtraEligible ? '?extra=1' : ''
        // Nomina Total API Endpunkt
        url = exportType === 'monthly' && currentMonth 
          ? `https://salary-management.azurewebsites.net/export/excel/${currentYear}/${currentMonth}${extraQuery}`
          : `https://salary-management.azurewebsites.net/export/excel/${currentYear}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      
      // Create blob and download
      const url_blob = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url_blob
      
      let filename: string
      if (exportFormat === 'asiento_nomina') {
        filename = `ASIENTO_NOMINA_${currentYear}_${currentMonth}.xlsx`
      } else if (exportFormat === 'irpf') {
        if (exportType === 'monthly' && currentMonth) {
          const isExtraEligible = currentMonth === 6 || currentMonth === 12
          const isExtra = exportExtra && isExtraEligible
          filename = isExtra
            ? `IRPF_EXTRA_${currentYear}_${currentMonth}.xlsx`
            : `IRPF_${currentYear}_${currentMonth}.xlsx`
        } else {
          filename = `IRPF_${currentYear}.xlsx`
        }
      } else {
        if (exportType === 'monthly' && currentMonth) {
          const isExtraEligible = currentMonth === 6 || currentMonth === 12
          const isExtra = exportExtra && isExtraEligible
          filename = isExtra
            ? `NOMINA_TOTAL_EXTRA_${currentYear}_${currentMonth}.xlsx`
            : `NOMINA_TOTAL_${currentYear}_${currentMonth}.xlsx`
        } else {
          filename = `gehaltsabrechnung_${currentYear}.xlsx`
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url_blob)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Error en la exportación. Por favor, inténtelo de nuevo.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Empleados</h1>
              <p className="text-gray-600">Conectado como: {user?.nombre_usuario} ({user?.rol})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={exportFormat} 
              onChange={(e) => {
                setExportFormat(e.target.value as 'nomina_total' | 'asiento_nomina' | 'irpf')
                setExportExtra(false)
                // Asiento Nomina requiere exportación mensual
                if (e.target.value === 'asiento_nomina') {
                  setExportType('monthly')
                  if (!currentMonth) {
                    setCurrentMonth(new Date().getMonth() + 1)
                  }
                }
                if (e.target.value === 'irpf' && exportType === 'monthly' && !currentMonth) {
                  setCurrentMonth(new Date().getMonth() + 1)
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="nomina_total">Nomina Total</option>
              <option value="asiento_nomina">Asiento Nomina</option>
              <option value="irpf">IRPF</option>
            </select>
            
            {(exportFormat === 'nomina_total' || exportFormat === 'irpf') && (
              <select 
                value={exportType} 
                onChange={(e) => {
                  setExportType(e.target.value as 'yearly' | 'monthly')
                  if (e.target.value === 'yearly') {
                    setExportExtra(false)
                  }
                  if (e.target.value === 'yearly') {
                    setCurrentMonth(null)
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="yearly">Anual</option>
                <option value="monthly">Mensual</option>
              </select>
            )}
            
            <select 
              value={currentYear} 
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 4 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            
            {(exportFormat === 'asiento_nomina' || exportType === 'monthly') && (
              <select 
                value={currentMonth || ''} 
                onChange={(e) => {
                  const nextMonth = e.target.value ? parseInt(e.target.value) : null
                  setCurrentMonth(nextMonth)
                  if (nextMonth !== 6 && nextMonth !== 12) {
                    setExportExtra(false)
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar mes...</option>
                {[
                  { value: 1, label: 'Enero' },
                  { value: 2, label: 'Febrero' },
                  { value: 3, label: 'Marzo' },
                  { value: 4, label: 'Abril' },
                  { value: 5, label: 'Mayo' },
                  { value: 6, label: 'Junio' },
                  { value: 7, label: 'Julio' },
                  { value: 8, label: 'Agosto' },
                  { value: 9, label: 'Septiembre' },
                  { value: 10, label: 'Octubre' },
                  { value: 11, label: 'Noviembre' },
                  { value: 12, label: 'Diciembre' }
                ].map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            )}

            {(exportFormat === 'nomina_total' || exportFormat === 'irpf') && exportType === 'monthly' && (currentMonth === 6 || currentMonth === 12) && (
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white">
                <input
                  type="checkbox"
                  checked={exportExtra}
                  onChange={(e) => setExportExtra(e.target.checked)}
                />
                Extra
              </label>
            )}
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={() => handleExport()}
              disabled={(exportFormat === 'asiento_nomina' || exportType === 'monthly') && !currentMonth}
            >
              <Download className="w-4 h-4" />
              Exportación Excel
            </Button>
            <Button variant="destructive" className="flex items-center gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Users className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Empleados</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">{employeeStats.total}</div>
            </div>
            <p className="text-gray-600">Número total de empleados</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-green-600">
                <FileText className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Empleados Activos</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">{employeeStats.active}</div>
            </div>
            <p className="text-gray-600">Empleados activos en el sistema</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-orange-600">
                <FileText className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Empleados Inactivos</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">{employeeStats.inactive}</div>
            </div>
            <p className="text-gray-600">Empleados inactivos en el sistema</p>
          </div>
        </div>

        <EmployeeTable onEmployeeChange={fetchEmployeeStats} />
      </div>
    </div>
  )
}

export default function AuthWrapper() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const userData = localStorage.getItem('user')

    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUser(user)
      } catch (error) {
        // Invalid user data, clear storage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)

    // Add event listener for browser close/tab close
    const handleBeforeUnload = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const handleLogin = (userData: any, token: string) => {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return <DashboardComponent user={user} onLogout={handleLogout} />
}
'use client'

import { useState, useEffect } from 'react'
import { Employee } from '@/types/employee'
import { Button } from '@/components/ui/button'
import { Search, Calendar, User, FileText } from 'lucide-react'

interface BearbeitungshistorieProps {
  employee: Employee
}

interface HistoryItem {
  id_log: number
  fecha: string
  usuario_login: string
  usuario_nombre?: string
  anio: number | null
  mes: number | null
  aktion: string
  objekt: string
  details: any
}

export default function Bearbeitungshistorie({ employee }: BearbeitungshistorieProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState<string>('')
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [employee.id_empleado, filterYear, filterMonth])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/bearbeitungslog`
      
      const params = new URLSearchParams()
      if (filterYear) params.append('anio', filterYear)
      if (filterMonth) params.append('mes', filterMonth)
      params.append('limit', '200')
      
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
      item.usuario_nombre?.toLowerCase().includes(searchLower) ||
      item.aktion?.toLowerCase().includes(searchLower) ||
      item.objekt?.toLowerCase().includes(searchLower) ||
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
          <div className="bg-gray-50 rounded p-2">
            {Object.entries(detailsObj).map(([key, value]) => (
              <div key={key} className="mb-1">
                <span className="font-medium">{key}:</span>{' '}
                <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )
    } catch (e) {
      return (
        <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
          {typeof details === 'string' ? details : JSON.stringify(details)}
        </div>
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Todos los años</option>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Todos los meses</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en historial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <Button onClick={fetchHistory} variant="outline" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* History List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-lg text-gray-600">Cargando historial de procesamiento...</div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || filterYear || filterMonth ? 'No se encontraron entradas' : 'No hay historial de procesamiento disponible'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div key={item.id_log} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {item.usuario_nombre || item.usuario_login}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(item.fecha)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-700">
                        {getObjectText(item.objekt)}
                      </span>
                    </div>
                    
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item.aktion === 'create' ? 'bg-green-100 text-green-800' :
                      item.aktion === 'update' ? 'bg-blue-100 text-blue-800' :
                      item.aktion === 'delete' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getActionText(item.aktion)}
                    </span>
                    
                    {(item.anio || item.mes) && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {item.anio && <span>{item.anio}</span>}
                        {item.mes && <span>/{item.mes.toString().padStart(2, '0')}</span>}
                      </div>
                    )}
                  </div>
                  
                  {item.details && renderDetails(item.details)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import apiClient from '@/lib/api'
import { Employee } from '@/types/employee'

type CarryOverItem = {
  id_carry_over: number
  id_empleado: number
  source_anio: number
  source_mes: number
  apply_anio: number
  apply_mes: number
  concept: string
  amount: number
  created_at?: string
  updated_at?: string
}

type ConceptKey =
  | 'horas_extras'
  | 'primas'
  | 'dietas_cotizables'
  | 'dietas_exentas'
  | 'anticipos'
  | 'salary'

const CONCEPTS: { key: ConceptKey; label: string }[] = [
  { key: 'horas_extras', label: 'Horas extra' },
  { key: 'primas', label: 'Primas' },
  { key: 'dietas_cotizables', label: 'Dietas cotizables' },
  { key: 'dietas_exentas', label: 'Dietas exentas' },
  { key: 'anticipos', label: 'Anticipos' },
  { key: 'salary', label: 'Salary' },
]

export default function CarryOverManager({ employees }: { employees: Employee[] }) {
  const now = new Date()
  const [employeeId, setEmployeeId] = useState<number | ''>('')
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)

  const [enabled, setEnabled] = useState<Record<ConceptKey, boolean>>({
    horas_extras: false,
    primas: false,
    dietas_cotizables: false,
    dietas_exentas: false,
    anticipos: false,
    salary: false,
  })

  const [amounts, setAmounts] = useState<Record<ConceptKey, string>>({
    horas_extras: '',
    primas: '',
    dietas_cotizables: '',
    dietas_exentas: '',
    anticipos: '',
    salary: '',
  })

  const [salarySign, setSalarySign] = useState<'plus' | 'minus'>('plus')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [items, setItems] = useState<CarryOverItem[]>([])

  const years = useMemo(() => {
    const start = now.getFullYear() - 4
    return Array.from({ length: 15 }, (_, i) => start + i)
  }, [now])

  const selectedEmployeeName = useMemo(() => {
    if (employeeId === '') return ''
    const e = employees.find((x) => x.id_empleado === employeeId)
    if (!e) return ''
    return `${e.apellido}, ${e.nombre}`
  }, [employeeId, employees])

  const load = async () => {
    if (employeeId === '') {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getCarryOverBySource(employeeId, year, month)
      setItems(Array.isArray(res?.items) ? res.items : [])
    } catch (e: any) {
      setError(e?.message || 'Error al cargar')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSuccess(null)
    setError(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, year, month])

  const toggleEnabled = (key: ConceptKey, value: boolean) => {
    setEnabled((prev) => ({ ...prev, [key]: value }))
    if (!value) {
      setAmounts((prev) => ({ ...prev, [key]: '' }))
    }
  }

  const doSave = async () => {
    setSuccess(null)
    setError(null)

    if (employeeId === '') {
      setError('Por favor, seleccione un empleado.')
      return
    }

    const toFloat = (s: string) => {
      const v = parseFloat(String(s).replace(',', '.'))
      return Number.isFinite(v) ? v : 0
    }

    const payloadItems: { concept: string; amount: number }[] = []
    for (const c of CONCEPTS) {
      if (!enabled[c.key]) continue
      let amount = toFloat(amounts[c.key])
      if (c.key === 'salary' && amount !== 0) {
        amount = salarySign === 'minus' ? -Math.abs(amount) : Math.abs(amount)
      }
      if (amount === 0) continue
      payloadItems.push({ concept: c.key, amount })
    }

    if (payloadItems.length === 0) {
      setError('Por favor, seleccione al menos un concepto e ingrese un monto.')
      return
    }

    setSaving(true)
    try {
      await apiClient.createCarryOver({
        employee_id: employeeId,
        year,
        month,
        items: payloadItems,
      })

      setSuccess(`Carry Over guardado para ${selectedEmployeeName || employeeId} (${month}.${year}). Aplicará el mes siguiente.`)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async (id: number) => {
    setSuccess(null)
    setError(null)
    setSaving(true)
    try {
      await apiClient.deleteCarryOver(id)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Error al eliminar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Carry Over</h3>
        <p className="text-sm text-gray-600">
          Guarda montos por empleado y mes que se sumarán automáticamente al mes siguiente. Los Carry Overs entrantes del mes anterior se transfieren automáticamente al siguiente mes al guardar.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertTitle>OK</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value ? parseInt(e.target.value, 10) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          >
            <option value="">Por favor seleccione</option>
            {employees
              .slice()
              .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
              .map((e) => (
                <option key={e.id_empleado} value={e.id_empleado}>
                  {e.apellido}, {e.nombre} (#{e.id_empleado})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mes (Fuente)</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4 text-sm font-medium text-gray-700">Concepto</div>
          <div className="md:col-span-2 text-sm font-medium text-gray-700">Activo</div>
          <div className="md:col-span-6 text-sm font-medium text-gray-700">Monto (€)</div>
        </div>

        {CONCEPTS.map((c) => {
          const isSalary = c.key === 'salary'
          return (
            <div key={c.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4 text-sm text-gray-900">{c.label}</div>

              <div className="md:col-span-2">
                <input
                  type="checkbox"
                  checked={enabled[c.key]}
                  onChange={(e) => toggleEnabled(c.key, e.target.checked)}
                  disabled={saving}
                />
              </div>

              <div className="md:col-span-6 flex gap-2 items-center">
                {isSalary && (
                  <select
                    value={salarySign}
                    onChange={(e) => setSalarySign(e.target.value as any)}
                    className="px-2 py-2 border border-gray-300 rounded-md"
                    disabled={saving || !enabled[c.key]}
                  >
                    <option value="plus">+</option>
                    <option value="minus">-</option>
                  </select>
                )}
                <input
                  type="text"
                  value={amounts[c.key]}
                  onChange={(e) => setAmounts((prev) => ({ ...prev, [c.key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={saving || !enabled[c.key]}
                  placeholder="0"
                />
              </div>
            </div>
          )
        })}

        <div className="pt-2">
          <Button onClick={doSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6" />

      <div className="space-y-3">
        <div>
          <h4 className="text-md font-semibold text-gray-900">Carry Overs Guardados (Fuente {month}.{year})</h4>
          <p className="text-sm text-gray-600">Estas entradas aplicarán en el mes {month === 12 ? `1.${year + 1}` : `${month + 1}.${year}`}</p>
        </div>

        {loading ? (
          <div className="text-sm text-gray-600">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-600">No hay entradas disponibles.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aplicar</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((it) => (
                  <tr key={it.id_carry_over}>
                    <td className="px-4 py-2 text-sm text-gray-900">{it.concept}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{Number(it.amount || 0).toFixed(2)} €</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {it.apply_mes}.{it.apply_anio}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="destructive" size="sm" onClick={() => doDelete(it.id_carry_over)} disabled={saving}>
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'
import { useState, useEffect, useMemo } from 'react'
import { Employee, Salary, Ingresos, Deducciones, EmployeeFte } from '@/types/employee'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Download, Euro, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import LogDetails from '@/components/ui/LogDetails'
import apiClient from '@/lib/api'
interface EmployeeDetailProps {
  employee: Employee
  onBack: () => void
}
export default function EmployeeDetail({ employee, onBack }: EmployeeDetailProps) {
  const [activeTab, setActiveTab] = useState<'salary' | 'ingresos' | 'deducciones' | 'stammdaten' | 'gehaltserhoehung' | 'bearbeitungslog' | 'stundenreduzierung'>('salary')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number | null>(null)
  const [dataMode, setDataMode] = useState<'yearly' | 'monthly'>('yearly')
  const [customYear, setCustomYear] = useState<string>('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [loading, setLoading] = useState(false)
  // Helper function to format date for input field
  const formatDateForInput = (date: any): string => {
    if (!date) return ''
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      // Format as YYYY-MM-DD
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      return ''
    }
  }

  // State for employee form (Stammdaten)
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [employeeFormData, setEmployeeFormData] = useState({
    nombre: employee.nombre || '',
    apellido: employee.apellido || '',
    ceco: employee.ceco || '',
    categoria: (employee as any).categoria ?? undefined,
    declaracion: (employee as any).declaracion ?? '',
    dni: (employee as any).dni ?? '',
    fecha_alta: formatDateForInput((employee as any).fecha_alta),
    activo: employee.activo ?? true
  })
  // State for salary increase
  const [increaseYear, setIncreaseYear] = useState<string>('')
  const [increasePercentage, setIncreasePercentage] = useState<string>('')
  const [increaseAbsolute, setIncreaseAbsolute] = useState<string>('')
  const [increaseType, setIncreaseType] = useState<'percentage' | 'absolute'>('percentage')
  const [increaseLoading, setIncreaseLoading] = useState(false)
  const [increaseResult, setIncreaseResult] = useState<any>(null)
  // Global payout month setting
  const [payoutMonth, setPayoutMonth] = useState<number>(4)
  // Salary state
  const [salary, setSalary] = useState<Salary | null>(null)
  const [salaries, setSalaries] = useState<any[]>([])
  const [ingresos, setIngresos] = useState<Ingresos | null>(null)
  const [deducciones, setDeducciones] = useState<Deducciones | null>(null)
  const [fteItems, setFteItems] = useState<EmployeeFte[]>([])
  const [fteLoading, setFteLoading] = useState(false)
  const [fteYear, setFteYear] = useState<number>(new Date().getFullYear())
  const [fteMonth, setFteMonth] = useState<number>(new Date().getMonth() + 1)
  const [fteReduction, setFteReduction] = useState<string>('')
  const [bearbeitungslogItems, setBearbeitungslogItems] = useState<any[]>([])
  const [bearbeitungslogLoading, setBearbeitungslogLoading] = useState(false)
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false)
  const [unsavedChangesSaving, setUnsavedChangesSaving] = useState(false)
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<any>(null)
  useEffect(() => {
    fetchData()
  }, [employee.id_empleado, year, month, dataMode])
  useEffect(() => {
    if (activeTab !== 'bearbeitungslog') return
    fetchBearbeitungslog()
  }, [activeTab, employee.id_empleado, year, month, dataMode])
  useEffect(() => {
    fetchPayoutMonth()
  }, [])
  const fetchPayoutMonth = async () => {
    try {
      const res = await apiClient.getPayoutMonth()
      if (typeof res?.payout_month === 'number') {
        setPayoutMonth(res.payout_month)
      }
    } catch (e) {
      console.error('Error fetching payout month:', e)
    }
  }
  const normalizeSnapshotObject = (obj: any, excludeKeys: string[] = []) => {
    if (!obj || typeof obj !== 'object') return obj
    const out: any = {}
    for (const [k, v] of Object.entries(obj)) {
      if (excludeKeys.includes(k)) continue
      if (v === undefined) continue
      if (typeof v === 'number') {
        out[k] = Number.isFinite(v) ? v : 0
      } else if (typeof v === 'string') {
        const n = Number(v)
        out[k] = Number.isFinite(n) && v.trim() !== '' ? n : v
      } else {
        out[k] = v
      }
    }
    return out
  }
  const currentSnapshot = useMemo(() => {
    return {
      salary: normalizeSnapshotObject(salary, ['id_empleado', 'anio', 'fecha_creacion', 'fecha_modificacion', 'salario_mensual_bruto', 'salario_mensual_con_atrasos']),
      ingresos: normalizeSnapshotObject(ingresos, ['id_empleado', 'anio', 'mes', 'fecha_creacion', 'fecha_modificacion']),
      deducciones: normalizeSnapshotObject(deducciones, ['id_empleado', 'anio', 'mes', 'fecha_creacion', 'fecha_modificacion']),
      employeeFormData: normalizeSnapshotObject(employeeFormData),
      fteReduction: (fteReduction || '').trim()
    }
  }, [salary, ingresos, deducciones, employeeFormData, fteReduction])
  const formatValueForDiff = (v: any) => {
    if (v === null || v === undefined) return '-'
    if (typeof v === 'boolean') return v ? 'Ja' : 'Nein'
    if (typeof v === 'number') {
      return v.toLocaleString('de-DE', { maximumFractionDigits: 2 })
    }
    return String(v)
  }
  const getUnsavedChanges = () => {
    const base = lastSavedSnapshot
    if (!base) return [] as Array<{ section: string; field: string; from: any; to: any }>
    const diffs: Array<{ section: string; field: string; from: any; to: any }> = []
    const compareObjects = (section: string, a: any, b: any) => {
      const keys = Array.from(new Set([...Object.keys(a || {}), ...Object.keys(b || {})]))
      for (const k of keys) {
        const av = (a || {})[k]
        const bv = (b || {})[k]
        const aNum = typeof av === 'number' ? av : Number(av)
        const bNum = typeof bv === 'number' ? bv : Number(bv)
        const bothNumeric = Number.isFinite(aNum) && Number.isFinite(bNum)
        const normalizeValue = (v: any) => {
          if (v === undefined || v === null || v === '') return undefined
          return v
        }
        const changed = bothNumeric ? aNum !== bNum : normalizeValue(av) !== normalizeValue(bv)
        if (changed) {
          diffs.push({ section, field: k, from: av, to: bv })
        }
      }
    }
    compareObjects('Gehalt', normalizeSnapshotObject(base.salary, ['id_empleado', 'anio', 'fecha_creacion', 'fecha_modificacion', 'salario_mensual_bruto', 'salario_mensual_con_atrasos']), currentSnapshot.salary)
    compareObjects('Zulagen', normalizeSnapshotObject(base.ingresos, ['id_empleado', 'anio', 'mes', 'fecha_creacion', 'fecha_modificacion']), currentSnapshot.ingresos)
    compareObjects('Abzüge', normalizeSnapshotObject(base.deducciones, ['id_empleado', 'anio', 'mes', 'fecha_creacion', 'fecha_modificacion']), currentSnapshot.deducciones)
    compareObjects('Stammdaten', normalizeSnapshotObject(base.employeeFormData), currentSnapshot.employeeFormData)
    if ((base.fteReduction || '') !== currentSnapshot.fteReduction) {
      diffs.push({ section: 'Stundenreduzierung', field: 'reduktion', from: base.fteReduction || '', to: currentSnapshot.fteReduction })
    }
    return diffs
  }
  const handleBackClick = () => {
    const diffs = getUnsavedChanges()
    if (diffs.length === 0) {
      onBack()
      return
    }
    setShowUnsavedChangesModal(true)
  }
  const saveAllUnsavedChanges = async () => {
    const diffs = getUnsavedChanges()
    if (diffs.length === 0) {
      setShowUnsavedChangesModal(false)
      onBack()
      return
    }
    try {
      setUnsavedChangesSaving(true)
      const hasSalary = diffs.some((d) => d.section === 'Gehalt')
      const hasIngresos = diffs.some((d) => d.section === 'Zulagen')
      const hasDeducciones = diffs.some((d) => d.section === 'Abzüge')
      const hasStammdaten = diffs.some((d) => d.section === 'Stammdaten')
      if (hasSalary && salary) {
        const token = localStorage.getItem('token')
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
        const checkResponse = await fetch(`https://salary-management.azurewebsites.net/employees/${employee.id_empleado}`, { headers })
        const employeeData = await checkResponse.json()
        const existingSalary = employeeData.salaries?.find((s: any) => s.anio === year)
        const url = existingSalary
          ? `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/salaries/${year}`
          : `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/salaries`
        const method = existingSalary ? 'PUT' : 'POST'
        await fetch(url, { method, headers, body: JSON.stringify({ ...salary, anio: year }) })
      }
      if (hasIngresos && ingresos) {
        const token = localStorage.getItem('token')
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
        const url = (dataMode === 'monthly' && month)
          ? `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/ingresos/${year}/${month}`
          : `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/ingresos/${year}`
        await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ ...ingresos, anio: year, ...(dataMode === 'monthly' && month ? { mes: month } : {}) })
        })
      }
      if (hasDeducciones && deducciones) {
        const token = localStorage.getItem('token')
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
        const url = (dataMode === 'monthly' && month)
          ? `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/deducciones/${year}/${month}`
          : `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/deducciones/${year}`
        await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ ...deducciones, anio: year, ...(dataMode === 'monthly' && month ? { mes: month } : {}) })
        })
      }
      if (hasStammdaten) {
        const token = localStorage.getItem('token')
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
        await fetch(`https://salary-management.azurewebsites.net/employees/${employee.id_empleado}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(employeeFormData)
        })
      }
      await fetchData()
      setShowUnsavedChangesModal(false)
      onBack()
    } catch (e) {
      console.error('Error saving unsaved changes:', e)
    } finally {
      setUnsavedChangesSaving(false)
    }
  }
  const getEffectiveFtePercent = (items: EmployeeFte[], y: number, m: number, excludeExact?: { anio: number; mes: number }) => {
    let best: EmployeeFte | null = null
    for (const it of items) {
      if (excludeExact && it.anio === excludeExact.anio && it.mes === excludeExact.mes) continue
      if (it.anio < y || (it.anio === y && it.mes <= m)) {
        if (!best) {
          best = it
        } else if (it.anio > best.anio || (it.anio === best.anio && it.mes > best.mes)) {
          best = it
        }
      }
    }
    if (!best) return 100
    const pctRaw: any = (best as any).porcentaje
    const pct = typeof pctRaw === 'string' ? parseFloat(pctRaw) : Number(pctRaw)
    return Number.isFinite(pct) ? pct : 100
  }
  const handleSaveFte = async (e: React.FormEvent) => {
    e.preventDefault()
    const reduction = parseFloat(fteReduction)
    if (!Number.isFinite(reduction) || reduction < 0 || reduction > 100) return
    try {
      setFteLoading(true)
      const prev = getEffectiveFtePercent(fteItems, fteYear, fteMonth, { anio: fteYear, mes: fteMonth })
      const next = Math.max(0, Math.min(100, prev - reduction))
      await apiClient.upsertEmployeeFte(employee.id_empleado, { anio: fteYear, mes: fteMonth, porcentaje: next })
      await fetchData()
      setFteReduction('')
    } catch (err) {
      console.error('Error saving fte:', err)
    } finally {
      setFteLoading(false)
    }
  }
  const handleDeleteFte = async (y: number, m: number) => {
    try {
      setFteLoading(true)
      await apiClient.deleteEmployeeFte(employee.id_empleado, y, m)
      await fetchData()
    } catch (err) {
      console.error('Error deleting fte:', err)
    } finally {
      setFteLoading(false)
    }
  }
  async function fetchBearbeitungslog() {
    try {
      setBearbeitungslogLoading(true)
      const params: any = { anio: year, limit: 200 }
      if (dataMode === 'monthly' && month) {
        params.mes = month
      }
      const res = await apiClient.getBearbeitungslog(employee.id_empleado, params)
      setBearbeitungslogItems(Array.isArray(res?.items) ? res.items : [])
    } catch (e) {
      console.error('Error fetching bearbeitungslog:', e)
      setBearbeitungslogItems([])
    } finally {
      setBearbeitungslogLoading(false)
    }
  }
  // Update employee form data when employee prop changes
  useEffect(() => {
    setEmployeeFormData({
      nombre: employee.nombre || '',
      apellido: employee.apellido || '',
      ceco: employee.ceco || '',
      categoria: (employee as any).categoria ?? undefined,
      declaracion: (employee as any).declaracion ?? '',
      dni: (employee as any).dni ?? '',
      fecha_alta: formatDateForInput((employee as any).fecha_alta),
      activo: employee.activo ?? true
    })
  }, [employee])
  async function fetchData() {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      
      console.log(`Fetching data for employee ${employee.id_empleado}, year ${year}, month ${month}, mode ${dataMode}`)
      
      // Fetch complete employee info
      const response = await fetch(
        `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}?_t=${Date.now()}`,
        { headers }
      )
      
      if (!response.ok) {
        console.error('API Response not OK:', response.status, response.statusText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Complete API Response:', data)
      console.log('Salaries:', data.salaries)
      console.log('Ingresos:', data.ingresos)
      console.log('Deducciones:', data.deducciones)
      console.log('Ingresos Mensuales:', data.ingresos_mensuales)
      console.log('Deducciones Mensuales:', data.deducciones_mensuales)
      console.log('FTE:', data.fte)
      
      // Extract salary data
      const salaryData = data.salaries?.find((s: any) => s.anio === year)
      
      // Extract ingresos and deducciones based on data mode
      let ingresosData, deduccionesData
      
      if (dataMode === 'monthly' && month) {
        ingresosData = data.ingresos_mensuales?.find((i: any) => i.anio === year && i.mes === month)
        deduccionesData = data.deducciones_mensuales?.find((d: any) => d.anio === year && d.mes === month)
      } else {
        ingresosData = data.ingresos?.find((i: any) => i.anio === year)
        deduccionesData = data.deducciones?.find((d: any) => d.anio === year)
      }
      
      console.log('Data found:', { salaryData, ingresosData, deduccionesData })
      
      const nextSalary = salaryData || {
        modalidad: 12,
        antiguedad: 0,
        salario_anual_bruto: 0,
        salario_mensual_bruto: 0,
        atrasos: 0
      }
      setSalary(nextSalary)
      setSalaries(Array.isArray(data.salaries) ? data.salaries : [])
      const nextIngresos = ingresosData || {
        ticket_restaurant: 0,
        primas: 0,
        dietas_cotizables: 0,
        horas_extras: 0,
        dias_exentos: 0,
        dietas_exentas: 0,
        seguro_pensiones: 0,
        lavado_coche: 0,
        ...(dataMode === 'monthly' ? { beca_escolar: 0 } : {}),
        formacion: 0,
        tickets: 0
      }
      setIngresos(nextIngresos)
      const nextDeducciones = deduccionesData || {
        seguro_accidentes: 0,
        adelas: 0,
        sanitas: 0,
        gasolina: 0,
        ret_especie: 0,
        seguro_medico: 0,
        cotizacion_especie: 0
      }
      setDeducciones(nextDeducciones)
      setFteItems(Array.isArray(data.fte) ? data.fte : [])
      setLastSavedSnapshot({
        salary: nextSalary,
        ingresos: nextIngresos,
        deducciones: nextDeducciones,
        employeeFormData: {
          nombre: data?.nombre ?? employee.nombre ?? '',
          apellido: data?.apellido ?? employee.apellido ?? '',
          ceco: data?.ceco ?? employee.ceco ?? '',
          fecha_alta: formatDateForInput((data as any)?.fecha_alta ?? (employee as any)?.fecha_alta),
          categoria: (data as any)?.categoria ?? (employee as any).categoria ?? undefined,
          activo: data?.activo ?? employee.activo ?? true
        },
        fteReduction: ''
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }
  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!salary) return
    try {
      const token = localStorage.getItem('token')
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      
      // Check if salary exists for this year
      const checkResponse = await fetch(`https://salary-management.azurewebsites.net/employees/${employee.id_empleado}`, {
        headers
      })
      const employeeData = await checkResponse.json()
      const existingSalary = employeeData.salaries?.find((s: any) => s.anio === year)
      
      const url = existingSalary 
        ? `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/salaries/${year}`
        : `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/salaries`
      
      const method = existingSalary ? 'PUT' : 'POST'
      
      await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ ...salary, anio: year })
      })
      fetchData()
    } catch (error) {
      console.error('Error saving salary:', error)
    }
  }
  const handleSaveIngresos = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ingresos) return
    try {
      const token = localStorage.getItem('token')
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      
      let url
      if (dataMode === 'monthly' && month) {
        url = `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/ingresos/${year}/${month}`
      } else {
        url = `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/ingresos/${year}`
      }
      
      await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...ingresos, anio: year, ...(dataMode === 'monthly' && month ? { mes: month } : {}) })
      })
      fetchData()
    } catch (error) {
      console.error('Error saving ingresos:', error)
    }
  }
  const handleSaveDeducciones = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deducciones) return
    try {
      const token = localStorage.getItem('token')
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      
      let url
      if (dataMode === 'monthly' && month) {
        url = `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/deducciones/${year}/${month}`
      } else {
        url = `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/deducciones/${year}`
      }
      
      await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...deducciones, anio: year, ...(dataMode === 'monthly' && month ? { mes: month } : {}) })
      })
      fetchData()
    } catch (error) {
      console.error('Error saving deducciones:', error)
    }
  }
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Kein Token gefunden')
        return
      }
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      
      console.log('Sending employee data:', employeeFormData)
      console.log('To URL:', `https://salary-management.azurewebsites.net/employees/${employee.id_empleado}`)
      
      const response = await fetch(`https://salary-management.azurewebsites.net/employees/${employee.id_empleado}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(employeeFormData)
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Mitarbeiter erfolgreich aktualisiert:', result)
        setShowEmployeeForm(false)
        // Update the local employee data to reflect changes immediately
        employee.nombre = employeeFormData.nombre
        employee.apellido = employeeFormData.apellido
        employee.ceco = employeeFormData.ceco
        employee.activo = employeeFormData.activo
        setLastSavedSnapshot((prev: any) => ({
          ...(prev || {}),
          employeeFormData: { ...employeeFormData }
        }))
      } else {
        const errorText = await response.text()
        console.error('Fehler beim Aktualisieren des Mitarbeiters:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error saving employee:', error)
    }
  }
  const handleSalaryIncrease = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!increaseYear || (increaseType === 'percentage' && !increasePercentage) || (increaseType === 'absolute' && !increaseAbsolute)) {
      alert('Bitte geben Sie Jahr und Erhöhungswert ein')
      return
    }
    
    setIncreaseLoading(true)
    setIncreaseResult(null)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Kein Token gefunden')
        return
      }
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      
      const requestData: any = {
        target_year: parseInt(increaseYear)
      }
      
      if (increaseType === 'percentage') {
        requestData.percentage_increase = parseFloat(increasePercentage)
      } else {
        requestData.absolute_increase = parseFloat(increaseAbsolute)
      }
      
      console.log('Sending salary increase request for single employee:', requestData)
      
      const response = await fetch(`https://salary-management.azurewebsites.net/employees/${employee.id_empleado}/salary-increase`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('Gehaltserhöhung erfolgreich:', result)
        setIncreaseResult(result)
        // Refresh data to show updated salaries
        fetchData()
      } else {
        console.error('Fehler bei Gehaltserhöhung:', result)
        setIncreaseResult(result)
      }
    } catch (error) {
      console.error('Error applying salary increase:', error)
      setIncreaseResult({ success: false, message: 'Netzwerkfehler' })
    } finally {
      setIncreaseLoading(false)
    }
  }
  const calculateAnnualSalaryWithFTE = () => {
    let totalAnnualSalary = 0
    for (let m = 1; m <= 12; m++) {
      totalAnnualSalary += calculateMonthlySalary(m)
    }
    return totalAnnualSalary
  }
  const calculateMonthlySalary = (selectedMonth: number | null) => {
    // FTE-Prozentsatz für den ausgewählten Monat abrufen
    const salaryYear = year
    const salaryMonth = selectedMonth || month
    const ftePercent = salaryMonth ? getEffectiveFtePercent(fteItems, salaryYear, salaryMonth) / 100 : 1
    // Wenn kein Monat ausgewählt, Jahresdurchschnitt unter Berücksichtigung von FTE verwenden
    if (!selectedMonth) {
      return calculateAnnualSalaryWithFTE() / 12
    }
    const monthsBeforePayout = Math.max(0, payoutMonth - 1)
    const modality = salary?.modalidad || 12
    const currentAnnualSalary = typeof salary?.salario_anual_bruto === 'string'
      ? parseFloat(salary.salario_anual_bruto) || 0
      : (salary?.salario_anual_bruto || 0)
    const prevYearSalaryObj = salaries?.find((s: any) => s?.anio === (year - 1))
    const prevAnnualSalary = typeof prevYearSalaryObj?.salario_anual_bruto === 'string'
      ? parseFloat(prevYearSalaryObj.salario_anual_bruto) || 0
      : (prevYearSalaryObj?.salario_anual_bruto || 0)
    const antiguedad = typeof salary?.antiguedad === 'string'
      ? parseFloat(salary.antiguedad) || 0
      : (salary?.antiguedad || 0)
    const oldMonthlyBase = modality > 0 ? (prevAnnualSalary / modality) : 0
    const newMonthlyBase = modality > 0 ? (currentAnnualSalary / modality) : 0
    // Für Monate vor dem Auszahlungsmonat: Gehalt vom Vorjahr verwenden, aber nur wenn Vorjahresgehalt > 0
    if (monthsBeforePayout > 0 && selectedMonth >= 1 && selectedMonth <= monthsBeforePayout) {
      // Wenn kein Vorjahresgehalt vorhanden, verwendet aktuelles Gehalt
      if (prevAnnualSalary > 0) {
        return (oldMonthlyBase + antiguedad) * ftePercent
      } else {
        return (newMonthlyBase + antiguedad) * ftePercent
      }
    }
    
    // Für Monate ab Auszahlungsmonat: neues Gehalt
    let totalSalary = (newMonthlyBase + antiguedad) * ftePercent
    // Atrasos nur im Auszahlungsmonat: Summe der monatlichen Differenzen (Neu - Alt) für Jan..(payoutMonth-1)
    // Wichtig: FTE je Monat berücksichtigen (Reduzierung kann mitten im Q1 starten)
    // Nur berechnen wenn Vorjahresgehalt > 0
    if (selectedMonth === payoutMonth && monthsBeforePayout > 0 && prevAnnualSalary > 0) {
      const diffBase = newMonthlyBase - oldMonthlyBase
      let atrasosTotal = 0
      for (let k = 1; k <= monthsBeforePayout; k++) {
        const fteK = getEffectiveFtePercent(fteItems, year, k) / 100
        atrasosTotal += diffBase * fteK
      }
      totalSalary += atrasosTotal
    }
    return totalSalary
  }
  const prorateSalaryForHireMonth = (baseSalary: number, selectedMonth: number | null) => {
    try {
      if (!selectedMonth) return baseSalary
      const rawHireDate = (employeeFormData as any)?.fecha_alta || (employee as any)?.fecha_alta
      if (!rawHireDate || typeof rawHireDate !== 'string') return baseSalary
      const d = new Date(rawHireDate)
      if (Number.isNaN(d.getTime())) return baseSalary
      const hireYear = d.getFullYear()
      const hireMonth = d.getMonth() + 1
      const targetYear = year
      const targetMonth = selectedMonth
      if ((targetYear < hireYear) || (targetYear === hireYear && targetMonth < hireMonth)) return 0
      if (hireYear !== targetYear || hireMonth !== targetMonth) return baseSalary
      const day = d.getDate()
      const employedDays = Math.max(0, 30 - (day - 1))
      return (baseSalary / 30) * employedDays
    } catch {
      return baseSalary
    }
  }
  const hireMonthProrationInfo = useMemo(() => {
    try {
      if (dataMode !== 'monthly' || !month) return { applied: false, employedDays: 30 }
      const rawHireDate = (employeeFormData as any)?.fecha_alta || (employee as any)?.fecha_alta
      if (!rawHireDate || typeof rawHireDate !== 'string') return { applied: false, employedDays: 30 }
      const d = new Date(rawHireDate)
      if (Number.isNaN(d.getTime())) return { applied: false, employedDays: 30 }
      if (d.getFullYear() !== year || (d.getMonth() + 1) !== month) return { applied: false, employedDays: 30 }
      const day = d.getDate()
      const employedDays = Math.max(0, 30 - (day - 1))
      return { applied: true, employedDays }
    } catch {
      return { applied: false, employedDays: 30 }
    }
  }, [dataMode, month, year, employeeFormData, employee])
  const calculateTotal = () => {
    const baseSalary = calculateMonthlySalary(month)
    const ingresosTotal = (typeof ingresos?.ticket_restaurant === 'string' ? parseFloat(ingresos.ticket_restaurant) || 0 : (ingresos?.ticket_restaurant || 0)) + 
                         (typeof ingresos?.primas === 'string' ? parseFloat(ingresos.primas) || 0 : (ingresos?.primas || 0)) + 
                         (typeof ingresos?.dietas_cotizables === 'string' ? parseFloat(ingresos.dietas_cotizables) || 0 : (ingresos?.dietas_cotizables || 0)) + 
                         (typeof ingresos?.horas_extras === 'string' ? parseFloat(ingresos.horas_extras) || 0 : (ingresos?.horas_extras || 0)) + 
                         (typeof ingresos?.dias_exentos === 'string' ? parseFloat(ingresos.dias_exentos) || 0 : (ingresos?.dias_exentos || 0)) + 
                         (typeof ingresos?.dietas_exentas === 'string' ? parseFloat(ingresos.dietas_exentas) || 0 : (ingresos?.dietas_exentas || 0)) + 
                         (typeof ingresos?.seguro_pensiones === 'string' ? parseFloat(ingresos.seguro_pensiones) || 0 : (ingresos?.seguro_pensiones || 0)) + 
                         (typeof ingresos?.lavado_coche === 'string' ? parseFloat(ingresos.lavado_coche) || 0 : (ingresos?.lavado_coche || 0)) +
                         (typeof ingresos?.beca_escolar === 'string' ? parseFloat((ingresos as any).beca_escolar) || 0 : ((ingresos as any)?.beca_escolar || 0)) +
                         (typeof ingresos?.formacion === 'string' ? parseFloat(ingresos.formacion) || 0 : (ingresos?.formacion || 0)) +
                         (typeof ingresos?.tickets === 'string' ? parseFloat(ingresos.tickets) || 0 : (ingresos?.tickets || 0))
    const deduccionesTotal = (typeof deducciones?.seguro_accidentes === 'string' ? parseFloat(deducciones.seguro_accidentes) || 0 : (deducciones?.seguro_accidentes || 0)) + 
                           (typeof deducciones?.adelas === 'string' ? parseFloat(deducciones.adelas) || 0 : (deducciones?.adelas || 0)) + 
                           (typeof deducciones?.sanitas === 'string' ? parseFloat(deducciones.sanitas) || 0 : (deducciones?.sanitas || 0)) + 
                           (typeof deducciones?.gasolina === 'string' ? parseFloat(deducciones.gasolina) || 0 : (deducciones?.gasolina || 0)) + 
                           (typeof deducciones?.ret_especie === 'string' ? parseFloat(deducciones.ret_especie) || 0 : (deducciones?.ret_especie || 0)) +
                           (typeof deducciones?.seguro_medico === 'string' ? parseFloat(deducciones.seguro_medico) || 0 : (deducciones?.seguro_medico || 0)) +
                           (typeof deducciones?.cotizacion_especie === 'string' ? parseFloat(deducciones.cotizacion_especie) || 0 : (deducciones?.cotizacion_especie || 0))
    return {
      gross: baseSalary + ingresosTotal,
      deductions: deduccionesTotal,
      net: baseSalary + ingresosTotal - deduccionesTotal,
      ingresosTotal,
      deduccionesTotal
    }
  }
  const totals = calculateTotal()
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando datos...</div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="text-lg font-semibold text-gray-900">Cambios no guardados</div>
              <div className="mt-1 text-sm text-gray-600">Tienes cambios que aún no han sido guardados.</div>
            </div>
            <div className="px-6 py-4">
              <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200">
                {getUnsavedChanges().length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-600">No se encontraron cambios.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campo</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anterior</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nuevo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {getUnsavedChanges().map((d, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{d.section}</td>
                          <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{d.field.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{formatValueForDiff(d.from)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatValueForDiff(d.to)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUnsavedChangesModal(false)}
                disabled={unsavedChangesSaving}
              >
                Cerrar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUnsavedChangesModal(false)
                  onBack()
                }}
                disabled={unsavedChangesSaving}
              >
                No guardar
              </Button>
              <Button
                type="button"
                onClick={saveAllUnsavedChanges}
                disabled={unsavedChangesSaving}
              >
                {unsavedChangesSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackClick}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {employee.apellido}, {employee.nombre}
              </h1>
              <p className="text-gray-600">ID: {employee.id_empleado} | CECO: {employee.ceco || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={dataMode} 
              onChange={(e) => {
                setDataMode(e.target.value as 'yearly' | 'monthly')
                if (e.target.value === 'yearly') {
                  setMonth(null)
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="yearly">Anual</option>
              <option value="monthly">Mensual</option>
            </select>
            
            <select 
              value={showCustomInput ? 'custom' : year} 
              onChange={(e) => {
                const value = e.target.value
                if (value === 'custom') {
                  setShowCustomInput(true)
                } else {
                  setShowCustomInput(false)
                  setYear(parseInt(value))
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Seleccionar año...</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 5 - i).map(y => {
                const currentYear = new Date().getFullYear()
                const isCurrentYear = y === currentYear
                return (
                  <option 
                    key={y} 
                    value={y}
                    style={{ 
                      fontWeight: isCurrentYear ? 'bold' : 'normal',
                      color: isCurrentYear ? '#2563eb' : 'inherit'
                    }}
                  >
                    {y}{isCurrentYear ? ' (actual)' : ''}
                  </option>
                )
              })}
              <option value="custom">Otro año...</option>
            </select>
            
            {showCustomInput && (
              <input
                type="number"
                placeholder="Ingresar año"
                value={customYear}
                onChange={(e) => {
                  setCustomYear(e.target.value)
                }}
                onBlur={(e) => {
                  const yearValue = parseInt(e.target.value)
                  if (!isNaN(yearValue) && yearValue > 0) {
                    setYear(yearValue)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const yearValue = parseInt(e.currentTarget.value)
                    if (!isNaN(yearValue) && yearValue > 0) {
                      setYear(yearValue)
                    }
                    e.currentTarget.blur()
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md w-32"
                min="1900"
                max="2100"
              />
            )}
            
            {dataMode === 'monthly' && (
              <select 
                value={month || ''} 
                onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar mes...</option>
                {[
                  { value: 1, label: 'Enero' },
                  { value: 2, label: 'Febrero' },
                  { value: 3, label: 'Marzo' },
                  { value: 4, label: 'Abril' },
                  { value: 5, label: 'Mayo' },
                  { value: 6, label: 'Junio' },
                  { value: 7, label: 'Julio' },
                  { value: 8, label: 'Agosto' },
                  { value: 9, label: 'Septiembre' },
                  { value: 10, label: 'Octubre' },
                  { value: 11, label: 'Noviembre' },
                  { value: 12, label: 'Diciembre' }
                ].map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Euro className="w-6 h-6" />
              <h3 className="font-semibold">Salario Mensual</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              €{prorateSalaryForHireMonth(calculateMonthlySalary(month), month).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {hireMonthProrationInfo.applied && (
              <div className="mt-2 text-xs text-gray-600">
                Prorrateado por fecha de contratación ({hireMonthProrationInfo.employedDays}/30 días)
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <TrendingUp className="w-6 h-6" />
              <h3 className="font-semibold">Salario Anual</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              €{calculateAnnualSalaryWithFTE().toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Calendar className="w-6 h-6" />
              <h3 className="font-semibold">{dataMode === 'monthly' ? 'Mes/Año' : 'Año'}</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dataMode === 'monthly' && month 
                ? `${month}/${year}` 
                : year.toString()
              }
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-8 px-6 whitespace-nowrap">
              {['salary', 'ingresos', 'deducciones', 'stundenreduzierung', 'bearbeitungslog', 'stammdaten', 'gehaltserhoehung'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'salary' ? 'Salario' : tab === 'ingresos' ? 'Bonificaciones' : tab === 'deducciones' ? 'Deducciones' : tab === 'stundenreduzierung' ? 'Reducción de Horas' : tab === 'bearbeitungslog' ? 'Historial de Procesamiento' : tab === 'gehaltserhoehung' ? 'Aumento de Salario' : 'Datos Maestros'}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'salary' && salary && (
              <form onSubmit={handleSaveSalary} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
                    <select
                      value={salary.modalidad}
                      onChange={(e) => setSalary({...salary, modalidad: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="12">12</option>
                      <option value="14">14</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Antigüedad (Años)</label>
                    <input
                      id="antiguedad"
                      type="number"
                      value={salary.antiguedad}
                      onChange={(e) => setSalary({...salary, antiguedad: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salario Anual (Bruto)</label>
                    <input
                      id="salario-anual-bruto"
                      type="number"
                      step="0.01"
                      value={salary.salario_anual_bruto}
                      onChange={(e) => setSalary({...salary, salario_anual_bruto: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Atrasos (%)</label>
                    <input
                      id="atrasos"
                      type="number"
                      step="0.01"
                      value={salary.atrasos || 0}
                      onChange={(e) => setSalary({...salary, atrasos: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      readOnly
                    />
                  </div>
                </div>
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar
                </Button>
              </form>
            )}
            {activeTab === 'ingresos' && ingresos && (
              <form onSubmit={handleSaveIngresos} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(ingresos).filter(([key]) => !['id_empleado', 'anio', 'mes', 'fecha_creacion', 'fecha_modificacion', ...(dataMode === 'yearly' ? ['beca_escolar'] : [])].includes(key)).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input
                        id={`ingresos-${key}`}
                        type="number"
                        step="0.01"
                        value={value || 0}
                        onChange={(e) => setIngresos({...ingresos, [key]: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  ))}
                </div>
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar
                </Button>
              </form>
            )}
            {activeTab === 'deducciones' && deducciones && (
              <form onSubmit={handleSaveDeducciones} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(deducciones).filter(([key]) => !['id_empleado', 'anio', 'mes', 'fecha_creacion', 'fecha_modificacion'].includes(key)).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input
                        id={`deducciones-${key}`}
                        type="number"
                        step="0.01"
                        value={value || 0}
                        onChange={(e) => setDeducciones({...deducciones, [key]: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  ))}
                </div>
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar
                </Button>
              </form>
            )}
            {activeTab === 'stundenreduzierung' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reducción de Horas</h3>
                  <p className="text-sm text-gray-600">
                    Registre cambios como "Reducción por %" a partir de un mes. En la exportación, solo el salario base (SALARIO MES) se reducirá correspondientemente.
                  </p>
                </div>
                <form onSubmit={handleSaveFte} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Válido desde Año</label>
                      <input
                        type="number"
                        min="2000"
                        max="2100"
                        value={fteYear}
                        onChange={(e) => setFteYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Válido desde Mes</label>
                      <select
                        value={fteMonth}
                        onChange={(e) => setFteMonth(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <option key={idx + 1} value={idx + 1}>{idx + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reducción por (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={fteReduction}
                        onChange={(e) => setFteReduction(e.target.value)}
                        placeholder="ej. 20"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Válido actualmente (para {fteMonth}/{fteYear}):{' '}
                    <span className="font-medium text-gray-900">
                      {getEffectiveFtePercent(fteItems, fteYear, fteMonth, { anio: fteYear, mes: fteMonth }).toFixed(2)}%
                    </span>
                    {' '}→ Nuevo:{' '}
                    <span className="font-medium text-gray-900">
                      {Math.max(0, Math.min(100, getEffectiveFtePercent(fteItems, fteYear, fteMonth, { anio: fteYear, mes: fteMonth }) - (parseFloat(fteReduction) || 0))).toFixed(2)}%
                    </span>
                  </div>
                  <Button type="submit" disabled={fteLoading} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {fteLoading ? 'Guardando...' : 'Guardar'}
                  </Button>
                </form>
                <div className="overflow-x-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desde</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grado de Empleo (%)</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Cambio</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fteItems.length === 0 ? (
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-600" colSpan={4}>No hay entradas disponibles.</td>
                        </tr>
                      ) : (
                        [...fteItems]
                          .sort((a, b) => (b.anio - a.anio) || (b.mes - a.mes))
                          .map((it) => (
                            <tr key={`${it.anio}-${it.mes}`}>
                              <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{it.mes}/{it.anio}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                                {(() => {
                                  const pct = typeof (it as any).porcentaje === 'string'
                                    ? parseFloat((it as any).porcentaje)
                                    : Number((it as any).porcentaje)
                                  const safePct = Number.isFinite(pct) ? pct : 100
                                  return `${safePct.toFixed(2)}%`
                                })()}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                                {it.fecha_modificacion ? new Date(String(it.fecha_modificacion)).toLocaleString('de-DE') : '-'}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={fteLoading}
                                  onClick={() => handleDeleteFte(it.anio, it.mes)}
                                >
                                  Eliminar
                                </Button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'bearbeitungslog' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Historial de Procesamiento</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fetchBearbeitungslog()}
                    disabled={bearbeitungslogLoading}
                  >
                    Actualizar
                  </Button>
                </div>
                {bearbeitungslogLoading ? (
                  <div className="text-gray-600">Cargando historial de procesamiento...</div>
                ) : bearbeitungslogItems.length === 0 ? (
                  <div className="text-gray-600">No hay entradas disponibles.</div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Momento</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objeto</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bearbeitungslogItems.map((item: any) => (
                          <tr key={item.id_log}>
                            <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                              {item.fecha ? new Date(item.fecha).toLocaleString('de-DE') : '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              <div className="font-medium">{item.nombre_completo || '-'}</div>
                              <div className="text-xs text-gray-500">{item.usuario_login || '-'}</div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{item.aktion || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{item.objekt || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              <LogDetails details={item.details} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'stammdaten' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Datos Maestros del Empleado</h3>
                  <Button 
                    onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {showEmployeeForm ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>
                {!showEmployeeForm ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        {employee.nombre || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        {employee.apellido || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CECO</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        {employee.ceco || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        {(employee as any).categoria || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        {employee.activo ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveEmployee} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          name="nombre"
                          value={employeeFormData.nombre}
                          onChange={(e) => setEmployeeFormData({...employeeFormData, nombre: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Declaración</label>
                        <select
                          name="declaracion"
                          value={(employeeFormData as any).declaracion ?? ''}
                          onChange={(e) => setEmployeeFormData({ ...(employeeFormData as any), declaracion: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-</option>
                          <option value="111">111</option>
                          <option value="216">216</option>
                          <option value="EXTERNO">EXTERNO</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select
                          name="categoria"
                          value={(employeeFormData as any).categoria ?? ''}
                          onChange={(e) => setEmployeeFormData({ ...(employeeFormData as any), categoria: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-</option>
                          <option value="Técnico">Técnico</option>
                          <option value="Oficina">Oficina</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                        <input
                          type="text"
                          name="apellido"
                          value={employeeFormData.apellido}
                          onChange={(e) => setEmployeeFormData({...employeeFormData, apellido: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DNI (solo EXTERNO)</label>
                        <input
                          type="text"
                          name="dni"
                          value={(employeeFormData as any).dni ?? ''}
                          onChange={(e) => setEmployeeFormData({ ...(employeeFormData as any), dni: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CECO (opcional)</label>
                        <input
                          type="text"
                          name="ceco"
                          value={employeeFormData.ceco}
                          onChange={(e) => setEmployeeFormData({...employeeFormData, ceco: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Contratación</label>
                        <input
                          type="date"
                          name="fecha_alta"
                          value={(employeeFormData as any).fecha_alta || ''}
                          onChange={(e) => setEmployeeFormData({ ...(employeeFormData as any), fecha_alta: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="flex items-center space-x-2 mt-7">
                          <input
                            type="checkbox"
                            name="activo"
                            checked={employeeFormData.activo}
                            onChange={(e) => setEmployeeFormData({...employeeFormData, activo: e.target.checked})}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Activo</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowEmployeeForm(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Guardar
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
            {activeTab === 'gehaltserhoehung' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Aumento de Salario para {employee.nombre} {employee.apellido}</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Aplica un aumento de salario (porcentual o absoluto) para este empleado.
                    El aumento se hará efectivo en abril del año objetivo con pago retroactivo de enero a marzo.
                  </p>
                </div>
                <form onSubmit={handleSalaryIncrease} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Año Objetivo</label>
                      <input
                        type="number"
                        min="2020"
                        max="2030"
                        value={increaseYear}
                        onChange={(e) => setIncreaseYear(e.target.value)}
                        placeholder="ej. 2026"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Aumento</label>
                      <select
                        value={increaseType}
                        onChange={(e) => setIncreaseType(e.target.value as 'percentage' | 'absolute')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="percentage">Porcentual (%)</option>
                        <option value="absolute">Absoluto (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {increaseType === 'percentage' ? 'Porcentaje (%)' : 'Monto Absoluto (€)'}
                      </label>
                      <input
                        type="number"
                        min={increaseType === 'percentage' ? '0.1' : '0'}
                        max={increaseType === 'percentage' ? '100' : '999999'}
                        step={increaseType === 'percentage' ? '0.1' : '1'}
                        value={increaseType === 'percentage' ? increasePercentage : increaseAbsolute}
                        onChange={(e) => increaseType === 'percentage' ? setIncreasePercentage(e.target.value) : setIncreaseAbsolute(e.target.value)}
                        placeholder={increaseType === 'percentage' ? 'ej. 10.0' : 'ej. 5000'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={increaseLoading}
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    {increaseLoading ? 'Procesando...' : `Aplicar Aumento de Salario para Empleado`}
                  </Button>
                </form>
                {increaseResult && (
                  <div className={`mt-6 p-4 rounded-md ${
                    increaseResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <h4 className={`font-medium mb-2 ${
                      increaseResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {increaseResult.success ? '✅ Éxito' : '❌ Error'}
                    </h4>
                    <p className={`text-sm mb-2 ${
                      increaseResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {increaseResult.message}
                    </p>
                    
                    {increaseResult.success && increaseResult.employees && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          Aumento de salario aplicado exitosamente:
                        </p>
                        <div className="max-h-40 overflow-y-auto">
                          {increaseResult.employees.map((emp: any, index: number) => (
                            <div key={index} className="text-xs text-green-700 py-1">
                              {emp.name}: {emp.old_salary}€ → {emp.new_salary}€ 
                              ({emp.increase_percent ? `+${emp.increase_percent}%` : `+${emp.increase_absolute}€`}, 
                              atrasos: {emp.atrasos.toFixed(2)}€, 
                              Basis: {emp.base_year})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {increaseResult.errors && increaseResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-red-800 mb-2">Errores:</p>
                        <div className="max-h-40 overflow-y-auto">
                          {increaseResult.errors.map((error: string, index: number) => (
                            <div key={index} className="text-xs text-red-700 py-1">{error}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'



import { useState, useEffect } from 'react'

import { Employee } from '@/types/employee'

import { Button } from '@/components/ui/button'

import { X, Save } from 'lucide-react'



interface EmployeeFormProps {

  employee?: Employee | null

  isOpen: boolean

  onClose: () => void

  onSave: (employee: Partial<Employee>) => void

}

const formatDateForInput = (date: any): string => {
  if (!date) return ''
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    // Format as YYYY-MM-DD
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

export default function EmployeeForm({ employee, isOpen, onClose, onSave }: EmployeeFormProps) {

  const [formData, setFormData] = useState({

    nombre: employee?.nombre || '',

    apellido: employee?.apellido || '',

    ceco: employee?.ceco || '',
    categoria: (employee as any)?.categoria || '',
    declaracion: (employee as any)?.declaracion || '',
    dni: (employee as any)?.dni || '',
    fecha_alta: formatDateForInput(employee?.fecha_alta),
    activo: employee?.activo ?? true
  })

  useEffect(() => {
    setFormData({
      nombre: employee?.nombre || '',
      apellido: employee?.apellido || '',
      ceco: employee?.ceco || '',
      categoria: (employee as any)?.categoria || '',
      declaracion: (employee as any)?.declaracion || '',
      dni: (employee as any)?.dni || '',
      fecha_alta: formatDateForInput(employee?.fecha_alta),
      activo: employee?.activo ?? true
    })
  }, [employee])

  // ...

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault()

    onSave(formData)

    onClose()

  }



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

    const { name, value, type } = e.target

    setFormData(prev => ({

      ...prev,

      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    }))

  }



  if (!isOpen) return null



  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">

        <div className="flex items-center justify-between mb-4">

          <h2 className="text-xl font-bold text-gray-900">

            {employee ? 'Editar Empleado' : 'Nuevo Empleado'}

          </h2>

          <Button variant="ghost" size="sm" onClick={onClose}>

            <X className="w-4 h-4" />

          </Button>

        </div>



        <form onSubmit={handleSubmit} className="space-y-4">

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">

              Nombre

            </label>

            <input

              type="text"

              name="nombre"

              value={formData.nombre}

              onChange={handleChange}

              required

              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

            />

          </div>



          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">

              Declaración

            </label>

            <select

              name="declaracion"

              value={(formData as any).declaracion}

              onChange={handleChange}

              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

            >

              <option value="">-</option>

              <option value="111">111</option>

              <option value="216">216</option>

              <option value="EXTERNO">EXTERNO</option>

            </select>

          </div>



          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">

              DNI (solo EXTERNO)

            </label>

            <input

              type="text"

              name="dni"

              value={(formData as any).dni}

              onChange={handleChange}

              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

            />

          </div>



          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">

              Categoría

            </label>

            <select

              name="categoria"

              value={(formData as any).categoria}

              onChange={handleChange}

              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

            >

              <option value="">-</option>

              <option value="Técnico">Técnico</option>

              <option value="Oficina">Oficina</option>

            </select>

          </div>



          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">

              Apellido

            </label>

            <input

              type="text"

              name="apellido"

              value={formData.apellido}

              onChange={handleChange}

              required

              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

            />

          </div>



          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">

              CECO (opcional)

            </label>

            <input

              type="text"

              name="ceco"

              value={formData.ceco}

              onChange={handleChange}

              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

            />

          </div>



          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">

              Fecha de Contratación

            </label>

            <input

              type="date"

              name="fecha_alta"

              value={formData.fecha_alta}

              onChange={handleChange}

              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

            />

          </div>



          <div>

            <label className="flex items-center space-x-2">

              <input

                type="checkbox"

                name="activo"

                checked={formData.activo}

                onChange={handleChange}

                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"

              />

              <span className="text-sm font-medium text-gray-700">Activo</span>

            </label>

          </div>



          <div className="flex justify-end space-x-2 pt-4">

            <Button type="button" variant="outline" onClick={onClose}>

              Cancelar

            </Button>

            <Button type="submit" className="flex items-center gap-2">

              <Save className="w-4 h-4" />

              Guardar

            </Button>

          </div>

        </form>

      </div>

    </div>

  )

}

'use client'



import React, { useState, useEffect } from 'react'

import { Employee } from '@/types/employee'

import { Button } from '@/components/ui/button'

import { Search, Plus, Edit, Trash2, Eye, TrendingUp, CheckCircle, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react'

import EmployeeForm from './EmployeeForm'

import EmployeeDetail from './EmployeeDetail'

import SalaryCopyManager from './SalaryCopyManager'

import GlobalBearbeitungshistorie from './GlobalBearbeitungshistorie'

import ImportHorasDietas from './ImportHorasDietas'

import CarryOverManager from './CarryOverManager'

import apiClient from '@/lib/api'



interface EmployeeTableProps {

  onEmployeeChange?: () => void

}



export default function EmployeeTable({ onEmployeeChange }: EmployeeTableProps) {

  const [employees, setEmployees] = useState<Employee[]>([])

  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)

  const [showDetail, setShowDetail] = useState(false)

  const [activeTab, setActiveTab] = useState<'employees' | 'increase' | 'salary-copy' | 'overview' | 'settings' | 'bulk-ingresos-deducciones' | 'bearbeitungshistorie' | 'import' | 'carry-over'>('employees')

  

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Employee | null;
    direction: 'asc' | 'desc' | null;
  }>({ key: null, direction: null })

  

  // State for salary increase

  const [increaseYear, setIncreaseYear] = useState<string>('')

  const [increasePercentage, setIncreasePercentage] = useState<string>('')

  const [increaseLoading, setIncreaseLoading] = useState(false)

  const [increaseResult, setIncreaseResult] = useState<any>(null)

  const [excludedEmployees, setExcludedEmployees] = useState<Set<number>>(new Set())

  const [selectAll, setSelectAll] = useState(true)

  const [searchTermIncrease, setSearchTermIncrease] = useState('')

  const [increaseType, setIncreaseType] = useState<'percentage' | 'absolute'>('percentage')

  const [absoluteAmount, setAbsoluteAmount] = useState<string>('')



  // State for salary overview

  const [overviewYear, setOverviewYear] = useState<string>(new Date().getFullYear().toString())

  const [overviewData, setOverviewData] = useState<any[]>([])

  const [overviewLoading, setOverviewLoading] = useState(false)

  // Sorting state for overview
  const [overviewSortConfig, setOverviewSortConfig] = useState<{
    key: 'name' | 'salary' | null;
    direction: 'asc' | 'desc' | null;
  }>({ key: null, direction: null })







  // Global payout month setting

  const [payoutMonth, setPayoutMonth] = useState<number>(4)

  const [payoutMonthLoading, setPayoutMonthLoading] = useState(false)

  

  // Atrasos recalculation state

  const [recalcYear, setRecalcYear] = useState<string>(new Date().getFullYear().toString())

  const [recalcLoading, setRecalcLoading] = useState(false)

  const [recalcResult, setRecalcResult] = useState<any>(null)







  // Bulk ingresos/deducciones state

  const [bulkYear, setBulkYear] = useState<string>(new Date().getFullYear().toString())

  const [bulkCategoria, setBulkCategoria] = useState<'all' | 'Técnico' | 'Oficina'>('all')

  const [bulkLoading, setBulkLoading] = useState(false)

  const [bulkResult, setBulkResult] = useState<any>(null)

  const [bulkIngresos, setBulkIngresos] = useState<any>({

    ticket_restaurant: 0,

    primas: 0,

    dietas_cotizables: 0,

    horas_extras: 0,

    dias_exentos: 0,

    dietas_exentas: 0,

    seguro_pensiones: 0,

    lavado_coche: 0,

    formacion: 0,

    tickets: 0

  })

  const [bulkDeducciones, setBulkDeducciones] = useState<any>({

    seguro_accidentes: 0,

    adelas: 0,

    sanitas: 0,

    gasolina: 0,

    ret_especie: 0,

    seguro_medico: 0,

    cotizacion_especie: 0

  })







  const [bulkIngresosEnabled, setBulkIngresosEnabled] = useState<Record<string, boolean>>({

    ticket_restaurant: false,

    primas: false,

    dietas_cotizables: false,

    horas_extras: false,

    dias_exentos: false,

    dietas_exentas: false,

    seguro_pensiones: false,

    lavado_coche: false,

    formacion: false,

    tickets: false,

  })







  const [bulkDeduccionesEnabled, setBulkDeduccionesEnabled] = useState<Record<string, boolean>>({

    seguro_accidentes: false,

    adelas: false,

    sanitas: false,

    gasolina: false,

    ret_especie: false,

    seguro_medico: false,

    cotizacion_especie: false,

  })



  useEffect(() => {

    fetchEmployees()

    fetchPayoutMonth()

  }, [])







  const fetchPayoutMonth = async () => {

    setPayoutMonthLoading(true)

    try {

      const res = await apiClient.getPayoutMonth()

      if (typeof res?.payout_month === 'number') {

        setPayoutMonth(res.payout_month)

      }

    } catch (e) {

      console.error('Error fetching payout month:', e)

    } finally {

      setPayoutMonthLoading(false)

    }

  }







  const handleApplyBulkIngresosDeducciones = async (e: React.FormEvent) => {

    e.preventDefault()







    const enabledIngresosKeys = Object.entries(bulkIngresosEnabled)

      .filter(([, enabled]) => enabled)

      .map(([key]) => key)



    const enabledDeduccionesKeys = Object.entries(bulkDeduccionesEnabled)

      .filter(([, enabled]) => enabled)

      .map(([key]) => key)



    if (enabledIngresosKeys.length === 0 && enabledDeduccionesKeys.length === 0) {

      alert('Por favor, seleccione al menos un campo (casilla) que desee guardar.')

      return

    }



    const scopeLabel = bulkCategoria === 'all' ? 'todos los empleados activos' : `todos los empleados activos ${bulkCategoria}`

    if (!confirm(`¿Realmente desea establecer bonificaciones/deducciones para el año ${bulkYear} para ${scopeLabel}? Esto sobrescribirá los valores existentes para todos los meses del año.`)) {

      return

    }



    setBulkLoading(true)

    setBulkResult(null)



    try {

      const year = parseInt(bulkYear)







      const ingresosPayload = enabledIngresosKeys.length > 0

        ? Object.fromEntries(enabledIngresosKeys.map((k) => [k, bulkIngresos[k]]))

        : undefined



      const deduccionesPayload = enabledDeduccionesKeys.length > 0

        ? Object.fromEntries(enabledDeduccionesKeys.map((k) => [k, bulkDeducciones[k]]))

        : undefined



      const result = await apiClient.applyIngresosDeduccionesToAllActive(year, {

        ...(ingresosPayload ? { ingresos: ingresosPayload } : {}),

        ...(deduccionesPayload ? { deducciones: deduccionesPayload } : {}),

        ...(bulkCategoria !== 'all' ? { categoria: bulkCategoria } : {}),

      })



      setBulkResult(result)

      if (result?.success) {

        fetchEmployees()

      }

    } catch (error: any) {

      console.error('Error applying bulk ingresos/deducciones:', error)

      setBulkResult({

        success: false,

        message: error?.message || 'Error de red',

        updated_count: 0,

        total_count: 0,

        errors: [error?.message || 'Error de red']

      })

    } finally {

      setBulkLoading(false)

    }

  }







  const handleSavePayoutMonth = async () => {

    setPayoutMonthLoading(true)

    try {

      await apiClient.setPayoutMonth(payoutMonth)

      onEmployeeChange?.()

    } catch (e) {

      console.error('Error saving payout month:', e)

      alert('No se pudo guardar el mes de pago')

    } finally {

      setPayoutMonthLoading(false)

    }

  }



  const handleRecalculateAtrasos = async () => {

    if (!confirm(`¿Realmente desea recalcular todos los atrasos para el año ${recalcYear}? Esto actualizará los valores para todos los empleados.`)) {

      return

    }



    setRecalcLoading(true)

    setRecalcResult(null)



    try {

      const response = await fetch('https://salary-management.azurewebsites.net/settings/recalculate-atrasos', {

        method: 'POST',

        headers: {

          'Authorization': `Bearer ${localStorage.getItem('token')}`,

          'Content-Type': 'application/json'

        },

        body: JSON.stringify({ year: parseInt(recalcYear) })

      })

      

      const result = await response.json()

      setRecalcResult(result)

      

      if (result.success) {

        // Actualizar los datos de los empleados después del recálculo exitoso

        fetchEmployees()

      }

    } catch (error) {

      console.error('Error recalculating atrasos:', error)

      setRecalcResult({

        success: false,

        message: 'Error al recalcular los atrasos',

        updated_count: 0,

        total_count: 0,

        errors: ['Error de red']

      })

    } finally {

      setRecalcLoading(false)

    }

  }



  useEffect(() => {

    if (activeTab === 'overview' && overviewYear) {

      fetchSalaryOverview(overviewYear)

    }

  }, [activeTab, overviewYear])



  const fetchEmployees = async () => {

    try {

      const response = await fetch(`https://salary-management.azurewebsites.net/employees?_t=${Date.now()}`, {

        headers: {

          'Authorization': `Bearer ${localStorage.getItem('token')}`,

          'Content-Type': 'application/json'

        }

      })

      const data = await response.json()

      setEmployees(data)

      onEmployeeChange?.()

    } catch (error) {

      console.error('Error fetching employees:', error)

    } finally {

      setLoading(false)

    }

  }



  const fetchSalaryOverview = async (year: string) => {

    setOverviewLoading(true)

    try {

      const token = localStorage.getItem('token')

      

      // Hole alle Mitarbeiter mit ihren Gehaltsdaten in einem einzigen Aufruf

      const response = await fetch(`https://salary-management.azurewebsites.net/employees/with-salaries?_t=${Date.now()}`, {

        headers: {

          'Authorization': `Bearer ${token}`,

          'Content-Type': 'application/json'

        }

      })

      

      const employeesData = await response.json()

      

      // Verarbeite die Daten lokal ohne zusätzliche API-Aufrufe

      const overviewData = employeesData.map((employee: any) => {

        const salary = employee.salaries?.find((s: any) => s.anio === parseInt(year))

        

        return {

          id: employee.id_empleado,

          name: `${employee.nombre} ${employee.apellido}`,

          ceco: employee.ceco || '-',

          salary: salary?.salario_anual_bruto || 0,

          has_salary: !!salary

        }

      })

      

      setOverviewData(overviewData)

    } catch (error) {

      console.error('Error fetching salary overview:', error)

      setOverviewData([])

    } finally {

      setOverviewLoading(false)

    }

  }



  const handleAddEmployee = () => {

    setSelectedEmployee(null)

    setIsFormOpen(true)

  }



  const handleEditEmployee = (employee: Employee) => {

    setSelectedEmployee(employee)

    setIsFormOpen(true)

  }



  const handleViewEmployee = (employee: Employee) => {

    setSelectedEmployee(employee)

    setShowDetail(true)

  }



  const handleSaveEmployee = async (employeeData: Partial<Employee>) => {

    try {

      if (selectedEmployee) {

        // Update existing employee

        await fetch(`https://salary-management.azurewebsites.net/employees/${selectedEmployee.id_empleado}`, {

          method: 'PUT',

          headers: { 

            'Content-Type': 'application/json',

            'Authorization': `Bearer ${localStorage.getItem('token')}`

          },

          body: JSON.stringify(employeeData)

        })

      } else {

        // Add new employee

        await fetch('https://salary-management.azurewebsites.net/employees', {

          method: 'POST',

          headers: { 

            'Content-Type': 'application/json',

            'Authorization': `Bearer ${localStorage.getItem('token')}`

          },

          body: JSON.stringify(employeeData)

        })

      }

      fetchEmployees()

    } catch (error) {

      console.error('Error saving employee:', error)

    }

  }



  const handleDeleteEmployee = async (id: number) => {

    if (!confirm('¿Realmente desea eliminar este empleado?')) return

    

    try {

      const token = localStorage.getItem('token')

      const response = await fetch(`https://salary-management.azurewebsites.net/employees/${id}`, {

        method: 'DELETE',

        headers: {

          'Authorization': `Bearer ${token}`,

          'Content-Type': 'application/json'

        }

      })



      if (response.ok) {

        fetchEmployees()

      } else {

        console.error('Error al eliminar el empleado')

      }

    } catch (error) {

      console.error('Error deleting employee:', error)

    }

  }



  const handleGlobalSalaryIncrease = async (e: React.FormEvent) => {

    e.preventDefault()

    

    if (!increaseYear || (increaseType === 'percentage' && !increasePercentage) || (increaseType === 'absolute' && !absoluteAmount)) {

      alert('Por favor, ingrese año y porcentaje o monto')

      return

    }

    

    setIncreaseLoading(true)

    setIncreaseResult(null)

    

    try {

      const token = localStorage.getItem('token')

      if (!token) {

        console.error('No se encontró token')

        return

      }



      const headers = { 

        'Content-Type': 'application/json',

        'Authorization': `Bearer ${token}`

      }

      

      const requestData: any = {

        target_year: parseInt(increaseYear),

        excluded_employee_ids: Array.from(excludedEmployees)

      }

      

      if (increaseType === 'percentage') {

        requestData.percentage_increase = parseFloat(increasePercentage)

      } else {

        requestData.absolute_increase = parseFloat(absoluteAmount)

      }

      

      console.log('Sending global salary increase request:', requestData)

      

      const response = await fetch('https://salary-management.azurewebsites.net/salaries/percentage-increase', {

        method: 'POST',

        headers,

        body: JSON.stringify(requestData)

      })

      

      const result = await response.json()

      

      if (response.ok) {

        console.log('Aumento global de salario exitoso:', result)

        setIncreaseResult(result)

        // Actualizar datos de empleados para mostrar salarios actualizados

        fetchEmployees()

      } else {

        console.error('Error en aumento global de salario:', result)

        setIncreaseResult(result)

      }

    } catch (error) {

      console.error('Error applying global salary increase:', error)

      setIncreaseResult({ success: false, message: 'Error de red' })

    } finally {

      setIncreaseLoading(false)

    }

  }



  const handleEmployeeCheckboxChange = (employeeId: number, checked: boolean) => {

    const newExcluded = new Set(excludedEmployees)

    if (checked) {

      newExcluded.delete(employeeId)

    } else {

      newExcluded.add(employeeId)

    }

    setExcludedEmployees(newExcluded)

    setSelectAll(newExcluded.size === 0)

  }



  const handleSelectAllChange = (checked: boolean) => {

    setSelectAll(checked)

    if (checked) {

      setExcludedEmployees(new Set())

    } else {

      setExcludedEmployees(new Set(filteredEmployeesForIncrease.map(emp => emp.id_empleado)))

    }

  }

  const filteredEmployees = Array.isArray(employees) ? employees.filter(employee =>

    employee.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||

    employee.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||

    employee.ceco?.toLowerCase().includes(searchTerm.toLowerCase()) ||

    employee.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||

    employee.id_empleado.toString().includes(searchTerm)

  ) : []

  const filteredEmployeesForIncrease = Array.isArray(employees) ? employees.filter(employee =>

    employee.nombre.toLowerCase().includes(searchTermIncrease.toLowerCase()) ||

    employee.apellido.toLowerCase().includes(searchTermIncrease.toLowerCase()) ||

    employee.ceco?.toLowerCase().includes(searchTermIncrease.toLowerCase()) ||

    employee.id_empleado.toString().includes(searchTermIncrease)

  ) : []

  // Sorting handler for overview
  const handleOverviewSort = (key: 'name' | 'salary') => {
    let direction: 'asc' | 'desc' | null = 'asc'
    
    if (overviewSortConfig.key === key) {
      if (overviewSortConfig.direction === 'asc') {
        direction = 'desc'
      } else if (overviewSortConfig.direction === 'desc') {
        direction = null
      } else {
        direction = 'asc'
      }
    }
    
    setOverviewSortConfig({ key, direction })
  }

  // Apply sorting to overview data
  const sortedOverviewData = React.useMemo(() => {
    if (!overviewSortConfig.key || !overviewSortConfig.direction) {
      return overviewData
    }

    return [...overviewData].sort((a, b) => {
      let aValue: any
      let bValue: any

      if (overviewSortConfig.key === 'name') {
        aValue = a.name
        bValue = b.name
      } else if (overviewSortConfig.key === 'salary') {
        // Convert salary to number for proper numeric sorting
        aValue = parseFloat(a.salary) || 0
        bValue = parseFloat(b.salary) || 0
      }

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return overviewSortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return overviewSortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue
      }

      return 0
    })
  }, [overviewData, overviewSortConfig])

  // Sorting handler for employees
  const handleSort = (key: keyof Employee) => {
    let direction: 'asc' | 'desc' | null = 'asc'
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc'
      } else if (sortConfig.direction === 'desc') {
        direction = null
      } else {
        direction = 'asc'
      }
    }
    
    setSortConfig({ key, direction })
  }

  // Apply sorting to filtered employees
  const sortedFilteredEmployees = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return filteredEmployees
    }

    const key = sortConfig.key as keyof Employee

    return [...filteredEmployees].sort((a, b) => {
      let aValue: any
      let bValue: any

      if (key === 'nombre') {
        aValue = `${a.apellido} ${a.nombre}`
        bValue = `${b.apellido} ${b.nombre}`
      } else if (key === 'activo') {
        aValue = a.activo ? 1 : 0
        bValue = b.activo ? 1 : 0
      } else {
        aValue = a[key]
        bValue = b[key]
      }

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue
      }

      return 0
    })
  }, [filteredEmployees, sortConfig])



  if (showDetail && selectedEmployee) {

    return (

      <EmployeeDetail

        employee={selectedEmployee}

        onBack={() => setShowDetail(false)}

      />

    )

  }



  if (loading) {

    return (

      <div className="flex items-center justify-center h-64">

        <div className="text-lg text-gray-600">Cargando empleados...</div>

      </div>

    )

  }



  return (

    <>

      <div className="bg-white rounded-lg shadow-lg p-6">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-2xl font-bold text-gray-800">Gestión de Empleados</h2>

        </div>



        {/* Tabs */}

        <div className="border-b border-gray-200 mb-6">

          <nav className="flex space-x-8">

            {['employees', 'increase', 'salary-copy', 'overview', 'settings', 'bulk-ingresos-deducciones', 'bearbeitungshistorie', 'import', 'carry-over'].map((tab) => (

              <button

                key={tab}

                onClick={() => setActiveTab(tab as any)}

                className={`py-2 px-1 border-b-2 font-medium text-sm ${

                  activeTab === tab

                    ? 'border-blue-500 text-blue-600'

                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

                }`}

              >

                {tab === 'employees' ? 'Empleados' : tab === 'increase' ? 'Aumento' : tab === 'salary-copy' ? 'Copia de Salario' : tab === 'overview' ? 'Resumen de Salario' : tab === 'settings' ? 'Configuración' : tab === 'bulk-ingresos-deducciones' ? 'Bonificaciones/Deducciones (Año)' : tab === 'bearbeitungshistorie' ? 'Historial de Procesamiento' : tab === 'import' ? 'Importar' : 'Carry Over'}

              </button>

            ))}

          </nav>

        </div>



        {/* Tab Content */}

        {activeTab === 'employees' && (

          <div>

            <div className="flex items-center justify-between mb-6">

              <h3 className="text-lg font-medium text-gray-900">Lista de Empleados</h3>

              <Button className="flex items-center gap-2" onClick={handleAddEmployee}>

                <Plus className="w-4 h-4" />

                Nuevo Empleado

              </Button>

            </div>



            <div className="flex items-center gap-2 mb-6">

              <Search className="w-5 h-5 text-gray-400" />

              <input

                id="employee-search"

                type="text"

                placeholder="Buscar empleado..."

                value={searchTerm}

                onChange={(e) => setSearchTerm(e.target.value)}

                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

              />

            </div>



            <div className="overflow-x-auto">

              <table className="w-full border-collapse">

                <thead>

                  <tr className="bg-gray-50 border-b border-gray-200">

                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('id_empleado')}
                    >
                      <div className="flex items-center gap-1">
                        ID
                        {sortConfig.key === 'id_empleado' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> :
                          sortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : null
                        )}
                      </div>
                    </th>

                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('nombre')}
                    >
                      <div className="flex items-center gap-1">
                        Nombre
                        {sortConfig.key === 'nombre' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> :
                          sortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : null
                        )}
                      </div>
                    </th>

                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('ceco')}
                    >
                      <div className="flex items-center gap-1">
                        CECO
                        {sortConfig.key === 'ceco' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> :
                          sortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : null
                        )}
                      </div>
                    </th>

                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('activo')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortConfig.key === 'activo' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> :
                          sortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : null
                        )}
                      </div>
                    </th>

                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('categoria')}
                    >
                      <div className="flex items-center gap-1">
                        Categoría
                        {sortConfig.key === 'categoria' && (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> :
                          sortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : null
                        )}
                      </div>
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>

                  </tr>

                </thead>

                <tbody className="bg-white divide-y divide-gray-200">

                  {sortedFilteredEmployees.map((employee) => (

                    <tr key={employee.id_empleado} className="hover:bg-gray-50 transition-colors">

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">

                        {employee.id_empleado}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                        {employee.apellido}, {employee.nombre}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                        {employee.ceco || '-'}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">

                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>

                          {employee.activo ? 'Activo' : 'Inactivo'}

                        </span>

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                        {employee.categoria || '-'}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">

                        <div className="flex items-center gap-2">

                          <Button 

                            variant="outline" 

                            size="sm" 

                            className="flex items-center gap-1"

                            onClick={() => handleViewEmployee(employee)}

                          >

                            <Eye className="w-4 h-4" />

                            Detalles

                          </Button>

                          <Button 

                            variant="outline" 

                            size="sm" 

                            className="flex items-center gap-1"

                            onClick={() => handleEditEmployee(employee)}

                          >

                            <Edit className="w-4 h-4" />

                            Editar

                          </Button>

                          <Button 

                            variant="destructive" 

                            size="sm" 

                            className="flex items-center gap-1"

                            onClick={() => handleDeleteEmployee(employee.id_empleado)}

                          >

                            <Trash2 className="w-4 h-4" />

                            Eliminar

                          </Button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>



            {sortedFilteredEmployees.length === 0 && (

              <div className="text-center py-8 text-gray-500">

                {searchTerm ? 'No se encontraron empleados' : 'No hay empleados disponibles'}

              </div>

            )}

          </div>

        )}







        {activeTab === 'bulk-ingresos-deducciones' && (

          <div className="space-y-6">

            <div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">Bonificaciones & Deducciones (Valores Anuales)</h3>

              <p className="text-sm text-gray-600">

                Establece los valores para todos los empleados activos (opcionalmente filtrado por categoría) para todos los meses del año seleccionado.

              </p>

            </div>



            <form onSubmit={handleApplyBulkIngresosDeducciones} className="space-y-6">

              <div className="flex items-center gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>

                  <select

                    value={bulkYear}

                    onChange={(e) => setBulkYear(e.target.value)}

                    className="px-3 py-2 border border-gray-300 rounded-md"

                    disabled={bulkLoading}

                  >

                    {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 4 + i).map(year => (

                      <option key={year} value={year}>{year}</option>

                    ))}

                  </select>

                </div>



                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Válido para</label>

                  <select

                    value={bulkCategoria}

                    onChange={(e) => setBulkCategoria(e.target.value as any)}

                    className="px-3 py-2 border border-gray-300 rounded-md"

                    disabled={bulkLoading}

                  >

                    <option value="all">Todos</option>

                    <option value="Técnico">Técnicos</option>

                    <option value="Oficina">Oficina</option>

                  </select>

                </div>

              </div>



              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="border border-gray-200 rounded-lg p-4">

                  <h4 className="text-md font-medium text-gray-900 mb-4">Bonificaciones</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {Object.entries(bulkIngresos).map(([key, value]) => (

                      <div key={key}>

                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">

                          <input

                            type="checkbox"

                            className="mr-2"

                            checked={!!bulkIngresosEnabled[key]}

                            onChange={(e) => setBulkIngresosEnabled({ ...bulkIngresosEnabled, [key]: e.target.checked })}

                            disabled={bulkLoading}

                          />

                          {key.replace(/_/g, ' ')}

                        </label>

                        <input

                          type="number"

                          step="0.01"

                          value={value as any}

                          onChange={(e) => {
                            const parsed = parseFloat(e.target.value)
                            setBulkIngresos({ ...bulkIngresos, [key]: isNaN(parsed) ? 0 : parsed })
                          }}

                          className="w-full px-3 py-2 border border-gray-300 rounded-md"

                          disabled={bulkLoading}

                        />

                      </div>

                    ))}

                  </div>

                </div>



                <div className="border border-gray-200 rounded-lg p-4">

                  <h4 className="text-md font-medium text-gray-900 mb-4">Deducciones</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {Object.entries(bulkDeducciones).map(([key, value]) => (

                      <div key={key}>

                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">

                          <input

                            type="checkbox"

                            className="mr-2"

                            checked={!!bulkDeduccionesEnabled[key]}

                            onChange={(e) => setBulkDeduccionesEnabled({ ...bulkDeduccionesEnabled, [key]: e.target.checked })}

                            disabled={bulkLoading}

                          />

                          {key.replace(/_/g, ' ')}

                        </label>

                        <input

                          type="number"

                          step="0.01"

                          value={value as any}

                          onChange={(e) => {
                            const parsed = parseFloat(e.target.value)
                            setBulkDeducciones({ ...bulkDeducciones, [key]: isNaN(parsed) ? 0 : parsed })
                          }}

                          className="w-full px-3 py-2 border border-gray-300 rounded-md"

                          disabled={bulkLoading}

                        />

                      </div>

                    ))}

                  </div>

                </div>

              </div>



              <Button type="submit" disabled={bulkLoading} className="flex items-center gap-2">

                <TrendingUp className="w-4 h-4" />

                {bulkLoading ? 'Procesando...' : 'Guardar para todos los empleados activos'}

              </Button>

            </form>



            {bulkResult && (

              <div className={`border rounded-lg p-4 ${

                bulkResult.success

                  ? 'border-green-200 bg-green-50'

                  : 'border-red-200 bg-red-50'

              }`}>

                <div className="flex items-center gap-2 mb-2">

                  {bulkResult.success ? (

                    <CheckCircle className="w-5 h-5 text-green-600" />

                  ) : (

                    <AlertCircle className="w-5 h-5 text-red-600" />

                  )}

                  <span className={`font-medium ${

                    bulkResult.success ? 'text-green-800' : 'text-red-800'

                  }`}>

                    {bulkResult.message}

                  </span>

                </div>



                {typeof bulkResult.updated_count === 'number' && typeof bulkResult.total_count === 'number' && (

                  <div className="text-sm text-gray-700">

                    Actualizado exitosamente: {bulkResult.updated_count} de {bulkResult.total_count} empleados

                  </div>

                )}



                {bulkResult.errors && bulkResult.errors.length > 0 && (

                  <div className="mt-2">

                    <p className="text-sm font-medium text-red-700">Fehler:</p>

                    <ul className="text-sm text-red-600 list-disc list-inside">

                      {bulkResult.errors.slice(0, 3).map((error: string, index: number) => (

                        <li key={index}>{error}</li>

                      ))}

                      {bulkResult.errors.length > 3 && (

                        <li>... y {bulkResult.errors.length - 3} errores más</li>

                      )}

                    </ul>

                  </div>

                )}

              </div>

            )}

          </div>

        )}







        {activeTab === 'settings' && (

          <div className="space-y-6">

            <div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración</h3>

              <p className="text-sm text-gray-600">

                Configuraciones globales que rara vez se modifican.

              </p>

            </div>



            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">

              <div>

                <div className="text-sm font-medium text-gray-900">Mes de Pago (global)</div>

                <div className="text-xs text-gray-600">

                  Controla hasta qué mes se aplica el salario anual anterior y en qué mes se pagan los atrasos.

                </div>

              </div>

              <div className="flex items-center gap-2">

                <select

                  value={payoutMonth}

                  onChange={(e) => setPayoutMonth(parseInt(e.target.value))}

                  className="px-3 py-2 border border-gray-300 rounded-md"

                  disabled={payoutMonthLoading}

                >

                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (

                    <option key={m} value={m}>{m}</option>

                  ))}

                </select>

                <Button onClick={handleSavePayoutMonth} disabled={payoutMonthLoading}>

                  Guardar

                </Button>

              </div>

            </div>



            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-blue-50">

              <div>

                <div className="text-sm font-medium text-gray-900">Recálculo de Atrasos</div>

                <div className="text-xs text-gray-600">

                  Recalcula todos los atrasos para el año seleccionado basado en el mes de pago actual.

                </div>

              </div>

              <div className="flex items-center gap-2">

                <select

                  value={recalcYear}

                  onChange={(e) => setRecalcYear(e.target.value)}

                  className="px-3 py-2 border border-gray-300 rounded-md"

                  disabled={recalcLoading}

                >

                  {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 4 + i).map(year => (

                    <option key={year} value={year}>{year}</option>

                  ))}

                </select>

                <Button 

                  onClick={handleRecalculateAtrasos} 

                  disabled={recalcLoading}

                  variant="outline"

                  className="flex items-center gap-2"

                >

                  {recalcLoading ? (

                    <>

                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />

                      Calculando...

                    </>

                  ) : (

                    <>

                      <TrendingUp className="w-4 h-4" />

                      Recalcular

                    </>

                  )}

                </Button>

              </div>

            </div>



            {/* Resultado del Recálculo de Atrasos */}

            {recalcResult && (

              <div className={`border rounded-lg p-4 ${

                recalcResult.success 

                  ? 'border-green-200 bg-green-50' 

                  : 'border-red-200 bg-red-50'

              }`}>

                <div className="flex items-center gap-2 mb-2">

                  {recalcResult.success ? (

                    <CheckCircle className="w-5 h-5 text-green-600" />

                  ) : (

                    <AlertCircle className="w-5 h-5 text-red-600" />

                  )}

                  <span className={`font-medium ${

                    recalcResult.success ? 'text-green-800' : 'text-red-800'

                  }`}>

                    {recalcResult.message}

                  </span>

                </div>

                

                {recalcResult.success && (

                  <div className="text-sm text-gray-700">

                    <p>Actualizado exitosamente: {recalcResult.updated_count} de {recalcResult.total_count} empleados</p>

                  </div>

                )}

                

                {recalcResult.errors && recalcResult.errors.length > 0 && (

                  <div className="mt-2">

                    <p className="text-sm font-medium text-red-700">Errores:</p>

                    <ul className="text-sm text-red-600 list-disc list-inside">

                      {recalcResult.errors.slice(0, 3).map((error: string, index: number) => (

                        <li key={index}>{error}</li>

                      ))}

                      {recalcResult.errors.length > 3 && (

                        <li>... y {recalcResult.errors.length - 3} errores más</li>

                      )}

                    </ul>

                  </div>

                )}

              </div>

            )}

          </div>

        )}



        {activeTab === 'increase' && (

          <div className="space-y-6">

            <div>

              <h3 className="text-lg font-medium text-gray-900 mb-4">Aumento de Salario para Empleados Seleccionados</h3>

              <p className="text-sm text-gray-600 mb-6">

                Aplica un aumento de salario a los empleados activos seleccionados.

                El aumento se hará efectivo en abril del año objetivo con pago retroactivo de enero a marzo.

              </p>

            </div>



            <form onSubmit={handleGlobalSalaryIncrease} className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Año Objetivo</label>

                  <input

                    type="number"

                    min="2020"

                    max="2030"

                    value={increaseYear}

                    onChange={(e) => setIncreaseYear(e.target.value)}

                    placeholder="ej. 2026"

                    className="w-full px-3 py-2 border border-gray-300 rounded-md"

                    required

                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Aumento</label>

                  <select

                    value={increaseType}

                    onChange={(e) => setIncreaseType(e.target.value as 'percentage' | 'absolute')}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md"

                  >

                    <option value="percentage">Porcentual (%)</option>

                    <option value="absolute">Monto Absoluto (€)</option>

                  </select>

                </div>

              </div>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">

                    {increaseType === 'percentage' ? 'Porcentaje (%)' : 'Monto Absoluto (€)'}

                  </label>

                  <input

                    type="number"

                    min={increaseType === 'percentage' ? '0.1' : '0'}

                    max={increaseType === 'percentage' ? '100' : '999999'}

                    step={increaseType === 'percentage' ? '0.1' : '1'}

                    value={increaseType === 'percentage' ? increasePercentage : absoluteAmount}

                    onChange={(e) => increaseType === 'percentage' ? setIncreasePercentage(e.target.value) : setAbsoluteAmount(e.target.value)}

                    placeholder={increaseType === 'percentage' ? 'ej. 10.0' : 'ej. 5000'}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md"

                    required

                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar (Empleado)</label>

                  <input

                    type="text"

                    value={searchTermIncrease}

                    onChange={(e) => setSearchTermIncrease(e.target.value)}

                    placeholder="Buscar empleado..."

                    className="w-full px-3 py-2 border border-gray-300 rounded-md"

                  />

                </div>

              </div>



              {/* Selección de Empleados */}

              <div>

                <div className="flex items-center justify-between mb-4">

                  <h4 className="text-md font-medium text-gray-900">

                    Empleados para aumento de salario ({filteredEmployeesForIncrease.filter(emp => !excludedEmployees.has(emp.id_empleado)).length} de {filteredEmployeesForIncrease.length} seleccionados)

                  </h4>

                  <label className="flex items-center gap-2 text-sm text-gray-600">

                    <input

                      type="checkbox"

                      checked={selectAll}

                      onChange={(e) => handleSelectAllChange(e.target.checked)}

                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"

                    />

                    Seleccionar todo/deseleccionar todo

                  </label>

                </div>

                

                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">

                  <div className="grid grid-cols-1 gap-2 p-4">

                    {filteredEmployeesForIncrease.map((employee) => (

                      <label key={employee.id_empleado} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">

                        <input

                          type="checkbox"

                          checked={!excludedEmployees.has(employee.id_empleado)}

                          onChange={(e) => handleEmployeeCheckboxChange(employee.id_empleado, e.target.checked)}

                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"

                        />

                        <div className="flex-1">

                          <span className="text-sm font-medium text-gray-900">

                            {employee.apellido}, {employee.nombre}

                          </span>

                          <span className="text-sm text-gray-500 ml-2">

                            (ID: {employee.id_empleado})

                          </span>

                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${

                            employee.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'

                          }`}>

                            {employee.activo ? 'Activo' : 'Inactivo'}

                          </span>

                        </div>

                      </label>

                    ))}

                  </div>

                </div>

              </div>



              <Button 

                type="submit" 

                disabled={increaseLoading || filteredEmployeesForIncrease.filter(emp => !excludedEmployees.has(emp.id_empleado)).length === 0}

                className="flex items-center gap-2"

              >

                <TrendingUp className="w-4 h-4" />

                {increaseLoading ? 'Procesando...' : `Aplicar aumento de salario a ${filteredEmployeesForIncrease.filter(emp => !excludedEmployees.has(emp.id_empleado)).length} empleados`}

              </Button>

            </form>



            {increaseResult && (

              <div className={`mt-6 p-4 rounded-md ${

                increaseResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'

              }`}>

                <h4 className={`font-medium mb-2 ${

                  increaseResult.success ? 'text-green-800' : 'text-red-800'

                }`}>

                  {increaseResult.success ? '✅ Éxito' : '❌ Error'}

                </h4>

                <p className={`text-sm mb-2 ${

                  increaseResult.success ? 'text-green-700' : 'text-red-700'

                }`}>

                  {increaseResult.message}

                </p>

                

                {increaseResult.success && increaseResult.employees && (

                  <div className="mt-3">

                    <p className="text-sm font-medium text-green-800 mb-2">

                      {increaseResult.updated_count} empleados actualizados:

                    </p>

                    <div className="max-h-40 overflow-y-auto">

                      {increaseResult.employees.map((emp: any, index: number) => (

                        <div key={index} className="text-xs text-green-700 py-1">

                          {emp.name}: {emp.old_salary}€ → {emp.new_salary}€ 

                          ({emp.increase_info}, atrasos: {emp.atrasos.toFixed(2)}€)

                        </div>

                      ))}

                    </div>

                  </div>

                )}

                

                {increaseResult.errors && increaseResult.errors.length > 0 && (

                  <div className="mt-3">

                    <p className="text-sm font-medium text-red-800 mb-2">Errores:</p>

                    <div className="max-h-40 overflow-y-auto">

                      {increaseResult.errors.map((error: string, index: number) => (

                        <div key={index} className="text-xs text-red-700 py-1">{error}</div>

                      ))}

                    </div>

                  </div>

                )}

              </div>

            )}

          </div>

        )}



        {activeTab === 'salary-copy' && (

          <div>

            <SalaryCopyManager />

          </div>

        )}



        {activeTab === 'overview' && (

          <div className="space-y-6">

            <div>

              <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Salario</h3>

              <p className="text-sm text-gray-600 mb-6">

                Muestra todos los empleados con sus salarios anuales para el año seleccionado.

              </p>

            </div>



            <div className="flex items-center gap-4 mb-6">

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>

                <select

                  value={overviewYear}

                  onChange={(e) => setOverviewYear(e.target.value)}

                  className="px-3 py-2 border border-gray-300 rounded-md"

                >

                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (

                    <option key={year} value={year}>{year}</option>

                  ))}

                </select>

              </div>

            </div>



            {overviewLoading ? (

              <div className="flex items-center justify-center h-32">

                <div className="text-lg text-gray-600">Cargando datos salariales...</div>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-gray-200">

                  <thead className="bg-gray-50">

                    <tr>

                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleOverviewSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Empleado
                          {overviewSortConfig.key === 'name' && (
                            overviewSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> :
                            overviewSortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : null
                          )}
                        </div>
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        CECO

                      </th>

                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleOverviewSort('salary')}
                      >
                        <div className="flex items-center gap-1">
                          Salario Anual
                          {overviewSortConfig.key === 'salary' && (
                            overviewSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> :
                            overviewSortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : null
                          )}
                        </div>
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Status

                      </th>

                    </tr>

                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">

                    {sortedOverviewData.map((employee) => (

                      <tr key={employee.id}>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">

                          {employee.name}

                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">

                          {employee.ceco}

                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                          {employee.salary.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €

                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">

                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${

                            employee.has_salary 

                              ? 'bg-green-100 text-green-800' 

                              : 'bg-red-100 text-red-800'

                          }`}>

                            {employee.has_salary ? 'Salario disponible' : 'Sin salario'}

                          </span>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

                

                {sortedOverviewData.length === 0 && (

                  <div className="text-center py-8 text-gray-500">

                    No se encontraron empleados

                  </div>

                )}

              </div>

            )}

          </div>

        )}



        {activeTab === 'bearbeitungshistorie' && (

          <div className="space-y-6">

            <div>

              <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Procesamiento</h3>

              <p className="text-sm text-gray-600 mb-6">

                Muestra todos los procesos de edición ordenados cronológicamente.

              </p>

            </div>



            <GlobalBearbeitungshistorie employees={employees} />

          </div>

        )}



        {activeTab === 'import' && (

          <div className="space-y-6">

            <ImportHorasDietas />

          </div>

        )}



        {activeTab === 'carry-over' && (

          <div className="space-y-6">

            <CarryOverManager employees={employees} />

          </div>

        )}

      </div>



      <EmployeeForm

        employee={selectedEmployee}

        isOpen={isFormOpen}

        onClose={() => setIsFormOpen(false)}

        onSave={handleSaveEmployee}

      />



      {showDetail && selectedEmployee && (

        <EmployeeDetail

          employee={selectedEmployee}

          onBack={() => setShowDetail(false)}

        />

      )}

    </>

  )

}

'use client'

import { useState, useEffect } from 'react'
import { Employee } from '@/types/employee'
import { Button } from '@/components/ui/button'
import { Search, Calendar, User, FileText, Filter } from 'lucide-react'

interface GlobalBearbeitungshistorieProps {
  employees: Employee[]
}

interface HistoryItem {
  id_log: number
  fecha: string
  usuario_login: string
  nombre_completo?: string
  id_empleado: number | null
  empleado_nombre?: string
  empleado_apellido?: string
  anio: number | null
  mes: number | null
  aktion: string
  objekt: string
  details: any
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
      item.aktion?.toLowerCase().includes(searchLower) ||
      item.objekt?.toLowerCase().includes(searchLower) ||
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
                  <div key={key} className="mb-2 p-2 bg-white rounded border border-gray-200">
                    <div className="font-medium text-gray-800 mb-1">{key}:</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-red-600">Antes:</span>
                        <span className="text-red-700 bg-red-50 px-2 py-1 rounded font-mono text-xs">
                          {typeof oldValue === 'object' ? JSON.stringify(oldValue, null, 2) : String(oldValue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">Después:</span>
                        <span className="text-green-700 bg-green-50 px-2 py-1 rounded font-mono text-xs">
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
                  <span className="font-medium text-gray-700">{key}:</span>{' '}
                  <span className="text-gray-600">
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
        <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
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
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en historial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="flex flex-wrap items-center gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos los años</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos los meses</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md min-w-48"
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
          <div className="text-lg text-gray-600">Cargando historial de procesamiento...</div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || filterYear || filterMonth || filterEmployee ? 'No se encontraron entradas' : 'No hay historial de procesamiento disponible'}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 mb-2">
            {filteredHistory.length} Entrada{filteredHistory.length !== 1 ? 's' : ''}
          </div>
          
          {filteredHistory.map((item) => (
            <div key={item.id_log} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {item.nombre_completo || item.usuario_login}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(item.fecha)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-700">
                        {getObjectText(item.objekt)}
                      </span>
                    </div>
                    
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item.aktion === 'create' ? 'bg-green-100 text-green-800' :
                      item.aktion === 'update' ? 'bg-blue-100 text-blue-800' :
                      item.aktion === 'delete' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getActionText(item.aktion)}
                    </span>
                    
                    {item.id_empleado && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
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
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {item.anio && <span>{item.anio}</span>}
                        {item.mes && <span>/{item.mes.toString().padStart(2, '0')}</span>}
                      </div>
                    )}
                  </div>
                  
                  {item.details && renderDetails(item.details)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type ImportResult = {
  success?: boolean
  message?: string
  year?: number
  month?: number
  processed_count?: number
  inserted_count?: number
  updated_count?: number
  skipped_count?: number
  error_count?: number
  errors?: string[]
}

export default function ImportHorasDietas() {
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [file, setFile] = useState<File | null>(null)
  const [gasolinaFile, setGasolinaFile] = useState<File | null>(null)
  const [cotizacionEspecieFile, setCotizacionEspecieFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmGasolinaOpen, setConfirmGasolinaOpen] = useState(false)
  const [confirmCotizacionEspecieOpen, setConfirmCotizacionEspecieOpen] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [gasolinaResult, setGasolinaResult] = useState<ImportResult | null>(null)
  const [cotizacionEspecieResult, setCotizacionEspecieResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gasolinaError, setGasolinaError] = useState<string | null>(null)
  const [cotizacionEspecieError, setCotizacionEspecieError] = useState<string | null>(null)

  const years = useMemo(() => {
    const start = now.getFullYear() - 4
    return Array.from({ length: 15 }, (_, i) => start + i)
  }, [now])

  const onSelectFile = (f: File | null) => {
    setResult(null)
    setError(null)
    setFile(f)
  }

  const onSelectGasolinaFile = (f: File | null) => {
    setGasolinaResult(null)
    setGasolinaError(null)
    setGasolinaFile(f)
  }

  const onSelectCotizacionEspecieFile = (f: File | null) => {
    setCotizacionEspecieResult(null)
    setCotizacionEspecieError(null)
    setCotizacionEspecieFile(f)
  }

  const openConfirm = () => {
    setResult(null)
    setError(null)

    if (!file) {
      setError('Por favor, seleccione un archivo Excel.')
      return
    }

    setConfirmOpen(true)
  }

  const openGasolinaConfirm = () => {
    setGasolinaResult(null)
    setGasolinaError(null)

    if (!gasolinaFile) {
      setGasolinaError('Por favor, seleccione un archivo Excel.')
      return
    }

    setConfirmGasolinaOpen(true)
  }

  const openCotizacionEspecieConfirm = () => {
    setCotizacionEspecieResult(null)
    setCotizacionEspecieError(null)

    if (!cotizacionEspecieFile) {
      setCotizacionEspecieError('Por favor, seleccione un archivo Excel.')
      return
    }

    setConfirmCotizacionEspecieOpen(true)
  }

  const doUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = localStorage.getItem('token')
      const form = new FormData()
      form.append('year', String(year))
      form.append('month', String(month))
      form.append('file', file)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://salary-management.azurewebsites.net'}/imports/horas-dietas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `HTTP ${res.status}`)
      }

      setResult(data)
    } catch (e: any) {
      setError(e?.message || 'La carga falló')
    } finally {
      setLoading(false)
    }
  }

  const doCotizacionEspecieUpload = async () => {
    if (!cotizacionEspecieFile) return

    setLoading(true)
    setCotizacionEspecieError(null)
    setCotizacionEspecieResult(null)

    try {
      const token = localStorage.getItem('token')
      const form = new FormData()
      form.append('year', String(year))
      form.append('month', String(month))
      form.append('file', cotizacionEspecieFile)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://salary-management.azurewebsites.net'}/imports/cotizacion-especie`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `HTTP ${res.status}`)
      }

      setCotizacionEspecieResult(data)
    } catch (e: any) {
      setCotizacionEspecieError(e?.message || 'La carga falló')
    } finally {
      setLoading(false)
    }
  }

  const doGasolinaUpload = async () => {
    if (!gasolinaFile) return

    setLoading(true)
    setGasolinaError(null)
    setGasolinaResult(null)

    try {
      const token = localStorage.getItem('token')
      const form = new FormData()
      form.append('year', String(year))
      form.append('month', String(month))
      form.append('file', gasolinaFile)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://salary-management.azurewebsites.net'}/imports/gasolina`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `HTTP ${res.status}`)
      }

      setGasolinaResult(data)
    } catch (e: any) {
      setGasolinaError(e?.message || 'La carga falló')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Horas + Dietas</h3>
        <p className="text-sm text-gray-600">
          Importa valores de un archivo Excel a bonificaciones y deducciones para el mes seleccionado.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <AlertTitle>{result.success ? 'Importación Exitosa' : 'Importación Completada con Errores'}</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              {result.message && <div>{result.message}</div>}
              <div>
                procesado: {result.processed_count ?? 0}, nuevo: {result.inserted_count ?? 0}, actualizado:{' '}
                {result.updated_count ?? 0}, omitido: {result.skipped_count ?? 0}, errores: {result.error_count ?? 0}
              </div>
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto text-xs bg-gray-50 border border-gray-200 rounded p-2">
                  {result.errors.slice(0, 50).map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            disabled={loading}
          />
          {file && <div className="text-xs text-gray-600 mt-1">{file.name}</div>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={openConfirm} disabled={loading}>
          Iniciar Importación
        </Button>
      </div>

      <div className="border-t border-gray-200 pt-6" />

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Gasolina</h3>
        <p className="text-sm text-gray-600">
          Importa valores de un archivo Excel a deducciones (Gasolina) para el mes seleccionado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => onSelectGasolinaFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            disabled={loading}
          />
          {gasolinaFile && <div className="text-xs text-gray-600 mt-1">{gasolinaFile.name}</div>}
        </div>
      </div>

      {gasolinaResult && (
        <Alert>
          <AlertTitle>{gasolinaResult.success ? 'Importación Gasolina Exitosa' : 'Importación Gasolina Completada con Errores'}</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              {gasolinaResult.message && <div>{gasolinaResult.message}</div>}
              <div>
                procesado: {gasolinaResult.processed_count ?? 0}, nuevo: {gasolinaResult.inserted_count ?? 0}, actualizado:{' '}
                {gasolinaResult.updated_count ?? 0}, omitido: {gasolinaResult.skipped_count ?? 0}, errores: {gasolinaResult.error_count ?? 0}
              </div>
              {Array.isArray(gasolinaResult.errors) && gasolinaResult.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto text-xs bg-gray-50 border border-gray-200 rounded p-2">
                  {gasolinaResult.errors.slice(0, 50).map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {gasolinaError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{gasolinaError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={openGasolinaConfirm} disabled={loading}>
          Iniciar Importación Gasolina
        </Button>
      </div>

      <div className="border-t border-gray-200 pt-6" />

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cotización Especie</h3>
        <p className="text-sm text-gray-600">
          Importa valores de un archivo Excel a deducciones (Cotización Especie) para el mes seleccionado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => onSelectCotizacionEspecieFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            disabled={loading}
          />
          {cotizacionEspecieFile && <div className="text-xs text-gray-600 mt-1">{cotizacionEspecieFile.name}</div>}
        </div>
      </div>

      {cotizacionEspecieResult && (
        <Alert>
          <AlertTitle>
            {cotizacionEspecieResult.success ? 'Importación Cotización Especie Exitosa' : 'Importación Cotización Especie Completada con Errores'}
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              {cotizacionEspecieResult.message && <div>{cotizacionEspecieResult.message}</div>}
              <div>
                procesado: {cotizacionEspecieResult.processed_count ?? 0}, nuevo: {cotizacionEspecieResult.inserted_count ?? 0}, actualizado:{' '}
                {cotizacionEspecieResult.updated_count ?? 0}, omitido: {cotizacionEspecieResult.skipped_count ?? 0}, errores:{' '}
                {cotizacionEspecieResult.error_count ?? 0}
              </div>
              {Array.isArray(cotizacionEspecieResult.errors) && cotizacionEspecieResult.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto text-xs bg-gray-50 border border-gray-200 rounded p-2">
                  {cotizacionEspecieResult.errors.slice(0, 50).map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {cotizacionEspecieError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{cotizacionEspecieError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={openCotizacionEspecieConfirm} disabled={loading}>
          Confirmar Importación Cotización Especie
        </Button>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => (loading ? null : setConfirmOpen(false))} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Importación</h4>
            <p className="text-sm text-gray-700 mb-4">
              ¿Desea importar el archivo <span className="font-medium">{file?.name}</span> para{' '}
              <span className="font-medium">
                {month}.{year}
              </span>{' '}
              ?
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  setConfirmOpen(false)
                  await doUpload()
                }}
                disabled={loading}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmGasolinaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => (loading ? null : setConfirmGasolinaOpen(false))} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Importación Gasolina</h4>
            <p className="text-sm text-gray-700 mb-4">
              ¿Desea importar el archivo <span className="font-medium">{gasolinaFile?.name}</span> para{' '}
              <span className="font-medium">
                {month}.{year}
              </span>{' '}
              ?
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmGasolinaOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  setConfirmGasolinaOpen(false)
                  await doGasolinaUpload()
                }}
                disabled={loading}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmCotizacionEspecieOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => (loading ? null : setConfirmCotizacionEspecieOpen(false))}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Importación Cotización Especie</h4>
            <p className="text-sm text-gray-700 mb-4">
              ¿Desea importar el archivo <span className="font-medium">{cotizacionEspecieFile?.name}</span> para{' '}
              <span className="font-medium">
                {month}.{year}
              </span>{' '}
              ?
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmCotizacionEspecieOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  setConfirmCotizacionEspecieOpen(false)
                  await doCotizacionEspecieUpload()
                }}
                disabled={loading}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import apiClient from '@/lib/api'

interface LoginProps {
  onLogin: (userData: any, token: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiClient.login(username, password)
      onLogin(response.user, response.access_token)
    } catch (err: any) {
      setError(err.message || 'Error de inicio de sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!username.trim()) {
      setError('Por favor, ingrese su nombre de usuario primero')
      return
    }

    setLoading(true)
    setError('')

    try {
      await apiClient.forgotPassword(username)
      setError('')
      alert('Si el usuario existe, se ha enviado un correo electrónico de restablecimiento')
    } catch (err: any) {
      setError(err.message || 'Error al enviar correo electrónico de restablecimiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">🏢 Nómina de Empleados</CardTitle>
          <CardDescription>
             Por favor, inicie sesión para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ¿Olvidó su contraseña?
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import apiClient from '@/lib/api'

export default function ResetPassword() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No se encontró token de restablecimiento')
        setValidatingToken(false)
        return
      }

      try {
        const response = await apiClient.validateResetToken(token)
        setTokenValid(true)
        setError('')
      } catch (err: any) {
        setError(err.message ||'Token inválido o expirado')
        setTokenValid(false)
      } finally {
        setValidatingToken(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      await apiClient.resetPassword(token, newPassword)
      setSuccess(true)
      setError('')
    } catch (err: any) {
      setError(err.message ||'Error al restablecer contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Validando token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Enlace Inválido</CardTitle>
            <CardDescription>
              Este enlace de restablecimiento de contraseña es inválido o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="text-center mt-4">
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Volver al Inicio de Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">✅ Contraseña Restablecida</CardTitle>
            <CardDescription>
              Su contraseña ha sido actualizada exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Ir al Inicio de Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">🔐 Establecer Nueva Contraseña</CardTitle>
          <CardDescription>
            Por favor, ingrese su nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Procesando...' : 'Actualizar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Copy, CheckCircle, Loader2 } from 'lucide-react'

interface MissingYear {
  year: number
  missing_count: number
  employees: Array<{
    id_empleado: number
    nombre: string
    apellido: string
  }>
  is_future_year?: boolean
}

interface CopyResult {
  success: boolean
  message: string
  copied_count: number
  skipped_count: number
  errors: string[]
}

export default function SalaryCopyManager() {
  const [missingYears, setMissingYears] = useState<MissingYear[]>([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)
  const [copyResult, setCopyResult] = useState<CopyResult | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear() + 1)
  const [availableYears, setAvailableYears] = useState<number[]>([])

  useEffect(() => {
    fetchMissingYears()
  }, [])

  const fetchMissingYears = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://salary-management.azurewebsites.net'}/salaries/missing-years`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      if (data.success) {
        setMissingYears(data.missing_years)
        // Extrahiere verfügbare Jahre für das Dropdown (nur Jahre mit Vorjahresdaten)
        const years = data.missing_years.map((y: MissingYear) => y.year)
        setAvailableYears(years)
        // Setze das erste verfügbare Jahr als Standard, falls das aktuelle nicht verfügbar ist
        if (years.length > 0 && !years.includes(newYear)) {
          setNewYear(years[0])
        }
      }
    } catch (error) {
      console.error('Error al obtener años faltantes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopySalaries = async (year: number) => {
    if (!confirm(`¿Realmente desea copiar todos los salarios de ${year - 1} a ${year}?`)) {
      return
    }

    setCopying(true)
    setSelectedYear(year)
    setCopyResult(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://salary-management.azurewebsites.net'}/salaries/copy-to-year/${year}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      setCopyResult(result)
      // Actualiza la lista de años faltantes
      if (result.success) {
        fetchMissingYears()
      }
    } catch (error) {
      console.error('Error al copiar salarios:', error)
      setCopyResult({
        success: false,
        message: 'Error al copiar salarios',
        copied_count: 0,
        skipped_count: 0,
        errors: ['Error de red']
      })
    } finally {
      setCopying(false)
      setSelectedYear(null)
    }
  }

  const handleCreateNewYear = async () => {
    if (!confirm(`¿Realmente desea crear todos los salarios para el año ${newYear}? Se copiarán todos los salarios de ${newYear - 1}.`)) {
      return
    }

    setCopying(true)
    setSelectedYear(newYear)
    setCopyResult(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://salary-management.azurewebsites.net'}/salaries/copy-to-year/${newYear}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      setCopyResult(result)
      // Actualiza la lista de años faltantes
      if (result.success) {
        fetchMissingYears()
        // Establece el próximo año como estándar
        setNewYear(newYear + 1)
      }
    } catch (error) {
      console.error('Error al copiar salarios:', error)
      setCopyResult({
        success: false,
        message: 'Error al copiar salarios',
        copied_count: 0,
        skipped_count: 0,
        errors: ['Error de red']
      })
    } finally {
      setCopying(false)
      setSelectedYear(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Cargando información salarial...</span>
        </div>
      </div>
    )
  }

  const currentYear = new Date().getFullYear()
  const relevantMissingYears = missingYears.filter(y => y.year >= currentYear - 1)

  if (relevantMissingYears.length === 0 && !copyResult) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Todos los salarios están actualizados</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Gestión Salarial</h3>
      
      {/* Crear Nuevo Año */}
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Copy className="w-5 h-5 text-blue-500" />
            <div>
              <span className="font-medium text-gray-800">Crear Nuevo Año</span>
              <p className="text-sm text-gray-600 mt-1">Copia todos los salarios del año anterior al año seleccionado.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={newYear} 
              onChange={(e) => setNewYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={copying || availableYears.length === 0}
            >
              {availableYears.length === 0 ? (
                <option value="">No hay años disponibles</option>
              ) : (
                availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))
              )}
            </select>
            <Button
              onClick={handleCreateNewYear}
              disabled={copying || availableYears.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {copying && selectedYear === newYear ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copying && selectedYear === newYear 
                ? 'Copiando...' 
                : availableYears.length === 0
                  ? 'No disponible'
                  : `Crear Año ${newYear}`
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Salarios Faltantes */}
      {relevantMissingYears.filter(y => y.missing_count > 0).length > 0 && (
        <div className="space-y-4 mb-6">
          <h4 className="text-md font-medium text-gray-700">Salarios Faltantes:</h4>
          {relevantMissingYears.filter(y => y.missing_count > 0).map((yearInfo) => (
            <div key={yearInfo.year} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <div>
                    <span className="font-medium text-gray-800">Año {yearInfo.year}</span>
                    <span className="text-gray-600 ml-2">
                      ({yearInfo.missing_count} empleados sin salario)
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => handleCopySalaries(yearInfo.year)}
                  disabled={copying}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {copying && selectedYear === yearInfo.year ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copying && selectedYear === yearInfo.year 
                    ? 'Copiando...' 
                    : `Copiar salarios de ${yearInfo.year - 1}`
                  }
                </Button>
              </div>
              
              {yearInfo.missing_count <= 5 && (
                <div className="mt-3 text-sm text-gray-600">
                  Empleados afectados: {yearInfo.employees.map(emp => 
                    `${emp.nombre} ${emp.apellido}`
                  ).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resultado de la copia */}
      {copyResult && (
        <div className={`border rounded-lg p-4 ${
          copyResult.success 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {copyResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${
              copyResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {copyResult.message}
            </span>
          </div>
          
          {copyResult.success && (
            <div className="text-sm text-gray-700">
              <p>Copiados con éxito: {copyResult.copied_count} empleados</p>
              {copyResult.skipped_count > 0 && (
                <p>Omitidos: {copyResult.skipped_count} empleados</p>
              )}
            </div>
          )}
          
          {copyResult.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-700">Errores:</p>
              <ul className="text-sm text-red-600 list-disc list-inside">
                {copyResult.errors.slice(0, 3).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {copyResult.errors.length > 3 && (
                  <li>... y {copyResult.errors.length - 3} errores más</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Estado si todo está bien */}
      {relevantMissingYears.filter(y => y.missing_count > 0).length === 0 && !copyResult && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Todos los salarios están actualizados</span>
        </div>
      )}
    </div>
  )
}
