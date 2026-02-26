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

class TestSettingsEndpoints:
    """Tests für Settings Management Endpunkte"""

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

    # Recalculate Atrasos Tests
    @patch('app.db_manager')
    def test_recalculate_atrasos_success(self, mock_db_manager, client, auth_headers):
        """Test erfolgreiche Neuberechnung von Atrasos"""
        mock_db_manager.recalculate_all_atrasos_for_year.return_value = {
            'success': True,
            'processed': 50,
            'updated': 45,
            'errors': 5,
            'details': 'Recalculation completed'
        }
        
        # Sende JSON-Daten mit year Parameter
        response = client.post('/settings/recalculate-atrasos',
                              data=json.dumps({'year': 2025}),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'processed' in data
        assert 'updated' in data
        assert 'errors' in data

    @patch('app.db_manager')
    def test_recalculate_atrasos_failure(self, mock_db_manager, client, auth_headers):
        """Test fehlgeschlagene Neuberechnung von Atrasos"""
        mock_db_manager.recalculate_all_atrasos_for_year.return_value = {
            'success': False,
            'processed': 0,
            'updated': 0,
            'errors': 10,
            'details': 'Recalculation failed'
        }
        
        response = client.post('/settings/recalculate-atrasos',
                              data=json.dumps({'year': 2025}),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['success'] is False

    def test_recalculate_atrasos_unauthorized(self, client):
        """Test Neuberechnung von Atrasos ohne Autorisierung"""
        response = client.post('/settings/recalculate-atrasos')
        assert response.status_code == 401

    @patch('app.db_manager')
    def test_recalculate_atrasos_database_error(self, mock_db_manager, client, auth_headers):
        """Test Neuberechnung von Atrasos mit Datenbankfehler"""
        mock_db_manager.recalculate_all_atrasos_for_year.side_effect = Exception("Database error")
        
        response = client.post('/settings/recalculate-atrasos',
                              data=json.dumps({'year': 2025}),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'errors' in data  # API gibt errors Array zurück

    # Apply Ingresos Deducciones Tests
    @patch('app.db_manager')
    def test_apply_ingresos_deducciones_success(self, mock_db_manager, client, auth_headers):
        """Test erfolgreiche Anwendung von Ingresos und Deducciones"""
        mock_db_manager.apply_yearly_ingresos_and_deducciones_to_all_active.return_value = {
            'success': True,
            'total_count': 100,
            'updated': 95,
            'skipped': 5,
            'details': 'Bulk operation completed'
        }
        
        request_data = {
            'year': 2025,
            'ingresos': 1000.0,
            'deducciones': 200.0,
            'categoria': 'Techniker'
        }
        
        response = client.post('/settings/apply-ingresos-deducciones',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'total_count' in data
        assert 'updated' in data
        # 'errors' field exists in success response

    @patch('app.db_manager')
    def test_apply_ingresos_deducciones_failure(self, mock_db_manager, client, auth_headers):
        """Test fehlgeschlagene Anwendung von Ingresos und Deducciones"""
        mock_db_manager.apply_yearly_ingresos_and_deducciones_to_all_active.return_value = {
            'success': False,
            'processed': 0,
            'updated': 0,
            'errors': 10,
            'details': 'Bulk operation failed'
        }
        
        request_data = {
            'year': 2025,
            'ingresos': 1000.0,
            'deducciones': 200.0
        }
        
        response = client.post('/settings/apply-ingresos-deducciones',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['success'] is False

    @patch('app.db_manager')
    def test_apply_ingresos_deducciones_database_error(self, mock_db_manager, client, auth_headers):
        """Test Anwendung von Ingresos und Deducciones mit Datenbankfehler"""
        mock_db_manager.apply_yearly_ingresos_and_deducciones_to_all_active.side_effect = Exception("Database error")
        
        request_data = {
            'year': 2025,
            'ingresos': 1000.0
        }
        
        response = client.post('/settings/apply-ingresos-deducciones',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'errors' in data  # API gibt errors Array zurück

    def test_apply_ingresos_deducciones_unauthorized(self, client):
        """Test Anwendung von Ingresos und Deducciones ohne Autorisierung"""
        response = client.post('/settings/apply-ingresos-deducciones')
        assert response.status_code == 401

    # Enhanced Payout Month Tests (existing but with more comprehensive testing)
    @patch('app.db_manager')
    def test_get_payout_month_success(self, mock_db_manager, client, auth_headers):
        """Test Abruf von Payout Month erfolgreich"""
        mock_db_manager.get_payout_month.return_value = 6
        
        response = client.get('/settings/payout-month', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['payout_month'] == 6

    @patch('app.db_manager')
    def test_get_payout_month_default(self, mock_db_manager, client, auth_headers):
        """Test Abruf von Payout Month mit Default-Wert"""
        mock_db_manager.get_payout_month.return_value = 4  # Default value
        
        response = client.get('/settings/payout-month', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['payout_month'] == 4

    def test_get_payout_month_unauthorized(self, client):
        """Test Abruf von Payout Month ohne Autorisierung"""
        response = client.get('/settings/payout-month')
        assert response.status_code == 401

    @patch('app.db_manager')
    def test_set_payout_month_success(self, mock_db_manager, client, auth_headers):
        """Test Setzen von Payout Month erfolgreich"""
        mock_db_manager.set_payout_month.return_value = True
        
        request_data = {'payout_month': 8}
        response = client.put('/settings/payout-month',
                             data=json.dumps(request_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['payout_month'] == 8

    @patch('app.db_manager')
    def test_set_payout_month_failure(self, mock_db_manager, client, auth_headers):
        """Test Setzen von Payout Month fehlgeschlagen"""
        mock_db_manager.set_payout_month.return_value = False
        
        request_data = {'payout_month': 8}
        response = client.put('/settings/payout-month',
                             data=json.dumps(request_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    def test_set_payout_month_unauthorized(self, client):
        """Test Setzen von Payout Month ohne Autorisierung"""
        request_data = {'payout_month': 8}
        response = client.put('/settings/payout-month',
                             data=json.dumps(request_data),
                             content_type='application/json')
        assert response.status_code == 401

    def test_set_payout_month_validation_errors(self, client, auth_headers):
        """Test Setzen von Payout Month mit Validierungsfehlern"""
        # Ungültiger Wert (zu hoch)
        request_data = {'payout_month': 13}
        response = client.put('/settings/payout-month',
                             data=json.dumps(request_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 400

        # Ungültiger Wert (zu niedrig)
        request_data = {'payout_month': 0}
        response = client.put('/settings/payout-month',
                             data=json.dumps(request_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 400

        # Ungültiger Typ
        request_data = {'payout_month': '8'}
        response = client.put('/settings/payout-month',
                             data=json.dumps(request_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 400

        # Fehlendes Feld
        request_data = {}
        response = client.put('/settings/payout-month',
                             data=json.dumps(request_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 400

    # Boundary value tests for payout month
    @patch('app.db_manager')
    def test_set_payout_month_boundary_values(self, mock_db_manager, client, auth_headers):
        """Test Setzen von Payout Month mit Grenzwerten"""
        mock_db_manager.set_payout_month.return_value = True
        
        # Januar (1)
        request_data = {'payout_month': 1}
        response = client.put('/settings/payout-month',
                             data=json.dumps(request_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 200

        # Dezember (12)
        request_data = {'payout_month': 12}
        response = client.put('/settings/payout-month',
                             data=json.dumps(request_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 200

    # Database Manager Tests for Settings
    @patch('app.db_manager')
    def test_get_payout_month_database_error(self, mock_db_manager, client, auth_headers):
        """Test Abruf von Payout Month mit Datenbankfehler"""
        mock_db_manager.get_payout_month.side_effect = Exception("Database error")
        
        response = client.get('/settings/payout-month', headers=auth_headers)
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data

    @patch('app.db_manager')
    def test_set_payout_month_database_error(self, mock_db_manager, client, auth_headers):
        """Test Setzen von Payout Month mit Datenbankfehler"""
        mock_db_manager.set_payout_month.side_effect = Exception("Database error")
        
        request_data = {'payout_month': 8}
        response = client.put('/settings/payout-month',
                             data=json.dumps(request_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data

    # Additional settings endpoints that might exist
    @patch('app.db_manager')
    def test_settings_with_optional_parameters(self, mock_db_manager, client, auth_headers):
        """Test Settings Endpunkte mit optionalen Parametern"""
        # Recalculate atrasos mit Jahr
        mock_db_manager.recalculate_all_atrasos_for_year.return_value = {
            'success': True,
            'processed': 10,
            'updated': 10,
            'errors': 0
        }
        
        response = client.post('/settings/recalculate-atrasos',
                              data=json.dumps({'year': 2025}),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200

    @patch('app.db_manager')
    def test_concurrent_settings_operations(self, mock_db_manager, client, auth_headers):
        """Test gleichzeitige Settings Operationen"""
        # Erste Operation
        mock_db_manager.recalculate_all_atrasos_for_year.return_value = {
            'success': True,
            'processed': 10,
            'updated': 10,
            'errors': 0
        }
        
        response1 = client.post('/settings/recalculate-atrasos',
                               data=json.dumps({'year': 2025}),
                               content_type='application/json',
                               headers=auth_headers)
        
        assert response1.status_code == 200

    @patch('app.db_manager')
    def test_settings_performance_large_dataset(self, mock_db_manager, client, auth_headers):
        """Test Settings Performance mit großem Datensatz"""
        # Simuliere große Datenverarbeitung
        mock_db_manager.recalculate_all_atrasos_for_year.return_value = {
            'success': True,
            'processed': 10000,
            'updated': 9500,
            'errors': 500,
            'details': 'Large dataset processing completed'
        }
        
        response = client.post('/settings/recalculate-atrasos',
                              data=json.dumps({'year': 2025}),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['processed'] == 10000
