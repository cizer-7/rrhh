import pytest
import json
import jwt
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import sys
import os

# Backend-Verzeichnis zum Pfad hinzufügen
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

from flask_api_server import app, create_access_token, verify_token, SECRET_KEY, ALGORITHM

class TestFlaskAPI:
    """Unit Tests für Flask API Server"""

    def test_create_access_token(self):
        """Test JWT Token Erstellung"""
        data = {"sub": "testuser"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        
        # Verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"
        assert "exp" in payload

    def test_create_access_token_with_expiry(self):
        """Test JWT Token Erstellung mit Ablaufdatum"""
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=30)
        token = create_access_token(data, expires_delta)
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"
        assert "exp" in payload

    def test_verify_token_success(self):
        """Test Token Verifizierung erfolgreich"""
        data = {"sub": "testuser"}
        token = create_access_token(data)
        
        username = verify_token(token)
        assert username == "testuser"

    def test_verify_token_invalid(self):
        """Test Token Verifizierung ungültig"""
        invalid_token = "invalid.token.here"
        
        username = verify_token(invalid_token)
        assert username is None

    def test_verify_token_expired(self):
        """Test Token Verifizierung abgelaufen"""
        data = {"sub": "testuser"}
        expires_delta = timedelta(seconds=-1)  # Already expired
        token = create_access_token(data, expires_delta)
        
        username = verify_token(token)
        assert username is None

    @pytest.fixture
    def auth_headers(self):
        """Authorization Headers mit gültigem Token"""
        token = create_access_token({"sub": "testuser"})
        return {'Authorization': f'Bearer {token}'}

    @pytest.fixture
    def client(self):
        """Flask Test Client"""
        app.config['TESTING'] = True
        with app.test_client() as client:
            with app.app_context():
                yield client

    def test_health_check(self, client):
        """Test Health Check Endpoint"""
        response = client.get('/health')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'timestamp' in data

    @patch('flask_api_server.db_manager')
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

    @patch('flask_api_server.db_manager')
    def test_login_missing_credentials(self, mock_db_manager, client):
        """Test Login mit fehlenden Credentials"""
        response = client.post('/auth/login',
                              data=json.dumps({'username': 'testuser'}),
                              content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    @patch('flask_api_server.db_manager')
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

    @patch('flask_api_server.db_manager')
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

    @patch('flask_api_server.db_manager')
    def test_get_employee_success(self, mock_db_manager, client, auth_headers, sample_employee_data, sample_salary_data):
        """Test Mitarbeiter abrufen erfolgreich"""
        employee_info = {
            'employee': sample_employee_data,
            'salaries': [sample_salary_data],
            'ingresos': [],
            'deducciones': []
        }
        mock_db_manager.get_employee_complete_info.return_value = employee_info
        
        response = client.get('/employees/1', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == employee_info

    @patch('flask_api_server.db_manager')
    def test_get_employee_not_found(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeiter nicht gefunden"""
        mock_db_manager.get_employee_complete_info.return_value = {}
        
        response = client.get('/employees/999', headers=auth_headers)
        
        assert response.status_code == 404

    @patch('flask_api_server.db_manager')
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

    @patch('flask_api_server.db_manager')
    def test_create_employee_failure(self, mock_db_manager, client, auth_headers):
        """Test neuen Mitarbeiter erstellen fehlgeschlagen"""
        mock_db_manager.add_employee.return_value = -1
        
        employee_data = {'nombre': 'Test', 'apellido': 'User', 'ceco': '1003'}
        response = client.post('/employees',
                              data=json.dumps(employee_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 400

    @patch('flask_api_server.db_manager')
    def test_update_employee_success(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeiter aktualisieren erfolgreich"""
        mock_db_manager.update_employee.return_value = True
        
        update_data = {'nombre': 'Nuevo Nombre', 'apellido': 'Nuevo Apellido'}
        response = client.put('/employees/1',
                             data=json.dumps(update_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    def test_update_employee_failure(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeiter aktualisieren fehlgeschlagen"""
        mock_db_manager.update_employee.return_value = False
        
        update_data = {'nombre': 'Nuevo Nombre'}
        response = client.put('/employees/1',
                             data=json.dumps(update_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 400

    @patch('flask_api_server.db_manager')
    def test_update_employee_no_data(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeiter aktualisieren ohne Daten"""
        response = client.put('/employees/1',
                             data=json.dumps({}),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 400

    @patch('flask_api_server.db_manager')
    def test_delete_employee_success(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeiter löschen erfolgreich"""
        mock_db_manager.delete_employee.return_value = True
        
        response = client.delete('/employees/1', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    def test_delete_employee_failure(self, mock_db_manager, client, auth_headers):
        """Test Mitarbeiter löschen fehlgeschlagen"""
        mock_db_manager.delete_employee.return_value = False
        
        response = client.delete('/employees/1', headers=auth_headers)
        
        assert response.status_code == 400

    @patch('flask_api_server.db_manager')
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

    @patch('flask_api_server.db_manager')
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

    @patch('flask_api_server.db_manager')
    def test_add_salary_failure(self, mock_db_manager, client, auth_headers):
        """Test Gehalt hinzufügen fehlgeschlagen"""
        mock_db_manager.add_salary.return_value = False
        
        salary_data = {'anio': 2025, 'modalidad': 12, 'salario_anual_bruto': 30000}
        response = client.post('/employees/1/salaries',
                              data=json.dumps(salary_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 400

    @patch('flask_api_server.db_manager')
    def test_update_salary_success(self, mock_db_manager, client, auth_headers):
        """Test Gehalt aktualisieren erfolgreich"""
        mock_db_manager.update_salary.return_value = True
        
        salary_data = {'modalidad': 14, 'salario_anual_bruto': 35000}
        response = client.put('/employees/1/salaries/2025',
                             data=json.dumps(salary_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    def test_delete_salary_success(self, mock_db_manager, client, auth_headers):
        """Test Gehalt löschen erfolgreich"""
        mock_db_manager.delete_salary.return_value = True
        
        response = client.delete('/employees/1/salaries/2025', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    def test_update_ingresos_success(self, mock_db_manager, client, auth_headers):
        """Test Bruttoeinkünfte aktualisieren erfolgreich"""
        mock_db_manager.update_ingresos.return_value = True
        
        ingresos_data = {'ticket_restaurant': 100, 'primas': 200}
        response = client.put('/employees/1/ingresos/2025',
                              data=json.dumps(ingresos_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    def test_update_deducciones_success(self, mock_db_manager, client, auth_headers):
        """Test Abzüge aktualisieren erfolgreich"""
        mock_db_manager.update_deducciones.return_value = True
        
        deducciones_data = {'seguro_accidentes': 30, 'adelas': 40}
        response = client.put('/employees/1/deducciones/2025',
                              data=json.dumps(deducciones_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    @patch('os.makedirs')
    @patch('flask_api_server.send_file')
    def test_export_excel_success(self, mock_send_file, mock_makedirs, mock_db_manager, client, auth_headers):
        """Test Excel-Export erfolgreich"""
        mock_db_manager.export_nomina_excel.return_value = True
        mock_send_file.return_value = "mock_file_response"
        
        response = client.get('/export/excel/2025', headers=auth_headers)
        
        assert response.status_code == 200
        mock_makedirs.assert_called_once_with("C:/temp", exist_ok=True)
        mock_db_manager.export_nomina_excel.assert_called_once()

    @patch('flask_api_server.db_manager')
    def test_export_excel_failure(self, mock_db_manager, client, auth_headers):
        """Test Excel-Export fehlgeschlagen"""
        mock_db_manager.export_nomina_excel.return_value = False
        
        response = client.get('/export/excel/2025', headers=auth_headers)
        
        assert response.status_code == 400

    def test_token_required_missing_token(self, client):
        """Test Token Required Decorator - fehlender Token"""
        response = client.get('/employees')
        
        assert response.status_code == 401

    def test_token_required_invalid_format(self, client):
        """Test Token Required Decorator - ungültiges Format"""
        headers = {'Authorization': 'InvalidFormat token123'}
        response = client.get('/employees', headers=headers)
        
        assert response.status_code == 401

    def test_token_required_invalid_token(self, client):
        """Test Token Required Decorator - ungültiger Token"""
        headers = {'Authorization': 'Bearer invalid.token.here'}
        response = client.get('/employees', headers=headers)
        
        assert response.status_code == 401
