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
      const response = await fetch('http://localhost:8000/salaries/missing-years', {
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
      console.error('Error fetching missing years:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopySalaries = async (year: number) => {
    if (!confirm(`Möchten Sie wirklich alle Gehälter von ${year - 1} nach ${year} kopieren?`)) {
      return
    }

    setCopying(true)
    setSelectedYear(year)
    setCopyResult(null)

    try {
      const response = await fetch(`http://localhost:8000/salaries/copy-to-year/${year}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      setCopyResult(result)
      
      if (result.success) {
        // Aktualisiere die Liste der fehlenden Jahre
        fetchMissingYears()
      }
    } catch (error) {
      console.error('Error copying salaries:', error)
      setCopyResult({
        success: false,
        message: 'Fehler bei der Gehaltskopierung',
        copied_count: 0,
        skipped_count: 0,
        errors: ['Netzwerkfehler']
      })
    } finally {
      setCopying(false)
      setSelectedYear(null)
    }
  }

  const handleCreateNewYear = async () => {
    if (!confirm(`Möchten Sie wirklich alle Gehälter für das Jahr ${newYear} anlegen? Es werden alle Gehälter von ${newYear - 1} kopiert.`)) {
      return
    }

    setCopying(true)
    setSelectedYear(newYear)
    setCopyResult(null)

    try {
      const response = await fetch(`http://localhost:8000/salaries/copy-to-year/${newYear}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      setCopyResult(result)
      
      if (result.success) {
        // Aktualisiere die Liste der fehlenden Jahre
        fetchMissingYears()
        // Setze das nächste Jahr als Standard
        setNewYear(newYear + 1)
      }
    } catch (error) {
      console.error('Error copying salaries:', error)
      setCopyResult({
        success: false,
        message: 'Fehler bei der Gehaltskopierung',
        copied_count: 0,
        skipped_count: 0,
        errors: ['Netzwerkfehler']
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
          <span className="ml-2 text-gray-600">Lade Gehaltsinformationen...</span>
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
          <span className="font-medium">Alle Gehälter sind auf dem neuesten Stand</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Gehaltsverwaltung</h3>
      
      {/* Neues Jahr anlegen */}
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Copy className="w-5 h-5 text-blue-500" />
            <div>
              <span className="font-medium text-gray-800">Neues Jahr anlegen</span>
              <p className="text-sm text-gray-600 mt-1">Kopiert alle Gehälter vom Vorjahr in das ausgewählte Jahr</p>
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
                <option value="">Keine Jahre verfügbar</option>
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
                ? 'Kopiere...' 
                : availableYears.length === 0
                  ? 'Nicht verfügbar'
                  : `Jahr ${newYear} anlegen`
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Fehlende Gehälter */}
      {relevantMissingYears.filter(y => y.missing_count > 0).length > 0 && (
        <div className="space-y-4 mb-6">
          <h4 className="text-md font-medium text-gray-700">Fehlende Gehälter:</h4>
          {relevantMissingYears.filter(y => y.missing_count > 0).map((yearInfo) => (
            <div key={yearInfo.year} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <div>
                    <span className="font-medium text-gray-800">Jahr {yearInfo.year}</span>
                    <span className="text-gray-600 ml-2">
                      ({yearInfo.missing_count} Mitarbeiter ohne Gehalt)
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
                    ? 'Kopiere...' 
                    : `Gehälter von ${yearInfo.year - 1} kopieren`
                  }
                </Button>
              </div>
              
              {yearInfo.missing_count <= 5 && (
                <div className="mt-3 text-sm text-gray-600">
                  Betroffene Mitarbeiter: {yearInfo.employees.map(emp => 
                    `${emp.nombre} ${emp.apellido}`
                  ).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ergebnis der Kopieraktion */}
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
              <p>Erfolgreich kopiert: {copyResult.copied_count} Mitarbeiter</p>
              {copyResult.skipped_count > 0 && (
                <p>Übersprungen: {copyResult.skipped_count} Mitarbeiter</p>
              )}
            </div>
          )}
          
          {copyResult.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-700">Fehler:</p>
              <ul className="text-sm text-red-600 list-disc list-inside">
                {copyResult.errors.slice(0, 3).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {copyResult.errors.length > 3 && (
                  <li>... und {copyResult.errors.length - 3} weitere Fehler</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Status wenn alles okay */}
      {relevantMissingYears.filter(y => y.missing_count > 0).length === 0 && !copyResult && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Alle Gehälter sind auf dem neuesten Stand</span>
        </div>
      )}
    </div>
  )
}
