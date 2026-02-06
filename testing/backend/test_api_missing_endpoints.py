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

from flask_api_server import app, create_access_token, verify_token, SECRET_KEY, ALGORITHM

class TestFlaskAPIMissingEndpoints:
    """Tests für fehlende API-Endpunkte"""

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

    @patch('flask_api_server.db_manager')
    def test_get_employees_with_salaries_success(self, mock_db_manager, client, auth_headers):
        """Test GET /employees/with-salaries erfolgreich"""
        employees_with_salaries = [
            {
                'id_empleado': 1, 
                'nombre': 'Juan', 
                'apellido': 'Perez', 
                'ceco': '1001', 
                'activo': True,
                'salaries': [{'anio': 2025, 'salario_anual_bruto': 30000}]
            }
        ]
        mock_db_manager.get_all_employees_with_salaries.return_value = employees_with_salaries
        
        response = client.get('/employees/with-salaries', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == employees_with_salaries

    def test_get_employees_with_salaries_unauthorized(self, client):
        """Test GET /employees/with-salaries ohne Autorisierung"""
        response = client.get('/employees/with-salaries')
        assert response.status_code == 401

    @patch('flask_api_server.db_manager')
    def test_update_salary_success(self, mock_db_manager, client, auth_headers):
        """Test PUT /employees/{id}/salaries/{year} erfolgreich"""
        mock_db_manager.update_salary.return_value = True
        
        salary_data = {'modalidad': 12, 'salario_anual_bruto': 35000}
        response = client.put('/employees/1/salaries/2025',
                             data=json.dumps(salary_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    def test_update_salary_failure(self, mock_db_manager, client, auth_headers):
        """Test PUT /employees/{id}/salaries/{year} fehlgeschlagen"""
        mock_db_manager.update_salary.return_value = False
        
        salary_data = {'modalidad': 12, 'salario_anual_bruto': 35000}
        response = client.put('/employees/1/salaries/2025',
                             data=json.dumps(salary_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 400

    @patch('flask_api_server.db_manager')
    def test_delete_salary_success(self, mock_db_manager, client, auth_headers):
        """Test DELETE /employees/{id}/salaries/{year} erfolgreich"""
        mock_db_manager.delete_salary.return_value = True
        
        response = client.delete('/employees/1/salaries/2025', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    def test_delete_salary_failure(self, mock_db_manager, client, auth_headers):
        """Test DELETE /employees/{id}/salaries/{year} fehlgeschlagen"""
        mock_db_manager.delete_salary.return_value = False
        
        response = client.delete('/employees/1/salaries/2025', headers=auth_headers)
        
        assert response.status_code == 400

    @patch('flask_api_server.db_manager')
    def test_update_ingresos_success(self, mock_db_manager, client, auth_headers):
        """Test PUT /employees/{id}/ingresos/{year} erfolgreich"""
        mock_db_manager.update_ingresos.return_value = True
        
        ingresos_data = {'ticket_restaurant': 150, 'transporte': 50}
        response = client.put('/employees/1/ingresos/2025',
                             data=json.dumps(ingresos_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    def test_update_deducciones_success(self, mock_db_manager, client, auth_headers):
        """Test PUT /employees/{id}/deducciones/{year} erfolgreich"""
        mock_db_manager.update_deducciones.return_value = True
        
        deducciones_data = {'seguro_accidentes': 40, 'seguro_medico': 60}
        response = client.put('/employees/1/deducciones/2025',
                             data=json.dumps(deducciones_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    def test_update_ingresos_mensuales_success(self, mock_db_manager, client, auth_headers):
        """Test PUT /employees/{id}/ingresos/{year}/{month} erfolgreich"""
        mock_db_manager.update_ingresos_mensuales.return_value = True
        
        ingresos_data = {'horas_extra': 200, 'bonificacion': 100}
        response = client.put('/employees/1/ingresos/2025/6',
                             data=json.dumps(ingresos_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    def test_update_deducciones_mensuales_success(self, mock_db_manager, client, auth_headers):
        """Test PUT /employees/{id}/deducciones/{year}/{month} erfolgreich"""
        mock_db_manager.update_deducciones_mensuales.return_value = True
        
        deducciones_data = {'ausencias': 50, 'atrasos': 20}
        response = client.put('/employees/1/deducciones/2025/6',
                             data=json.dumps(deducciones_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('flask_api_server.db_manager')
    def test_export_excel_monthly_success(self, mock_db_manager, client, auth_headers):
        """Test GET /export/excel/{year}/{month} erfolgreich"""
        mock_db_manager.export_nomina_excel.return_value = True
        
        with patch('flask_api_server.send_file', return_value="mock_file_response"):
            with patch('os.makedirs'):
                response = client.get('/export/excel/2025/6', headers=auth_headers)
        
        assert response.status_code == 200

    @patch('flask_api_server.db_manager')
    def test_export_asiento_nomina_success(self, mock_db_manager, client, auth_headers):
        """Test GET /export/asiento_nomina/{year}/{month} erfolgreich"""
        mock_db_manager.export_asiento_nomina_excel.return_value = True
        
        with patch('flask_api_server.send_file', return_value="mock_file_response"):
            with patch('os.makedirs'):
                response = client.get('/export/asiento_nomina/2025/6', headers=auth_headers)
        
        assert response.status_code == 200

    @patch('flask_api_server.db_manager')
    def test_recalculate_atrasos_success(self, mock_db_manager, client, auth_headers):
        """Test POST /settings/recalculate-atrasos erfolgreich"""
        mock_db_manager.recalculate_all_atrasos_for_year.return_value = {
            'success': True,
            'recalculated_count': 10
        }
        
        request_data = {'year': 2025}
        response = client.post('/settings/recalculate-atrasos',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True

    @patch('flask_api_server.db_manager')
    def test_apply_ingresos_deducciones_success(self, mock_db_manager, client, auth_headers):
        """Test POST /settings/apply-ingresos-deducciones erfolgreich"""
        mock_db_manager.apply_yearly_ingresos_and_deducciones_to_all_active.return_value = {
            'success': True,
            'updated_count': 15
        }
        
        request_data = {
            'year': 2025,
            'ingresos': {'ticket_restaurant': 100},
            'deducciones': {'seguro_accidentes': 30}
        }
        response = client.post('/settings/apply-ingresos-deducciones',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True

    @patch('flask_api_server.db_manager')
    def test_copy_salaries_to_year_success(self, mock_db_manager, client, auth_headers):
        """Test POST /salaries/copy-to-year/{year} erfolgreich"""
        mock_db_manager.copy_salaries_to_new_year.return_value = {
            'success': True,
            'copied_count': 20
        }
        
        response = client.post('/salaries/copy-to-year/2026', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True

    def test_all_endpoints_require_authentication(self, client):
        """Test dass alle geschützten Endpunkte Authentifizierung benötigen"""
        protected_endpoints = [
            ('/employees/with-salaries', 'GET'),
            ('/employees/1/salaries/2025', 'PUT'),
            ('/employees/1/salaries/2025', 'DELETE'),
            ('/employees/1/ingresos/2025', 'PUT'),
            ('/employees/1/deducciones/2025', 'PUT'),
            ('/employees/1/ingresos/2025/6', 'PUT'),
            ('/employees/1/deducciones/2025/6', 'PUT'),
            ('/export/excel/2025/6', 'GET'),
            ('/export/asiento_nomina/2025/6', 'GET'),
            ('/settings/recalculate-atrasos', 'POST'),
            ('/settings/apply-ingresos-deducciones', 'POST'),
            ('/salaries/copy-to-year/2026', 'POST')
        ]
        
        for endpoint, method in protected_endpoints:
            if method == 'GET':
                response = client.get(endpoint)
            elif method == 'POST':
                response = client.post(endpoint, 
                                      data=json.dumps({}),
                                      content_type='application/json')
            elif method == 'PUT':
                response = client.put(endpoint,
                                     data=json.dumps({}),
                                     content_type='application/json')
            elif method == 'DELETE':
                response = client.delete(endpoint)
            
            assert response.status_code == 401, f"Endpoint {endpoint} should require authentication"
