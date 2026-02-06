/**
 * Frontend Tests für EmployeeForm Component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Import EmployeeForm dynamically to avoid the React context issue
let EmployeeForm
beforeAll(async () => {
  const module = await import('../../frontend/src/components/EmployeeForm')
  EmployeeForm = module.default
})

describe('EmployeeForm Component', () => {
  const mockOnSave = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders form fields correctly when open', () => {
    render(<EmployeeForm isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />)

    expect(screen.getByText('Vorname')).toBeInTheDocument()
    expect(screen.getByText('Nachname')).toBeInTheDocument()
    expect(screen.getByText('CECO (optional)')).toBeInTheDocument()
    expect(screen.getByText('Aktiv')).toBeInTheDocument()
    expect(screen.getByText('Speichern')).toBeInTheDocument()
    expect(screen.getByText('Abbrechen')).toBeInTheDocument()
  })

  test('does not render when closed', () => {
    render(<EmployeeForm isOpen={false} onClose={mockOnClose} onSave={mockOnSave} />)

    expect(screen.queryByText('Vorname')).not.toBeInTheDocument()
  })

  test('submits form with correct data', () => {
    render(<EmployeeForm isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />)

    const inputs = screen.getAllByDisplayValue('')
    const nameInput = inputs.find(input => input.name === 'nombre')
    const apellidoInput = inputs.find(input => input.name === 'apellido')
    const cecoInput = inputs.find(input => input.name === 'ceco')

    fireEvent.change(nameInput, { target: { value: 'Max' } })
    fireEvent.change(apellidoInput, { target: { value: 'Mustermann' } })
    fireEvent.change(cecoInput, { target: { value: '1001' } })
    fireEvent.click(screen.getByText('Speichern'))

    expect(mockOnSave).toHaveBeenCalledWith({
      nombre: 'Max',
      apellido: 'Mustermann',
      ceco: '1001',
      activo: true
    })
    expect(mockOnClose).toHaveBeenCalled()
  })

  test('calls onClose when cancel button is clicked', () => {
    render(<EmployeeForm isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />)

    fireEvent.click(screen.getByText('Abbrechen'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('pre-fills form with employee data', () => {
    const employee = {
      id_empleado: 1,
      nombre: 'John',
      apellido: 'Doe',
      ceco: '2001',
      activo: false
    }

    render(<EmployeeForm isOpen={true} onClose={mockOnClose} onSave={mockOnSave} employee={employee} />)

    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2001')).toBeInTheDocument()
    expect(screen.getByLabelText('Aktiv')).not.toBeChecked()
  })

  test('handles checkbox changes', () => {
    render(<EmployeeForm isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />)

    const checkbox = screen.getByLabelText('Aktiv')
    expect(checkbox).toBeChecked()

    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })
})
