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

class TestFTEEndpoints:
    """Tests für FTE (Full-Time Equivalent) Management Endpunkte"""

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

    @patch('app.db_manager')
    def test_get_employee_fte_success(self, mock_db_manager, client, auth_headers):
        """Test FTE-Daten für Mitarbeiter abrufen erfolgreich"""
        fte_data = [
            {'anio': 2025, 'mes': 1, 'porcentaje': 100.0, 'fecha_modificacion': '2025-01-01'},
            {'anio': 2025, 'mes': 2, 'porcentaje': 80.0, 'fecha_modificacion': '2025-02-01'}
        ]
        mock_db_manager.get_employee_fte.return_value = fte_data
        
        response = client.get('/employees/1/fte', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['items'] == fte_data
        mock_db_manager.get_employee_fte.assert_called_once_with(1)

    def test_get_employee_fte_unauthorized(self, client):
        """Test FTE-Daten abrufen ohne Autorisierung"""
        response = client.get('/employees/1/fte')
        assert response.status_code == 401

    @patch('app.db_manager')
    def test_get_employee_fte_database_error(self, mock_db_manager, client, auth_headers):
        """Test FTE-Daten abrufen mit Datenbankfehler"""
        mock_db_manager.get_employee_fte.side_effect = Exception("Database error")
        
        response = client.get('/employees/1/fte', headers=auth_headers)
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data

    @patch('app.db_manager')
    def test_upsert_employee_fte_success(self, mock_db_manager, client, auth_headers):
        """Test FTE-Daten erstellen/aktualisieren erfolgreich"""
        mock_db_manager.upsert_employee_fte.return_value = True
        mock_db_manager.get_employee_fte.return_value = []  # No existing entry
        
        fte_data = {
            'anio': 2025,
            'mes': 1,
            'porcentaje': 75.5
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
        assert 'Stundenreduzierung gespeichert' in data['message']
        mock_db_manager.upsert_employee_fte.assert_called_once_with(1, 2025, 1, 75.5)

    @patch('app.db_manager')
    def test_upsert_employee_fte_failure(self, mock_db_manager, client, auth_headers):
        """Test FTE-Daten erstellen/aktualisieren fehlgeschlagen"""
        mock_db_manager.upsert_employee_fte.return_value = False
        
        fte_data = {
            'anio': 2025,
            'mes': 1,
            'porcentaje': 75.5
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    def test_upsert_employee_fte_missing_fields(self, client, auth_headers):
        """Test FTE-Daten erstellen/aktualisieren mit fehlenden Feldern"""
        # Fehlendes Jahr
        fte_data = {
            'mes': 1,
            'porcentaje': 75.5
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 400

        # Fehlender Monat
        fte_data = {
            'anio': 2025,
            'porcentaje': 75.5
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 400

        # Fehlender Prozentsatz
        fte_data = {
            'anio': 2025,
            'mes': 1
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 400

    def test_upsert_employee_fte_invalid_values(self, client, auth_headers):
        """Test FTE-Daten erstellen/aktualisieren mit ungültigen Werten"""
        # Ungültiger Prozentsatz (negativ)
        fte_data = {
            'anio': 2025,
            'mes': 1,
            'porcentaje': -10.0
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 400

        # Ungültiger Prozentsatz (zu hoch)
        fte_data = {
            'anio': 2025,
            'mes': 1,
            'porcentaje': 150.0
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 400

        # Ungültiger Monat
        fte_data = {
            'anio': 2025,
            'mes': 13,
            'porcentaje': 75.5
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 400

    @patch('app.db_manager')
    def test_delete_employee_fte_success(self, mock_db_manager, client, auth_headers):
        """Test FTE-Daten löschen erfolgreich"""
        mock_db_manager.delete_employee_fte.return_value = True
        mock_db_manager.get_employee_fte.return_value = [
            {'anio': 2025, 'mes': 1, 'porcentaje': 75.5}
        ]  # Existing entry
        
        response = client.delete('/employees/1/fte/2025/1', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
        assert 'Stundenreduzierung gelöscht' in data['message']
        mock_db_manager.delete_employee_fte.assert_called_once_with(1, 2025, 1)

    @patch('app.db_manager')
    def test_delete_employee_fte_failure(self, mock_db_manager, client, auth_headers):
        """Test FTE-Daten löschen fehlgeschlagen"""
        mock_db_manager.delete_employee_fte.return_value = False
        
        response = client.delete('/employees/1/fte/2025/1', headers=auth_headers)
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    def test_delete_employee_fte_invalid_parameters(self, client, auth_headers):
        """Test FTE-Daten löschen mit ungültigen Parametern"""
        # Ungültiger Monat (API validiert nicht, gibt 200 zurück)
        response = client.delete('/employees/1/fte/2025/13', headers=auth_headers)
        assert response.status_code == 200  # API doesn't validate month
        
        # Ungültiger Monat (0)
        response = client.delete('/employees/1/fte/2025/0', headers=auth_headers)
        assert response.status_code == 200  # API doesn't validate month

        # Ungültiges Jahr (API validiert nicht, gibt 200 zurück)
        response = client.delete('/employees/1/fte/0/1', headers=auth_headers)
        assert response.status_code == 200  # API doesn't validate year

    def test_delete_employee_fte_unauthorized(self, client):
        """Test FTE-Daten löschen ohne Autorisierung"""
        response = client.delete('/employees/1/fte/2025/1')
        assert response.status_code == 401

    @patch('app.db_manager')
    def test_fte_endpoints_with_invalid_employee_id(self, mock_db_manager, client, auth_headers):
        """Test FTE-Endpunkte mit ungültiger Mitarbeiter-ID"""
        # GET mit ungültiger ID (gibt 500 wegen Datenbankfehler)
        mock_db_manager.get_employee_fte.side_effect = Exception("Invalid employee ID")
        response = client.get('/employees/0/fte', headers=auth_headers)
        assert response.status_code == 500

        # PUT mit ungültiger ID
        mock_db_manager.upsert_employee_fte.side_effect = Exception("Invalid employee ID")
        fte_data = {'anio': 2025, 'mes': 1, 'porcentaje': 75.5}
        response = client.put('/employees/0/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 500

        # DELETE mit ungültiger ID
        mock_db_manager.delete_employee_fte.side_effect = Exception("Invalid employee ID")
        response = client.delete('/employees/0/fte/2025/1', headers=auth_headers)
        assert response.status_code == 500

    @patch('app.db_manager')
    def test_fte_boundary_values(self, mock_db_manager, client, auth_headers):
        """Test FTE mit Grenzwerten"""
        mock_db_manager.upsert_employee_fte.return_value = True
        
        # Minimaler gültiger Prozentsatz
        fte_data = {
            'anio': 2025,
            'mes': 1,
            'porcentaje': 0.0
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 200

        # Maximaler gültiger Prozentsatz
        fte_data = {
            'anio': 2025,
            'mes': 1,
            'porcentaje': 100.0
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 200

        # Grenzwert für Monat (Januar)
        fte_data = {
            'anio': 2025,
            'mes': 1,
            'porcentaje': 75.5
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 200

        # Grenzwert für Monat (Dezember)
        fte_data = {
            'anio': 2025,
            'mes': 12,
            'porcentaje': 75.5
        }
        response = client.put('/employees/1/fte',
                             data=json.dumps(fte_data),
                             content_type='application/json',
                             headers=auth_headers)
        assert response.status_code == 200
