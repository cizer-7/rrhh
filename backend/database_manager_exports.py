from typing import Any, Dict, List, Optional

import pandas as pd


class DatabaseManagerExportsMixin:
    def _calculate_salario_mes_for_export(
        self,
        month: int,
        payout_month: int,
        salario_mensual_bruto: float,
        atrasos: float,
        salario_mensual_bruto_prev: float,
        antiguedad: float,
        fte_porcentaje: float = 100.0,
    ) -> float:
        salario_mensual_bruto = float(salario_mensual_bruto or 0)
        atrasos = float(atrasos or 0)
        salario_mensual_bruto_prev = float(salario_mensual_bruto_prev or 0)
        antiguedad = float(antiguedad or 0)
        fte_porcentaje = float(fte_porcentaje or 100.0)

        months_before_payout = max(0, int(payout_month) - 1)
        fte_factor = fte_porcentaje / 100.0

        if months_before_payout > 0 and 1 <= int(month) <= months_before_payout:
            # Vorjahresgehalt, nur Basis mit FTE, antiguedad voll
            # Wenn Vorjahresgehalt 0 oder nicht vorhanden, verwendet aktuelles Gehalt
            prev_salary = float(salario_mensual_bruto_prev or 0)
            if prev_salary <= 0:
                # Kein Vorjahresgehalt - verwendet aktuelles Gehalt
                return (salario_mensual_bruto + antiguedad) * fte_factor
            else:
                return (prev_salary + antiguedad) * fte_factor
        elif int(month) == int(payout_month):
            # Neues Gehalt (reduzierte Basis) + monatsscharfe Atrasos + antiguedad
            base_salary = (salario_mensual_bruto + antiguedad) * fte_factor
            # Atrasos = Summe (new - old) * fte(k) für k=1..months_before_payout
            # Nur berechnen wenn Vorjahresgehalt > 0
            prev_salary = float(salario_mensual_bruto_prev or 0)
            if prev_salary > 0 and months_before_payout > 0:
                diff = salario_mensual_bruto - prev_salary
                atrasos_total = 0.0
                # Simulate month-specific FTE like frontend:
                # January: 100% (no FTE reduction yet)
                # February/March: current FTE (50%)
                for k in range(1, months_before_payout + 1):
                    if k == 1:  # January
                        month_fte = 1.0
                    else:  # February, March
                        month_fte = fte_factor
                    atrasos_total += diff * month_fte
                return base_salary + atrasos_total
            else:
                # Keine Atrasos wenn kein Vorjahresgehalt
                return base_salary
        else:
            # Normale Monate ab payoutMonth+1: neues Gehalt mit FTE, antiguedad voll
            return (salario_mensual_bruto + antiguedad) * fte_factor

    def export_nomina_excel(
        self,
        year: int,
        output_path: str,
        month: int = None,
        extra: bool = False,
    ) -> bool:
        """Exportiert Gehaltsdaten im Excel-Format - nur monatlicher Export wird unterstützt"""

        try:
            if not month:
                self.logger.error("Monatlicher Export erfordert eine Monatsangabe")
                return False

            extra_where = "AND s.modalidad = 14" if extra else ""

            query = f"""
            SELECT 
                CONCAT(e.apellido, ', ', e.nombre) as nombre_completo,
                e.ceco,
                COALESCE(s.modalidad, 0) as modalidad,
                COALESCE(s.salario_mensual_bruto, 0) as salario_mensual_bruto,
                COALESCE(s.atrasos, 0) as atrasos,
                COALESCE(s.antiguedad, 0) as antiguedad,
                COALESCE(sp.salario_mensual_bruto, 0) as salario_mensual_bruto_prev,
                COALESCE((
                    SELECT f.porcentaje
                    FROM t008_empleado_fte f
                    WHERE f.id_empleado = e.id_empleado
                      AND (f.anio < %s OR (f.anio = %s AND f.mes <= %s))
                    ORDER BY f.anio DESC, f.mes DESC
                    LIMIT 1
                ), 100) as fte_porcentaje,
                COALESCE(i.ticket_restaurant, 0) as ticket_restaurant,
                COALESCE(d.cotizacion_especie, 0) as cotizacion_especie,
                COALESCE(i.primas, 0) as primas,
                COALESCE(i.dietas_cotizables, 0) as dietas_cotizables,
                COALESCE(i.horas_extras, 0) as horas_extras,
                COALESCE(i.seguro_pensiones, 0) as seguro_pensiones,
                COALESCE(d.seguro_accidentes, 0) as seguro_accidentes,
                COALESCE(i.dietas_exentas, 0) as dietas_exentas,
                COALESCE(i.formacion, 0) as formacion,
                COALESCE(d.adelas, 0) as adelas,
                COALESCE(d.sanitas, 0) as sanitas,
                COALESCE(d.gasolina_arval, 0) as gasolina_arval,
                COALESCE(d.gasolina_ald, 0) as gasolina_ald,
                COALESCE(i.dias_exentos, 0) as dias_exentos
            FROM t001_empleados e
            LEFT JOIN t002_salarios s ON e.id_empleado = s.id_empleado AND s.anio = %s
            LEFT JOIN t002_salarios sp ON e.id_empleado = sp.id_empleado AND sp.anio = %s
            LEFT JOIN t003_ingresos_brutos_mensuales i ON e.id_empleado = i.id_empleado AND i.anio = %s AND i.mes = %s
            LEFT JOIN t004_deducciones_mensuales d ON e.id_empleado = d.id_empleado AND d.anio = %s AND d.mes = %s
            WHERE e.activo = TRUE
            {extra_where}
            ORDER BY e.apellido, e.nombre
            """

            data = self.execute_query(query, (year, year, month, year, year - 1, year, month, year, month))

            if not data:
                self.logger.warning(f"Keine Daten für Jahr {year} gefunden")
                return False

            df = pd.DataFrame(data)

            # Convert all numeric columns to float to avoid decimal/float type issues
            numeric_columns = [
                'salario_mensual_bruto', 'atrasos', 'antiguedad', 'salario_mensual_bruto_prev',
                'fte_porcentaje',
                'ticket_restaurant', 'cotizacion_especie', 'primas', 'dietas_cotizables',
                'horas_extras', 'seguro_pensiones', 'seguro_accidentes', 'dietas_exentas',
                'formacion', 'adelas', 'sanitas', 'gasolina_arval', 'gasolina_ald', 'dias_exentos'
            ]
            
            for col in numeric_columns:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(float)

            payout_month = self.get_payout_month() if hasattr(self, "get_payout_month") else 4
            df['salario_mes'] = df.apply(
                lambda r: self._calculate_salario_mes_for_export(
                    month=month,
                    payout_month=payout_month,
                    salario_mensual_bruto=r.get('salario_mensual_bruto', 0),
                    atrasos=r.get('atrasos', 0),
                    salario_mensual_bruto_prev=r.get('salario_mensual_bruto_prev', 0),
                    antiguedad=r.get('antiguedad', 0),
                    fte_porcentaje=r.get('fte_porcentaje', 100),
                ),
                axis=1,
            )

            if extra:
                columns = [
                    'nombre_completo',
                    'ceco',
                    'salario_mes',
                ]
                df = df[columns]

                with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                    empty_df = pd.DataFrame([[None] * 3] * 3)
                    empty_df.to_excel(writer, sheet_name='Sheet1', index=False, header=False)

                    header_row = pd.DataFrame([[None] * 3])
                    header_row.iloc[0, 0] = 'Suma de IMPORTE'
                    header_row.iloc[0, 1] = 'Etiquetas de columna'
                    header_row.to_excel(writer, sheet_name='Sheet1', index=False, header=False, startrow=3)

                    column_names = [
                        'Etiquetas de fila',
                        'CECO',
                        'SALARIO MES',
                    ]
                    columns_df = pd.DataFrame([column_names])
                    columns_df.to_excel(writer, sheet_name='Sheet1', index=False, header=False, startrow=4)

                    df.columns = column_names
                    df.to_excel(writer, sheet_name='Sheet1', index=False, header=False, startrow=5)

                    empty_row_df = pd.DataFrame([[None] * len(column_names)])
                    empty_row_df.to_excel(writer, sheet_name='Sheet1', index=False, header=False, startrow=len(df) + 6)

                    last_row = len(df) + 7
                    worksheet = writer.sheets['Sheet1']

                    data_start_row = 6
                    data_end_row = len(df) + 5
                    worksheet[f'C{last_row}'] = f"=SUM(C{data_start_row}:C{data_end_row})"
                    worksheet[f'C{last_row}'].number_format = '#,##0.00'

                self.logger.info(f"Excel-Export erfolgreich: {output_path}")
                return True

            df['total'] = (
                df['salario_mes']
                + df['ticket_restaurant']
                + df['cotizacion_especie']
                + df['primas']
                + df['dietas_cotizables']
                + df['horas_extras']
                + df['seguro_pensiones']
                + df['seguro_accidentes']
                + df['dietas_exentas']
            )

            df['anticipos'] = df['ticket_restaurant'] + df['dietas_cotizables'] + df['dietas_exentas']

            df['total_especie'] = df['cotizacion_especie'] + df['seguro_pensiones'] + df['seguro_accidentes']

            df['base_imponible'] = df['salario_mes'] + df['primas'] + df['horas_extras']

            df['seguro_medico'] = df['adelas'] + df['sanitas']

            columns = [
                'nombre_completo',
                'ceco',
                'salario_mes',
                'ticket_restaurant',
                'cotizacion_especie',
                'primas',
                'dietas_cotizables',
                'horas_extras',
                'seguro_pensiones',
                'seguro_accidentes',
                'dietas_exentas',
                'formacion',
                'adelas',
                'sanitas',
                'gasolina_arval',
                'gasolina_ald',
                'dias_exentos',
                'total',
                'anticipos',
                'total_especie',
                'base_imponible',
                'seguro_medico',
            ]

            df = df[columns]

            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                empty_df = pd.DataFrame([[None] * 22] * 3)
                empty_df.to_excel(writer, sheet_name='Sheet1', index=False, header=False)

                header_row = pd.DataFrame([[None] * 22])
                header_row.iloc[0, 0] = 'Suma de IMPORTE'
                header_row.iloc[0, 1] = 'Etiquetas de columna'
                header_row.to_excel(writer, sheet_name='Sheet1', index=False, header=False, startrow=3)

                column_names = [
                    'Etiquetas de fila',
                    'CECO',
                    'SALARIO MES',
                    'TICKET RESTAURANT',
                    'COTIZACIÓN ESPECIE',
                    'PRIMAS',
                    'DIETAS COTIZABLES',
                    'HORAS EXTRAS',
                    'SEGURO PENSIONES',
                    'SEGURO ACCIDENTES',
                    'DIETAS EXENTAS',
                    'FORMACION',
                    'ADESLAS',
                    'SANITAS',
                    'GASOLINA ARVAL',
                    'GASOLINA ALD',
                    'DÍAS EXENTOS',
                    'TOTAL',
                    'ANTICIPOS',
                    'TOTAL ESPECIE',
                    'BASE IMPONIBLE',
                    'SEGURO MÉDICO',
                ]

                columns_df = pd.DataFrame([column_names])
                columns_df.to_excel(writer, sheet_name='Sheet1', index=False, header=False, startrow=4)

                df.columns = column_names
                df.to_excel(writer, sheet_name='Sheet1', index=False, header=False, startrow=5)

                empty_row_df = pd.DataFrame([[None] * len(column_names)])
                empty_row_df.to_excel(writer, sheet_name='Sheet1', index=False, header=False, startrow=len(df) + 6)

                last_row = len(df) + 7
                worksheet = writer.sheets['Sheet1']

                for col_idx in range(2, 22):
                    col_letter = chr(65 + col_idx)
                    if col_letter <= 'V':
                        if col_idx - 1 < len(column_names):
                            col_name = column_names[col_idx - 1]
                            if col_name not in ['Etiquetas de fila', 'CECO']:
                                data_start_row = 6
                                data_end_row = len(df) + 5
                                formula = f"=SUM({col_letter}{data_start_row}:{col_letter}{data_end_row})"
                                worksheet[f'{col_letter}{last_row}'] = formula
                                cell = worksheet[f'{col_letter}{last_row}']
                                cell.number_format = '#,##0.00'

            self.logger.info(f"Excel-Export erfolgreich: {output_path}")
            return True

        except Exception as e:
            self.logger.error(f"Fehler beim Excel-Export: {e}")
            return False

    def export_asiento_nomina_excel(self, year: int, month: int, output_path: str) -> bool:
        """Exportiert Gehaltsdaten im Asiento Nomina Excel-Format"""

        try:
            query = """
            SELECT 
                e.id_empleado,
                e.ceco,
                CONCAT(e.apellido, ', ', e.nombre) as nombre_completo,
                COALESCE(s.salario_mensual_bruto, 0) as salario_mensual_bruto,
                COALESCE(s.atrasos, 0) as atrasos,
                COALESCE(s.antiguedad, 0) as antiguedad,
                COALESCE(sp.salario_mensual_bruto, 0) as salario_mensual_bruto_prev,
                COALESCE((
                    SELECT f.porcentaje
                    FROM t008_empleado_fte f
                    WHERE f.id_empleado = e.id_empleado
                      AND (f.anio < %s OR (f.anio = %s AND f.mes <= %s))
                    ORDER BY f.anio DESC, f.mes DESC
                    LIMIT 1
                ), 100) as fte_porcentaje,
                COALESCE(i.ticket_restaurant, 0) as ticket_restaurant,
                COALESCE(d.cotizacion_especie, 0) as cotizacion_especie,
                COALESCE(i.primas, 0) as primas,
                COALESCE(i.dietas_cotizables, 0) as dietas_cotizables,
                COALESCE(i.horas_extras, 0) as horas_extras,
                COALESCE(i.seguro_pensiones, 0) as seguro_pensiones,
                COALESCE(d.seguro_accidentes, 0) as seguro_accidentes,
                COALESCE(i.dietas_exentas, 0) as dietas_exentas,
                COALESCE(i.formacion, 0) as formacion,
                COALESCE(d.adelas, 0) as adelas,
                COALESCE(d.sanitas, 0) as sanitas,
                COALESCE(d.gasolina_arval, 0) as gasolina_arval,
                COALESCE(d.gasolina_ald, 0) as gasolina_ald,
                COALESCE(i.dias_exentos, 0) as dias_exentos
            FROM t001_empleados e
            LEFT JOIN t002_salarios s ON e.id_empleado = s.id_empleado AND s.anio = %s
            LEFT JOIN t002_salarios sp ON e.id_empleado = sp.id_empleado AND sp.anio = %s
            LEFT JOIN t003_ingresos_brutos_mensuales i ON e.id_empleado = i.id_empleado AND i.anio = %s AND i.mes = %s
            LEFT JOIN t004_deducciones_mensuales d ON e.id_empleado = d.id_empleado AND d.anio = %s AND d.mes = %s
            WHERE e.activo = TRUE
            ORDER BY e.apellido, e.nombre
            """

            data = self.execute_query(query, (year, year, month, year, year - 1, year, month, year, month))

            if not data:
                self.logger.warning(f"Keine Daten für Jahr {year}, Monat {month} gefunden")
                return False

            df = pd.DataFrame(data)

            # Convert all numeric columns to float to avoid decimal/float type issues
            numeric_columns = [
                'salario_mensual_bruto', 'atrasos', 'antiguedad', 'salario_mensual_bruto_prev',
                'fte_porcentaje',
                'ticket_restaurant', 'cotizacion_especie', 'primas', 'dietas_cotizables',
                'horas_extras', 'seguro_pensiones', 'seguro_accidentes', 'dietas_exentas',
                'formacion', 'adelas', 'sanitas', 'gasolina_arval', 'gasolina_ald', 'dias_exentos'
            ]
            
            for col in numeric_columns:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(float)

            payout_month = self.get_payout_month() if hasattr(self, "get_payout_month") else 4
            df['salario_mes'] = df.apply(
                lambda r: self._calculate_salario_mes_for_export(
                    month=month,
                    payout_month=payout_month,
                    salario_mensual_bruto=r.get('salario_mensual_bruto', 0),
                    atrasos=r.get('atrasos', 0),
                    salario_mensual_bruto_prev=r.get('salario_mensual_bruto_prev', 0),
                    antiguedad=r.get('antiguedad', 0),
                    fte_porcentaje=r.get('fte_porcentaje', 100),
                ),
                axis=1,
            )

            df['seguro_medico'] = df['adelas'] + df['sanitas']
            df['combustible'] = df['gasolina_arval'] + df['gasolina_ald']

            month_names = [
                '',
                'Enero',
                'Febrero',
                'Marzo',
                'Abril',
                'Mayo',
                'Junio',
                'Julio',
                'Agosto',
                'Septiembre',
                'Octubre',
                'Noviembre',
                'Diciembre',
            ]

            month_str = month_names[month]
            month_year_str = f"NOMINA {month}.{str(year)[2:]}"

            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                workbook = writer.book
                worksheet = workbook.create_sheet('Sheet1')

                column_widths = {
                    'A': 15,
                    'B': 3,
                    'C': 3,
                    'D': 15,
                    'E': 3,
                    'F': 3,
                    'G': 25,
                    'H': 3,
                    'I': 3,
                    'J': 3,
                    'K': 3,
                    'L': 10,
                    'M': 25,
                    'N': 30,
                }

                for col, width in column_widths.items():
                    worksheet.column_dimensions[col].width = width

                row_num = 1

                worksheet[f'A{row_num}'] = 'Cta.General'
                worksheet[f'B{row_num}'] = 'TEXTO BREVE'
                worksheet[f'D{row_num}'] = 'IMPORTE'
                worksheet[f'E{row_num}'] = 'IMPORTE EN MON.'
                worksheet[f'G{row_num}'] = 'TEXTO'
                worksheet[f'L{row_num}'] = 'CeCo'
                row_num += 1

                worksheet[f'A{row_num}'] = 142710300
                worksheet[f'C{row_num}'] = 'H'
                worksheet[f'G{row_num}'] = month_year_str
                worksheet[f'M{row_num}'] = 'IRPF'
                row_num += 1

                worksheet[f'A{row_num}'] = 142921300
                worksheet[f'C{row_num}'] = 'H'
                worksheet[f'G{row_num}'] = month_year_str
                worksheet[f'M{row_num}'] = 'SEG.SOC.'
                row_num += 1

                for idx, emp in df.iterrows():
                    worksheet[f'A{row_num}'] = 162111110
                    worksheet[f'C{row_num}'] = 'D'
                    worksheet[f'D{row_num}'] = emp['salario_mes']
                    worksheet[f'G{row_num}'] = month_year_str
                    worksheet[f'L{row_num}'] = emp['ceco']
                    if idx == 0:
                        worksheet[f'M{row_num}'] = 'SUELDOS Y SALARIOS'
                    worksheet[f'N{row_num}'] = emp['nombre_completo']
                    row_num += 1

                for idx, emp in df.iterrows():
                    worksheet[f'A{row_num}'] = 162711150
                    worksheet[f'C{row_num}'] = 'D'
                    worksheet[f'D{row_num}'] = ''
                    worksheet[f'G{row_num}'] = month_year_str
                    worksheet[f'L{row_num}'] = emp['ceco']
                    if idx == 0:
                        worksheet[f'M{row_num}'] = 'SEG.SOCIAL A CARGO EMPRESA'
                    worksheet[f'N{row_num}'] = emp['nombre_completo']
                    row_num += 1

                for idx, emp in df.iterrows():
                    worksheet[f'A{row_num}'] = 162511500
                    worksheet[f'C{row_num}'] = 'D'
                    worksheet[f'D{row_num}'] = emp['horas_extras'] if emp['horas_extras'] > 0 else ''
                    worksheet[f'G{row_num}'] = month_year_str
                    worksheet[f'L{row_num}'] = emp['ceco']
                    if idx == 0:
                        worksheet[f'M{row_num}'] = 'HORAS EXTRAS'
                    worksheet[f'N{row_num}'] = emp['nombre_completo']
                    row_num += 1

                for idx, emp in df.iterrows():
                    worksheet[f'A{row_num}'] = 162610500
                    worksheet[f'C{row_num}'] = 'D'
                    worksheet[f'D{row_num}'] = emp['primas'] if emp['primas'] > 0 else ''
                    worksheet[f'G{row_num}'] = month_year_str
                    worksheet[f'L{row_num}'] = emp['ceco']
                    if idx == 0:
                        worksheet[f'M{row_num}'] = 'PRIMAS'
                    worksheet[f'N{row_num}'] = emp['nombre_completo']
                    row_num += 1

                total_seguro_medico = df['seguro_medico'].sum()
                total_combustible = df['combustible'].sum()

                worksheet[f'A{row_num}'] = 642100004
                worksheet[f'C{row_num}'] = 'H'
                worksheet[f'G{row_num}'] = f"{month_year_str} Seg. Medico"
                worksheet[f'D{row_num}'] = total_seguro_medico
                worksheet[f'M{row_num}'] = 'SANITAS+ADESLAS'
                row_num += 1

                worksheet[f'A{row_num}'] = 628100005
                worksheet[f'C{row_num}'] = 'H'
                worksheet[f'G{row_num}'] = f"{month_year_str} COMBUSTIBLE"
                worksheet[f'D{row_num}'] = total_combustible
                worksheet[f'M{row_num}'] = 'COMBUSTIBLE'
                row_num += 1

                worksheet[f'A{row_num}'] = 476000003
                worksheet[f'C{row_num}'] = 'H'
                worksheet[f'G{row_num}'] = month_year_str
                worksheet[f'M{row_num}'] = 'SEG. SOCIAL A PAGAR'
                row_num += 1

                worksheet[f'A{row_num}'] = 465000006
                worksheet[f'C{row_num}'] = 'H'
                worksheet[f'G{row_num}'] = month_year_str
                worksheet[f'M{row_num}'] = 'LIQUIDO A PERCIBIR'
                row_num += 1

                worksheet[f'A{row_num}'] = 142951200
                worksheet[f'C{row_num}'] = 'H'
                worksheet[f'G{row_num}'] = month_year_str
                row_num += 1

                sum_row = row_num
                formula = f'=SUMIF(N:N,"*",D:D)-SUMIF(N:N,"",D:D)+D{sum_row}'
                worksheet[f'D{row_num}'] = formula

            self.logger.info(f"Asiento Nomina Excel-Export erfolgreich: {output_path}")
            return True

        except Exception as e:
            self.logger.error(f"Fehler beim Asiento Nomina Excel-Export: {e}")
            return False
