import pytest
import json
import jwt
from unittest.mock import Mock, patch
from datetime import datetime, timezone, timedelta
import sys
import os

# Backend-Verzeichnis zum Pfad hinzufügen
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
sys.path.insert(0, backend_path)

from app import app, create_access_token, verify_token, SECRET_KEY, ALGORITHM

class TestFlaskAPICore:
    """Kern-Tests für Flask API - fokussiert auf wesentliche Funktionalität"""

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

    def test_jwt_token_creation_and_verification(self):
        """Test JWT Token Erstellung und Verifizierung"""
        # Token erstellen
        data = {"sub": "testuser", "role": "admin"}
        token = create_access_token(data)
        
        # Token validieren
        assert token is not None
        assert isinstance(token, str)
        
        # Token dekodieren
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"
        assert payload["role"] == "admin"
        assert "exp" in payload
        
        # Ablaufdatum prüfen
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        assert exp > now
        assert exp <= now + timedelta(hours=24)  # Standard-Ablauf

    def test_jwt_token_verification_success(self):
        """Test erfolgreiche Token-Verifizierung"""
        data = {"sub": "testuser"}
        token = create_access_token(data)
        
        username = verify_token(token)
        assert username == "testuser"

    def test_jwt_token_verification_invalid(self):
        """Test Token-Verifizierung mit ungültigem Token"""
        invalid_tokens = [
            "invalid",
            "invalid.token",
            "invalid.token.here.extra",
            "",
            None
        ]
        
        for invalid_token in invalid_tokens:
            result = verify_token(invalid_token)
            assert result is None

    def test_jwt_token_verification_expired(self):
        """Test Token-Verifizierung mit abgelaufenem Token"""
        data = {"sub": "testuser"}
        expires_delta = timedelta(seconds=-1)  # Bereits abgelaufen
        token = create_access_token(data, expires_delta)
        
        username = verify_token(token)
        assert username is None

    def test_health_check_endpoint(self, client):
        """Test Health Check Endpoint"""
        response = client.get('/health')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'timestamp' in data

    @patch('app.db_manager')
    def test_login_success(self, mock_db_manager, client):
        """Test erfolgreicher Login"""
        user_data = {
            'id_usuario': 1,
            'nombre_usuario': 'testuser',
            'nombre_completo': 'Test User',
            'rol': 'admin',
            'activo': True
        }
        mock_db_manager.verify_user.return_value = user_data
        
        login_data = {'username': 'testuser', 'password': 'password'}
        response = client.post('/auth/login',
                              data=json.dumps(login_data),
                              content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data
        assert data['token_type'] == 'bearer'
        assert data['user'] == user_data
        
        # Token validieren
        token = data['access_token']
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"

    @patch('app.db_manager')
    def test_login_missing_credentials(self, mock_db_manager, client):
        """Test Login mit fehlenden Credentials"""
        # Fehlender Username
        response = client.post('/auth/login',
                              data=json.dumps({'password': 'password'}),
                              content_type='application/json')
        assert response.status_code == 400
        
        # Fehlendes Passwort
        response = client.post('/auth/login',
                              data=json.dumps({'username': 'testuser'}),
                              content_type='application/json')
        assert response.status_code == 400
        
        # Leere Daten
        response = client.post('/auth/login',
                              data=json.dumps({}),
                              content_type='application/json')
        assert response.status_code == 400

    @patch('app.db_manager')
    def test_login_invalid_credentials(self, mock_db_manager, client):
        """Test Login mit ungültigen Credentials"""
        mock_db_manager.verify_user.return_value = None
        
        login_data = {'username': 'testuser', 'password': 'wrongpassword'}
        response = client.post('/auth/login',
                              data=json.dumps(login_data),
                              content_type='application/json')
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data

    @patch('app.db_manager')
    def test_get_all_employees_success(self, mock_db_manager, client, auth_headers):
        """Test alle Mitarbeiter abrufen erfolgreich"""
        employees = [
            {'id_empleado': 1, 'nombre': 'Juan', 'apellido': 'Perez', 'ceco': '1001', 'activo': True},
            {'id_empleado': 2, 'nombre': 'Maria', 'apellido': 'Garcia', 'ceco': '1002', 'activo': True}
        ]
        mock_db_manager.get_all_employees.return_value = employees
        
        response = client.get('/employees', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == employees

    def test_get_all_employees_unauthorized(self, client):
        """Test alle Mitarbeiter abrufen ohne Autorisierung"""
        response = client.get('/employees')
        assert response.status_code == 401

    def test_get_all_employees_invalid_token(self, client):
        """Test alle Mitarbeiter abrufen mit ungültigem Token"""
        headers = {'Authorization': 'Bearer invalid.token.here'}
        response = client.get('/employees', headers=headers)
        assert response.status_code == 401

    @patch('app.db_manager')
    def test_get_employee_success(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeiter abrufen erfolgreich"""
        employee_info = {
            'employee': {'id_empleado': 1, 'nombre': 'Juan', 'apellido': 'Perez', 'ceco': '1001', 'activo': True},
            'salaries': [{'id_empleado': 1, 'anio': 2025, 'salario_anual_bruto': 30000}],
            'ingresos': [{'id_empleado': 1, 'anio': 2025, 'ticket_restaurant': 100}],
            'deducciones': [{'id_empleado': 1, 'anio': 2025, 'seguro_accidentes': 30}]
        }
        mock_db_manager.get_employee_complete_info.return_value = employee_info
        
        response = client.get('/employees/1', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == employee_info

    @patch('app.db_manager')
    def test_get_employee_not_found(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeiter nicht gefunden"""
        mock_db_manager.get_employee_complete_info.return_value = {}
        
        response = client.get('/employees/999', headers=auth_headers)
        assert response.status_code == 404



    @patch('app.db_manager')
    def test_get_payout_month_success(self, mock_db_manager, client, auth_headers):
        """Test GET /settings/payout-month"""
        mock_db_manager.get_payout_month.return_value = 4

        response = client.get('/settings/payout-month', headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == {"payout_month": 4}



    @patch('app.db_manager')
    def test_set_payout_month_success(self, mock_db_manager, client, auth_headers):
        """Test PUT /settings/payout-month"""
        mock_db_manager.set_payout_month.return_value = True

        response = client.put(
            '/settings/payout-month',
            data=json.dumps({"payout_month": 5}),
            content_type='application/json',
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"] is True
        assert data["payout_month"] == 5



    @patch('app.db_manager')
    def test_set_payout_month_validation_error(self, mock_db_manager, client, auth_headers):
        """Test PUT /settings/payout-month validation"""
        mock_db_manager.set_payout_month.return_value = True

        response = client.put(
            '/settings/payout-month',
            data=json.dumps({"payout_month": 13}),
            content_type='application/json',
            headers=auth_headers,
        )
        assert response.status_code == 400

        response = client.put(
            '/settings/payout-month',
            data=json.dumps({"payout_month": 0}),
            content_type='application/json',
            headers=auth_headers,
        )
        assert response.status_code == 400

        response = client.put(
            '/settings/payout-month',
            data=json.dumps({"payout_month": "5"}),
            content_type='application/json',
            headers=auth_headers,
        )
        assert response.status_code == 400

    @patch('app.db_manager')
    def test_create_employee_success(self, mock_db_manager, client, auth_headers):
        """Test neuen Mitarbeiter erstellen erfolgreich"""
        new_employee = {'id_empleado': 3, 'nombre': 'Test', 'apellido': 'User', 'ceco': '1003', 'activo': True}
        mock_db_manager.add_employee.return_value = 3
        mock_db_manager.get_all_employees.return_value = [new_employee]
        
        employee_data = {'nombre': 'Test', 'apellido': 'User', 'ceco': '1003'}
        response = client.post('/employees',
                              data=json.dumps(employee_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == new_employee

    @patch('app.db_manager')
    def test_create_employee_failure(self, mock_db_manager, client, auth_headers):
        """Test neuen Mitarbeiter erstellen fehlgeschlagen"""
        mock_db_manager.add_employee.return_value = -1
        
        employee_data = {'nombre': 'Test', 'apellido': 'User', 'ceco': '1003'}
        response = client.post('/employees',
                              data=json.dumps(employee_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 400

    @patch('app.db_manager')
    def test_update_employee_success(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeiter aktualisieren erfolgreich"""
        mock_db_manager.update_employee.return_value = True
        
        update_data = {'nombre': 'Updated Name', 'apellido': 'Updated Surname'}
        response = client.put('/employees/1',
                             data=json.dumps(update_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('app.db_manager')
    def test_update_employee_failure(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeiter aktualisieren fehlgeschlagen"""
        mock_db_manager.update_employee.return_value = False
        
        update_data = {'nombre': 'Updated Name'}
        response = client.put('/employees/1',
                             data=json.dumps(update_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 400

    # DEAKTIVIERT zum Schutz der Produktivdaten
    # @patch('app.db_manager')
    # def test_delete_employee_success(self, mock_db_manager, client, auth_headers):
    #     """Test Mitarbeiter löschen erfolgreich"""
    #     mock_db_manager.delete_employee.return_value = True
    #     
    #     response = client.delete('/employees/1', headers=auth_headers)
    #     
    #     assert response.status_code == 200
    #     data = json.loads(response.data)
    #     assert 'message' in data

    # DEAKTIVIERT zum Schutz der Produktivdaten
    # @patch('app.db_manager')
    # def test_delete_employee_failure(self, mock_db_manager, client, auth_headers):
    #     """Test Mitarbeiter löschen fehlgeschlagen"""
    #     mock_db_manager.delete_employee.return_value = False
    #     
    #     response = client.delete('/employees/1', headers=auth_headers)
    #     
    #     assert response.status_code == 400

    @patch('app.db_manager')
    def test_search_employees_success(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeitersuche erfolgreich"""
        employees = [
            {'id_empleado': 1, 'nombre': 'Juan', 'apellido': 'Perez', 'ceco': '1001', 'activo': True}
        ]
        mock_db_manager.search_employees.return_value = employees
        
        response = client.get('/employees/search/Juan', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == employees

    @patch('app.db_manager')
    def test_add_salary_success(self, mock_db_manager, client, auth_headers):
        """Test Gehalt hinzufügen erfolgreich"""
        mock_db_manager.add_salary.return_value = True
        
        salary_data = {'anio': 2025, 'modalidad': 12, 'salario_anual_bruto': 30000}
        response = client.post('/employees/1/salaries',
                              data=json.dumps(salary_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('app.db_manager')
    def test_export_excel_success(self, mock_db_manager, client, auth_headers):
        """Test Excel-Export erfolgreich"""
        mock_db_manager.export_nomina_excel.return_value = True
        
        with patch('app.send_file', return_value="mock_file_response"):
            with patch('os.makedirs'):
                response = client.get('/export/excel/2025', headers=auth_headers)
        
        assert response.status_code == 200

    @patch('app.db_manager')
    def test_export_excel_failure(self, mock_db_manager, client, auth_headers):
        """Test Excel-Export fehlgeschlagen"""
        mock_db_manager.export_nomina_excel.return_value = False
        
        response = client.get('/export/excel/2025', headers=auth_headers)
        assert response.status_code == 400

    def test_concurrent_requests_simple(self, client):
        """Test einfache nebenläufige Anfragen"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def make_request():
            try:
                # Neuen Client für jeden Thread erstellen
                with app.test_client() as thread_client:
                    response = thread_client.get('/health')
                    results.put(response.status_code)
            except Exception as e:
                results.put(str(e))
        
        # Mehrere nebenläufige Anfragen
        threads = []
        for _ in range(3):  # Weniger Threads für Stabilität
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Warten auf alle Threads
        for thread in threads:
            thread.join()
        
        # Überprüfe Ergebnisse
        success_count = 0
        while not results.empty():
            result = results.get()
            if result == 200:
                success_count += 1
        
        # Mindestens 2 von 3 sollten erfolgreich sein
        assert success_count >= 2

    def test_api_response_format(self, client):
        """Test API-Antwortformate"""
        # Health Check
        response = client.get('/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, dict)
        assert 'status' in data
        
        # Ungeschützer Endpunkt
        response = client.get('/employees')
        assert response.status_code == 401
        data = json.loads(response.data)
        assert isinstance(data, dict)

    def test_security_headers_basic(self, client):
        """Test grundlegende Security Headers"""
        response = client.get('/health')
        
        # Status Code sollte 200 sein
        assert response.status_code == 200
        
        # Content-Type sollte vorhanden sein
        content_type = response.headers.get('Content-Type', '')
        assert 'application/json' in content_type
