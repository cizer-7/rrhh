'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import apiClient from '@/lib/api'

export default function ResetPassword() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Kein Reset-Token gefunden')
        setValidatingToken(false)
        return
      }

      try {
        const response = await apiClient.validateResetToken(token)
        setTokenValid(true)
        setError('')
      } catch (err: any) {
        setError(err.message || 'Ungültiger oder abgelaufener Token')
        setTokenValid(false)
      } finally {
        setValidatingToken(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      setLoading(false)
      return
    }

    try {
      await apiClient.resetPassword(token, newPassword)
      setSuccess(true)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Fehler beim Zurücksetzen des Passworts')
    } finally {
      setLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Token wird validiert...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">❌ Ungültiger Link</CardTitle>
            <CardDescription>
              Dieser Passwort-Reset-Link ist ungültig oder abgelaufen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="text-center mt-4">
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Zurück zum Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">✅ Passwort zurückgesetzt</CardTitle>
            <CardDescription>
              Ihr Passwort wurde erfolgreich aktualisiert.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Zum Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">🔐 Neues Passwort festlegen</CardTitle>
          <CardDescription>
            Bitte geben Sie Ihr neues Passwort ein
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Wird verarbeitet...' : 'Passwort aktualisieren'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
