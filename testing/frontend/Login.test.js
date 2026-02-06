/**
 * Frontend Tests für Login Component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Import apiClient mock
const apiClient = require('@/lib/api').default

// Import Login dynamically to avoid the React context issue
let Login
beforeAll(async () => {
  const module = await import('../../frontend/src/components/Login')
  Login = module.default
})

describe('Login Component', () => {
  const mockOnLogin = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders login form correctly', () => {
    render(<Login onLogin={mockOnLogin} />)

    expect(screen.getByLabelText('Benutzername')).toBeInTheDocument()
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument()
    expect(screen.getByText('Anmelden')).toBeInTheDocument()
  })

  test('submits login form with correct credentials', async () => {
    apiClient.login.mockResolvedValueOnce({
      user: { id: 1, username: 'admin' },
      access_token: 'mock-token'
    })

    render(<Login onLogin={mockOnLogin} />)

    fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'password' } })

    fireEvent.click(screen.getByText('Anmelden'))

    await waitFor(() => {
      expect(apiClient.login).toHaveBeenCalledWith('admin', 'password')
    })

    expect(mockOnLogin).toHaveBeenCalledWith(
      { id: 1, username: 'admin' },
      'mock-token'
    )
  })

  test('displays error message on failed login', async () => {
    apiClient.login.mockRejectedValueOnce(new Error('Invalid credentials'))

    render(<Login onLogin={mockOnLogin} />)

    fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'wrong' } })

    fireEvent.click(screen.getByText('Anmelden'))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  test('displays default error message when error has no message', async () => {
    apiClient.login.mockRejectedValueOnce(new Error())

    render(<Login onLogin={mockOnLogin} />)

    fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'password' } })

    fireEvent.click(screen.getByText('Anmelden'))

    await waitFor(() => {
      expect(screen.getByText('Anmeldung fehlgeschlagen')).toBeInTheDocument()
    })
  })

  test('disables submit button during login', async () => {
    apiClient.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<Login onLogin={mockOnLogin} />)

    fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'password' } })

    const submitButton = screen.getByText('Anmelden')
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByText('Anmelden...')).toBeInTheDocument()
  })

  test('clears error message on successful login', async () => {
    apiClient.login.mockRejectedValueOnce(new Error('First error'))
    apiClient.login.mockResolvedValueOnce({
      user: { id: 1, username: 'admin' },
      access_token: 'mock-token'
    })

    render(<Login onLogin={mockOnLogin} />)

    // First attempt - should show error
    fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByText('Anmelden'))

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument()
    })

    // Second attempt - should clear error and succeed
    fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'password' } })
    fireEvent.click(screen.getByText('Anmelden'))

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument()
    })
  })
})
