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

