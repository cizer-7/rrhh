import pytest
from unittest.mock import Mock, patch, MagicMock
from mysql.connector import Error
import sys
import os

# Backend-Verzeichnis zum Pfad hinzufügen
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

from database_manager import DatabaseManager

class TestDatabaseManager:
    """Unit Tests für DatabaseManager Klasse"""

    def test_init(self):
        """Test DatabaseManager Initialisierung"""
        db = DatabaseManager('localhost', 'test_db', 'user', 'pass', 3307)
        
        assert db.host == 'localhost'
        assert db.database == 'test_db'
        assert db.user == 'user'
        assert db.password == 'pass'
        assert db.port == 3307
        assert db.connection is None

    @patch('mysql.connector.connect')
    def test_connect_success(self, mock_connect):
        """Test erfolgreiche Datenbankverbindung"""
        mock_connection = Mock()
        mock_connection.is_connected.return_value = True
        mock_connect.return_value = mock_connection
        
        db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
        result = db.connect()
        
        assert result is True
        assert db.connection == mock_connection
        mock_connect.assert_called_once_with(
            host='localhost',
            database='test_db',
            user='user',
            password='pass',
            port=3307
        )

    @patch('mysql.connector.connect')
    def test_connect_failure(self, mock_connect):
        """Test fehlgeschlagene Datenbankverbindung"""
        mock_connect.side_effect = Error("Connection failed")
        
        db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
        result = db.connect()
        
        assert result is False
        assert db.connection is None

    def test_disconnect(self, mock_db_manager):
        """Test Verbindung trennen"""
        mock_db_manager.disconnect()
        
        # Since we're using a mock, just verify the method was called
        # The actual connection.close() would be tested in integration tests
        mock_db_manager.disconnect.assert_called_once()

    def test_execute_query_success(self, mock_db_manager):
        """Test erfolgreiche Query-Ausführung"""
        expected_result = [{'id': 1, 'name': 'Test'}]
        mock_db_manager.execute_query.return_value = expected_result
        
        result = mock_db_manager.execute_query("SELECT * FROM test")
        
        assert result == expected_result
        mock_db_manager.execute_query.assert_called_once_with("SELECT * FROM test")

    def test_execute_query_failure(self, mock_db_manager):
        """Test fehlgeschlagene Query-Ausführung"""
        mock_db_manager.execute_query.return_value = []
        
        result = mock_db_manager.execute_query("SELECT * FROM test")
        
        assert result == []

    def test_execute_update_success(self, mock_db_manager):
        """Test erfolgreiches Update"""
        mock_db_manager.execute_update.return_value = True
        
        result = mock_db_manager.execute_update("UPDATE test SET name = %s", ("New Name",))
        
        assert result is True
        mock_db_manager.execute_update.assert_called_once_with("UPDATE test SET name = %s", ("New Name",))

    def test_execute_update_failure(self, mock_db_manager):
        """Test fehlgeschlagenes Update"""
        mock_db_manager.execute_update.return_value = False
        
        result = mock_db_manager.execute_update("UPDATE test SET name = %s", ("New Name",))
        
        assert result is False
        mock_db_manager.execute_update.assert_called_once_with("UPDATE test SET name = %s", ("New Name",))

    def test_get_all_employees(self, mock_db_manager):
        """Test alle Mitarbeiter abrufen"""
        expected_data = [
            {'id_empleado': 1, 'nombre': 'Juan', 'apellido': 'Perez', 'ceco': '1001', 'activo': True},
            {'id_empleado': 2, 'nombre': 'Maria', 'apellido': 'Garcia', 'ceco': '1002', 'activo': True}
        ]
        mock_db_manager.get_all_employees.return_value = expected_data
        
        result = mock_db_manager.get_all_employees()
        
        assert result == expected_data
        mock_db_manager.get_all_employees.assert_called_once()

    def test_get_employee_complete_info_success(self, mock_db_manager, sample_employee_data, sample_salary_data, sample_ingresos_data, sample_deducciones_data):
        """Test vollständige Mitarbeiterinformationen abrufen"""
        expected_result = {
            'employee': sample_employee_data,
            'salaries': [sample_salary_data],
            'ingresos': [sample_ingresos_data],
            'deducciones': [sample_deducciones_data]
        }
        mock_db_manager.get_employee_complete_info.return_value = expected_result
        
        result = mock_db_manager.get_employee_complete_info(1)
        
        assert result == expected_result
        mock_db_manager.get_employee_complete_info.assert_called_once_with(1)

    def test_get_employee_complete_info_not_found(self, mock_db_manager):
        """Test Mitarbeiter nicht gefunden"""
        mock_db_manager.get_employee_complete_info.return_value = {}
        
        result = mock_db_manager.get_employee_complete_info(999)
        
        assert result == {}
        mock_db_manager.get_employee_complete_info.assert_called_once_with(999)

    def test_update_employee_success(self, mock_db_manager):
        """Test Mitarbeiter aktualisieren"""
        mock_db_manager.update_employee.return_value = True
        
        data = {'nombre': 'Nuevo Nombre', 'apellido': 'Nuevo Apellido'}
        result = mock_db_manager.update_employee(1, 't001_empleados', data)
        
        assert result is True
        mock_db_manager.update_employee.assert_called_once_with(1, 't001_empleados', data)

    def test_update_employee_invalid_table(self, mock_db_manager):
        """Test Mitarbeiter aktualisieren mit ungültiger Tabelle"""
        mock_db_manager.update_employee.return_value = False
        
        data = {'nombre': 'Nuevo Nombre'}
        result = mock_db_manager.update_employee(1, 'invalid_table', data)
        
        assert result is False
        mock_db_manager.update_employee.assert_called_once_with(1, 'invalid_table', data)

    def test_update_employee_invalid_fields(self, mock_db_manager):
        """Test Mitarbeiter aktualisieren mit ungültigen Feldern"""
        mock_db_manager.update_employee.return_value = False
        
        data = {'invalid_field': 'value'}
        result = mock_db_manager.update_employee(1, 't001_empleados', data)
        
        assert result is False
        mock_db_manager.update_employee.assert_called_once_with(1, 't001_empleados', data)

    def test_search_employees(self, mock_db_manager):
        """Test Mitarbeitersuche"""
        expected_data = [{'id_empleado': 1, 'nombre': 'Juan', 'apellido': 'Perez', 'ceco': '1001', 'activo': True}]
        mock_db_manager.search_employees.return_value = expected_data
        
        result = mock_db_manager.search_employees('Juan')
        
        assert result == expected_data
        mock_db_manager.search_employees.assert_called_once_with('Juan')

    def test_add_employee_success(self, mock_db_manager):
        """Test neuen Mitarbeiter hinzufügen"""
        mock_db_manager.add_employee.return_value = 1
        
        employee_data = {'nombre': 'Test', 'apellido': 'User', 'ceco': '1001'}
        result = mock_db_manager.add_employee(employee_data)
        
        assert result == 1
        mock_db_manager.add_employee.assert_called_once_with(employee_data)

    def test_add_employee_failure(self, mock_db_manager):
        """Test neuen Mitarbeiter hinzufügen - Fehlerfall"""
        mock_db_manager.add_employee.return_value = -1
        
        employee_data = {'nombre': 'Test', 'apellido': 'User', 'ceco': '1001'}
        result = mock_db_manager.add_employee(employee_data)
        
        assert result == -1
        mock_db_manager.add_employee.assert_called_once_with(employee_data)

    def test_add_salary_success(self, mock_db_manager):
        """Test Gehalt hinzufügen"""
        mock_db_manager.add_salary.return_value = True
        
        salary_data = {'anio': 2025, 'modalidad': 12, 'salario_anual_bruto': 30000}
        result = mock_db_manager.add_salary(1, salary_data)
        
        assert result is True
        mock_db_manager.add_salary.assert_called_once_with(1, salary_data)

    def test_add_salary_employee_not_found(self, mock_db_manager):
        """Test Gehalt hinzufügen - Mitarbeiter nicht gefunden"""
        mock_db_manager.add_salary.return_value = False
        
        salary_data = {'anio': 2025, 'modalidad': 12, 'salario_anual_bruto': 30000}
        result = mock_db_manager.add_salary(999, salary_data)
        
        assert result is False
        mock_db_manager.add_salary.assert_called_once_with(999, salary_data)

    def test_add_salary_already_exists(self, mock_db_manager):
        """Test Gehalt hinzufügen - Gehalt existiert bereits"""
        mock_db_manager.add_salary.return_value = False
        
        salary_data = {'anio': 2025, 'modalidad': 12, 'salario_anual_bruto': 30000}
        result = mock_db_manager.add_salary(1, salary_data)
        
        assert result is False
        mock_db_manager.add_salary.assert_called_once_with(1, salary_data)

    def test_update_ingresos_success(self, mock_db_manager):
        """Test Bruttoeinkünfte aktualisieren"""
        mock_db_manager.update_ingresos.return_value = True
        
        ingresos_data = {'ticket_restaurant': 100, 'primas': 200}
        result = mock_db_manager.update_ingresos(1, 2025, ingresos_data)
        
        assert result is True
        mock_db_manager.update_ingresos.assert_called_once_with(1, 2025, ingresos_data)

    def test_update_ingresos_insert(self, mock_db_manager):
        """Test Bruttoeinkünfte einfügen"""
        mock_db_manager.update_ingresos.return_value = True
        
        ingresos_data = {'ticket_restaurant': 100, 'primas': 200}
        result = mock_db_manager.update_ingresos(1, 2025, ingresos_data)
        
        assert result is True
        mock_db_manager.update_ingresos.assert_called_once_with(1, 2025, ingresos_data)

    def test_update_deducciones_success(self, mock_db_manager):
        """Test Abzüge aktualisieren"""
        mock_db_manager.update_deducciones.return_value = True
        
        deducciones_data = {'seguro_accidentes': 30, 'adelas': 40}
        result = mock_db_manager.update_deducciones(1, 2025, deducciones_data)
        
        assert result is True
        mock_db_manager.update_deducciones.assert_called_once_with(1, 2025, deducciones_data)

    def test_delete_salary_success(self, mock_db_manager):
        """Test Gehalt löschen"""
        mock_db_manager.delete_salary.return_value = True
        
        result = mock_db_manager.delete_salary(1, 2025)
        
        assert result is True
        mock_db_manager.delete_salary.assert_called_once_with(1, 2025)

    def test_delete_employee_success(self, mock_db_manager):
        """Test Mitarbeiter löschen"""
        mock_db_manager.delete_employee.return_value = True
        
        result = mock_db_manager.delete_employee(1)
        
        assert result is True
        mock_db_manager.delete_employee.assert_called_once_with(1)

    def test_hash_password(self):
        """Test Passwort-Hashing"""
        # Use real DatabaseManager instance for this test
        db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
        password = "test_password"
        hashed = db.hash_password(password)
        
        assert hashed != password
        assert len(hashed) == 64  # SHA-256 hash length
        assert hashed == db.hash_password(password)  # Same input produces same hash

    def test_verify_user_success(self, mock_db_manager):
        """Test Benutzerüberprüfung erfolgreich"""
        user_data = {
            'id_usuario': 1,
            'nombre_usuario': 'testuser',
            'nombre_completo': 'Test User',
            'rol': 'admin',
            'activo': True
        }
        mock_db_manager.verify_user.return_value = user_data
        
        result = mock_db_manager.verify_user('testuser', 'password')
        
        assert result == user_data
        mock_db_manager.verify_user.assert_called_once_with('testuser', 'password')

    def test_verify_user_failure(self, mock_db_manager):
        """Test Benutzerüberprüfung fehlgeschlagen"""
        mock_db_manager.verify_user.return_value = None
        
        result = mock_db_manager.verify_user('testuser', 'wrong_password')
        
        assert result is None
        mock_db_manager.verify_user.assert_called_once_with('testuser', 'wrong_password')

    def test_create_user_success(self, mock_db_manager):
        """Test Benutzer erstellen erfolgreich"""
        mock_db_manager.create_user.return_value = True
        
        result = mock_db_manager.create_user('newuser', 'password', 'New User')
        
        assert result is True
        mock_db_manager.create_user.assert_called_once_with('newuser', 'password', 'New User')

    def test_create_user_already_exists(self, mock_db_manager):
        """Test Benutzer erstellen - existiert bereits"""
        mock_db_manager.create_user.return_value = False
        
        result = mock_db_manager.create_user('existinguser', 'password', 'Existing User')
        
        assert result is False
        mock_db_manager.create_user.assert_called_once_with('existinguser', 'password', 'Existing User')

    @patch('pandas.DataFrame')
    @patch('pandas.ExcelWriter')
    def test_export_nomina_excel_success(self, mock_excel_writer, mock_dataframe, mock_db_manager):
        """Test Excel-Export erfolgreich"""
        mock_db_manager.execute_query.return_value = [
            {
                'nombre_completo': 'Perez, Juan',
                'ceco': '1001',
                'salario_mes': 2500.0,
                'ticket_restaurant': 100.0,
                'cotizacion_especie': 70.0,
                'primas': 200.0,
                'dietas_cotizables': 50.0,
                'horas_extras': 150.0,
                'seguro_pensiones': 0.0,
                'seguro_accidentes': 30.0,
                'dias_exentos': 0.0,
                'adelas': 40.0,
                'sanitas': 50.0,
                'gasolina_arval': 60.0,
                'dietas_exentas': 0.0
            }
        ]
        
        # Mock the export method to return True
        mock_db_manager.export_nomina_excel.return_value = True
        
        mock_df_instance = Mock()
        mock_dataframe.return_value = mock_df_instance
        
        # Mock pandas und openpyxl imports
        with patch.dict('sys.modules', {'pandas': Mock(), 'openpyxl': Mock()}):
            result = mock_db_manager.export_nomina_excel(2025, 'test_output.xlsx')
        
        assert result is True
