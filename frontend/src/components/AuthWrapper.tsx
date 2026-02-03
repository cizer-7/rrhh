'use client'

import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import { ArrowLeft, Download, Users, FileText, LogOut, TrendingUp } from 'lucide-react'
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
  const [exportFormat, setExportFormat] = useState<'nomina_total' | 'asiento_nomina'>('nomina_total')
  
  // State für Gehaltserhöhung
  const [showSalaryIncrease, setShowSalaryIncrease] = useState(false)
  const [increaseYear, setIncreaseYear] = useState('')
  const [increasePercentage, setIncreasePercentage] = useState('')
  const [increaseLoading, setIncreaseLoading] = useState(false)
  const [increaseResult, setIncreaseResult] = useState<any>(null)
  
  const router = useRouter()

  useEffect(() => {
    fetchEmployeeStats()
  }, [])

  const fetchEmployeeStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/employees', {
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
        // Refresh stats to show updated data
        fetchEmployeeStats()
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
      
      // Asiento Nomina erfordert monatlichen Export
      if (exportFormat === 'asiento_nomina' && (!currentMonth || exportType !== 'monthly')) {
        alert('Asiento Nomina Export erfordert monatliche Auswahl')
        return
      }
      
      let url: string
      if (exportFormat === 'asiento_nomina') {
        // Asiento Nomina API Endpunkt
        url = `http://localhost:8000/export/asiento_nomina/${currentYear}/${currentMonth}`
      } else {
        // Nomina Total API Endpunkt
        url = exportType === 'monthly' && currentMonth 
          ? `http://localhost:8000/export/excel/${currentYear}/${currentMonth}`
          : `http://localhost:8000/export/excel/${currentYear}`
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
        filename = `asiento_nomina_${currentYear}_${currentMonth}.xlsx`
      } else {
        filename = exportType === 'monthly' && currentMonth 
          ? `gehaltsabrechnung_${currentYear}_${currentMonth}.xlsx`
          : `gehaltsabrechnung_${currentYear}.xlsx`
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url_blob)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Export fehlgeschlagen. Bitte versuchen Sie es erneut.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mitarbeiter Dashboard</h1>
              <p className="text-gray-600">Angemeldet als: {user?.nombre_usuario} ({user?.rol})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Gehaltserhöhung Button */}
            <Button 
              variant="outline" 
              className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              onClick={() => setShowSalaryIncrease(!showSalaryIncrease)}
            >
              <TrendingUp className="w-4 h-4" />
              {showSalaryIncrease ? 'Abbrechen' : 'Gehaltserhöhung'}
            </Button>
            
            {/* Link zur Gehaltsverwaltung */}
            <Button 
              variant="outline" 
              className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              onClick={() => {
                const element = document.getElementById('salary-management')
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <Download className="w-4 h-4" />
              Gehaltsverwaltung
            </Button>
            <select 
              value={exportFormat} 
              onChange={(e) => {
                setExportFormat(e.target.value as 'nomina_total' | 'asiento_nomina')
                // Asiento Nomina erfordert monatlichen Export
                if (e.target.value === 'asiento_nomina') {
                  setExportType('monthly')
                  if (!currentMonth) {
                    setCurrentMonth(new Date().getMonth() + 1)
                  }
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="nomina_total">Nomina Total</option>
              <option value="asiento_nomina">Asiento Nomina</option>
            </select>
            
            {exportFormat === 'nomina_total' && (
              <select 
                value={exportType} 
                onChange={(e) => {
                  setExportType(e.target.value as 'yearly' | 'monthly')
                  if (e.target.value === 'yearly') {
                    setCurrentMonth(null)
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="yearly">Jährlich</option>
                <option value="monthly">Monatlich</option>
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
                onChange={(e) => setCurrentMonth(e.target.value ? parseInt(e.target.value) : null)}
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
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={() => handleExport()}
              disabled={(exportFormat === 'asiento_nomina' || exportType === 'monthly') && !currentMonth}
            >
              <Download className="w-4 h-4" />
              Excel Export
            </Button>
            <Button variant="destructive" className="flex items-center gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Abmelden
            </Button>
          </div>
        </div>

        {/* Gehaltserhöhungs-Formular */}
        {showSalaryIncrease && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Prozentuale Gehaltserhöhung für alle Mitarbeiter</h3>
            <p className="text-sm text-gray-600 mb-6">
              Wendet eine prozentuale Gehaltserhöhung auf alle aktiven Mitarbeiter an. 
              Die Erhöhung wird erst im April des Zieljahres wirksam mit Nachzahlung für Januar-März.
            </p>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Users className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Mitarbeiter</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">{employeeStats.total}</div>
            </div>
            <p className="text-gray-600">Gesamtzahl der Mitarbeiter</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-green-600">
                <FileText className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Aktive Mitarbeiter</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">{employeeStats.active}</div>
            </div>
            <p className="text-gray-600">Aktive Mitarbeiter im System</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-orange-600">
                <FileText className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Inaktive Mitarbeiter</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">{employeeStats.inactive}</div>
            </div>
            <p className="text-gray-600">Inaktive Mitarbeiter im System</p>
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
        <div className="text-lg text-gray-600">Lade...</div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return <DashboardComponent user={user} onLogout={handleLogout} />
}
