/**
 * Cliente API para la comunicación con el Backend FastAPI
 */



const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://salary-management.azurewebsites.net'



class ApiClient {

  private baseURL: string

  private token: string | null = null



  constructor(baseURL: string = API_BASE_URL) {

    this.baseURL = baseURL

    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  }



  private async request<T>(

    endpoint: string,

    options: RequestInit = {}

  ): Promise<T> {

    const url = `${this.baseURL}${endpoint}`

    

    const headers: Record<string, string> = {

      'Content-Type': 'application/json',

      ...(options.headers as Record<string, string> || {}),

    }



    if (this.token) {

      headers.Authorization = `Bearer ${this.token}`

    }



    const response = await fetch(url, {

      ...options,

      headers,

    })



    if (!response.ok) {

      const errorData = await response.json().catch(() => ({}))

      throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`)

    }



    return response.json()

  }



  setToken(token: string) {

    this.token = token

    if (typeof window !== 'undefined') {

      localStorage.setItem('token', token)

    }

  }



  clearToken() {

    this.token = null

    if (typeof window !== 'undefined') {

      localStorage.removeItem('token')

    }

  }



  // Autenticación

  async login(username: string, password: string) {

    const response = await this.request<any>('/auth/login', {

      method: 'POST',

      body: JSON.stringify({ username, password }),

    })

    

    this.setToken(response.access_token)

    return response

  }



  async forgotPassword(username: string) {

    return this.request<any>('/forgot-password', {

      method: 'POST',

      body: JSON.stringify({ username }),

    })

  }



  async resetPassword(token: string, newPassword: string) {

    return this.request<any>('/reset-password', {

      method: 'POST',

      body: JSON.stringify({ token, new_password: newPassword }),

    })

  }



  async validateResetToken(token: string) {

    return this.request<any>('/validate-reset-token', {

      method: 'POST',

      body: JSON.stringify({ token }),

    })

  }



  // Empleados

  async getEmployees() {

    return this.request<any[]>('/employees')

  }



  async getEmployee(id: number) {

    return this.request<any>(`/employees/${id}`)

  }



  async createEmployee(employee: any) {

    return this.request<any>('/employees', {

      method: 'POST',

      body: JSON.stringify(employee),

    })

  }



  async updateEmployee(id: number, employee: any) {

    return this.request<any>(`/employees/${id}`, {

      method: 'PUT',

      body: JSON.stringify(employee),

    })

  }



  async deleteEmployee(id: number) {

    return this.request<any>(`/employees/${id}`, {

      method: 'DELETE',

    })

  }



  async searchEmployees(searchTerm: string) {

    return this.request<any[]>(`/employees/search/${encodeURIComponent(searchTerm)}`)

  }



  // Salarios

  async addSalary(employeeId: number, salary: any) {

    return this.request<any>(`/employees/${employeeId}/salaries`, {

      method: 'POST',

      body: JSON.stringify(salary),

    })

  }



  async updateSalary(employeeId: number, year: number, salary: any) {

    return this.request<any>(`/employees/${employeeId}/salaries/${year}`, {

      method: 'PUT',

      body: JSON.stringify(salary),

    })

  }



  async deleteSalary(employeeId: number, year: number) {

    return this.request<any>(`/employees/${employeeId}/salaries/${year}`, {

      method: 'DELETE',

    })

  }



  // Ingresos

  async updateIngresos(employeeId: number, year: number, ingresos: any) {

    return this.request<any>(`/employees/${employeeId}/ingresos/${year}`, {

      method: 'PUT',

      body: JSON.stringify(ingresos),

    })

  }



  // Ingresos Mensuales

  async updateIngresosMensuales(employeeId: number, year: number, month: number, ingresos: any) {

    return this.request<any>(`/employees/${employeeId}/ingresos/${year}/${month}`, {

      method: 'PUT',

      body: JSON.stringify(ingresos),

    })

  }



  // Deducciones

  async updateDeducciones(employeeId: number, year: number, deducciones: any) {

    return this.request<any>(`/employees/${employeeId}/deducciones/${year}`, {

      method: 'PUT',

      body: JSON.stringify(deducciones),

    })

  }



  // Deducciones Mensuales

  async updateDeduccionesMensuales(employeeId: number, year: number, month: number, deducciones: any) {

    return this.request<any>(`/employees/${employeeId}/deducciones/${year}/${month}`, {

      method: 'PUT',

      body: JSON.stringify(deducciones),

    })

  }



  async getBearbeitungslog(employeeId: number, params?: { anio?: number; mes?: number; limit?: number }) {

    const search = new URLSearchParams()

    if (params?.anio !== undefined) search.set('anio', String(params.anio))

    if (params?.mes !== undefined) search.set('mes', String(params.mes))

    if (params?.limit !== undefined) search.set('limit', String(params.limit))

    const qs = search.toString()

    return this.request<{ items: any[] }>(`/employees/${employeeId}/bearbeitungslog${qs ? `?${qs}` : ''}`)

  }



  async getEmployeeFte(employeeId: number) {

    return this.request<{ items: any[] }>(`/employees/${employeeId}/fte`)

  }



  async upsertEmployeeFte(employeeId: number, payload: { anio: number; mes: number; porcentaje: number }) {

    return this.request<any>(`/employees/${employeeId}/fte`, {

      method: 'PUT',

      body: JSON.stringify(payload),

    })

  }



  async deleteEmployeeFte(employeeId: number, year: number, month: number) {

    return this.request<any>(`/employees/${employeeId}/fte/${year}/${month}`, {

      method: 'DELETE',

    })

  }



  // Excel Export

  async exportExcel(year: number, month?: number): Promise<Blob> {

    const url = month ? `${this.baseURL}/export/excel/${year}/${month}` : `${this.baseURL}/export/excel/${year}`

    

    const headers: Record<string, string> = {}

    if (this.token) {

      headers.Authorization = `Bearer ${this.token}`

    }



    const response = await fetch(url, { headers })

    

    if (!response.ok) {

      throw new Error(`Export failed: ${response.statusText}`)

    }



    return response.blob()

  }



  // Health Check

  async healthCheck() {

    return this.request<any>('/health')

  }







  // Settings

  async getPayoutMonth() {

    return this.request<{ payout_month: number }>('/settings/payout-month')

  }







  async setPayoutMonth(payoutMonth: number) {

    return this.request<{ success: boolean; payout_month: number }>('/settings/payout-month', {

      method: 'PUT',

      body: JSON.stringify({ payout_month: payoutMonth }),

    })

  }







  async applyIngresosDeduccionesToAllActive(year: number, payload: { ingresos?: any; deducciones?: any; kategorie?: 'Techniker' | 'Office' }) {

    return this.request<any>('/settings/apply-ingresos-deducciones', {

      method: 'POST',

      body: JSON.stringify({ year, ...payload }),

    })

  }



  // Carry Over

  async getCarryOverBySource(employeeId: number, year: number, month: number) {

    return this.request<{ items: any[] }>(`/carry-over/${employeeId}/${year}/${month}`)

  }



  async createCarryOver(payload: { employee_id: number; year: number; month: number; items: { concept: string; amount: number }[]; defer_concepts?: string[] }) {

    return this.request<{ success: boolean }>('/carry-over', {

      method: 'POST',

      body: JSON.stringify(payload),

    })

  }



  async deleteCarryOver(carryOverId: number) {

    return this.request<{ success: boolean }>(`/carry-over/${carryOverId}`, {

      method: 'DELETE',

    })

  }

}



export const apiClient = new ApiClient()

export default apiClient

