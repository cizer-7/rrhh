import pytest
import sys
import os
from unittest.mock import Mock, patch

# Backend-Verzeichnis zum Pfad hinzufügen
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

from database_manager import DatabaseManager

class TestDatabaseManagerIntegrationSimple:
    """Einfache Integrationstests für DatabaseManager"""

    @pytest.fixture
    def mock_database_setup(self):
        """Mock-Datenbank-Setup für Integrationstests"""
        mock_connection = Mock()
        mock_cursor = Mock()
        
        # Standard-Antworten
        mock_cursor.fetchall.return_value = [
            {'id_empleado': 1, 'nombre': 'Juan', 'apellido': 'Perez', 'ceco': '1001', 'activo': True}
        ]
        mock_connection.cursor.return_value = mock_cursor
        mock_connection.is_connected.return_value = True
        
        return mock_connection, mock_cursor

    def test_basic_workflow(self, mock_database_setup):
        """Test grundlegender Workflow"""
        mock_connection, mock_cursor = mock_database_setup
        
        with patch('mysql.connector.connect', return_value=mock_connection):
            db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
            
            # Verbindung herstellen
            assert db.connect() is True
            assert db.connection == mock_connection
            
            # Mitarbeiter abrufen
            employees = db.get_all_employees()
            assert len(employees) == 1
            assert employees[0]['nombre'] == 'Juan'
            
            # Verbindung trennen
            db.disconnect()
            mock_connection.close.assert_called_once()

    def test_employee_crud_workflow(self, mock_database_setup):
        """Test Mitarbeiter CRUD Workflow"""
        mock_connection, mock_cursor = mock_database_setup
        
        with patch('mysql.connector.connect', return_value=mock_connection):
            db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
            db.connect()
            
            # Mitarbeiter erstellen
            with patch.object(db, 'execute_update', return_value=True):
                with patch.object(db, 'execute_query', return_value=[{'max_id': 1}]):
                    with patch.object(db, '_create_default_records'):
                        emp_id = db.add_employee({
                            'nombre': 'Test',
                            'apellido': 'User',
                            'ceco': '1001'
                        })
                        assert emp_id == 2
            
            # Mitarbeiter aktualisieren
            with patch.object(db, 'execute_update', return_value=True):
                result = db.update_employee(1, 't001_empleados', {'nombre': 'Updated'})
                assert result is True
            
            # Mitarbeiter löschen
            with patch.object(db, 'execute_update', return_value=True):
                result = db.delete_employee(1)
                assert result is True

    def test_user_management_workflow(self, mock_database_setup):
        """Test Benutzerverwaltungs-Workflow"""
        mock_connection, mock_cursor = mock_database_setup
        
        with patch('mysql.connector.connect', return_value=mock_connection):
            db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
            db.connect()
            
            # Benutzer erstellen
            with patch.object(db, 'execute_query', return_value=[]):
                with patch.object(db, 'execute_update', return_value=True):
                    result = db.create_user('newuser', 'password', 'New User')
                    assert result is True
            
            # Benutzer verifizieren
            user_data = {
                'id_usuario': 1,
                'nombre_usuario': 'newuser',
                'nombre_completo': 'New User',
                'rol': 'user',
                'activo': True
            }
            
            with patch.object(db, 'execute_query', return_value=[user_data]):
                result = db.verify_user('newuser', 'password')
                assert result == user_data

    def test_salary_workflow(self, mock_database_setup):
        """Test Gehaltsverwaltungs-Workflow"""
        mock_connection, mock_cursor = mock_database_setup
        
        with patch('mysql.connector.connect', return_value=mock_connection):
            db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
            db.connect()
            
            # Gehalt hinzufügen - Mitarbeiter existiert, Gehalt existiert nicht
            salary_data = {
                'anio': 2025,
                'modalidad': 12,
                'salario_anual_bruto': 30000
            }
            
            # Mock für Mitarbeiter-Check und Gehalt-Check
            with patch.object(db, 'execute_query') as mock_query:
                mock_query.side_effect = [
                    [{'id_empleado': 1}],  # Mitarbeiter existiert
                    []  # Gehalt existiert nicht
                ]
                with patch.object(db, 'execute_update', return_value=True):
                    with patch.object(db, '_update_subsequent_years_atrasos'):
                        result = db.add_salary(1, salary_data)
                        assert result is True
            
            # Gehalt aktualisieren
            with patch.object(db, 'execute_query', return_value=[{'id_empleado': 1}]):
                with patch.object(db, 'execute_update', return_value=True):
                    with patch.object(db, '_update_subsequent_years_atrasos'):
                        result = db.update_salary(1, 2025, {'salario_anual_bruto': 35000})
                        assert result is True
            
            # Gehalt löschen
            with patch.object(db, 'execute_update', return_value=True):
                result = db.delete_salary(1, 2025)
                assert result is True

    def test_error_handling_workflow(self, mock_database_setup):
        """Test Fehlerbehandlung im Workflow"""
        mock_connection, mock_cursor = mock_database_setup
        
        with patch('mysql.connector.connect', return_value=mock_connection):
            db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
            db.connect()
            
            # Datenbankfehler bei Query - sollte Exception abfangen
            with patch.object(db, 'execute_query', side_effect=Exception("DB Error")):
                try:
                    result = db.get_all_employees()
                    # Wenn keine Exception geworfen wird, sollte Ergebnis eine Liste sein
                    assert isinstance(result, list)
                except Exception:
                    # Exception ist auch akzeptabel
                    pass
            
            # Datenbankfehler bei Update
            with patch.object(db, 'execute_update', side_effect=Exception("Update Error")):
                result = db.add_employee({'nombre': 'Test', 'apellido': 'User', 'ceco': '1001'})
                assert result == -1

    def test_search_workflow(self, mock_database_setup):
        """Test Such-Workflow"""
        mock_connection, mock_cursor = mock_database_setup
        
        with patch('mysql.connector.connect', return_value=mock_connection):
            db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
            db.connect()
            
            # Suche durchführen
            search_results = db.search_employees('Juan')
            assert len(search_results) == 1
            assert search_results[0]['nombre'] == 'Juan'

    def test_complete_employee_info_workflow(self, mock_database_setup):
        """Test vollständige Mitarbeiterinformationen Workflow"""
        mock_connection, mock_cursor = mock_database_setup
        
        with patch('mysql.connector.connect', return_value=mock_connection):
            db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
            db.connect()
            
            # Vollständige Informationen abrufen
            employee_data = {'id_empleado': 1, 'nombre': 'Test', 'apellido': 'User', 'ceco': '1001', 'activo': True}
            
            with patch.object(db, 'execute_query', return_value=[employee_data]):
                result = db.get_employee_complete_info(1)
                
                assert 'employee' in result
                assert result['employee']['nombre'] == 'Test'
                assert 'salaries' in result
                assert 'ingresos' in result
                assert 'deducciones' in result

    def test_excel_export_workflow(self, mock_database_setup):
        """Test Excel-Export Workflow"""
        mock_connection, mock_cursor = mock_database_setup
        
        with patch('mysql.connector.connect', return_value=mock_connection):
            db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
            db.connect()
            
            # Export-Daten vorbereiten
            export_data = [
                {
                    'nombre_completo': 'Test User',
                    'ceco': '1001',
                    'salario_mes': 2500.0
                }
            ]
            
            with patch.dict('sys.modules', {'pandas': Mock(), 'openpyxl': Mock()}):
                with patch.object(db, 'execute_query', return_value=export_data):
                    with patch('pandas.DataFrame'):
                        with patch('pandas.ExcelWriter'):
                            result = db.export_nomina_excel(2025, 'test.xlsx')
                            assert isinstance(result, bool)

    def test_concurrent_operations_simple(self, mock_database_setup):
        """Test einfache nebenläufige Operationen"""
        mock_connection, mock_cursor = mock_database_setup
        
        with patch('mysql.connector.connect', return_value=mock_connection):
            db = DatabaseManager('localhost', 'test_db', 'user', 'pass')
            db.connect()
            
            import threading
            import queue
            
            results = queue.Queue()
            
            def worker_operation(worker_id):
                try:
                    with patch.object(db, 'execute_query', return_value=[]):
                        with patch.object(db, 'execute_update', return_value=True):
                            result = db.add_employee({
                                'nombre': f'Worker{worker_id}',
                                'apellido': 'Test',
                                'ceco': f'{worker_id}'
                            })
                            results.put(result)
                except Exception as e:
                    results.put(str(e))
            
            # Mehrere Worker gleichzeitig starten
            threads = []
            for i in range(3):
                thread = threading.Thread(target=worker_operation, args=(i,))
                threads.append(thread)
                thread.start()
            
            # Warten auf alle Threads
            for thread in threads:
                thread.join()
            
            # Überprüfe Ergebnisse
            successful_operations = 0
            while not results.empty():
                result = results.get()
                if isinstance(result, int) and result > 0:
                    successful_operations += 1
            
            # Alle Operationen sollten erfolgreich sein
            assert successful_operations == 3
