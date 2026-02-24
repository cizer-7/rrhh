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
    kategorie: (employee as any).kategorie ?? undefined,
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
        const checkResponse = await fetch(`http://localhost:8000/employees/${employee.id_empleado}`, { headers })
        const employeeData = await checkResponse.json()
        const existingSalary = employeeData.salaries?.find((s: any) => s.anio === year)
        const url = existingSalary
          ? `http://localhost:8000/employees/${employee.id_empleado}/salaries/${year}`
          : `http://localhost:8000/employees/${employee.id_empleado}/salaries`
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
          ? `http://localhost:8000/employees/${employee.id_empleado}/ingresos/${year}/${month}`
          : `http://localhost:8000/employees/${employee.id_empleado}/ingresos/${year}`
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
          ? `http://localhost:8000/employees/${employee.id_empleado}/deducciones/${year}/${month}`
          : `http://localhost:8000/employees/${employee.id_empleado}/deducciones/${year}`
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
        await fetch(`http://localhost:8000/employees/${employee.id_empleado}`, {
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
      kategorie: (employee as any).kategorie ?? undefined,
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
        `http://localhost:8000/employees/${employee.id_empleado}?_t=${Date.now()}`,
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
          kategorie: (data as any)?.kategorie ?? (employee as any)?.kategorie ?? undefined,
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
      
      const response = await fetch(`http://localhost:8000/employees/${employee.id_empleado}/salary-increase`, {
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                        {(employee as any).kategorie || '-'}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                        <select
                          name="kategorie"
                          value={(employeeFormData as any).kategorie ?? ''}
                          onChange={(e) => setEmployeeFormData({ ...(employeeFormData as any), kategorie: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-</option>
                          <option value="Techniker">Techniker</option>
                          <option value="Office">Office</option>
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
