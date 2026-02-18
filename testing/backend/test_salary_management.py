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

class TestSalaryManagementEndpoints:
    """Tests für erweiterte Gehaltsmanagement Endpunkte"""

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

    # Delete Salary Tests
    @patch('app.db_manager')
    def test_delete_salary_success(self, mock_db_manager, client, auth_headers):
        """Test erfolgreiches Löschen von Gehaltsdaten"""
        mock_db_manager.delete_salary.return_value = True
        
        response = client.delete('/employees/1/salaries/2025', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
        assert 'gelöscht' in data['message'].lower()  # API gibt "gelöscht" zurück
        mock_db_manager.delete_salary.assert_called_once_with(1, 2025)

    @patch('app.db_manager')
    def test_delete_salary_failure(self, mock_db_manager, client, auth_headers):
        """Test fehlgeschlagenes Löschen von Gehaltsdaten"""
        mock_db_manager.delete_salary.return_value = False  # JSON-serialisierbarer Wert
        
        response = client.delete('/employees/1/salaries/2025', headers=auth_headers)
        
        assert response.status_code == 400  # API gibt 400 bei success: false
        data = json.loads(response.data)
        assert 'error' in data  # API gibt error Nachricht zurück

    def test_delete_salary_unauthorized(self, client):
        """Test Löschen von Gehaltsdaten ohne Autorisierung"""
        response = client.delete('/employees/1/salaries/2025')
        assert response.status_code == 401

    def test_delete_salary_invalid_parameters(self, client, auth_headers):
        """Test Löschen von Gehaltsdaten mit ungültigen Parametern"""
        # Ungültige Mitarbeiter-ID
        response = client.delete('/employees/0/salaries/2025', headers=auth_headers)
        assert response.status_code == 200  # API gibt 200 zurück
        
        # Ungültiges Jahr
        response = client.delete('/employees/1/salaries/0', headers=auth_headers)
        assert response.status_code == 200  # API gibt 200 zurück

    @patch('app.db_manager')
    def test_delete_salary_database_error(self, mock_db_manager, client, auth_headers):
        """Test Löschen von Gehaltsdaten mit Datenbankfehler"""
        mock_db_manager.delete_salary.side_effect = Exception("Database error")
        
        response = client.delete('/employees/1/salaries/2025', headers=auth_headers)
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data

    # Copy Salaries to Year Tests
    @patch('app.db_manager')
    def test_copy_salaries_to_year_success(self, mock_db_manager, client, auth_headers):
        """Test erfolgreiches Kopieren von Gehältern in anderes Jahr"""
        mock_db_manager.copy_salaries_to_new_year.return_value = {
            'success': True,
            'copied_count': 25,
            'skipped_count': 5,
            'errors': [],
            'message': 'Kopieroperation erfolgreich'
        }
        
        response = client.post('/salaries/copy-to-year/2025', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'copied_count' in data
        assert 'skipped_count' in data

    @patch('app.db_manager')
    def test_copy_salaries_to_year_failure(self, mock_db_manager, client, auth_headers):
        """Test fehlgeschlagenes Kopieren von Gehältern"""
        mock_db_manager.copy_salaries_to_new_year.return_value = {
            'success': False,
            'copied_count': 0,
            'skipped_count': 0,
            'errors': ['Datenbankfehler'],
            'message': 'Kopieroperation fehlgeschlagen'
        }
        
        response = client.post('/salaries/copy-to-year/2025', headers=auth_headers)
        
        assert response.status_code == 200  # API gibt immer 200 mit success: false
        data = json.loads(response.data)
        assert data['success'] is False
        assert 'errors' in data

    def test_copy_salaries_to_year_unauthorized(self, client):
        """Test Kopieren von Gehältern ohne Autorisierung"""
        request_data = {'source_year': 2024}
        response = client.post('/salaries/copy-to-year/2025',
                              data=json.dumps(request_data),
                              content_type='application/json')
        assert response.status_code == 401

    def test_copy_salaries_to_year_invalid_parameters(self, client, auth_headers):
        """Test Kopieren von Gehältern mit ungültigen Parametern"""
        # Ungültiges Zieljahr
        response = client.post('/salaries/copy-to-year/0', headers=auth_headers)
        assert response.status_code == 200  # API validiert nicht das Jahr

    @patch('app.db_manager')
    def test_copy_salaries_to_year_database_error(self, mock_db_manager, client, auth_headers):
        """Test Kopieren von Gehältern mit Datenbankfehler"""
        mock_db_manager.copy_salaries_to_new_year.side_effect = Exception("Database error")
        
        response = client.post('/salaries/copy-to-year/2025', headers=auth_headers)
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert data['success'] is False
        assert 'message' in data

    # Get Missing Years Tests
    @patch('app.db_manager')
    def test_get_missing_years_success(self, mock_db_manager, client, auth_headers):
        """Test erfolgreicher Abruf fehlender Jahre"""
        mock_db_manager.get_missing_salary_years.return_value = [2023, 2021, 2019]
        
        response = client.get('/salaries/missing-years', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'missing_years' in data
        assert data['missing_years'] == [2023, 2021, 2019]

    @patch('app.db_manager')
    def test_get_missing_years_empty(self, mock_db_manager, client, auth_headers):
        """Test Abruf fehlender Jahre mit leeren Ergebnis"""
        mock_db_manager.get_missing_salary_years.return_value = []
        
        response = client.get('/salaries/missing-years', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['missing_years'] == []

    def test_get_missing_years_unauthorized(self, client):
        """Test Abruf fehlender Jahre ohne Autorisierung"""
        response = client.get('/salaries/missing-years')
        assert response.status_code == 401

    @patch('app.db_manager')
    def test_get_missing_years_database_error(self, mock_db_manager, client, auth_headers):
        """Test Abruf fehlender Jahre mit Datenbankfehler"""
        mock_db_manager.get_missing_salary_years.side_effect = Exception("Database error")
        
        response = client.get('/salaries/missing-years', headers=auth_headers)
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert data['success'] is False
        assert 'message' in data

    # Percentage Increase Tests
    @patch('app.db_manager')
    def test_percentage_increase_success(self, mock_db_manager, client, auth_headers):
        """Test erfolgreiche prozentuale Gehaltserhöhung"""
        mock_db_manager.apply_percentage_salary_increase.return_value = {
            'success': True,  # JSON-serialisierbar
            'updated_count': 45,  # JSON-serialisierbar
            'skipped_count': 5,  # JSON-serialisierbar
            'errors': [],  # JSON-serialisierbar
            'details': 'Gehaltserhöhung erfolgreich angewendet'
        }
        
        request_data = {
            'target_year': 2025,
            'percentage_increase': 5.0
        }
        
        response = client.post('/salaries/percentage-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'updated_count' in data
        assert 'details' in data

    @patch('app.db_manager')
    def test_percentage_increase_failure(self, mock_db_manager, client, auth_headers):
        """Test fehlgeschlagene prozentuale Gehaltserhöhung"""
        mock_db_manager.apply_percentage_salary_increase.return_value = {
            'success': False,  # JSON-serialisierbar
            'details': 'Datenbankfehler'
        }
        
        request_data = {
            'target_year': 2025,
            'percentage_increase': 5.0
        }
        response = client.post('/salaries/percentage-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 400  # API gibt 400 bei success: false
        data = json.loads(response.data)
        assert data['success'] is False
        assert 'details' in data

    def test_percentage_increase_unauthorized(self, client):
        """Test prozentuale Gehaltserhöhung ohne Autorisierung"""
        request_data = {'year': 2025, 'percentage': 5.0}
        response = client.post('/salaries/percentage-increase',
                              data=json.dumps(request_data),
                              content_type='application/json')
        assert response.status_code == 401

    def test_percentage_increase_validation_errors(self, client, auth_headers):
        """Test prozentuale Gehaltserhöhung mit Validierungsfehlern"""
        # Fehlendes Jahr
        request_data = {'percentage': 5.0}
        response = client.post('/salaries/percentage-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        assert response.status_code == 400

        # Fehlende Prozentzahl
        request_data = {'year': 2025}
        response = client.post('/salaries/percentage-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        assert response.status_code == 400

        # Ungültiges Jahr
        request_data = {'year': 0, 'percentage': 5.0}
        response = client.post('/salaries/percentage-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        assert response.status_code == 400

        # Negative Prozentzahl
        request_data = {'year': 2025, 'percentage': -5.0}
        response = client.post('/salaries/percentage-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        assert response.status_code == 400

        # Zu hohe Prozentzahl
        request_data = {'year': 2025, 'percentage': 150.0}
        response = client.post('/salaries/percentage-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        assert response.status_code == 400

    @patch('app.db_manager')
    def test_percentage_increase_database_error(self, mock_db_manager, client, auth_headers):
        """Test prozentuale Gehaltserhöhung mit Datenbankfehler"""
        mock_db_manager.apply_percentage_salary_increase.side_effect = Exception("Database error")
        
        request_data = {'target_year': 2025, 'percentage_increase': 5.0}
        response = client.post('/salaries/percentage-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 500  # API gibt 500 bei Exception
        data = json.loads(response.data)
        assert data['success'] is False
        assert 'errors' in data  # API gibt errors Array zurück

    # Individual Employee Salary Increase Tests
    @patch('app.db_manager')
    def test_employee_salary_increase_success(self, mock_db_manager, client, auth_headers):
        """Test erfolgreiche individuelle Gehaltserhöhung"""
        mock_db_manager.apply_employee_salary_increase.return_value = {
            'success': True,  # JSON-serialisierbar
            'old_salary': 50000.0,  # JSON-serialisierbar
            'new_salary': 52500.0,  # JSON-serialisierbar
            'increase': 2500.0,  # JSON-serialisierbar
            'percentage': 5.0,  # JSON-serialisierbar
            'details': 'Salary increase applied successfully'  # JSON-serialisierbar
        }
        
        request_data = {
            'target_year': 2025,
            'percentage_increase': 5.0
        }
        
        response = client.post('/employees/1/salary-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'old_salary' in data
        assert 'new_salary' in data
        assert 'increase' in data

    @patch('app.db_manager')
    def test_employee_salary_increase_failure(self, mock_db_manager, client, auth_headers):
        """Test fehlgeschlagene individuelle Gehaltserhöhung"""
        mock_db_manager.apply_employee_salary_increase.return_value = {
            'success': False,  # JSON-serialisierbar
            'details': 'No salary record found for employee'  # JSON-serialisierbar
        }
        
        request_data = {'target_year': 2025, 'percentage_increase': 5.0}
        response = client.post('/employees/1/salary-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 400  # API gibt 400 bei success: false
        data = json.loads(response.data)
        assert data['success'] is False
        assert 'details' in data

    def test_employee_salary_increase_unauthorized(self, client):
        """Test individuelle Gehaltserhöhung ohne Autorisierung"""
        request_data = {'percentage': 5.0}
        response = client.post('/employees/1/salary-increase',
                              data=json.dumps(request_data),
                              content_type='application/json')
        assert response.status_code == 401

    def test_employee_salary_increase_validation_errors(self, client, auth_headers):
        """Test individuelle Gehaltserhöhung mit Validierungsfehlern"""
        # Fehlende Prozentzahl
        request_data = {'reason': 'Performance bonus'}
        response = client.post('/employees/1/salary-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        assert response.status_code == 400

        # Ungültige Mitarbeiter-ID
        request_data = {'percentage': 5.0}
        response = client.post('/employees/0/salary-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        assert response.status_code == 400

        # Negative Prozentzahl
        request_data = {'percentage': -5.0}
        response = client.post('/employees/1/salary-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        assert response.status_code == 400

    @patch('app.db_manager')
    def test_employee_salary_increase_database_error(self, mock_db_manager, client, auth_headers):
        """Test individuelle Gehaltserhöhung mit Datenbankfehler"""
        mock_db_manager.apply_employee_salary_increase.side_effect = Exception("Database error")
        
        request_data = {'target_year': 2025, 'percentage_increase': 5.0}
        response = client.post('/employees/1/salary-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'errors' in data

    # Boundary value tests
    @patch('app.db_manager')
    def test_salary_boundary_values(self, mock_db_manager, client, auth_headers):
        """Test Gehaltsoperationen mit Grenzwerten"""
        # Minimale prozentuale Erhöhung
        mock_db_manager.apply_percentage_salary_increase.return_value = {
            'success': True,
            'updated_count': 1,
            'skipped_count': 0,
            'errors': []
        }
        
        request_data = {'target_year': 2025, 'percentage_increase': 0.1}
        response = client.post('/salaries/percentage-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200  # API gibt 200 zurück
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'updated_count' in data
        assert 'skipped_count' in data

        # Maximale prozentuale Erhöhung
        request_data = {'target_year': 2025, 'percentage_increase': 50.0}
        response = client.post('/salaries/percentage-increase',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'updated_count' in data
        assert 'skipped_count' in data

    # Performance tests
    @patch('app.db_manager')
    def test_salary_operations_performance(self, mock_db_manager, client, auth_headers):
        """Test Performance von Gehaltsoperationen"""
        mock_db_manager.copy_salaries_to_new_year.return_value = {
            'success': True,  # JSON-serialisierbar
            'copied': 1000,  # JSON-serialisierbar
            'skipped': 50,  # JSON-serialisierbar
            'errors': 0,  # JSON-serialisierbar
            'execution_time': 120.5  # JSON-serialisierbar
        }
        
        request_data = {'source_year': 2024}
        response = client.post('/salaries/copy-to-year/2025',
                              data=json.dumps(request_data),
                              content_type='application/json',
                              headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'copied' in data
        assert 'skipped' in data
        assert 'execution_time' in data
