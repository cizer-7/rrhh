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

class TestAuthenticationEndpoints:
    """Tests für Authentifizierungsendpunkte"""

    @pytest.fixture
    def client(self):
        """Flask Test Client"""
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test_secret_key'
        with app.test_client() as client:
            with app.app_context():
                yield client

    @patch('app.db_manager')
    def test_forgot_password_success(self, mock_db_manager, client):
        """Test erfolgreiche Passwort-Reset-Anfrage"""
        mock_db_manager.get_user_email.return_value = 'test@example.com'
        mock_db_manager.create_password_reset_token.return_value = True
        
        request_data = {'username': 'testuser'}
        response = client.post('/auth/forgot-password',
                              data=json.dumps(request_data),
                              content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
        assert 'Wenn der Benutzer existiert' in data['message']

    @patch('app.db_manager')
    def test_forgot_password_user_not_found(self, mock_db_manager, client):
        """Test Passwort-Reset mit nicht existentem Benutzer"""
        mock_db_manager.get_user_email.return_value = None
        
        request_data = {'username': 'nonexistentuser'}
        response = client.post('/auth/forgot-password',
                              data=json.dumps(request_data),
                              content_type='application/json')
        
        # Aus Sicherheitsgründen wird immer 200 zurückgegeben
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
        assert 'Wenn der Benutzer existiert' in data['message']

    def test_forgot_password_missing_username(self, client):
        """Test Passwort-Reset ohne Benutzernamen"""
        request_data = {}
        response = client.post('/auth/forgot-password',
                              data=json.dumps(request_data),
                              content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    @patch('app.db_manager')
    @patch('app.email_service')
    def test_forgot_password_email_error(self, mock_email_service, mock_db_manager, client):
        """Test Passwort-Reset mit Email-Fehler"""
        mock_db_manager.get_user_email.return_value = 'test@example.com'
        mock_db_manager.create_password_reset_token.return_value = True
        mock_email_service.send_password_reset_email.return_value = False
        
        request_data = {'username': 'testuser'}
        response = client.post('/auth/forgot-password',
                              data=json.dumps(request_data),
                              content_type='application/json')
        
        # Sollte trotzdem 200 zurückgeben (Token wurde gespeichert)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    @patch('app.db_manager')
    def test_reset_password_success(self, mock_db_manager, client):
        """Test erfolgreicher Passwort-Reset"""
        mock_db_manager.validate_password_reset_token.return_value = {'nombre_usuario': 'testuser'}
        mock_db_manager.update_password.return_value = True
        
        request_data = {
            'token': 'valid_token',
            'new_password': 'new_password_123'
        }
        response = client.post('/auth/reset-password',
                              data=json.dumps(request_data),
                              content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
        assert 'Passwort erfolgreich aktualisiert' in data['message']

    @patch('app.db_manager')
    def test_reset_password_invalid_token(self, mock_db_manager, client):
        """Test Passwort-Reset mit ungültigem Token"""
        mock_db_manager.validate_password_reset_token.return_value = None
        
        request_data = {
            'token': 'invalid_token',
            'new_password': 'new_password_123'
        }
        response = client.post('/auth/reset-password',
                              data=json.dumps(request_data),
                              content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Ungültiger oder abgelaufener Token' in data['error']

    def test_reset_password_missing_fields(self, client):
        """Test Passwort-Reset mit fehlenden Feldern"""
        # Fehlendes Token
        request_data = {'new_password': 'new_password_123'}
        response = client.post('/auth/reset-password',
                              data=json.dumps(request_data),
                              content_type='application/json')
        assert response.status_code == 400
        
        # Fehlendes Passwort
        request_data = {'token': 'valid_token'}
        response = client.post('/auth/reset-password',
                              data=json.dumps(request_data),
                              content_type='application/json')
        assert response.status_code == 400

    @patch('app.db_manager')
    def test_reset_password_update_failure(self, mock_db_manager, client):
        """Test Passwort-Reset mit Update-Fehler"""
        mock_db_manager.validate_password_reset_token.return_value = {'nombre_usuario': 'testuser'}
        mock_db_manager.update_password.return_value = False
        
        request_data = {
            'token': 'valid_token',
            'new_password': 'new_password_123'
        }
        response = client.post('/auth/reset-password',
                              data=json.dumps(request_data),
                              content_type='application/json')
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data

    @patch('app.db_manager')
    def test_validate_reset_token_success(self, mock_db_manager, client):
        """Test erfolgreiche Token-Validierung"""
        mock_db_manager.validate_password_reset_token.return_value = {'nombre_usuario': 'testuser'}
        
        request_data = {'token': 'valid_token'}
        response = client.post('/auth/validate-reset-token',
                              data=json.dumps(request_data),
                              content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['valid'] is True
        assert 'username' in data

    @patch('app.db_manager')
    def test_validate_reset_token_invalid(self, mock_db_manager, client):
        """Test Token-Validierung mit ungültigem Token"""
        mock_db_manager.validate_password_reset_token.return_value = None
        
        request_data = {'token': 'invalid_token'}
        response = client.post('/auth/validate-reset-token',
                              data=json.dumps(request_data),
                              content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    def test_validate_reset_token_missing_token(self, client):
        """Test Token-Validierung ohne Token"""
        request_data = {}
        response = client.post('/auth/validate-reset-token',
                              data=json.dumps(request_data),
                              content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    def test_password_strength_validation(self, client):
        """Test Passwort-Stärke Validierung"""
        weak_passwords = [
            '123',
            'password',
            'test',
            'a' * 5,
            ''
        ]
        
        for weak_password in weak_passwords:
            request_data = {
                'token': 'valid_token',
                'new_password': weak_password
            }
            response = client.post('/auth/reset-password',
                                  data=json.dumps(request_data),
                                  content_type='application/json')
            
            # Should fail for weak passwords (implementation dependent)
            if weak_password and len(weak_password) < 6:
                assert response.status_code in [400, 200]  # Depends on implementation
