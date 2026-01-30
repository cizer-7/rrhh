import mysql.connector

from mysql.connector import Error

from typing import Dict, List, Any, Optional

import logging

import hashlib

import pandas as pd

from datetime import datetime



class DatabaseManager:

    def __init__(self, host: str, database: str, user: str, password: str, port: int = 3307):

        self.host = host

        self.database = database

        self.user = user

        self.password = password

        self.port = port

        self.connection = None

        self.logger = logging.getLogger(__name__)

    

    def connect(self) -> bool:

        try:

            self.connection = mysql.connector.connect(

                host=self.host,

                database=self.database,

                user=self.user,

                password=self.password,

                port=self.port

            )

            

            if self.connection.is_connected():

                self.logger.info(f"Erfolgreich verbunden mit MySQL Datenbank {self.database}")

                return True

                

        except Error as e:

            self.logger.error(f"Fehler bei der Verbindung zur Datenbank: {e}")

            return False

        

        return False

    

    def disconnect(self):

        if self.connection and self.connection.is_connected():

            self.connection.close()

            self.logger.info("Datenbankverbindung geschlossen")

    

    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:

        try:

            cursor = self.connection.cursor(dictionary=True)

            cursor.execute(query, params)

            result = cursor.fetchall()

            cursor.close()

            return result

        except Error as e:

            self.logger.error(f"Fehler bei der Abfrage: {e}")

            return []

    

    def execute_update(self, query: str, params: tuple = None) -> bool:

        try:

            cursor = self.connection.cursor()

            cursor.execute(query, params)

            self.connection.commit()

            cursor.close()

            return True

        except Error as e:

            self.logger.error(f"Fehler beim Update: {e}")

            self.logger.error(f"Query: {query}")

            self.logger.error(f"Params: {params}")

            self.connection.rollback()

            return False

    

    def get_all_employees(self) -> List[Dict]:

        query = """

        SELECT id_empleado, nombre, apellido, ceco, activo 

        FROM t001_empleados 

        ORDER BY apellido, nombre

        """

        return self.execute_query(query)

    

    def get_employee_complete_info(self, employee_id: int) -> Dict:

        # Mitarbeiterstammdaten

        employee_query = """

        SELECT id_empleado, nombre, apellido, ceco, activo 

        FROM t001_empleados 

        WHERE id_empleado = %s

        """

        employees = self.execute_query(employee_query, (employee_id,))

        

        if not employees:

            return {}

        

        employee = employees[0]

        

        # Gehaltsdaten

        salary_query = """

        SELECT anio, modalidad, antiguedad, salario_anual_bruto, salario_mensual_bruto, atrasos, salario_mensual_con_atrasos, fecha_modificacion

        FROM t002_salarios 

        WHERE id_empleado = %s 

        ORDER BY anio DESC

        """

        salaries = self.execute_query(salary_query, (employee_id,))

        

        # Bruttoeinkünfte (jahresabhängig) - Aggregiere aus monatlichen Daten
        ingresos_query = """
        SELECT 
            anio,
            ROUND(AVG(ticket_restaurant), 2) as ticket_restaurant,
            ROUND(AVG(primas), 2) as primas,
            ROUND(AVG(dietas_cotizables), 2) as dietas_cotizables,
            ROUND(AVG(horas_extras), 2) as horas_extras,
            ROUND(AVG(dias_exentos), 2) as dias_exentos,
            ROUND(AVG(dietas_exentas), 2) as dietas_exentas,
            ROUND(AVG(seguro_pensiones), 2) as seguro_pensiones,
            ROUND(AVG(lavado_coche), 2) as lavado_coche,
            ROUND(AVG(formacion), 2) as formacion,
            ROUND(AVG(tickets), 2) as tickets,
            MAX(fecha_modificacion) as fecha_modificacion
        FROM t003_ingresos_brutos_mensuales 
        WHERE id_empleado = %s
        GROUP BY anio
        ORDER BY anio DESC
        """
        ingresos_results = self.execute_query(ingresos_query, (employee_id,))
        

        # Abzüge (jahresabhängig) - Aggregiere aus monatlichen Daten
        deducciones_query = """
        SELECT 
            anio,
            ROUND(AVG(seguro_accidentes), 2) as seguro_accidentes,
            ROUND(AVG(adelas), 2) as adelas,
            ROUND(AVG(sanitas), 2) as sanitas,
            ROUND(AVG(gasolina_arval), 2) as gasolina_arval,
            ROUND(AVG(gasolina_ald), 2) as gasolina_ald,
            ROUND(AVG(ret_especie), 2) as ret_especie,
            ROUND(AVG(seguro_medico), 2) as seguro_medico,
            ROUND(AVG(cotizacion_especie), 2) as cotizacion_especie,
            MAX(fecha_modificacion) as fecha_modificacion
        FROM t004_deducciones_mensuales 
        WHERE id_empleado = %s
        GROUP BY anio
        ORDER BY anio DESC
        """
        deducciones_results = self.execute_query(deducciones_query, (employee_id,))

        

        # Monatliche Bruttoeinkünfte

        ingresos_mensuales_query = """

        SELECT anio, mes, ticket_restaurant, primas, 

               dietas_cotizables, horas_extras, dias_exentos, 

               dietas_exentas, seguro_pensiones, lavado_coche, formacion, tickets, fecha_modificacion

        FROM t003_ingresos_brutos_mensuales 

        WHERE id_empleado = %s

        ORDER BY anio DESC, mes ASC

        """

        ingresos_mensuales_results = self.execute_query(ingresos_mensuales_query, (employee_id,))

        

        # Monatliche Abzüge

        deducciones_mensuales_query = """

        SELECT anio, mes, seguro_accidentes, adelas, sanitas, 

               gasolina_arval, gasolina_ald, ret_especie, seguro_medico, cotizacion_especie, fecha_modificacion

        FROM t004_deducciones_mensuales 

        WHERE id_empleado = %s

        ORDER BY anio DESC, mes ASC

        """

        deducciones_mensuales_results = self.execute_query(deducciones_mensuales_query, (employee_id,))

        

        return {

            'employee': employee,

            'salaries': salaries,

            'ingresos': ingresos_results,

            'deducciones': deducciones_results,

            'ingresos_mensuales': ingresos_mensuales_results,

            'deducciones_mensuales': deducciones_mensuales_results

        }

    

    def update_employee(self, employee_id: int, table: str, data: Dict[str, Any]) -> bool:

        if table == 't001_empleados':

            # Nur updatable Felder erlauben

            allowed_fields = ['nombre', 'apellido', 'ceco', 'activo']

            update_fields = []

            update_values = []

            

            for field, value in data.items():

                if field in allowed_fields:

                    update_fields.append(f"{field} = %s")

                    update_values.append(value)

            

            if not update_fields:

                return False

            

            query = f"""

            UPDATE t001_empleados 

            SET {', '.join(update_fields)} 

            WHERE id_empleado = %s

            """

            update_values.append(employee_id)

            return self.execute_update(query, tuple(update_values))

        

        return False

    

    def update_salary(self, employee_id: int, year: int, data: Dict[str, Any]) -> bool:

        # Prüfen ob Gehalt für dieses Jahr existiert

        check_query = """

        SELECT id_empleado FROM t002_salarios 

        WHERE id_empleado = %s AND anio = %s

        """

        exists = self.execute_query(check_query, (employee_id, year))

        

        allowed_fields = ['modalidad', 'salario_anual_bruto', 'antiguedad']

        

        if exists:

            # Update

            update_fields = []

            update_values = []

            

            for field, value in data.items():

                if field in allowed_fields:

                    update_fields.append(f"{field} = %s")

                    update_values.append(value)

            

            if not update_fields:

                return False

            

            # Wenn sich das Jahresgehalt ändert, auch das Monatsgehalt neu berechnen

            if 'salario_anual_bruto' in data:

                modalidad = int(data.get('modalidad', 12))  # Standard oder aus den Daten

                update_fields.append("salario_mensual_bruto = %s")

                update_values.append(float(data['salario_anual_bruto']) / modalidad)

            

            query = f"""

            UPDATE t002_salarios 

            SET {', '.join(update_fields)} 

            WHERE id_empleado = %s AND anio = %s

            """

            update_values.extend([employee_id, year])

            result = self.execute_update(query, tuple(update_values))

            

            # Wenn erfolgreich und sich das Jahresgehalt geändert hat, aktualisiere Folgejahre

            if result and 'salario_anual_bruto' in data:

                self._update_subsequent_years_atrasos(employee_id, year)

            

            return result

        else:

            # Insert

            insert_fields = ['id_empleado', 'anio'] + [field for field in data.keys() if field in allowed_fields]

            insert_values = [employee_id, year] + [data[field] for field in insert_fields[2:]]

            

            # Monatsgehalt berechnen

            if 'salario_anual_bruto' in data:

                insert_fields.append('salario_mensual_bruto')

                modalidad = int(data.get('modalidad', 12))

                insert_values.append(float(data['salario_anual_bruto']) / modalidad)

            

            placeholders = ', '.join(['%s'] * len(insert_fields))

            query = f"""

            INSERT INTO t002_salarios ({', '.join(insert_fields)}) 

            VALUES ({placeholders})

            """

            result = self.execute_update(query, tuple(insert_values))

            

            # Wenn erfolgreich, aktualisiere Folgejahre

            if result:

                self._update_subsequent_years_atrasos(employee_id, year)

            

            return result

    

    def search_employees(self, search_term: str) -> List[Dict]:

        query = """

        SELECT id_empleado, nombre, apellido, ceco, activo 

        FROM t001_empleados 

        WHERE id_empleado = %s 

           OR LOWER(nombre) LIKE LOWER(%s) 

           OR LOWER(apellido) LIKE LOWER(%s) 

           OR LOWER(ceco) LIKE LOWER(%s)

        ORDER BY apellido, nombre

        """

        search_pattern = f"%{search_term}%"

        return self.execute_query(query, (search_term, search_pattern, search_pattern, search_pattern))

    

    def add_employee(self, employee_data: Dict[str, Any]) -> int:

        try:

            # Neue ID holen

            max_id_query = "SELECT COALESCE(MAX(id_empleado), 0) as max_id FROM t001_empleados"

            result = self.execute_query(max_id_query)

            new_id = result[0]['max_id'] + 1 if result else 1

            

            # Mitarbeiter einfügen

            insert_query = """

            INSERT INTO t001_empleados (id_empleado, nombre, apellido, ceco, activo) 

            VALUES (%s, %s, %s, %s, %s)

            """

            params = (

                new_id,

                employee_data.get('nombre', ''),

                employee_data.get('apellido', ''),

                employee_data.get('ceco', ''),

                employee_data.get('activo', True)

            )

            

            if self.execute_update(insert_query, params):

                # Standard-Datensätze für neuen Mitarbeiter erstellen

                self._create_default_records(new_id)

                return new_id

            else:

                return -1

                

        except Exception as e:

            self.logger.error(f"Fehler beim Hinzufügen des Mitarbeiters: {e}")

            return -1

    

    def _create_default_records(self, employee_id: int):

        # Nur noch monatliche Standarddatensätze für das aktuelle Jahr erstellen

        current_year = datetime.now().year

        self._create_monthly_default_records(employee_id, current_year)

    

    def _create_monthly_default_records(self, employee_id: int, year: int):

        """Erstellt Standard-Monatsdatensätze für einen Mitarbeiter"""

        try:

            # Monatliche Bruttoeinkünfte für alle 12 Monate erstellen

            for month in range(1, 13):

                ingresos_monthly_query = """

                INSERT INTO t003_ingresos_brutos_mensuales (id_empleado, anio, mes, ticket_restaurant, 

                                                           primas, dietas_cotizables, horas_extras, dias_exentos, 

                                                           dietas_exentas, seguro_pensiones, lavado_coche, formacion, tickets) 

                VALUES (%s, %s, %s, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

                ON DUPLICATE KEY UPDATE

                    ticket_restaurant = VALUES(ticket_restaurant),

                    primas = VALUES(primas),

                    dietas_cotizables = VALUES(dietas_cotizables),

                    horas_extras = VALUES(horas_extras),

                    dias_exentos = VALUES(dias_exentos),

                    dietas_exentas = VALUES(dietas_exentas),

                    seguro_pensiones = VALUES(seguro_pensiones),

                    lavado_coche = VALUES(lavado_coche),

                    formacion = VALUES(formacion),

                    tickets = VALUES(tickets)

                """

                self.execute_update(ingresos_monthly_query, (employee_id, year, month))

            

            # Monatliche Abzüge für alle 12 Monate erstellen

            for month in range(1, 13):

                deducciones_monthly_query = """

                INSERT INTO t004_deducciones_mensuales (id_empleado, anio, mes, seguro_accidentes, 

                                                        adelas, sanitas, gasolina_arval, gasolina_ald, cotizacion_especie) 

                VALUES (%s, %s, %s, 0, 0, 0, 0, 0, 0)

                ON DUPLICATE KEY UPDATE

                    seguro_accidentes = VALUES(seguro_accidentes),

                    adelas = VALUES(adelas),

                    sanitas = VALUES(sanitas),

                    gasolina_arval = VALUES(gasolina_arval),

                    gasolina_ald = VALUES(gasolina_ald),

                    cotizacion_especie = VALUES(cotizacion_especie)

                """

                self.execute_update(deducciones_monthly_query, (employee_id, year, month))

                

        except Exception as e:

            self.logger.error(f"Fehler beim Erstellen der monatlichen Standarddatensätze: {e}")

    

    def add_salary(self, employee_id: int, salary_data: Dict[str, Any]) -> bool:

        try:

            # Prüfen ob Mitarbeiter existiert

            employee_query = "SELECT id_empleado FROM t001_empleados WHERE id_empleado = %s"

            employee = self.execute_query(employee_query, (employee_id,))

            

            if not employee:

                self.logger.error(f"Mitarbeiter mit ID {employee_id} nicht gefunden")

                return False

            

            # Prüfen ob Gehalt für dieses Jahr bereits existiert

            year = salary_data.get('anio')

            if year is None:

                self.logger.error("Jahr nicht angegeben")

                return False

            

            check_query = "SELECT id_empleado FROM t002_salarios WHERE id_empleado = %s AND anio = %s"

            exists = self.execute_query(check_query, (employee_id, year))

            

            if exists:

                self.logger.error(f"Gehalt für Jahr {year} existiert bereits für Mitarbeiter {employee_id}")

                return False

            

            # Neues Gehalt einfügen

            insert_query = """

            INSERT INTO t002_salarios (id_empleado, anio, modalidad, antiguedad, 

                                     salario_anual_bruto, salario_mensual_bruto) 

            VALUES (%s, %s, %s, %s, %s, %s)

            """

            

            salario_anual = salary_data.get('salario_anual_bruto', 0)

            modalidad = salary_data.get('modalidad', 12)

            salario_mensual = salario_anual / modalidad

            

            params = (

                employee_id,

                year,

                salary_data.get('modalidad', 12),

                salary_data.get('antiguedad', 0),

                salario_anual,

                salario_mensual

            )

            

            result = self.execute_update(insert_query, params)

            

            # Wenn erfolgreich, prüfe ob Folgejahre existieren und aktualisiere ihre atrasos

            if result:

                self._update_subsequent_years_atrasos(employee_id, year)

            

            return result

            

        except Exception as e:

            self.logger.error(f"Fehler beim Hinzufügen des Gehalts: {e}")

            return False

    

    def _update_subsequent_years_atrasos(self, employee_id: int, base_year: int) -> None:

        """Aktualisiert atrasos für alle Folgejahre eines Mitarbeiters"""

        try:

            # Finde alle Jahre größer als base_year für diesen Mitarbeiter

            query = """

            SELECT anio, modalidad, salario_anual_bruto 

            FROM t002_salarios 

            WHERE id_empleado = %s AND anio > %s 

            ORDER BY anio ASC

            """

            subsequent_years = self.execute_query(query, (employee_id, base_year))

            

            for year_data in subsequent_years:

                current_year = year_data['anio']

                modalidad = year_data['modalidad']

                current_salario = year_data['salario_anual_bruto']

                

                # Finde das Gehalt des Vorjahres

                prev_query = """

                SELECT salario_anual_bruto 

                FROM t002_salarios 

                WHERE id_empleado = %s AND anio = %s

                """

                prev_year_data = self.execute_query(prev_query, (employee_id, current_year - 1))

                

                if prev_year_data:

                    prev_salario = prev_year_data[0]['salario_anual_bruto']

                    

                    # Berechne neues atrasos

                    if modalidad == 12:

                        new_atrasos = (current_salario - prev_salario) / 12 * 3

                    elif modalidad == 14:

                        new_atrasos = (current_salario - prev_salario) / 14 * 3

                    else:

                        new_atrasos = 0

                    

                    # Berechne neues salario_mensual_bruto

                    new_salario_mensual = current_salario / modalidad if modalidad in [12, 14] else current_salario / 12

                    

                    # Aktualisiere den Datensatz

                    update_query = """

                    UPDATE t002_salarios 

                    SET atrasos = %s, 

                        salario_mensual_con_atrasos = %s,

                        salario_mensual_bruto = %s

                    WHERE id_empleado = %s AND anio = %s

                    """

                    self.execute_update(update_query, (

                        new_atrasos,

                        new_salario_mensual + new_atrasos,

                        new_salario_mensual,

                        employee_id,

                        current_year

                    ))

                    

        except Exception as e:

            self.logger.error(f"Fehler bei der Aktualisierung der Folgejahre: {e}")

    

    def update_ingresos(self, employee_id: int, year: int, data: Dict[str, Any]) -> bool:

        """Aktualisiert oder fügt Bruttoeinkünfte für einen Mitarbeiter für alle Monate eines Jahres hinzu"""

        try:

            self.logger.info(f"update_ingresos aufgerufen für employee_id={employee_id}, year={year}")

            

            allowed_fields = [

                'ticket_restaurant', 'primas', 

                'dietas_cotizables', 'horas_extras', 'dias_exentos', 

                'dietas_exentas', 'seguro_pensiones', 'lavado_coche', 'formacion', 'tickets'

            ]

            

            # Filtere die Daten auf erlaubte Felder

            filtered_data = {k: v for k, v in data.items() if k in allowed_fields}

            

            if not filtered_data:

                return False

            

            # Für jeden Monat (1-12) die monatlichen Datensätze aktualisieren

            success_all = True

            for month in range(1, 13):

                # Prüfen ob monatlicher Datensatz existiert

                check_query = """

                SELECT id_empleado FROM t003_ingresos_brutos_mensuales 

                WHERE id_empleado = %s AND anio = %s AND mes = %s

                """

                exists = self.execute_query(check_query, (employee_id, year, month))

                

                if exists:

                    # Update monatlicher Datensatz

                    update_fields = []

                    update_values = []

                    

                    for field, value in filtered_data.items():

                        update_fields.append(f"{field} = %s")

                        update_values.append(value)

                    

                    query = f"""

                    UPDATE t003_ingresos_brutos_mensuales 

                    SET {', '.join(update_fields)} 

                    WHERE id_empleado = %s AND anio = %s AND mes = %s

                    """

                    update_values.extend([employee_id, year, month])

                    

                    result = self.execute_update(query, tuple(update_values))

                    if not result:

                        success_all = False

                        self.logger.error(f"Fehler beim Aktualisieren von Monat {month}")

                else:

                    # Insert neuen monatlichen Datensatz

                    insert_fields = ['id_empleado', 'anio', 'mes'] + list(filtered_data.keys())

                    insert_values = [employee_id, year, month] + list(filtered_data.values())

                    

                    placeholders = ', '.join(['%s'] * len(insert_fields))

                    query = f"""

                    INSERT INTO t003_ingresos_brutos_mensuales ({', '.join(insert_fields)}) 

                    VALUES ({placeholders})

                    """

                    

                    result = self.execute_update(query, tuple(insert_values))

                    if not result:

                        success_all = False

                        self.logger.error(f"Fehler beim Einfügen von Monat {month}")

            

            return success_all

                

        except Exception as e:

            self.logger.error(f"Fehler beim Aktualisieren der Bruttoeinkünfte: {e}")

            return False

    

    def update_deducciones(self, employee_id: int, year: int, data: Dict[str, Any]) -> bool:

        """Aktualisiert oder fügt Abzüge für einen Mitarbeiter für alle Monate eines Jahres hinzu"""

        try:

            allowed_fields = ['seguro_accidentes', 'adelas', 'sanitas', 'gasolina_arval', 'gasolina_ald', 'ret_especie', 'seguro_medico', 'cotizacion_especie']

            

            # Filtere die Daten auf erlaubte Felder

            filtered_data = {k: v for k, v in data.items() if k in allowed_fields}

            

            if not filtered_data:

                return False

            

            # Für jeden Monat (1-12) die monatlichen Datensätze aktualisieren

            success_all = True

            for month in range(1, 13):

                # Prüfen ob monatlicher Datensatz existiert

                check_query = """

                SELECT id_empleado FROM t004_deducciones_mensuales 

                WHERE id_empleado = %s AND anio = %s AND mes = %s

                """

                exists = self.execute_query(check_query, (employee_id, year, month))

                

                if exists:

                    # Update monatlicher Datensatz

                    update_fields = []

                    update_values = []

                    

                    for field, value in filtered_data.items():

                        update_fields.append(f"{field} = %s")

                        update_values.append(value)

                    

                    query = f"""

                    UPDATE t004_deducciones_mensuales 

                    SET {', '.join(update_fields)} 

                    WHERE id_empleado = %s AND anio = %s AND mes = %s

                    """

                    update_values.extend([employee_id, year, month])

                    

                    result = self.execute_update(query, tuple(update_values))

                    if not result:

                        success_all = False

                        self.logger.error(f"Fehler beim Aktualisieren von Monat {month}")

                else:

                    # Insert neuen monatlichen Datensatz

                    insert_fields = ['id_empleado', 'anio', 'mes'] + list(filtered_data.keys())

                    insert_values = [employee_id, year, month] + list(filtered_data.values())

                    

                    placeholders = ', '.join(['%s'] * len(insert_fields))

                    query = f"""

                    INSERT INTO t004_deducciones_mensuales ({', '.join(insert_fields)}) 

                    VALUES ({placeholders})

                    """

                    

                    result = self.execute_update(query, tuple(insert_values))

                    if not result:

                        success_all = False

                        self.logger.error(f"Fehler beim Einfügen von Monat {month}")

            

            return success_all

                

        except Exception as e:

            self.logger.error(f"Fehler beim Aktualisieren der Abzüge: {e}")

            return False

    

    def _update_monthly_from_yearly(self, employee_id: int, year: int, data: Dict[str, Any], table_type: str) -> None:

        """Aktualisiert alle monatlichen Datensätze basierend auf den jährlichen Daten"""

        try:

            if table_type == 'ingresos':

                table_name = 't003_ingresos_brutos_mensuales'

                allowed_fields = [

                    'ticket_restaurant', 'primas', 

                    'dietas_cotizables', 'horas_extras', 'dias_exentos', 

                    'dietas_exentas', 'seguro_pensiones', 'lavado_coche', 'formacion', 'tickets'

                ]

            elif table_type == 'deducciones':

                table_name = 't004_deducciones_mensuales'

                allowed_fields = ['seguro_accidentes', 'adelas', 'sanitas', 'gasolina_arval', 'gasolina_ald', 'ret_especie', 'seguro_medico', 'cotizacion_especie']

            else:

                return

            

            # Für jeden Monat (1-12) die monatlichen Datensätze aktualisieren

            for month in range(1, 13):

                # Prüfen ob monatlicher Datensatz existiert

                check_query = f"""

                SELECT id_empleado FROM {table_name} 

                WHERE id_empleado = %s AND anio = %s AND mes = %s

                """

                exists = self.execute_query(check_query, (employee_id, year, month))

                

                if exists:

                    # Update existierenden monatlichen Datensatz

                    update_fields = []

                    update_values = []

                    

                    for field, value in data.items():

                        if field in allowed_fields:

                            update_fields.append(f"{field} = %s")

                            update_values.append(value)

                    

                    if update_fields:

                        query = f"""

                        UPDATE {table_name} 

                        SET {', '.join(update_fields)} 

                        WHERE id_empleado = %s AND anio = %s AND mes = %s

                        """

                        update_values.extend([employee_id, year, month])

                        self.execute_update(query, tuple(update_values))

                else:

                    # Create neuen monatlichen Datensatz

                    insert_fields = ['id_empleado', 'anio', 'mes'] + [field for field in data.keys() if field in allowed_fields]

                    insert_values = [employee_id, year, month] + [data[field] for field in insert_fields[3:]]

                    

                    placeholders = ', '.join(['%s'] * len(insert_fields))

                    query = f"""

                    INSERT INTO {table_name} ({', '.join(insert_fields)}) 

                    VALUES ({placeholders})

                    """

                    self.execute_update(query, tuple(insert_values))

                    

        except Exception as e:

            self.logger.error(f"Fehler bei der Aktualisierung der monatlichen Daten aus jährlichen Daten: {e}")

    

    def delete_salary(self, employee_id: int, year: int) -> bool:

        """Löscht einen Gehaltsdatensatz für einen Mitarbeiter und Jahr"""

        try:

            query = "DELETE FROM t002_salarios WHERE id_empleado = %s AND anio = %s"

            result = self.execute_update(query, (employee_id, year))

            

            if result:

                self.logger.info(f"Gehaltsdatensatz für Mitarbeiter {employee_id}, Jahr {year} wurde gelöscht")

            

            return result

                

        except Exception as e:  

            self.logger.error(f"Fehler beim Löschen des Gehaltsdatensatzes für Mitarbeiter {employee_id}, Jahr {year}: {e}")

            return False

    

    def delete_employee(self, employee_id):

        """Löscht einen Mitarbeiter und alle zugehörigen Daten"""

        try:

            cursor = self.connection.cursor()            

            try:

                # Zuerst abhängige Daten löschen

                # 1. Gehälter löschen

                delete_salaries = "DELETE FROM t002_salarios WHERE id_empleado = %s"

                cursor.execute(delete_salaries, (employee_id,))

                

                # 2. Monatliche Bruttoeinkünfte löschen

                delete_ingresos_mensuales = "DELETE FROM t003_ingresos_brutos_mensuales WHERE id_empleado = %s"

                cursor.execute(delete_ingresos_mensuales, (employee_id,))

                

                # 3. Monatliche Abzüge löschen

                delete_deducciones_mensuales = "DELETE FROM t004_deducciones_mensuales WHERE id_empleado = %s"

                cursor.execute(delete_deducciones_mensuales, (employee_id,))

                

                # 4. Mitarbeiter löschen

                delete_employee = "DELETE FROM t001_empleados WHERE id_empleado = %s"

                cursor.execute(delete_employee, (employee_id,))

                

                # Transaktion bestätigen

                self.connection.commit()

                

                self.logger.info(f"Mitarbeiter {employee_id} und alle zugehörigen Daten wurden gelöscht")

                return True

                

            except Exception as e:

                # Transaktion zurückrollen

                self.connection.rollback()

                raise e

                

            finally:

                cursor.close()

                

        except Exception as e:

            self.logger.error(f"Fehler beim Löschen des Mitarbeiters {employee_id}: {e}")

            return False

    

    def hash_password(self, password: str) -> str:

        """Hash a password using SHA-256"""

        return hashlib.sha256(password.encode()).hexdigest()

    

    def verify_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:

        """Verify user credentials and return user data if valid"""

        try:

            password_hash = self.hash_password(password)

            query = """

            SELECT id_usuario, nombre_usuario, nombre_completo, rol, activo

            FROM t005_benutzer 

            WHERE nombre_usuario = %s AND hash_contraseña = %s AND activo = TRUE

            """

            users = self.execute_query(query, (username, password_hash))

            

            if users:

                return users[0]

            return None

                

        except Exception as e:

            self.logger.error(f"Fehler bei der Benutzerüberprüfung: {e}")

            return None

    

    def create_user(self, username: str, password: str, voller_name: str, rolle: str = 'benutzer') -> bool:

        """Create a new user"""

        try:

            # Check if user already exists

            check_query = "SELECT id_usuario FROM t005_benutzer WHERE nombre_usuario = %s"

            existing = self.execute_query(check_query, (username,))

            

            if existing:

                self.logger.error(f"Benutzer {username} existiert bereits")

                return False

            

            # Create new user

            password_hash = self.hash_password(password)

            insert_query = """

            INSERT INTO t005_benutzer (nombre_usuario, hash_contraseña, nombre_completo, rol) 

            VALUES (%s, %s, %s, %s)

            """

            

            return self.execute_update(insert_query, (username, password_hash, voller_name, rolle))
            
        except Exception as e:
            self.logger.error(f"Fehler beim Erstellen des Benutzers: {e}")
            return False

    def export_nomina_excel(self, year: int, output_path: str, month: int = None) -> bool:
        """Exportiert Gehaltsdaten im Excel-Format - nur monatlicher Export wird unterstützt"""
        
        try:
            # Da nur noch monatliche Tabellen existieren, muss ein Monat angegeben werden

            if not month:

                self.logger.error("Monatlicher Export erfordert eine Monatsangabe")

                return False

            

            # SQL-Abfrage für alle benötigten Daten - monatlich

            query = """

            SELECT 

                CONCAT(e.apellido, ', ', e.nombre) as nombre_completo,

                e.ceco,

                COALESCE(s.salario_mensual_con_atrasos, s.salario_mensual_bruto, 0) as salario_mes,

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

            LEFT JOIN t003_ingresos_brutos_mensuales i ON e.id_empleado = i.id_empleado AND i.anio = %s AND i.mes = %s

            LEFT JOIN t004_deducciones_mensuales d ON e.id_empleado = d.id_empleado AND d.anio = %s AND d.mes = %s

            WHERE e.activo = TRUE

            ORDER BY e.apellido, e.nombre

            """

            data = self.execute_query(query, (year, year, month, year, month))

            if not data:
                self.logger.warning(f"Keine Daten für Jahr {year} gefunden")
                return False

            # DataFrame erstellen
            df = pd.DataFrame(data)

            # Berechnete Spalten hinzufügen
            # Total = SALARIO MES + TICKET RESTAURANT + COTIZACIÓN ESPECIE + PRIMAS + DIETAS COTIZABLES + HORAS EXTRAS + SEGURO PENSIONES + SEGURO ACCIDENTES + DIETAS EXENTAS
            df['total'] = (df['salario_mes'] + df['ticket_restaurant'] + df['cotizacion_especie'] + 
                          df['primas'] + df['dietas_cotizables'] + df['horas_extras'] + 
                          df['seguro_pensiones'] + df['seguro_accidentes'] + df['dietas_exentas'])

            # Anticipos = TICKET RESTAURANT + DIETAS COTIZABLES + DIETAS EXENTAS
            df['anticipos'] = df['ticket_restaurant'] + df['dietas_cotizables'] + df['dietas_exentas']

            # TOTAL ESPECIE = COTIZACIÓN ESPECIE + SEGURO PENSIONES + SEGURO ACCIDENTES
            df['total_especie'] = df['cotizacion_especie'] + df['seguro_pensiones'] + df['seguro_accidentes']

            # BASE IMPONIBLE = SALARIO MES + PRIMAS + HORAS EXTRAS
            df['base_imponible'] = df['salario_mes'] + df['primas'] + df['horas_extras']

            # SEGURO MÉDICO = ADESLAS + SANITAS
            df['seguro_medico'] = df['adelas'] + df['sanitas']

            # Spaltenreihenfolge für Excel gemäss Referenzdatei
            columns = ['nombre_completo', 'ceco', 'salario_mes', 'ticket_restaurant', 
                      'cotizacion_especie', 'primas', 'dietas_cotizables', 'horas_extras',
                      'seguro_pensiones', 'seguro_accidentes', 'dietas_exentas', 'formacion',
                      'adelas', 'sanitas', 'gasolina_arval', 'gasolina_ald', 'dias_exentos',
                      'total', 'anticipos', 'total_especie', 'base_imponible', 'seguro_medico']
            df = df[columns]

            # Excel-Datei mit exaktem Format erstellen
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                # Leere Zeilen 1-3
                empty_df = pd.DataFrame([[None] * 22] * 3)
                empty_df.to_excel(writer, sheet_name='Sheet1', index=False, header=False)

                # Zeile 4: Suma de IMPORTE und Etiquetas de columna nur über CECO
                header_row = pd.DataFrame([[None] * 22])
                header_row.iloc[0, 0] = 'Suma de IMPORTE'
                header_row.iloc[0, 1] = 'Etiquetas de columna'
                header_row.to_excel(writer, sheet_name='Sheet1', index=False, header=False, startrow=3)

                # Zeile 5: Spaltennamen gemäss neuer Reihenfolge
                column_names = ['Etiquetas de fila', 'CECO', 'SALARIO MES', 'TICKET RESTAURANT', 
                              'COTIZACIÓN ESPECIE', 'PRIMAS', 'DIETAS COTIZABLES', 'HORAS EXTRAS',
                              'SEGURO PENSIONES', 'SEGURO ACCIDENTES', 'DIETAS EXENTAS', 'FORMACION',
                              'ADESLAS', 'SANITAS', 'GASOLINA ARVAL', 'GASOLINA ALD', 'DÍAS EXENTOS',
                              'TOTAL', 'ANTICIPOS', 'TOTAL ESPECIE', 'BASE IMPONIBLE', 'SEGURO MÉDICO']

                # Spaltennamen als separate Zeile schreiben
                columns_df = pd.DataFrame([column_names])
                columns_df.to_excel(writer, sheet_name='Sheet1', index=False, header=False, startrow=4)

                # Daten ab Zeile 6 schreiben mit Komma als Dezimaltrennzeichen
                df.columns = column_names

                # Konvertiere numerische Werte zu Strings mit Komma als Dezimaltrennzeichen
                df_formatted = df.copy()
                for col in df.columns:
                    if col not in ['Etiquetas de fila', 'CECO']:  # Nicht für Name und CECO
                        df_formatted[col] = df[col].apply(lambda x: f"{x:.2f}".replace('.', ',') if pd.notna(x) and x != 0 else '')

                df_formatted.to_excel(writer, sheet_name='Sheet1', index=False, header=False, startrow=5)

            self.logger.info(f"Excel-Export erfolgreich: {output_path}")
            return True

        except Exception as e:
            self.logger.error(f"Fehler beim Excel-Export: {e}")
            return False


    def update_ingresos_mensuales(self, employee_id: int, year: int, month: int, data: Dict[str, Any]) -> bool:

        """Aktualisiert monatliche Bruttoeinkünfte für einen spezifischen Monat"""

        try:

            allowed_fields = [

                'ticket_restaurant', 'primas', 

                'dietas_cotizables', 'horas_extras', 'dias_exentos', 

                'dietas_exentas', 'seguro_pensiones', 'lavado_coche', 'formacion', 'tickets'

            ]

            

            # Filtere die Daten auf erlaubte Felder

            filtered_data = {k: v for k, v in data.items() if k in allowed_fields}

            

            if not filtered_data:

                return False

            

            # Prüfen ob monatlicher Datensatz existiert

            check_query = """

            SELECT id_empleado FROM t003_ingresos_brutos_mensuales 

            WHERE id_empleado = %s AND anio = %s AND mes = %s

            """

            exists = self.execute_query(check_query, (employee_id, year, month))

            

            if exists:

                # Update existierenden monatlichen Datensatz

                update_fields = []

                update_values = []

                

                for field, value in filtered_data.items():

                    update_fields.append(f"{field} = %s")

                    update_values.append(value)

                

                query = f"""

                UPDATE t003_ingresos_brutos_mensuales 

                SET {', '.join(update_fields)} 

                WHERE id_empleado = %s AND anio = %s AND mes = %s

                """

                update_values.extend([employee_id, year, month])

                

                return self.execute_update(query, tuple(update_values))

            else:

                # Insert neuen monatlichen Datensatz

                insert_fields = ['id_empleado', 'anio', 'mes'] + list(filtered_data.keys())

                insert_values = [employee_id, year, month] + list(filtered_data.values())

                

                placeholders = ', '.join(['%s'] * len(insert_fields))

                query = f"""

                INSERT INTO t003_ingresos_brutos_mensuales ({', '.join(insert_fields)}) 

                VALUES ({placeholders})

                """

                

                return self.execute_update(query, tuple(insert_values))

                

        except Exception as e:

            self.logger.error(f"Fehler beim Aktualisieren der monatlichen Bruttoeinkünfte: {e}")

            return False

    

    def update_deducciones_mensuales(self, employee_id: int, year: int, month: int, data: Dict[str, Any]) -> bool:

        """Aktualisiert monatliche Abzüge für einen spezifischen Monat"""

        try:

            allowed_fields = ['seguro_accidentes', 'adelas', 'sanitas', 'gasolina_arval', 'gasolina_ald', 'ret_especie', 'seguro_medico', 'cotizacion_especie']

            

            # Filtere die Daten auf erlaubte Felder

            filtered_data = {k: v for k, v in data.items() if k in allowed_fields}

            

            if not filtered_data:

                return False

            

            # Prüfen ob monatlicher Datensatz existiert

            check_query = """

            SELECT id_empleado FROM t004_deducciones_mensuales 

            WHERE id_empleado = %s AND anio = %s AND mes = %s

            """

            exists = self.execute_query(check_query, (employee_id, year, month))

            

            if exists:

                # Update existierenden monatlichen Datensatz

                update_fields = []

                update_values = []

                

                for field, value in filtered_data.items():

                    update_fields.append(f"{field} = %s")

                    update_values.append(value)

                

                query = f"""

                UPDATE t004_deducciones_mensuales 

                SET {', '.join(update_fields)} 

                WHERE id_empleado = %s AND anio = %s AND mes = %s

                """

                update_values.extend([employee_id, year, month])

                

                return self.execute_update(query, tuple(update_values))

            else:

                # Insert neuen monatlichen Datensatz

                insert_fields = ['id_empleado', 'anio', 'mes'] + list(filtered_data.keys())

                insert_values = [employee_id, year, month] + list(filtered_data.values())

                

                placeholders = ', '.join(['%s'] * len(insert_fields))

                query = f"""

                INSERT INTO t004_deducciones_mensuales ({', '.join(insert_fields)}) 

                VALUES ({placeholders})

                """

                

                return self.execute_update(query, tuple(insert_values))

                

        except Exception as e:

            self.logger.error(f"Fehler beim Aktualisieren der monatlichen Abzüge: {e}")

            return False
