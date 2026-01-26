'use client'

import { useState } from 'react'
import { Employee } from '@/types/employee'
import { Button } from '@/components/ui/button'
import { X, Save } from 'lucide-react'

interface EmployeeFormProps {
  employee?: Employee | null
  isOpen: boolean
  onClose: () => void
  onSave: (employee: Partial<Employee>) => void
}

export default function EmployeeForm({ employee, isOpen, onClose, onSave }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    nombre: employee?.nombre || '',
    apellido: employee?.apellido || '',
    ceco: employee?.ceco || '',
    activo: employee?.activo ?? true
  })

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
            {employee ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vorname
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
              Nachname
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
              CECO (optional)
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
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Aktiv</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Speichern
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
