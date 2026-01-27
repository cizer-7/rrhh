/**
 * Frontend Tests für EmployeeDetail Component - Fixed Version
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock fetch
global.fetch = jest.fn()

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Import EmployeeDetail dynamically to avoid the React context issue
let EmployeeDetail
beforeAll(async () => {
  const module = await import('../../frontend/src/components/EmployeeDetail')
  EmployeeDetail = module.default
})

describe('EmployeeDetail Component', () => {
  const mockEmployee = {
    id_empleado: 1,
    nombre: 'Juan',
    apellido: 'Perez',
    ceco: '1001',
    activo: true
  }

  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('mock-token')
  })

  test('renders employee information correctly', async () => {
    const currentYear = new Date().getFullYear()
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        employee: mockEmployee,
        salaries: [],
        ingresos: [],
        deducciones: []
      })
    })

    render(<EmployeeDetail employee={mockEmployee} onBack={mockOnBack} />)

    await waitFor(() => {
      // Check employee name and ID
      expect(screen.getByText('Perez, Juan')).toBeInTheDocument()
      expect(screen.getByText('ID: 1 | CECO: 1001')).toBeInTheDocument()
      expect(screen.getByText('Zurück')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('displays loading state initially', () => {
    // Mock delayed response
    fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<EmployeeDetail employee={mockEmployee} onBack={mockOnBack} />)

    expect(screen.getByText('Lade Daten...')).toBeInTheDocument()
  })

  test('renders year selector with current year highlighted', async () => {
    const currentYear = new Date().getFullYear()
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        employee: mockEmployee,
        salaries: [],
        ingresos: [],
        deducciones: []
      })
    })

    render(<EmployeeDetail employee={mockEmployee} onBack={mockOnBack} />)

    // Wait for basic employee info to load first
    await waitFor(() => {
      expect(screen.getByText('Perez, Juan')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Then check for the year selector
    const currentYearOption = screen.getByText(`${currentYear} (aktuell)`)
    expect(currentYearOption).toBeInTheDocument()
  })

  test('switches between tabs correctly', async () => {
    const currentYear = new Date().getFullYear()
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        employee: mockEmployee,
        salaries: [{
          anio: currentYear,
          modalidad: 12,
          antiguedad: 5,
          salario_anual_bruto: 30000,
          salario_mensual_bruto: 2500,
          atrasos: 0
        }],
        ingresos: [{
          anio: currentYear,
          ticket_restaurant: 100,
          primas: 200,
          dietas_cotizables: 50,
          horas_extras: 150,
          dias_exentos: 0,
          dietas_exentas: 0,
          seguro_pensiones: 0,
          lavado_coche: 0
        }],
        deducciones: [{
          anio: currentYear,
          seguro_accidentes: 30,
          adelas: 40,
          sanitas: 50,
          gasolina_arval: 60,
          cotizacion_especie: 20
        }]
      })
    })

    render(<EmployeeDetail employee={mockEmployee} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByText('Gehalt')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click on Zulagen tab
    fireEvent.click(screen.getByText('Zulagen'))
    expect(screen.getByText('ticket restaurant')).toBeInTheDocument()

    // Click on Abzüge tab
    fireEvent.click(screen.getByText('Abzüge'))
    expect(screen.getByText('seguro accidentes')).toBeInTheDocument()
  })

  test('handles salary form submission', async () => {
    const currentYear = new Date().getFullYear()
    
    // Mock the initial data fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        employee: mockEmployee,
        salaries: [{
          anio: currentYear,
          modalidad: 12,
          antiguedad: 5,
          salario_anual_bruto: 30000,
          salario_mensual_bruto: 2500,
          atrasos: 0
        }],
        ingresos: [],
        deducciones: []
      })
    })
    
    // Mock any subsequent API calls (check existing + PUT)
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    })

    render(<EmployeeDetail employee={mockEmployee} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('30000')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Change salary value
    const salaryInput = screen.getByDisplayValue('30000')
    fireEvent.change(salaryInput, { target: { value: '35000' } })

    // Submit form
    const saveButton = screen.getByText('Speichern')
    fireEvent.click(saveButton)

    // Just verify that additional API calls were made (don't worry about exact count)
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    }, { timeout: 3000 })
  })

  test('calculates totals correctly', async () => {
    const currentYear = new Date().getFullYear()
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        employee: mockEmployee,
        salaries: [{
          anio: currentYear,
          modalidad: 12,
          antiguedad: 5,
          salario_anual_bruto: 36000,
          salario_mensual_bruto: 3000,
          atrasos: 0
        }],
        ingresos: [{
          anio: currentYear,
          ticket_restaurant: 120,
          primas: 240,
          dietas_cotizables: 60,
          horas_extras: 180,
          dias_exentos: 0,
          dietas_exentas: 0,
          seguro_pensiones: 0,
          lavado_coche: 0
        }],
        deducciones: [{
          anio: currentYear,
          seguro_accidentes: 36,
          adelas: 48,
          sanitas: 60,
          gasolina_arval: 72,
          cotizacion_especie: 24
        }]
      })
    })

    render(<EmployeeDetail employee={mockEmployee} onBack={mockOnBack} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('36000')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check monthly salary calculation
    // Base: 3000 + Ingresos monthly: (120+240+60+180)/12 = 50 - Deductions monthly: (36+48+60+72+24)/12 = 20
    // Expected: 3000 + 50 - 20 = 3030
    expect(screen.getByText(/€3\.030,00/)).toBeInTheDocument()

    // Check annual salary
    expect(screen.getByText(/€36\.000,00/)).toBeInTheDocument()
  })

  test('handles API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))

    render(<EmployeeDetail employee={mockEmployee} onBack={mockOnBack} />)

    await waitFor(() => {
      // Should not crash and should render the component
      expect(screen.getByText('Perez, Juan')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('calls onBack when back button is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        employee: mockEmployee,
        salaries: [],
        ingresos: [],
        deducciones: []
      })
    })

    render(<EmployeeDetail employee={mockEmployee} onBack={mockOnBack} />)

    // Wait for the component to load and find the back button
    await waitFor(() => {
      expect(screen.getByText('Zurück')).toBeInTheDocument()
    }, { timeout: 3000 })

    const backButton = screen.getByText('Zurück')
    fireEvent.click(backButton)

    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })
})
