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

  const [bulkKategorie, setBulkKategorie] = useState<'all' | 'Techniker' | 'Office'>('all')

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



    const scopeLabel = bulkKategorie === 'all' ? 'todos los empleados activos' : `todos los empleados activos ${bulkKategorie}`

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

        ...(bulkKategorie !== 'all' ? { kategorie: bulkKategorie } : {}),

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

      const response = await fetch('http://localhost:8000/settings/recalculate-atrasos', {

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

      const response = await fetch(`http://localhost:8000/employees?_t=${Date.now()}`, {

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

      const response = await fetch(`http://localhost:8000/employees/with-salaries?_t=${Date.now()}`, {

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

        await fetch(`http://localhost:8000/employees/${selectedEmployee.id_empleado}`, {

          method: 'PUT',

          headers: { 

            'Content-Type': 'application/json',

            'Authorization': `Bearer ${localStorage.getItem('token')}`

          },

          body: JSON.stringify(employeeData)

        })

      } else {

        // Add new employee

        await fetch('http://localhost:8000/employees', {

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

      const response = await fetch(`http://localhost:8000/employees/${id}`, {

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

      

      const response = await fetch('http://localhost:8000/salaries/percentage-increase', {

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

    employee.kategorie?.toLowerCase().includes(searchTerm.toLowerCase()) ||

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
                      onClick={() => handleSort('kategorie')}
                    >
                      <div className="flex items-center gap-1">
                        Categoría
                        {sortConfig.key === 'kategorie' && (
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

                        {employee.kategorie || '-'}

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

                    value={bulkKategorie}

                    onChange={(e) => setBulkKategorie(e.target.value as any)}

                    className="px-3 py-2 border border-gray-300 rounded-md"

                    disabled={bulkLoading}

                  >

                    <option value="all">Todos</option>

                    <option value="Techniker">Técnicos</option>

                    <option value="Office">Oficina</option>

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

