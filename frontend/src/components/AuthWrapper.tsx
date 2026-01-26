'use client'

import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import { ArrowLeft, Download, Users, FileText, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import EmployeeTable from '@/components/EmployeeTable'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/api'

interface DashboardProps {
  user?: any
  onLogout: () => void
}

function DashboardComponent({ user, onLogout }: DashboardProps) {
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const router = useRouter()

  useEffect(() => {
    fetchEmployeeStats()
  }, [])

  const fetchEmployeeStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const employees = await response.json()
      
      const total = employees.length
      const active = employees.filter((emp: any) => emp.activo).length
      const inactive = total - active

      setEmployeeStats({ total, active, inactive })
    } catch (error) {
      console.error('Error fetching employee stats:', error)
    }
  }

  const handleBack = () => {
    router.push('/')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    onLogout()
  }

  const handleExport = async (type: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/export/excel/${currentYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      
      // Create blob and download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gehaltsabrechnung_${currentYear}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Export fehlgeschlagen. Bitte versuchen Sie es erneut.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mitarbeiter Dashboard</h1>
              <p className="text-gray-600">Angemeldet als: {user?.nombre_usuario} ({user?.rol})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={currentYear} 
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <Button variant="outline" className="flex items-center gap-2" onClick={() => handleExport('complete')}>
              <Download className="w-4 h-4" />
              Excel Export
            </Button>
            <Button variant="destructive" className="flex items-center gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Abmelden
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Users className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Mitarbeiter</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">{employeeStats.total}</div>
            </div>
            <p className="text-gray-600">Gesamtzahl der Mitarbeiter</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-green-600">
                <FileText className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Aktive Mitarbeiter</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">{employeeStats.active}</div>
            </div>
            <p className="text-gray-600">Aktive Mitarbeiter im System</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-orange-600">
                <FileText className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Inaktive Mitarbeiter</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900">{employeeStats.inactive}</div>
            </div>
            <p className="text-gray-600">Inaktive Mitarbeiter im System</p>
          </div>
        </div>

        <EmployeeTable onEmployeeChange={fetchEmployeeStats} />
      </div>
    </div>
  )
}

export default function AuthWrapper() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const userData = localStorage.getItem('user')

    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUser(user)
      } catch (error) {
        // Invalid user data, clear storage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)

    // Add event listener for browser close/tab close
    const handleBeforeUnload = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const handleLogin = (userData: any, token: string) => {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Lade...</div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return <DashboardComponent user={user} onLogout={handleLogout} />
}
