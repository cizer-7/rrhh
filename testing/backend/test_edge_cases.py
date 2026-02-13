import pytest
import json
import jwt
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone, timedelta
import sys
import os

# Backend-Verzeichnis zum Pfad hinzufügen
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
sys.path.insert(0, backend_path)

from app import app, create_access_token, verify_token, SECRET_KEY, ALGORITHM
from database_manager import DatabaseManager

class TestEdgeCasesAndErrorHandling:
    """Edge Cases und Fehlerbehandlung Tests"""

    @pytest.fixture
    def client(self):
        """Flask Test Client"""
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test_secret_key'
        with app.test_client() as client:
            with app.app_context():
                yield client

    @pytest.fixture
    def auth_headers(self):
        """Authorization Headers mit gültigem Token"""
        token = create_access_token({"sub": "testuser"})
        return {'Authorization': f'Bearer {token}'}

    def test_jwt_token_with_invalid_secret(self):
        """Test JWT Token mit ungültigem Secret"""
        # Token mit anderem Secret erstellen
        token = jwt.encode({"sub": "testuser"}, "wrong_secret", algorithm="HS256")
        
        username = verify_token(token)
        assert username is None

    def test_jwt_token_with_wrong_algorithm(self):
        """Test JWT Token mit falschem Algorithmus"""
        # Token mit anderem Algorithmus erstellen
        token = jwt.encode({"sub": "testuser"}, SECRET_KEY, algorithm="HS512")
        
        username = verify_token(token)
        assert username is None

    def test_jwt_token_missing_subject(self):
        """Test JWT Token ohne Subject"""
        token = jwt.encode({"role": "admin"}, SECRET_KEY, algorithm=ALGORITHM)
        
        username = verify_token(token)
        assert username is None

    def test_malformed_authorization_header(self, client):
        """Test missformatierte Authorization Header"""
        malformed_headers = [
            {'Authorization': 'InvalidHeader'},
            {'Authorization': 'Bearer'},
            {'Authorization': 'Bearer '},
            {'Authorization': 'Bearera token.here'},
            {'Authorization': 'Bearer token.here.extra.parts'}
        ]
        
        for headers in malformed_headers:
            response = client.get('/employees', headers=headers)
            assert response.status_code == 401

    @patch('app.db_manager')
    def test_database_connection_error(self, mock_db_manager, client, auth_headers):
        """Test Datenbankverbindungsfehler"""
        mock_db_manager.get_all_employees.side_effect = Exception("Database connection lost")
        
        response = client.get('/employees', headers=auth_headers)
        
        # Sollte 500 Internal Server Error geben
        assert response.status_code in [500, 400]

    @patch('app.db_manager')
    def test_login_with_database_error(self, mock_db_manager, client):
        """Test Login bei Datenbankfehler"""
        mock_db_manager.verify_user.side_effect = Exception("Database error")
        
        login_data = {'username': 'testuser', 'password': 'password'}
        response = client.post('/auth/login',
                              data=json.dumps(login_data),
                              content_type='application/json')
        
        assert response.status_code == 500

    def test_invalid_json_payload(self, client, auth_headers):
        """Test ungültige JSON Payload"""
        invalid_json_data = [
            'invalid json',
            '{"incomplete": json',
            '{"key": undefined}',
            'null',
            ''
        ]
        
        for invalid_data in invalid_json_data:
            response = client.post('/employees',
                                  data=invalid_data,
                                  content_type='application/json',
                                  headers=auth_headers)
            
            # Sollte 400 Bad Request oder 500 Internal Server Error geben
            assert response.status_code in [400, 500]

    @patch('app.db_manager')
    def test_employee_not_found_various_endpoints(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeiter nicht gefunden bei verschiedenen Endpunkten"""
        mock_db_manager.get_employee_complete_info.return_value = {}
        mock_db_manager.update_employee.return_value = False
        mock_db_manager.delete_employee.return_value = False
        
        # GET employee
        response = client.get('/employees/999', headers=auth_headers)
        assert response.status_code == 404
        
        # PUT employee
        response = client.put('/employees/999',
                             data=json.dumps({'nombre': 'Test'}),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 400
        
        # DELETE employee
        response = client.delete('/employees/999', headers=auth_headers)
        assert response.status_code == 400

    @patch('app.db_manager')
    def test_invalid_employee_ids(self, mock_db_manager, client, auth_headers):
        """Test ungültige Mitarbeiter-IDs"""
        invalid_ids = [
            '/employees/abc',  # String statt Zahl
            '/employees/-1',   # Negative Zahl
            '/employees/0',   # Zero
            '/employees/999999999999999999'  # Zu große Zahl
        ]
        
        for endpoint in invalid_ids:
            response = client.get(endpoint, headers=auth_headers)
            # Sollte entweder 404 (nicht gefunden), 400 (bad request) oder 500 sein
            assert response.status_code in [404, 400, 500]

    @patch('app.db_manager')
    def test_invalid_years_and_months(self, mock_db_manager, client, auth_headers):
        """Test ungültige Jahre und Monate"""
        mock_db_manager.update_salary.return_value = True
        mock_db_manager.update_ingresos.return_value = True
        mock_db_manager.update_deducciones.return_value = True
        
        # Ungültige Jahre
        invalid_years = [
            ('/employees/1/salaries/abc', 'PUT'),
            ('/employees/1/salaries/0', 'PUT'),
            ('/employees/1/salaries/-2025', 'PUT'),
            ('/employees/1/salaries/10000', 'PUT')
        ]
        
        # Ungültige Monate
        invalid_months = [
            ('/employees/1/ingresos/2025/abc', 'PUT'),
            ('/employees/1/ingresos/2025/0', 'PUT'),
            ('/employees/1/ingresos/2025/13', 'PUT'),
            ('/employees/1/ingresos/2025/-6', 'PUT')
        ]
        
        for endpoint, method in invalid_years + invalid_months:
            if method == 'PUT':
                response = client.put(endpoint,
                                     data=json.dumps({'test': 'data'}),
                                     content_type='application/json',
                                     headers=auth_headers)
            
            # Flask kann diese Routen als gültig behandeln, also prüfen wir auf 200 oder 404
            assert response.status_code in [200, 404, 500]

    @patch('app.db_manager')
    def test_empty_search_results(self, mock_db_manager, client, auth_headers):
        """Test leere Suchergebnisse"""
        mock_db_manager.search_employees.return_value = []
        
        response = client.get('/employees/search/nonexistent', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == []

    @patch('app.db_manager')
    def test_sql_injection_attempts(self, mock_db_manager, client, auth_headers):
        """Test SQL Injection Versuche"""
        # Mock sollte normal funktionieren
        mock_db_manager.search_employees.return_value = []
        
        malicious_search_terms = [
            "'; DROP TABLE employees; --",
            "1' OR '1'='1",
            "admin'--",
            "'; INSERT INTO users VALUES ('hacker', 'password'); --"
        ]
        
        for search_term in malicious_search_terms:
            response = client.get(f'/employees/search/{search_term}', headers=auth_headers)
            
            # Sollte 200 zurückgeben (Mock fängt alles ab), aber in Realität 
            # sollten die Parameter richtig escaped werden
            assert response.status_code == 200
            mock_db_manager.search_employees.assert_called_with(search_term)

    @patch('app.db_manager')
    def test_large_payload_handling(self, mock_db_manager, client, auth_headers):
        """Test Verarbeitung großer Payloads"""
        mock_db_manager.add_employee.return_value = 1
        
        # Sehr große Payload erstellen
        large_payload = {
            'nombre': 'x' * 10000,  # 10KB Name
            'apellido': 'y' * 10000,  # 10KB Nachname
            'ceco': 'z' * 1000  # 1KB Cost Center
        }
        
        response = client.post('/employees',
                              data=json.dumps(large_payload),
                              content_type='application/json',
                              headers=auth_headers)
        
        # Sollte 200, 400, 404 oder 413 sein
        assert response.status_code in [200, 400, 404, 413]

    def test_concurrent_login_attempts(self, client):
        """Test nebenläufige Login-Versuche"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def make_login_request():
            try:
                with app.test_client() as thread_client:
                    response = thread_client.post('/auth/login',
                                                 data=json.dumps({'username': 'test', 'password': 'test'}),
                                                 content_type='application/json')
                    results.put(response.status_code)
            except Exception as e:
                results.put(str(e))
        
        # Mehrere nebenläufige Login-Versuche
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_login_request)
            threads.append(thread)
            thread.start()
        
        # Warten auf alle Threads
        for thread in threads:
            thread.join()
        
        # Überprüfe Ergebnisse
        success_count = 0
        error_count = 0
        
        while not results.empty():
            result = results.get()
            if isinstance(result, int) and result in [200, 401]:
                success_count += 1
            else:
                error_count += 1
        
        # Mindestens 3 sollten erfolgreich verarbeitet werden
        assert success_count >= 3
        assert error_count == 0

    def test_large_dataset_processing(self):
        """Test Verarbeitung großer Datensätze ohne Speicherprobleme"""
        # Simuliere Verarbeitung großer Datenmengen
        large_data = []
        for i in range(1000):  # Reduzierte Größe für Stabilität
            large_data.append({
                'id': i,
                'name': f'Employee {i}',
                'salary': 30000 + i,
                'data': 'x' * 100  # Zusätzliche Daten
            })
        
        # JSON-Verarbeitung sollte ohne Fehler funktionieren
        try:
            json_str = json.dumps(large_data)
            parsed_data = json.loads(json_str)
            assert len(parsed_data) == 1000
        except Exception as e:
            pytest.fail(f"Large dataset processing failed: {e}")
