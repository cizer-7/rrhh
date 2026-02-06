/**
 * Frontend Tests für EmployeeTable Component
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

// Import EmployeeTable dynamically to avoid the React context issue
let EmployeeTable
beforeAll(async () => {
  const module = await import('../../frontend/src/components/EmployeeTable')
  EmployeeTable = module.default
})

describe('EmployeeTable Component', () => {
  const mockEmployees = [
    {
      id_empleado: 1,
      nombre: 'Juan',
      apellido: 'Perez',
      ceco: '1001',
      activo: true
    },
    {
      id_empleado: 2,
      nombre: 'Maria',
      apellido: 'Garcia',
      ceco: '1002',
      activo: false
    }
  ]

  const mockOnEmployeeSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage
    localStorageMock.getItem.mockReturnValue('mock-token')
    // Mock fetch responses for employees
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockEmployees
    })
    // Mock apiClient getPayoutMonth
    global.apiClient.getPayoutMonth.mockResolvedValue({ payout_month: 4 })
  })

  test('renders employee table correctly', async () => {
    render(<EmployeeTable onEmployeeSelect={mockOnEmployeeSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Perez, Juan')).toBeInTheDocument()
      expect(screen.getByText('Garcia, Maria')).toBeInTheDocument()
      expect(screen.getByText('ID: 1 | CECO: 1001')).toBeInTheDocument()
      expect(screen.getByText('ID: 2 | CECO: 1002')).toBeInTheDocument()
    })
  })

  test('displays loading state initially', () => {
    // Mock delayed response
    global.fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<EmployeeTable onEmployeeSelect={mockOnEmployeeSelect} />)

    expect(screen.getByText('Lade Mitarbeiter...')).toBeInTheDocument()
  })

  test('calls onEmployeeSelect when employee row is clicked', async () => {
    render(<EmployeeTable onEmployeeSelect={mockOnEmployeeSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Perez, Juan')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Perez, Juan'))
    expect(mockOnEmployeeSelect).toHaveBeenCalledWith(mockEmployees[0])
  })

  test('filters employees by search term', async () => {
    render(<EmployeeTable onEmployeeSelect={mockOnEmployeeSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Perez, Juan')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Mitarbeiter suchen...')
    fireEvent.change(searchInput, { target: { value: 'Juan' } })

    await waitFor(() => {
      expect(screen.getByText('Perez, Juan')).toBeInTheDocument()
      expect(screen.queryByText('Garcia, Maria')).not.toBeInTheDocument()
    })
  })

  test('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'))

    render(<EmployeeTable onEmployeeSelect={mockOnEmployeeSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Keine Mitarbeiter vorhanden')).toBeInTheDocument()
    })
  })

  test('displays empty state when no employees', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    })

    render(<EmployeeTable onEmployeeSelect={mockOnEmployeeSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Keine Mitarbeiter vorhanden')).toBeInTheDocument()
    })
  })
})
