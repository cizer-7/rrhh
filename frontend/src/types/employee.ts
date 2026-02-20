export interface Employee {



  id_empleado: number;



  nombre: string;



  apellido: string;



  ceco?: string;

  kategorie?: 'Techniker' | 'Office' | string;



  activo: boolean;



  fecha_alta?: string;



  fecha_creacion?: string;



  fecha_modificacion?: string;



}







export interface EmployeeFte {



  anio: number;



  mes: number;



  porcentaje: number;



  fecha_modificacion?: string;



}







export interface Salary {



  id_empleado: number;



  anio: number;



  modalidad: number;



  antiguedad: number;



  salario_anual_bruto: number;



  salario_mensual_bruto: number;



  atrasos?: number;



  salario_mensual_con_atrasos?: number;



  fecha_creacion?: string;



  fecha_modificacion?: string;



}







export interface Ingresos {



  id_empleado: number;



  anio: number;



  mes?: number;



  ticket_restaurant: number;



  primas: number;



  dietas_cotizables: number;



  horas_extras: number;



  dias_exentos: number;



  dietas_exentas: number;



  seguro_pensiones: number;



  lavado_coche: number;



  beca_escolar: number;



  formacion: number;



  tickets: number;



  fecha_creacion?: string;



  fecha_modificacion?: string;



}







export interface Deducciones {



  id_empleado: number;



  anio: number;



  mes?: number;



  seguro_accidentes: number;



  adelas: number;



  sanitas: number;



  gasolina: number;



  ret_especie: number;



  seguro_medico: number;



  cotizacion_especie: number;



  fecha_creacion?: string;



  fecha_modificacion?: string;



}







export interface EmployeeCompleteInfo {



  employee: Employee;



  salaries: Salary[];



  ingresos: Ingresos[];



  deducciones: Deducciones[];



  fte?: EmployeeFte[];



}



