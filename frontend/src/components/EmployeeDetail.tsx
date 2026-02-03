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

  const [activeTab, setActiveTab] = useState<'salary' | 'ingresos' | 'deducciones' | 'stammdaten' | 'gehaltserhoehung'>('salary')

  const [year, setYear] = useState<number>(new Date().getFullYear())

  const [month, setMonth] = useState<number | null>(null)

  const [dataMode, setDataMode] = useState<'yearly' | 'monthly'>('yearly')

  const [customYear, setCustomYear] = useState<string>('')

  const [showCustomInput, setShowCustomInput] = useState(false)

  const [loading, setLoading] = useState(false)

  // State for employee form (Stammdaten)
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [employeeFormData, setEmployeeFormData] = useState({
    nombre: employee.nombre || '',
    apellido: employee.apellido || '',
    ceco: employee.ceco || '',
    activo: employee.activo ?? true
  })

  // State for salary increase
  const [increaseYear, setIncreaseYear] = useState<string>('')
  const [increasePercentage, setIncreasePercentage] = useState<string>('')
  const [increaseLoading, setIncreaseLoading] = useState(false)
  const [increaseResult, setIncreaseResult] = useState<any>(null)



  // Salary state

  const [salary, setSalary] = useState<Salary | null>(null)

  const [ingresos, setIngresos] = useState<Ingresos | null>(null)

  const [deducciones, setDeducciones] = useState<Deducciones | null>(null)



  useEffect(() => {

    fetchData()

  }, [employee.id_empleado, year, month, dataMode])

  // Update employee form data when employee prop changes
  useEffect(() => {
    setEmployeeFormData({
      nombre: employee.nombre || '',
      apellido: employee.apellido || '',
      ceco: employee.ceco || '',
      activo: employee.activo ?? true
    })
  }, [employee])



  const fetchData = async () => {

    setLoading(true)

    try {

      const token = localStorage.getItem('token')

      const headers = {

        'Authorization': `Bearer ${token}`,

        'Content-Type': 'application/json'

      }

      

      console.log(`Fetching data for employee ${employee.id_empleado}, year ${year}, month ${month}, mode ${dataMode}`)

      

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

      console.log('Ingresos Mensuales:', data.ingresos_mensuales)

      console.log('Deducciones Mensuales:', data.deducciones_mensuales)

      

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

        lavado_coche: 0,

        formacion: 0,

        tickets: 0

      })

      setDeducciones(deduccionesData || {

        seguro_accidentes: 0,

        adelas: 0,

        sanitas: 0,

        gasolina_arval: 0,

        gasolina_ald: 0,

        ret_especie: 0,

        seguro_medico: 0,

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

      

      let url

      if (dataMode === 'monthly' && month) {

        url = `http://localhost:8000/employees/${employee.id_empleado}/ingresos/${year}/${month}`

      } else {

        url = `http://localhost:8000/employees/${employee.id_empleado}/ingresos/${year}`

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

        url = `http://localhost:8000/employees/${employee.id_empleado}/deducciones/${year}/${month}`

      } else {

        url = `http://localhost:8000/employees/${employee.id_empleado}/deducciones/${year}`

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
      console.log('To URL:', `http://localhost:8000/employees/${employee.id_empleado}`)
      
      const response = await fetch(`http://localhost:8000/employees/${employee.id_empleado}`, {
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
    
    if (!increaseYear || !increasePercentage) {
      alert('Bitte geben Sie Jahr und Prozentsatz ein')
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
      
      const requestData = {
        target_year: parseInt(increaseYear),
        percentage_increase: parseFloat(increasePercentage)
      }
      
      console.log('Sending salary increase request:', requestData)
      
      const response = await fetch('http://localhost:8000/salaries/percentage-increase', {
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

  const calculateMonthlySalary = (selectedMonth: number | null) => {
    // Wenn kein Monat ausgewählt, Jahresdurchschnitt verwenden
    if (!selectedMonth) {
      return typeof salary?.salario_mensual_bruto === 'string' 
        ? parseFloat(salary.salario_mensual_bruto) || 0 
        : (salary?.salario_mensual_bruto || 0)
    }
    
    // Für Monate Januar-März: Gehalt vom Vorjahr verwenden
    if (selectedMonth >= 1 && selectedMonth <= 3) {
      // Berechne altes Monatsgehalt (aktuelles Jahresgehalt - Erhöhung)
      const currentAnnualSalary = typeof salary?.salario_anual_bruto === 'string' 
        ? parseFloat(salary.salario_anual_bruto) || 0 
        : (salary?.salario_anual_bruto || 0)
      const atrasos = typeof salary?.atrasos === 'string' 
        ? parseFloat(salary.atrasos) || 0 
        : (salary?.atrasos || 0)
      const modalidad = salary?.modalidad || 12
      
      // Altes Jahresgehalt = aktuelles Jahresgehalt - (atrasos * modalidad / 3)
      const oldAnnualSalary = currentAnnualSalary - (atrasos * modalidad / 3)
      const oldMonthlySalary = oldAnnualSalary / modalidad
      
      return oldMonthlySalary
    }
    
    // Für Monate April-Dezember: neues Gehalt (inkl. atrasos)
    return typeof salary?.salario_mensual_con_atrasos === 'string' 
      ? parseFloat(salary.salario_mensual_con_atrasos) || 0 
      : (salary?.salario_mensual_con_atrasos || salary?.salario_mensual_bruto || 0)
  }

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

                         (typeof ingresos?.formacion === 'string' ? parseFloat(ingresos.formacion) || 0 : (ingresos?.formacion || 0)) +

                         (typeof ingresos?.tickets === 'string' ? parseFloat(ingresos.tickets) || 0 : (ingresos?.tickets || 0))

    const deduccionesTotal = (typeof deducciones?.seguro_accidentes === 'string' ? parseFloat(deducciones.seguro_accidentes) || 0 : (deducciones?.seguro_accidentes || 0)) + 

                           (typeof deducciones?.adelas === 'string' ? parseFloat(deducciones.adelas) || 0 : (deducciones?.adelas || 0)) + 

                           (typeof deducciones?.sanitas === 'string' ? parseFloat(deducciones.sanitas) || 0 : (deducciones?.sanitas || 0)) + 

                           (typeof deducciones?.gasolina_arval === 'string' ? parseFloat(deducciones.gasolina_arval) || 0 : (deducciones?.gasolina_arval || 0)) + 

                           (typeof deducciones?.gasolina_ald === 'string' ? parseFloat(deducciones.gasolina_ald) || 0 : (deducciones?.gasolina_ald || 0)) +

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

              value={dataMode} 

              onChange={(e) => {

                setDataMode(e.target.value as 'yearly' | 'monthly')

                if (e.target.value === 'yearly') {

                  setMonth(null)

                }

              }}

              className="px-3 py-2 border border-gray-300 rounded-md"

            >

              <option value="yearly">Jährlich</option>

              <option value="monthly">Monatlich</option>

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

            

            {dataMode === 'monthly' && (

              <select 

                value={month || ''} 

                onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : null)}

                className="px-3 py-2 border border-gray-300 rounded-md"

              >

                <option value="">Monat wählen...</option>

                {[

                  { value: 1, label: 'Januar' },

                  { value: 2, label: 'Februar' },

                  { value: 3, label: 'März' },

                  { value: 4, label: 'April' },

                  { value: 5, label: 'Mai' },

                  { value: 6, label: 'Juni' },

                  { value: 7, label: 'Juli' },

                  { value: 8, label: 'August' },

                  { value: 9, label: 'September' },

                  { value: 10, label: 'Oktober' },

                  { value: 11, label: 'November' },

                  { value: 12, label: 'Dezember' }

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

              <h3 className="font-semibold">Monatsgehalt</h3>

            </div>

            <div className="text-2xl font-bold text-gray-900">

              €{calculateMonthlySalary(month).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

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

              <h3 className="font-semibold">{dataMode === 'monthly' ? 'Monat/Jahr' : 'Jahr'}</h3>

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

          <div className="border-b border-gray-200">

            <nav className="flex space-x-8 px-6">

              {['salary', 'ingresos', 'deducciones', 'stammdaten', 'gehaltserhoehung'].map((tab) => (

                <button

                  key={tab}

                  onClick={() => setActiveTab(tab as any)}

                  className={`py-4 px-1 border-b-2 font-medium text-sm ${

                    activeTab === tab

                      ? 'border-blue-500 text-blue-600'

                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

                  }`}

                >

                  {tab === 'salary' ? 'Gehalt' : tab === 'ingresos' ? 'Zulagen' : tab === 'deducciones' ? 'Abzüge' : tab === 'gehaltserhoehung' ? 'Gehaltserhöhung' : 'Stammdaten'}

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

            {activeTab === 'stammdaten' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Mitarbeiter Stammdaten</h3>
                  <Button 
                    onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {showEmployeeForm ? 'Abbrechen' : 'Bearbeiten'}
                  </Button>
                </div>

                {!showEmployeeForm ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        {employee.nombre || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        {employee.activo ? 'Aktiv' : 'Inaktiv'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveEmployee} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">CECO (optional)</label>
                        <input
                          type="text"
                          name="ceco"
                          value={employeeFormData.ceco}
                          onChange={(e) => setEmployeeFormData({...employeeFormData, ceco: e.target.value})}
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
                          <span className="text-sm font-medium text-gray-700">Aktiv</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowEmployeeForm(false)}>
                        Abbrechen
                      </Button>
                      <Button type="submit" className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Speichern
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'gehaltserhoehung' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Prozentuale Gehaltserhöhung</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Wendet eine prozentuale Gehaltserhöhung auf alle aktiven Mitarbeiter an. 
                    Die Erhöhung wird erst im April des Zieljahres wirksam mit Nachzahlung für Januar-März.
                  </p>
                </div>

                <form onSubmit={handleSalaryIncrease} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zieljahr</label>
                      <input
                        type="number"
                        min="2020"
                        max="2030"
                        value={increaseYear}
                        onChange={(e) => setIncreaseYear(e.target.value)}
                        placeholder="z.B. 2026"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prozentsatz (%)</label>
                      <input
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={increasePercentage}
                        onChange={(e) => setIncreasePercentage(e.target.value)}
                        placeholder="z.B. 10.0"
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
                    {increaseLoading ? 'Wird verarbeitet...' : 'Gehaltserhöhung anwenden'}
                  </Button>
                </form>

                {increaseResult && (
                  <div className={`mt-6 p-4 rounded-md ${
                    increaseResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <h4 className={`font-medium mb-2 ${
                      increaseResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {increaseResult.success ? '✅ Erfolg' : '❌ Fehler'}
                    </h4>
                    <p className={`text-sm mb-2 ${
                      increaseResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {increaseResult.message}
                    </p>
                    
                    {increaseResult.success && increaseResult.employees && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          {increaseResult.updated_count} Mitarbeiter aktualisiert:
                        </p>
                        <div className="max-h-40 overflow-y-auto">
                          {increaseResult.employees.map((emp: any, index: number) => (
                            <div key={index} className="text-xs text-green-700 py-1">
                              {emp.name}: {emp.old_salary}€ → {emp.new_salary}€ 
                              (+{emp.increase_percent}%, atrasos: {emp.atrasos.toFixed(2)}€)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {increaseResult.errors && increaseResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-red-800 mb-2">Fehler:</p>
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

