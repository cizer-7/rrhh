'use client'

import { useState, useEffect } from 'react'
import { Employee } from '@/types/employee'
import { Button } from '@/components/ui/button'
import { Search, Plus, Edit, Trash2, Eye, TrendingUp } from 'lucide-react'
import EmployeeForm from './EmployeeForm'
import EmployeeDetail from './EmployeeDetail'
import SalaryCopyManager from './SalaryCopyManager'

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
  const [activeTab, setActiveTab] = useState<'employees' | 'increase' | 'salary-copy'>('employees')
  
  // State for salary increase
  const [increaseYear, setIncreaseYear] = useState<string>('')
  const [increasePercentage, setIncreasePercentage] = useState<string>('')
  const [increaseLoading, setIncreaseLoading] = useState(false)
  const [increaseResult, setIncreaseResult] = useState<any>(null)
  const [excludedEmployees, setExcludedEmployees] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:8000/employees', {
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
    if (!confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) return
    
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
        console.error('Fehler beim Löschen des Mitarbeiters')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  const handleGlobalSalaryIncrease = async (e: React.FormEvent) => {
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
        percentage_increase: parseFloat(increasePercentage),
        excluded_employee_ids: Array.from(excludedEmployees)
      }
      
      console.log('Sending global salary increase request:', requestData)
      
      const response = await fetch('http://localhost:8000/salaries/percentage-increase', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('Globale Gehaltserhöhung erfolgreich:', result)
        setIncreaseResult(result)
        // Refresh employee data to show updated salaries
        fetchEmployees()
      } else {
        console.error('Fehler bei globaler Gehaltserhöhung:', result)
        setIncreaseResult(result)
      }
    } catch (error) {
      console.error('Error applying global salary increase:', error)
      setIncreaseResult({ success: false, message: 'Netzwerkfehler' })
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
      setExcludedEmployees(new Set(filteredEmployees.map(emp => emp.id_empleado)))
    }
  }

  const filteredEmployees = employees.filter(employee =>
    employee.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.ceco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.id_empleado.toString().includes(searchTerm)
  )

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
        <div className="text-lg text-gray-600">Lade Mitarbeiter...</div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Mitarbeiterverwaltung</h2>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {['employees', 'increase', 'salary-copy'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'employees' ? 'Mitarbeiter' : tab === 'increase' ? 'Erhöhung' : 'Gehaltskopie'}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'employees' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Mitarbeiterliste</h3>
              <Button className="flex items-center gap-2" onClick={handleAddEmployee}>
                <Plus className="w-4 h-4" />
                Neuer Mitarbeiter
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                id="employee-search"
                type="text"
                placeholder="Mitarbeiter suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CECO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
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
                          {employee.activo ? 'Aktiv' : 'Inaktiv'}
                        </span>
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
                            Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit className="w-4 h-4" />
                            Bearbeiten
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => handleDeleteEmployee(employee.id_empleado)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Löschen
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Keine Mitarbeiter gefunden' : 'Keine Mitarbeiter vorhanden'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'increase' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Gehaltserhöhung für ausgewählte Mitarbeiter</h3>
              <p className="text-sm text-gray-600 mb-6">
                Wendet eine prozentuale Gehaltserhöhung auf ausgewählte aktive Mitarbeiter an. 
                Die Erhöhung wird erst im April des Zieljahres wirksam mit Nachzahlung für Januar-März.
              </p>
            </div>

            <form onSubmit={handleGlobalSalaryIncrease} className="space-y-4">
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

              {/* Mitarbeiter-Auswahl */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">
                    Mitarbeiter für Gehaltserhöhung ({filteredEmployees.filter(emp => !excludedEmployees.has(emp.id_empleado)).length} von {filteredEmployees.length} ausgewählt)
                  </h4>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAllChange(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Alle auswählen/abwählen
                  </label>
                </div>
                
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-2 p-4">
                    {filteredEmployees.map((employee) => (
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
                            {employee.activo ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={increaseLoading || filteredEmployees.filter(emp => !excludedEmployees.has(emp.id_empleado)).length === 0}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                {increaseLoading ? 'Wird verarbeitet...' : `Gehaltserhöhung für ${filteredEmployees.filter(emp => !excludedEmployees.has(emp.id_empleado)).length} Mitarbeiter anwenden`}
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

        {activeTab === 'salary-copy' && (
          <div>
            <SalaryCopyManager />
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
