import '@testing-library/jest-dom'

// Import React and ReactDOM to ensure they're available in the test environment
import React from 'react'
import ReactDOM from 'react-dom'

// Don't mock React hooks - use the real ones

// Mock Radix UI components
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }) => <div {...props}>{children}</div>,
}))

// Mock class-variance-authority
jest.mock('class-variance-authority', () => ({
  cva: () => 'mocked-class-name',
  VariantProps: {},
}))

// Mock clsx and tailwind-merge
jest.mock('clsx', () => ({
  clsx: (...args) => args.filter(Boolean).join(' '),
}))

jest.mock('tailwind-merge', () => ({
  twMerge: (...args) => args.filter(Boolean).join(' '),
}))

// Mock the utils cn function
jest.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
}))

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

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock apiClient
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    getEmployees: jest.fn(),
    getEmployee: jest.fn(),
    createEmployee: jest.fn(),
    updateEmployee: jest.fn(),
    deleteEmployee: jest.fn(),
    searchEmployees: jest.fn(),
    addSalary: jest.fn(),
    updateSalary: jest.fn(),
    deleteSalary: jest.fn(),
    updateIngresos: jest.fn(),
    updateIngresosMensuales: jest.fn(),
    updateDeducciones: jest.fn(),
    updateDeduccionesMensuales: jest.fn(),
    exportExcel: jest.fn(),
    healthCheck: jest.fn(),
    getPayoutMonth: jest.fn(),
    setPayoutMonth: jest.fn(),
    applyIngresosDeduccionesToAllActive: jest.fn(),
  }
}))

// Mock apiClient for tests that need it
const apiClientMock = {
  login: jest.fn(),
  getEmployees: jest.fn(),
  getEmployee: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
  searchEmployees: jest.fn(),
  addSalary: jest.fn(),
  updateSalary: jest.fn(),
  deleteSalary: jest.fn(),
  updateIngresos: jest.fn(),
  updateIngresosMensuales: jest.fn(),
  updateDeducciones: jest.fn(),
  updateDeduccionesMensuales: jest.fn(),
  exportExcel: jest.fn(),
  healthCheck: jest.fn(),
  getPayoutMonth: jest.fn(),
  setPayoutMonth: jest.fn(),
  applyIngresosDeduccionesToAllActive: jest.fn(),
}

// Make apiClient available globally for tests
global.apiClient = apiClientMock

// Suppress console warnings during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
