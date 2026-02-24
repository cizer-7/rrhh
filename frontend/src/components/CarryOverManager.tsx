'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import apiClient from '@/lib/api'
import { Employee } from '@/types/employee'

type CarryOverItem = {
  id_carry_over: number
  id_empleado: number
  source_anio: number
  source_mes: number
  apply_anio: number
  apply_mes: number
  concept: string
  amount: number
  created_at?: string
  updated_at?: string
}

type ConceptKey =
  | 'horas_extras'
  | 'primas'
  | 'dietas_cotizables'
  | 'dietas_exentas'
  | 'anticipos'
  | 'salary'

const CONCEPTS: { key: ConceptKey; label: string }[] = [
  { key: 'horas_extras', label: 'Horas extra' },
  { key: 'primas', label: 'Primas' },
  { key: 'dietas_cotizables', label: 'Dietas cotizables' },
  { key: 'dietas_exentas', label: 'Dietas exentas' },
  { key: 'anticipos', label: 'Anticipos' },
  { key: 'salary', label: 'Salary' },
]

export default function CarryOverManager({ employees }: { employees: Employee[] }) {
  const now = new Date()
  const [employeeId, setEmployeeId] = useState<number | ''>('')
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)

  const [enabled, setEnabled] = useState<Record<ConceptKey, boolean>>({
    horas_extras: false,
    primas: false,
    dietas_cotizables: false,
    dietas_exentas: false,
    anticipos: false,
    salary: false,
  })

  const [amounts, setAmounts] = useState<Record<ConceptKey, string>>({
    horas_extras: '',
    primas: '',
    dietas_cotizables: '',
    dietas_exentas: '',
    anticipos: '',
    salary: '',
  })

  const [salarySign, setSalarySign] = useState<'plus' | 'minus'>('plus')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [items, setItems] = useState<CarryOverItem[]>([])

  const years = useMemo(() => {
    const start = now.getFullYear() - 4
    return Array.from({ length: 15 }, (_, i) => start + i)
  }, [now])

  const selectedEmployeeName = useMemo(() => {
    if (employeeId === '') return ''
    const e = employees.find((x) => x.id_empleado === employeeId)
    if (!e) return ''
    return `${e.apellido}, ${e.nombre}`
  }, [employeeId, employees])

  const load = async () => {
    if (employeeId === '') {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getCarryOverBySource(employeeId, year, month)
      setItems(Array.isArray(res?.items) ? res.items : [])
    } catch (e: any) {
      setError(e?.message || 'Error al cargar')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSuccess(null)
    setError(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, year, month])

  const toggleEnabled = (key: ConceptKey, value: boolean) => {
    setEnabled((prev) => ({ ...prev, [key]: value }))
    if (!value) {
      setAmounts((prev) => ({ ...prev, [key]: '' }))
    }
  }

  const doSave = async () => {
    setSuccess(null)
    setError(null)

    if (employeeId === '') {
      setError('Por favor, seleccione un empleado.')
      return
    }

    const toFloat = (s: string) => {
      const v = parseFloat(String(s).replace(',', '.'))
      return Number.isFinite(v) ? v : 0
    }

    const payloadItems: { concept: string; amount: number }[] = []
    for (const c of CONCEPTS) {
      if (!enabled[c.key]) continue
      let amount = toFloat(amounts[c.key])
      if (c.key === 'salary' && amount !== 0) {
        amount = salarySign === 'minus' ? -Math.abs(amount) : Math.abs(amount)
      }
      if (amount === 0) continue
      payloadItems.push({ concept: c.key, amount })
    }

    if (payloadItems.length === 0) {
      setError('Por favor, seleccione al menos un concepto e ingrese un monto.')
      return
    }

    setSaving(true)
    try {
      await apiClient.createCarryOver({
        employee_id: employeeId,
        year,
        month,
        items: payloadItems,
      })

      setSuccess(`Carry Over guardado para ${selectedEmployeeName || employeeId} (${month}.${year}). Aplicará el mes siguiente.`)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async (id: number) => {
    setSuccess(null)
    setError(null)
    setSaving(true)
    try {
      await apiClient.deleteCarryOver(id)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Error al eliminar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Carry Over</h3>
        <p className="text-sm text-gray-600">
          Guarda montos por empleado y mes que se sumarán automáticamente al mes siguiente. Los Carry Overs entrantes del mes anterior se transfieren automáticamente al siguiente mes al guardar.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertTitle>OK</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value ? parseInt(e.target.value, 10) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          >
            <option value="">Por favor seleccione</option>
            {employees
              .slice()
              .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
              .map((e) => (
                <option key={e.id_empleado} value={e.id_empleado}>
                  {e.apellido}, {e.nombre} (#{e.id_empleado})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mes (Fuente)</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4 text-sm font-medium text-gray-700">Concepto</div>
          <div className="md:col-span-2 text-sm font-medium text-gray-700">Activo</div>
          <div className="md:col-span-6 text-sm font-medium text-gray-700">Monto (€)</div>
        </div>

        {CONCEPTS.map((c) => {
          const isSalary = c.key === 'salary'
          return (
            <div key={c.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4 text-sm text-gray-900">{c.label}</div>

              <div className="md:col-span-2">
                <input
                  type="checkbox"
                  checked={enabled[c.key]}
                  onChange={(e) => toggleEnabled(c.key, e.target.checked)}
                  disabled={saving}
                />
              </div>

              <div className="md:col-span-6 flex gap-2 items-center">
                {isSalary && (
                  <select
                    value={salarySign}
                    onChange={(e) => setSalarySign(e.target.value as any)}
                    className="px-2 py-2 border border-gray-300 rounded-md"
                    disabled={saving || !enabled[c.key]}
                  >
                    <option value="plus">+</option>
                    <option value="minus">-</option>
                  </select>
                )}
                <input
                  type="text"
                  value={amounts[c.key]}
                  onChange={(e) => setAmounts((prev) => ({ ...prev, [c.key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={saving || !enabled[c.key]}
                  placeholder="0"
                />
              </div>
            </div>
          )
        })}

        <div className="pt-2">
          <Button onClick={doSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6" />

      <div className="space-y-3">
        <div>
          <h4 className="text-md font-semibold text-gray-900">Carry Overs Guardados (Fuente {month}.{year})</h4>
          <p className="text-sm text-gray-600">Estas entradas aplicarán en el mes {month === 12 ? `1.${year + 1}` : `${month + 1}.${year}`}</p>
        </div>

        {loading ? (
          <div className="text-sm text-gray-600">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-600">No hay entradas disponibles.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aplicar</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((it) => (
                  <tr key={it.id_carry_over}>
                    <td className="px-4 py-2 text-sm text-gray-900">{it.concept}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{Number(it.amount || 0).toFixed(2)} €</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {it.apply_mes}.{it.apply_anio}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="destructive" size="sm" onClick={() => doDelete(it.id_carry_over)} disabled={saving}>
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
