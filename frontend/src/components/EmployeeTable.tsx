'use client'

import { useState, useEffect } from 'react'
import { Employee } from '@/types/employee'
import { Button } from '@/components/ui/button'
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react'
import EmployeeForm from './EmployeeForm'
import EmployeeDetail from './EmployeeDetail'

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
      await fetch(`http://localhost:8000/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
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
          <h2 className="text-2xl font-bold text-gray-800">Mitarbeiterliste</h2>
          <Button className="flex items-center gap-2" onClick={handleAddEmployee}>
            <Plus className="w-4 h-4" />
            Neuer Mitarbeiter
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Search className="w-5 h-5 text-gray-400" />
          <input
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

      <EmployeeForm
        employee={selectedEmployee}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveEmployee}
      />
    </>
  )
}
