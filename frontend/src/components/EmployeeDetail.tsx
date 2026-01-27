'use client'

import { useState, useEffect } from 'react'
import { Employee, Salary, Ingresos, Deducciones } from '@/types/employee'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Download, Euro, TrendingUp, TrendingDown, Calendar } from 'lucide-react'

interface EmployeeDetailProps {
  employee: Employee
  onBack: () => void
}

export default function EmployeeDetail({ employee, onBack }: EmployeeDetailProps) {
  const [activeTab, setActiveTab] = useState<'salary' | 'ingresos' | 'deducciones'>('salary')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [customYear, setCustomYear] = useState<string>('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [loading, setLoading] = useState(false)

  // Salary state
  const [salary, setSalary] = useState<Salary | null>(null)
  const [ingresos, setIngresos] = useState<Ingresos | null>(null)
  const [deducciones, setDeducciones] = useState<Deducciones | null>(null)

  useEffect(() => {
    fetchData()
  }, [employee.id_empleado, year])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      
      console.log(`Fetching data for employee ${employee.id_empleado}, year ${year}`)
      
      // Fetch complete employee info
      const response = await fetch(`http://localhost:8000/employees/${employee.id_empleado}`, {
        headers
      })
      
      if (!response.ok) {
        console.error('API Response not OK:', response.status, response.statusText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Complete API Response:', data)
      console.log('Salaries:', data.salaries)
      console.log('Ingresos:', data.ingresos)
      console.log('Deducciones:', data.deducciones)
      
      // Extract salary, ingresos, and deducciones from the response
      const salaryData = data.salaries?.find((s: any) => s.anio === year)
      const ingresosData = data.ingresos?.find((i: any) => i.anio === year)
      const deduccionesData = data.deducciones?.find((d: any) => d.anio === year)
      
      console.log('Year data found:', { salaryData, ingresosData, deduccionesData })
      
      setSalary(salaryData || {
        modalidad: 12,
        antiguedad: 0,
        salario_anual_bruto: 0,
        salario_mensual_bruto: 0,
        atrasos: 0
      })
      setIngresos(ingresosData || {
        ticket_restaurant: 0,
        primas: 0,
        dietas_cotizables: 0,
        horas_extras: 0,
        dias_exentos: 0,
        dietas_exentas: 0,
        seguro_pensiones: 0,
        lavado_coche: 0
      })
      setDeducciones(deduccionesData || {
        seguro_accidentes: 0,
        adelas: 0,
        sanitas: 0,
        gasolina_arval: 0,
        cotizacion_especie: 0
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
      const checkResponse = await fetch(`http://localhost:8000/employees/${employee.id_empleado}`, {
        headers
      })
      const employeeData = await checkResponse.json()
      const existingSalary = employeeData.salaries?.find((s: any) => s.anio === year)
      
      const url = existingSalary 
        ? `http://localhost:8000/employees/${employee.id_empleado}/salaries/${year}`
        : `http://localhost:8000/employees/${employee.id_empleado}/salaries`
      
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
      
      await fetch(`http://localhost:8000/employees/${employee.id_empleado}/ingresos/${year}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...ingresos, anio: year })
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
      
      await fetch(`http://localhost:8000/employees/${employee.id_empleado}/deducciones/${year}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...deducciones, anio: year })
      })
      fetchData()
    } catch (error) {
      console.error('Error saving deducciones:', error)
    }
  }

  const calculateTotal = () => {
    const baseSalary = typeof salary?.salario_mensual_bruto === 'string' 
      ? parseFloat(salary.salario_mensual_bruto) || 0 
      : (salary?.salario_mensual_bruto || 0)
    const ingresosTotal = (typeof ingresos?.ticket_restaurant === 'string' ? parseFloat(ingresos.ticket_restaurant) || 0 : (ingresos?.ticket_restaurant || 0)) + 
                         (typeof ingresos?.primas === 'string' ? parseFloat(ingresos.primas) || 0 : (ingresos?.primas || 0)) + 
                         (typeof ingresos?.dietas_cotizables === 'string' ? parseFloat(ingresos.dietas_cotizables) || 0 : (ingresos?.dietas_cotizables || 0)) + 
                         (typeof ingresos?.horas_extras === 'string' ? parseFloat(ingresos.horas_extras) || 0 : (ingresos?.horas_extras || 0)) + 
                         (typeof ingresos?.dias_exentos === 'string' ? parseFloat(ingresos.dias_exentos) || 0 : (ingresos?.dias_exentos || 0)) + 
                         (typeof ingresos?.dietas_exentas === 'string' ? parseFloat(ingresos.dietas_exentas) || 0 : (ingresos?.dietas_exentas || 0)) + 
                         (typeof ingresos?.seguro_pensiones === 'string' ? parseFloat(ingresos.seguro_pensiones) || 0 : (ingresos?.seguro_pensiones || 0)) + 
                         (typeof ingresos?.lavado_coche === 'string' ? parseFloat(ingresos.lavado_coche) || 0 : (ingresos?.lavado_coche || 0))
    const deduccionesTotal = (typeof deducciones?.seguro_accidentes === 'string' ? parseFloat(deducciones.seguro_accidentes) || 0 : (deducciones?.seguro_accidentes || 0)) + 
                           (typeof deducciones?.adelas === 'string' ? parseFloat(deducciones.adelas) || 0 : (deducciones?.adelas || 0)) + 
                           (typeof deducciones?.sanitas === 'string' ? parseFloat(deducciones.sanitas) || 0 : (deducciones?.sanitas || 0)) + 
                           (typeof deducciones?.gasolina_arval === 'string' ? parseFloat(deducciones.gasolina_arval) || 0 : (deducciones?.gasolina_arval || 0)) + 
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
        <div className="text-lg text-gray-600">Lade Daten...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
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
              <option value="">Jahr wählen...</option>
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
                    {y}{isCurrentYear ? ' (aktuell)' : ''}
                  </option>
                )
              })}
              <option value="custom">Anderes Jahr...</option>
            </select>
            {showCustomInput && (
              <input
                type="number"
                placeholder="Jahr eingeben"
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
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Euro className="w-6 h-6" />
              <h3 className="font-semibold">Monatsgehalt</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              €{((typeof salary?.salario_mensual_bruto === 'string' ? parseFloat(salary.salario_mensual_bruto) : (salary?.salario_mensual_bruto || 0)) + ((totals.ingresosTotal || 0) / 12) - ((totals.deduccionesTotal || 0) / 12)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <TrendingUp className="w-6 h-6" />
              <h3 className="font-semibold">Jahresgehalt</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              €{(typeof salary?.salario_anual_bruto === 'string' ? parseFloat(salary.salario_anual_bruto) : (salary?.salario_anual_bruto || 0)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Calendar className="w-6 h-6" />
              <h3 className="font-semibold">Jahr</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {year}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['salary', 'ingresos', 'deducciones'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'salary' ? 'Gehalt' : tab === 'ingresos' ? 'Zulagen' : 'Abzüge'}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Antigüedad (Jahre)</label>
                    <input
                      id="antiguedad"
                      type="number"
                      value={salary.antiguedad}
                      onChange={(e) => setSalary({...salary, antiguedad: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jahresgehalt (Brutto)</label>
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
                    />
                  </div>
                </div>
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Speichern
                </Button>
              </form>
            )}

            {activeTab === 'ingresos' && ingresos && (
              <form onSubmit={handleSaveIngresos} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(ingresos).filter(([key]) => !['id_empleado', 'anio', 'fecha_creacion', 'fecha_modificacion'].includes(key)).map(([key, value]) => (
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
                  Speichern
                </Button>
              </form>
            )}

            {activeTab === 'deducciones' && deducciones && (
              <form onSubmit={handleSaveDeducciones} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(deducciones).filter(([key]) => !['id_empleado', 'anio', 'fecha_creacion', 'fecha_modificacion'].includes(key)).map(([key, value]) => (
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
                  Speichern
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
