import pytest
import sys
import os
import tempfile
import shutil
from unittest.mock import Mock, patch, MagicMock
from mysql.connector import Error
import hashlib
import time

# Backend-Verzeichnis zum Pfad hinzufügen
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
sys.path.insert(0, backend_path)

from database_manager import DatabaseManager

class TestDatabaseManagerCore:
    """Kern-Tests für DatabaseManager - fokussiert auf reale Funktionalität"""

    @pytest.fixture
    def db_manager(self):
        """DatabaseManager Instanz für Tests"""
        return DatabaseManager('localhost', 'test_db', 'test_user', 'test_password', 3307)

    def test_initialization(self, db_manager):
        """Test DatabaseManager Initialisierung"""
        assert db_manager.host == 'localhost'
        assert db_manager.database == 'test_db'
        assert db_manager.user == 'test_user'
        assert db_manager.password == 'test_password'
        assert db_manager.port == 3307
        assert db_manager.connection is None

    def test_hash_password_functionality(self, db_manager):
        """Test Passwort-Hashing Funktionalität"""
        password = "test_password_123"
        
        # Hash erzeugen
        hashed = db_manager.hash_password(password)
        
        # Überprüfungen
        assert hashed != password
        assert len(hashed) == 64  # SHA-256
        assert all(c in '0123456789abcdef' for c in hashed)
        
        # Konsistenzprüfung
        hashed2 = db_manager.hash_password(password)
        assert hashed == hashed2
        
        # Unterschiedliche Passworte erzeugen unterschiedliche Hashes
        hashed3 = db_manager.hash_password("other_password")
        assert hashed != hashed3

    def test_hash_password_edge_cases(self, db_manager):
        """Test Passwort-Hashing Grenzwertfälle"""
        # Leeres Passwort
        hashed_empty = db_manager.hash_password("")
        assert len(hashed_empty) == 64
        assert hashed_empty != ""
        
        # Sehr langes Passwort
        long_password = "x" * 1000
        hashed_long = db_manager.hash_password(long_password)
        assert len(hashed_long) == 64
        
        # Spezielle Zeichen
        special_password = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        hashed_special = db_manager.hash_password(special_password)
        assert len(hashed_special) == 64
        assert hashed_special != special_password

    @patch('mysql.connector.connect')
    def test_connection_success(self, mock_connect, db_manager):
        """Test erfolgreiche Datenbankverbindung"""
        mock_connection = Mock()
        mock_connection.is_connected.return_value = True
        mock_connect.return_value = mock_connection
        
        result = db_manager.connect()
        
        assert result is True
        assert db_manager.connection == mock_connection
        mock_connect.assert_called_once_with(
            host='localhost',
            database='test_db',
            user='test_user',
            password='test_password',
            port=3307
        )

    @patch('mysql.connector.connect')
    def test_connection_failure(self, mock_connect, db_manager):
        """Test fehlgeschlagene Datenbankverbindung"""
        mock_connect.side_effect = Error("Connection failed")
        
        result = db_manager.connect()
        
        assert result is False
        assert db_manager.connection is None

    @patch('mysql.connector.connect')
    def test_connection_timeout(self, mock_connect, db_manager):
        """Test Connection Timeout"""
        import socket
        mock_connect.side_effect = socket.timeout("Connection timeout")
        
        # Erwarte TimeoutError
        with pytest.raises(socket.timeout):
            db_manager.connect()

    def test_execute_query_without_connection(self, db_manager):
        """Test Query-Ausführung ohne Verbindung"""
        # Sollte AttributeError oder Error werfen
        with pytest.raises((AttributeError, Error)):
            db_manager.execute_query("SELECT * FROM test")

    @patch('mysql.connector.connect')
    def test_execute_query_success(self, mock_connect, db_manager):
        """Test erfolgreiche Query-Ausführung"""
        mock_connection = Mock()
        mock_cursor = Mock()
        mock_cursor.fetchall.return_value = [{'id': 1, 'name': 'test'}]
        mock_connection.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_connection
        
        db_manager.connection = mock_connection
        result = db_manager.execute_query("SELECT * FROM test")
        
        assert result == [{'id': 1, 'name': 'test'}]
        mock_cursor.execute.assert_called_once_with("SELECT * FROM test", None)
        mock_cursor.close.assert_called_once()

    @patch('mysql.connector.connect')
    def test_execute_query_with_params(self, mock_connect, db_manager):
        """Test Query-Ausführung mit Parametern"""
        mock_connection = Mock()
        mock_cursor = Mock()
        mock_cursor.fetchall.return_value = []
        mock_connection.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_connection
        
        db_manager.connection = mock_connection
        query = "SELECT * FROM test WHERE id = %s"
        params = (1,)
        
        db_manager.execute_query(query, params)
        
        mock_cursor.execute.assert_called_once_with(query, params)

    @patch('mysql.connector.connect')
    def test_execute_query_database_error(self, mock_connect, db_manager):
        """Test Query-Ausführung mit Datenbankfehler"""
        mock_connection = Mock()
        mock_cursor = Mock()
        mock_cursor.execute.side_effect = Error("SQL Error")
        mock_connection.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_connection
        
        db_manager.connection = mock_connection
        result = db_manager.execute_query("SELECT * FROM test")
        
        assert result == []

    @patch('mysql.connector.connect')
    def test_execute_update_success(self, mock_connect, db_manager):
        """Test erfolgreiches Update"""
        mock_connection = Mock()
        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_connection
        
        db_manager.connection = mock_connection
        result = db_manager.execute_update("UPDATE test SET name = %s", ("new_name",))
        
        assert result is True
        mock_cursor.execute.assert_called_once()
        mock_connection.commit.assert_called_once()
        mock_cursor.close.assert_called_once()

    @patch('mysql.connector.connect')
    def test_execute_update_failure(self, mock_connect, db_manager):
        """Test fehlgeschlagenes Update"""
        mock_connection = Mock()
        mock_cursor = Mock()
        mock_cursor.execute.side_effect = Error("Update Error")
        mock_connection.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_connection
        
        db_manager.connection = mock_connection
        result = db_manager.execute_update("UPDATE test SET name = %s", ("new_name",))
        
        assert result is False
        mock_connection.rollback.assert_called_once()

    def test_add_employee_validation(self, db_manager):
        """Test Mitarbeiter-Erstellung Validierung"""
        # Leere Daten
        result = db_manager.add_employee({})
        assert result == -1
        
        # Fehlende Pflichtfelder
        result = db_manager.add_employee({'nombre': 'Test'})
        assert result == -1
        
        # Nur Pflichtfelder (sollte -1 zurückgeben wegen fehlender DB)
        result = db_manager.add_employee({
            'nombre': 'Test',
            'apellido': 'User',
            'ceco': '1001'
        })
        assert result == -1

    @patch('mysql.connector.connect')
    def test_add_employee_success(self, mock_connect, db_manager):
        """Test erfolgreiche Mitarbeiter-Erstellung"""
        mock_connection = Mock()
        mock_cursor = Mock()
        
        # Mock für MAX ID Abfrage
        mock_cursor.fetchall.side_effect = [
            [{'max_id': 1}],  # MAX ID Abfrage
            []  # INSERT Abfrage
        ]
        mock_connection.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_connection
        
        # Mock execute_update für Erfolg
        with patch.object(db_manager, 'execute_update', return_value=True):
            with patch.object(db_manager, 'execute_query', return_value=[{'max_id': 1}]):
                with patch.object(db_manager, '_create_default_records'):
                    result = db_manager.add_employee({
                        'nombre': 'Test',
                        'apellido': 'User',
                        'ceco': '1001'
                    })
                    assert result == 2  # max_id + 1

    @patch('mysql.connector.connect')
    def test_update_employee_success(self, mock_connect, db_manager):
        """Test erfolgreiche Mitarbeiter-Aktualisierung"""
        mock_connection = Mock()
        mock_connect.return_value = mock_connection
        
        with patch.object(db_manager, 'execute_update', return_value=True):
            result = db_manager.update_employee(1, 't001_empleados', {
                'nombre': 'Updated Name',
                'apellido': 'Updated Surname'
            })
            assert result is True

    def test_update_employee_invalid_table(self, db_manager):
        """Test Mitarbeiter-Aktualisierung mit ungültiger Tabelle"""
        result = db_manager.update_employee(1, 'invalid_table', {'nombre': 'Test'})
        assert result is False

    def test_update_employee_invalid_fields(self, db_manager):
        """Test Mitarbeiter-Aktualisierung mit ungültigen Feldern"""
        # Ungültige Felder sollten ignoriert werden
        result = db_manager.update_employee(1, 't001_empleados', {
            'invalid_field': 'value'
        })
        # Sollte False zurückgeben weil keine gültigen Felder
        assert result is False

    def test_verify_user_without_connection(self, db_manager):
        """Test Benutzer-Verifizierung ohne Verbindung"""
        result = db_manager.verify_user('testuser', 'password')
        assert result is None

    @patch('mysql.connector.connect')
    def test_verify_user_success(self, mock_connect, db_manager):
        """Test erfolgreiche Benutzer-Verifizierung"""
        mock_connection = Mock()
        mock_connect.return_value = mock_connection
        
        user_data = {
            'id_usuario': 1,
            'nombre_usuario': 'testuser',
            'nombre_completo': 'Test User',
            'rol': 'admin',
            'activo': True
        }
        
        with patch.object(db_manager, 'execute_query', return_value=[user_data]):
            result = db_manager.verify_user('testuser', 'password')
            assert result == user_data

    @patch('mysql.connector.connect')
    def test_verify_user_not_found(self, mock_connect, db_manager):
        """Test Benutzer-Verifizierung - Benutzer nicht gefunden"""
        mock_connection = Mock()
        mock_connect.return_value = mock_connection
        
        with patch.object(db_manager, 'execute_query', return_value=[]):
            result = db_manager.verify_user('nonexistent', 'password')
            assert result is None

    def test_export_excel_without_dependencies(self, db_manager):
        """Test Excel-Export ohne Abhängigkeiten"""
        with patch.dict('sys.modules', {'pandas': None, 'openpyxl': None}):
            result = db_manager.export_nomina_excel(2025, 'test.xlsx')
            assert result is False

    def test_search_employees_without_connection(self, db_manager):
        """Test Mitarbeitersuche ohne Verbindung"""
        # Sollte AttributeError werfen weil connection None ist
        with pytest.raises(AttributeError):
            db_manager.search_employees('test')

    @patch('mysql.connector.connect')
    def test_search_employees_success(self, mock_connect, db_manager):
        """Test erfolgreiche Mitarbeitersuche"""
        mock_connection = Mock()
        mock_connect.return_value = mock_connection
        
        employees = [
            {'id_empleado': 1, 'nombre': 'Test', 'apellido': 'User', 'ceco': '1001', 'activo': True}
        ]
        
        with patch.object(db_manager, 'execute_query', return_value=employees):
            result = db_manager.search_employees('test')
            assert result == employees

    def test_get_all_employees_without_connection(self, db_manager):
        """Test alle Mitarbeiter abrufen ohne Verbindung"""
        # Sollte AttributeError werfen weil connection None ist
        with pytest.raises(AttributeError):
            db_manager.get_all_employees()

    @patch('mysql.connector.connect')
    def test_get_all_employees_success(self, mock_connect, db_manager):
        """Test erfolgreiche Abfrage aller Mitarbeiter"""
        mock_connection = Mock()
        mock_connect.return_value = mock_connection
        
        employees = [
            {'id_empleado': 1, 'nombre': 'Test', 'apellido': 'User', 'ceco': '1001', 'activo': True}
        ]
        
        with patch.object(db_manager, 'execute_query', return_value=employees):
            result = db_manager.get_all_employees()
            assert result == employees

    def test_get_employee_complete_info_without_connection(self, db_manager):
        """Test vollständige Mitarbeiterinformationen ohne Verbindung"""
        # Sollte AttributeError werfen weil connection None ist
        with pytest.raises(AttributeError):
            db_manager.get_employee_complete_info(1)

    @patch('mysql.connector.connect')
    def test_get_employee_complete_info_success(self, mock_connect, db_manager):
        """Test erfolgreiche Abfrage vollständiger Mitarbeiterinformationen"""
        mock_connection = Mock()
        mock_connect.return_value = mock_connection
        
        employee_data = {'id_empleado': 1, 'nombre': 'Test', 'apellido': 'User', 'ceco': '1001', 'activo': True}
        salary_data = [{'id_empleado': 1, 'anio': 2025, 'salario_anual_bruto': 30000}]
        
        # Mock execute_query mit return_value statt side_effect
        with patch.object(db_manager, 'execute_query') as mock_query:
            # Erster Aufruf für Mitarbeiterdaten
            mock_query.return_value = [employee_data]
            
            result = db_manager.get_employee_complete_info(1)
            
            # Überprüfe Basis-Struktur
            assert 'employee' in result
            assert result['employee'] == employee_data

    def test_performance_hash_password(self, db_manager):
        """Test Performance von Passwort-Hashing"""
        import time
        
        # Viele Hash-Operationen durchführen
        start_time = time.time()
        
        for i in range(1000):
            db_manager.hash_password(f"password_{i}")
        
        duration = time.time() - start_time
        
        # Sollte unter 5 Sekunden dauern
        assert duration < 5.0

    def test_concurrent_hash_operations(self, db_manager):
        """Test nebenläufige Hash-Operationen"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def hash_password_worker():
            try:
                result = db_manager.hash_password("test_password")
                results.put(result)
            except Exception as e:
                results.put(str(e))
        
        # Mehrere Threads gleichzeitig starten
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=hash_password_worker)
            threads.append(thread)
            thread.start()
        
        # Warten auf alle Threads
        for thread in threads:
            thread.join()
        
        # Alle Ergebnisse sollten identisch sein
        hash_results = []
        while not results.empty():
            hash_results.append(results.get())
        
        # Alle Hashes sollten identisch sein
        assert len(set(hash_results)) == 1
        assert all(len(h) == 64 for h in hash_results)

    def test_memory_usage_hash_operations(self, db_manager):
        """Test Speicherverbrauch bei Hash-Operationen"""
        try:
            import psutil
            import os
            
            process = psutil.Process(os.getpid())
            memory_before = process.memory_info().rss
            
            # Viele Operationen durchführen
            for i in range(1000):
                db_manager.hash_password(f"password_{i}")
            
            memory_after = process.memory_info().rss
            memory_increase = memory_after - memory_before
            
            # Speicherincrease sollte moderat sein (< 50MB)
            assert memory_increase < 50 * 1024 * 1024  # 50 MB in Bytes
            
        except ImportError:
            # psutil nicht verfügbar - Test überspringen
            pytest.skip("psutil nicht verfügbar für Memory-Test")

    def test_error_recovery(self, db_manager):
        """Test Fehlerwiederherstellung"""
        # Test mit verschiedenen Fehlerbedingungen
        error_scenarios = [
            "",    # Leerer String
            "x" * 1000000,  # Sehr langer String
        ]
        
        for scenario in error_scenarios:
            try:
                result = db_manager.hash_password(scenario)
                assert len(result) == 64
            except Exception as e:
                # Sollte nicht crashen
                assert isinstance(e, (MemoryError, OverflowError, AttributeError))

    @patch('mysql.connector.connect')
    def test_disconnect_functionality(self, mock_connect, db_manager):
        """Test Verbindungstrennung"""
        mock_connection = Mock()
        mock_connect.return_value = mock_connection
        
        # Verbindung herstellen
        db_manager.connect()
        assert db_manager.connection == mock_connection
        
        # Verbindung trennen
        db_manager.disconnect()
        mock_connection.close.assert_called_once()
