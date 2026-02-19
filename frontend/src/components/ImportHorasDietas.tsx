'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type ImportResult = {
  success?: boolean
  message?: string
  year?: number
  month?: number
  processed_count?: number
  inserted_count?: number
  updated_count?: number
  skipped_count?: number
  error_count?: number
  errors?: string[]
}

export default function ImportHorasDietas() {
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [file, setFile] = useState<File | null>(null)
  const [gasolinaFile, setGasolinaFile] = useState<File | null>(null)
  const [cotizacionEspecieFile, setCotizacionEspecieFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmGasolinaOpen, setConfirmGasolinaOpen] = useState(false)
  const [confirmCotizacionEspecieOpen, setConfirmCotizacionEspecieOpen] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [gasolinaResult, setGasolinaResult] = useState<ImportResult | null>(null)
  const [cotizacionEspecieResult, setCotizacionEspecieResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gasolinaError, setGasolinaError] = useState<string | null>(null)
  const [cotizacionEspecieError, setCotizacionEspecieError] = useState<string | null>(null)

  const years = useMemo(() => {
    const start = now.getFullYear() - 4
    return Array.from({ length: 15 }, (_, i) => start + i)
  }, [now])

  const onSelectFile = (f: File | null) => {
    setResult(null)
    setError(null)
    setFile(f)
  }

  const onSelectGasolinaFile = (f: File | null) => {
    setGasolinaResult(null)
    setGasolinaError(null)
    setGasolinaFile(f)
  }

  const onSelectCotizacionEspecieFile = (f: File | null) => {
    setCotizacionEspecieResult(null)
    setCotizacionEspecieError(null)
    setCotizacionEspecieFile(f)
  }

  const openConfirm = () => {
    setResult(null)
    setError(null)

    if (!file) {
      setError('Bitte wähle eine Excel-Datei aus.')
      return
    }

    setConfirmOpen(true)
  }

  const openGasolinaConfirm = () => {
    setGasolinaResult(null)
    setGasolinaError(null)

    if (!gasolinaFile) {
      setGasolinaError('Bitte wähle eine Excel-Datei aus.')
      return
    }

    setConfirmGasolinaOpen(true)
  }

  const openCotizacionEspecieConfirm = () => {
    setCotizacionEspecieResult(null)
    setCotizacionEspecieError(null)

    if (!cotizacionEspecieFile) {
      setCotizacionEspecieError('Bitte wähle eine Excel-Datei aus.')
      return
    }

    setConfirmCotizacionEspecieOpen(true)
  }

  const doUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = localStorage.getItem('token')
      const form = new FormData()
      form.append('year', String(year))
      form.append('month', String(month))
      form.append('file', file)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/imports/horas-dietas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `HTTP ${res.status}`)
      }

      setResult(data)
    } catch (e: any) {
      setError(e?.message || 'Upload fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  const doCotizacionEspecieUpload = async () => {
    if (!cotizacionEspecieFile) return

    setLoading(true)
    setCotizacionEspecieError(null)
    setCotizacionEspecieResult(null)

    try {
      const token = localStorage.getItem('token')
      const form = new FormData()
      form.append('year', String(year))
      form.append('month', String(month))
      form.append('file', cotizacionEspecieFile)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/imports/cotizacion-especie`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `HTTP ${res.status}`)
      }

      setCotizacionEspecieResult(data)
    } catch (e: any) {
      setCotizacionEspecieError(e?.message || 'Upload fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  const doGasolinaUpload = async () => {
    if (!gasolinaFile) return

    setLoading(true)
    setGasolinaError(null)
    setGasolinaResult(null)

    try {
      const token = localStorage.getItem('token')
      const form = new FormData()
      form.append('year', String(year))
      form.append('month', String(month))
      form.append('file', gasolinaFile)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/imports/gasolina`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `HTTP ${res.status}`)
      }

      setGasolinaResult(data)
    } catch (e: any) {
      setGasolinaError(e?.message || 'Upload fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Horas + Dietas</h3>
        <p className="text-sm text-gray-600">
          Importiert Werte aus einer Excel-Datei in Zulagen & Abzüge für den ausgewählten Monat.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <AlertTitle>{result.success ? 'Import erfolgreich' : 'Import abgeschlossen mit Fehlern'}</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              {result.message && <div>{result.message}</div>}
              <div>
                verarbeitet: {result.processed_count ?? 0}, neu: {result.inserted_count ?? 0}, aktualisiert:{' '}
                {result.updated_count ?? 0}, übersprungen: {result.skipped_count ?? 0}, Fehler: {result.error_count ?? 0}
              </div>
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto text-xs bg-gray-50 border border-gray-200 rounded p-2">
                  {result.errors.slice(0, 50).map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jahr</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monat</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Datei</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            disabled={loading}
          />
          {file && <div className="text-xs text-gray-600 mt-1">{file.name}</div>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={openConfirm} disabled={loading}>
          Import starten
        </Button>
      </div>

      <div className="border-t border-gray-200 pt-6" />

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Gasolina</h3>
        <p className="text-sm text-gray-600">
          Importiert Werte aus einer Excel-Datei in Abzüge (Gasolina) für den ausgewählten Monat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jahr</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monat</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Datei</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => onSelectGasolinaFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            disabled={loading}
          />
          {gasolinaFile && <div className="text-xs text-gray-600 mt-1">{gasolinaFile.name}</div>}
        </div>
      </div>

      {gasolinaResult && (
        <Alert>
          <AlertTitle>{gasolinaResult.success ? 'Gasolina Import erfolgreich' : 'Gasolina Import abgeschlossen mit Fehlern'}</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              {gasolinaResult.message && <div>{gasolinaResult.message}</div>}
              <div>
                verarbeitet: {gasolinaResult.processed_count ?? 0}, neu: {gasolinaResult.inserted_count ?? 0}, aktualisiert:{' '}
                {gasolinaResult.updated_count ?? 0}, übersprungen: {gasolinaResult.skipped_count ?? 0}, Fehler: {gasolinaResult.error_count ?? 0}
              </div>
              {Array.isArray(gasolinaResult.errors) && gasolinaResult.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto text-xs bg-gray-50 border border-gray-200 rounded p-2">
                  {gasolinaResult.errors.slice(0, 50).map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {gasolinaError && (
        <Alert variant="destructive">
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{gasolinaError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={openGasolinaConfirm} disabled={loading}>
          Gasolina Import starten
        </Button>
      </div>

      <div className="border-t border-gray-200 pt-6" />

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cotizacion Especie</h3>
        <p className="text-sm text-gray-600">
          Importiert Werte aus einer Excel-Datei in Abzüge (Cotizacion Especie) für den ausgewählten Monat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jahr</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monat</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Datei</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => onSelectCotizacionEspecieFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            disabled={loading}
          />
          {cotizacionEspecieFile && <div className="text-xs text-gray-600 mt-1">{cotizacionEspecieFile.name}</div>}
        </div>
      </div>

      {cotizacionEspecieResult && (
        <Alert>
          <AlertTitle>
            {cotizacionEspecieResult.success ? 'Cotizacion Especie Import erfolgreich' : 'Cotizacion Especie Import abgeschlossen mit Fehlern'}
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              {cotizacionEspecieResult.message && <div>{cotizacionEspecieResult.message}</div>}
              <div>
                verarbeitet: {cotizacionEspecieResult.processed_count ?? 0}, neu: {cotizacionEspecieResult.inserted_count ?? 0}, aktualisiert:{' '}
                {cotizacionEspecieResult.updated_count ?? 0}, übersprungen: {cotizacionEspecieResult.skipped_count ?? 0}, Fehler:{' '}
                {cotizacionEspecieResult.error_count ?? 0}
              </div>
              {Array.isArray(cotizacionEspecieResult.errors) && cotizacionEspecieResult.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto text-xs bg-gray-50 border border-gray-200 rounded p-2">
                  {cotizacionEspecieResult.errors.slice(0, 50).map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {cotizacionEspecieError && (
        <Alert variant="destructive">
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{cotizacionEspecieError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={openCotizacionEspecieConfirm} disabled={loading}>
          Cotizacion Especie Import starten
        </Button>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => (loading ? null : setConfirmOpen(false))} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Import bestätigen</h4>
            <p className="text-sm text-gray-700 mb-4">
              Möchtest du die Datei <span className="font-medium">{file?.name}</span> für{' '}
              <span className="font-medium">
                {month}.{year}
              </span>{' '}
              importieren?
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                onClick={async () => {
                  setConfirmOpen(false)
                  await doUpload()
                }}
                disabled={loading}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmGasolinaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => (loading ? null : setConfirmGasolinaOpen(false))} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Gasolina Import bestätigen</h4>
            <p className="text-sm text-gray-700 mb-4">
              Möchtest du die Datei <span className="font-medium">{gasolinaFile?.name}</span> für{' '}
              <span className="font-medium">
                {month}.{year}
              </span>{' '}
              importieren?
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmGasolinaOpen(false)}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                onClick={async () => {
                  setConfirmGasolinaOpen(false)
                  await doGasolinaUpload()
                }}
                disabled={loading}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmCotizacionEspecieOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => (loading ? null : setConfirmCotizacionEspecieOpen(false))}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Cotizacion Especie Import bestätigen</h4>
            <p className="text-sm text-gray-700 mb-4">
              Möchtest du die Datei <span className="font-medium">{cotizacionEspecieFile?.name}</span> für{' '}
              <span className="font-medium">
                {month}.{year}
              </span>{' '}
              importieren?
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmCotizacionEspecieOpen(false)}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                onClick={async () => {
                  setConfirmCotizacionEspecieOpen(false)
                  await doCotizacionEspecieUpload()
                }}
                disabled={loading}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
