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
from database_manager import DatabaseManager

class TestBearbeitungslog:
    """Tests für Bearbeitungslog Funktionen"""

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

    @pytest.fixture
    def db_manager(self):
        """DatabaseManager Instanz für Tests"""
        return DatabaseManager('localhost', 'test_db', 'test_user', 'test_password', 3307)

    # Database Manager Tests
    def test_insert_bearbeitungslog_success(self, db_manager):
        """Test erfolgreichen Eintrag in Bearbeitungslog"""
        with patch.object(db_manager, 'execute_update', return_value=True):
            result = db_manager.insert_bearbeitungslog(
                usuario_login='testuser',
                aktion='CREATE',
                objekt='employee',
                id_empleado=1,
                anio=2025,
                mes=1,
                details={'field': 'value'}
            )
            assert result is True

    def test_insert_bearbeitungslog_missing_required_fields(self, db_manager):
        """Test Bearbeitungslog mit fehlenden Pflichtfeldern"""
        # Fehlender Benutzer
        result = db_manager.insert_bearbeitungslog(
            usuario_login='',
            aktion='CREATE'
        )
        assert result is False

        # Fehlende Aktion
        result = db_manager.insert_bearbeitungslog(
            usuario_login='testuser',
            aktion=''
        )
        assert result is False

    def test_insert_bearbeitungslog_with_details(self, db_manager):
        """Test Bearbeitungslog mit Details"""
        test_details = {
            'old_values': {'name': 'old_name'},
            'new_values': {'name': 'new_name'},
            'changed_fields': ['name']
        }
        
        with patch.object(db_manager, 'execute_update', return_value=True) as mock_execute:
            result = db_manager.insert_bearbeitungslog(
                usuario_login='testuser',
                aktion='UPDATE',
                objekt='employee',
                id_empleado=1,
                details=test_details
            )
            assert result is True
            # Prüfen ob Details als JSON übergeben wurden
            call_args = mock_execute.call_args[0][1]
            details_json = call_args[6]  # details parameter
            assert details_json is not None

    def test_insert_bearbeitungslog_invalid_details(self, db_manager):
        """Test Bearbeitungslog mit ungültigen Details"""
        # Details die nicht serialisierbar sind
        invalid_details = {'function': lambda x: x}
        
        with patch.object(db_manager, 'execute_update', return_value=True):
            result = db_manager.insert_bearbeitungslog(
                usuario_login='testuser',
                aktion='UPDATE',
                details=invalid_details
            )
            assert result is True  # Sollte nicht fehlschlagen, Details werden auf None gesetzt

    def test_get_bearbeitungslog_success(self, db_manager):
        """Test erfolgreichen Abruf von Bearbeitungslog"""
        mock_logs = [
            {
                'id_log': 1,
                'usuario_login': 'testuser',
                'id_empleado': 1,
                'anio': 2025,
                'mes': 1,
                'accion': 'CREATE',
                'objekt': 'employee',
                'details': '{"field": "value"}',
                'fecha_creacion': '2025-01-01 10:00:00'
            }
        ]
        
        with patch.object(db_manager, 'execute_query', return_value=mock_logs):
            result = db_manager.get_bearbeitungslog(
                id_empleado=1,
                anio=2025,
                mes=1,
                limit=100
            )
            assert len(result) == 1
            assert result[0]['usuario_login'] == 'testuser'

    def test_get_bearbeitungslog_missing_employee_id(self, db_manager):
        """Test Bearbeitungslog Abruf ohne Mitarbeiter-ID"""
        result = db_manager.get_bearbeitungslog(id_empleado=None)
        assert result == []

    def test_get_bearbeitungslog_with_limit(self, db_manager):
        """Test Bearbeitungslog Abruf mit Limit"""
        mock_logs = [{'id_log': i} for i in range(5)]
        
        with patch.object(db_manager, 'execute_query', return_value=mock_logs):
            # Test mit gültigem Limit
            result = db_manager.get_bearbeitungslog(id_empleado=1, limit=50)
            assert len(result) == 5
            
            # Test mit zu hohem Limit (sollte auf 1000 begrenzt werden)
            result = db_manager.get_bearbeitungslog(id_empleado=1, limit=2000)
            assert len(result) == 5

    def test_get_global_bearbeitungslog_success(self, db_manager):
        """Test erfolgreichen Abruf von globalem Bearbeitungslog"""
        mock_logs = [
            {
                'id_log': 1,
                'usuario_login': 'testuser',
                'id_empleado': 1,
                'anio': 2025,
                'mes': 1,
                'accion': 'CREATE',
                'objekt': 'employee',
                'details': '{"field": "value"}',
                'fecha_creacion': '2025-01-01 10:00:00'
            }
        ]
        
        with patch.object(db_manager, 'execute_query', return_value=mock_logs):
            result = db_manager.get_global_bearbeitungslog(limit=100)
            assert len(result) == 1
            assert result[0]['usuario_login'] == 'testuser'

    def test_create_change_details(self, db_manager):
        """Test Erstellung von Änderungsdetails"""
        # Test mit alten und neuen Daten
        old_data = {'name': 'old_name', 'email': 'old@email.com'}
        new_data = {'name': 'new_name', 'email': 'old@email.com'}
        changed_fields = ['name']
        
        result = db_manager.create_change_details(old_data, new_data, changed_fields)
        
        assert 'name' in result
        assert result['name']['old'] == 'old_name'
        assert result['name']['new'] == 'new_name'

    def test_create_change_details_empty_data(self, db_manager):
        """Test Erstellung von Änderungsdetails mit leeren Daten"""
        result = db_manager.create_change_details()
        assert result == {}

    def test_create_change_details_only_new_data(self, db_manager):
        """Test Erstellung von Änderungsdetails nur mit neuen Daten"""
        new_data = {'name': 'new_name', 'email': 'new@email.com'}
        
        result = db_manager.create_change_details(new_data=new_data)
        
        assert 'name' in result
        assert result['name']['new'] == 'new_name'
        assert result['name']['old'] is None

    # API Endpoint Tests
    @patch('app.db_manager')
    def test_get_global_bearbeitungslog_api_success(self, mock_db_manager, client, auth_headers):
        """Test API Endpunkt für globalen Bearbeitungslog"""
        mock_logs = [
            {'id_log': 1, 'usuario_login': 'testuser', 'accion': 'create', 'objekt': 'employee'},
            {'id_log': 2, 'usuario_login': 'testuser', 'accion': 'update', 'objekt': 'salary'}
        ]
        mock_db_manager.get_global_bearbeitungslog.return_value = mock_logs
        
        response = client.get('/bearbeitungslog', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['items'] == mock_logs
        mock_db_manager.get_global_bearbeitungslog.assert_called_once_with(id_empleado=None, anio=None, mes=None, limit=200)

    @patch('app.db_manager')
    def test_get_employee_bearbeitungslog_with_params(self, mock_db_manager, client, auth_headers):
        """Test API Endpunkt für Mitarbeiter-Bearbeitungslog mit Parametern"""
        mock_logs = []
        mock_db_manager.get_bearbeitungslog.return_value = mock_logs
        
        response = client.get('/employees/1/bearbeitungslog?anio=2025&mes=1&limit=50', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['items'] == mock_logs
        mock_db_manager.get_bearbeitungslog.assert_called_once_with(1, anio=2025, mes=1, limit=50)

    def test_get_employee_bearbeitungslog_unauthorized(self, client):
        """Test Mitarbeiter-Bearbeitungslog ohne Autorisierung"""
        response = client.get('/employees/1/bearbeitungslog')
        assert response.status_code == 401

    @patch('app.db_manager')
    def test_get_global_bearbeitungslog_api_success(self, mock_db_manager, client, auth_headers):
        """Test API Endpunkt für globalen Bearbeitungslog"""
        mock_logs = [
            {
                'id_log': 1,
                'usuario_login': 'testuser',
                'id_empleado': 1,
                'accion': 'CREATE',
                'objekt': 'employee',
                'details': '{"field": "value"}',
                'fecha_creacion': '2025-01-01 10:00:00'
            }
        ]
        mock_db_manager.get_global_bearbeitungslog.return_value = mock_logs
        
        response = client.get('/bearbeitungslog', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['items'] == mock_logs
        mock_db_manager.get_global_bearbeitungslog.assert_called_once_with(id_empleado=None, anio=None, mes=None, limit=200)

    @patch('app.db_manager')
    def test_get_global_bearbeitungslog_api_with_limit(self, mock_db_manager, client, auth_headers):
        """Test API Endpunkt für globalen Bearbeitungslog mit Limit"""
        mock_logs = [{'id_log': 1, 'usuario_login': 'testuser', 'accion': 'create'}]
        mock_db_manager.get_global_bearbeitungslog.return_value = mock_logs
        
        response = client.get('/bearbeitungslog?limit=100', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['items'] == mock_logs
        mock_db_manager.get_global_bearbeitungslog.assert_called_once_with(id_empleado=None, anio=None, mes=None, limit=100)

    def test_get_global_bearbeitungslog_unauthorized(self, client):
        """Test globalen Bearbeitungslog ohne Autorisierung"""
        response = client.get('/bearbeitungslog')
        assert response.status_code == 401

    @patch('app.db_manager')
    def test_bearbeitungslog_database_error(self, mock_db_manager, client, auth_headers):
        """Test Bearbeitungslog mit Datenbankfehler"""
        mock_db_manager.get_bearbeitungslog.side_effect = Exception("Database error")
        
        response = client.get('/employees/1/bearbeitungslog', headers=auth_headers)
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data

    @patch('app.db_manager')
    def test_bearbeitungslog_invalid_employee_id(self, mock_db_manager, client, auth_headers):
        """Test Bearbeitungslog mit ungültiger Mitarbeiter-ID"""
        mock_db_manager.get_bearbeitungslog.side_effect = Exception("Invalid employee ID")
        
        response = client.get('/employees/0/bearbeitungslog', headers=auth_headers)
        
        assert response.status_code == 500  # API gibt 500 bei Exception
        data = json.loads(response.data)
        assert 'error' in data

    @patch('app.db_manager')
    def test_bearbeitungslog_invalid_parameters(self, mock_db_manager, client, auth_headers):
        """Test Bearbeitungslog mit ungültigen Parametern"""
        mock_db_manager.get_bearbeitungslog.side_effect = Exception("Invalid parameters")
        
        # Ungültiges Jahr
        response = client.get('/employees/1/bearbeitungslog?anio=0', headers=auth_headers)
        assert response.status_code == 500  # API gibt 500 bei Exception
        data = json.loads(response.data)
        assert 'error' in data
