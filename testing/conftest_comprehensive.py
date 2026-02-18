import pytest
import os
import sys
import hashlib
from unittest.mock import Mock, patch
from mysql.connector import Error

# Backend-Verzeichnis zum Pfad hinzufügen
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

from database_manager import DatabaseManager

@pytest.fixture(scope="session")
def test_config():
    """Globale Test-Konfiguration"""
    return {
        'database': {
            'host': 'localhost',
            'database': 'test_gehaltsabrechnung',
            'user': 'test_user',
            'password': 'test_password',
            'port': 3307
        },
        'api': {
            'base_url': 'http://localhost:8000',
            'timeout': 30
        }
    }

@pytest.fixture
def mock_db_connection():
    """Mock-Datenbankverbindung für Tests"""
    mock_conn = Mock()
    mock_conn.is_connected.return_value = True
    mock_conn.cursor.return_value = Mock()
    mock_conn.close.return_value = None
    mock_conn.commit.return_value = None
    mock_conn.rollback.return_value = None
    return mock_conn

@pytest.fixture
def mock_db_manager():
    """Mock DatabaseManager für Tests"""
    manager = Mock(spec=DatabaseManager)
    
    # Konfiguriere alle wichtigen Methoden
    manager.connect = Mock(return_value=True)
    manager.disconnect = Mock()
    manager.execute_query = Mock(return_value=[])
    manager.execute_update = Mock(return_value=True)
    manager.add_employee = Mock(return_value=1)
    manager.update_employee = Mock(return_value=True)
    manager.delete_employee = Mock(return_value=True)
    manager.get_all_employees = Mock(return_value=[])
    manager.get_employee_complete_info = Mock(return_value={})
    manager.search_employees = Mock(return_value=[])
    manager.add_salary = Mock(return_value=True)
    manager.update_salary = Mock(return_value=True)
    manager.delete_salary = Mock(return_value=True)
    manager.update_ingresos = Mock(return_value=True)
    manager.update_deducciones = Mock(return_value=True)
    manager.verify_user = Mock(return_value=None)
    manager.create_user = Mock(return_value=True)
    manager.hash_password = Mock(side_effect=lambda x: hashlib.sha256(x.encode()).hexdigest())
    manager.export_nomina_excel = Mock(return_value=True)
    manager.connection = Mock()
    
    return manager

@pytest.fixture
def sample_employee_data():
    """Beispiel-Mitarbeiterdaten für Tests"""
    return {
        'id_empleado': 1,
        'nombre': 'Juan',
        'apellido': 'Perez',
        'ceco': '1001',
        'activo': True
    }

@pytest.fixture
def sample_salary_data():
    """Beispiel-Gehaltsdaten für Tests"""
    return {
        'id_empleado': 1,
        'anio': 2025,
        'modalidad': 12,
        'antiguedad': 5,
        'salario_anual_bruto': 30000.0,
        'salario_mensual_bruto': 2500.0,
        'atrasos': 0.0,
        'salario_mensual_con_atrasos': 2500.0
    }

@pytest.fixture
def sample_ingresos_data():
    """Beispiel-Bruttoeinkommensdaten für Tests"""
    return {
        'id_empleado': 1,
        'anio': 2025,
        'ticket_restaurant': 100.0,
        'primas': 200.0,
        'dietas_cotizables': 50.0,
        'horas_extras': 150.0,
        'dias_exentos': 0.0,
        'dietas_exentas': 0.0,
        'seguro_pensiones': 0.0,
        'lavado_coche': 0.0
    }

@pytest.fixture
def sample_deducciones_data():
    """Beispiel-Abzugsdaten für Tests"""
    return {
        'id_empleado': 1,
        'anio': 2025,
        'seguro_accidentes': 30.0,
        'adelas': 40.0,
        'sanitas': 50.0,
        'gasolina': 60.0,
        'cotizacion_especie': 20.0
    }

@pytest.fixture
def sample_user_data():
    """Beispiel-Benutzerdaten für Tests"""
    return {
        'id_usuario': 1,
        'nombre_usuario': 'testuser',
        'nombre_completo': 'Test User',
        'rol': 'admin',
        'activo': True
    }

@pytest.fixture
def flask_app():
    """Flask App für API-Tests"""
    from flask_api_server import app
    
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test_secret_key'
    
    with app.test_client() as client:
        with app.app_context():
            yield client

@pytest.fixture
def auth_headers():
    """Authorization Headers mit gültigem Token"""
    from flask_api_server import create_access_token
    token = create_access_token({"sub": "testuser"})
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def invalid_auth_headers():
    """Invalid Authorization Headers für Tests"""
    return {
        'Authorization': 'Bearer invalid.token.here'
    }

@pytest.fixture
def mock_database_response():
    """Mock-Datenbankantworten für verschiedene Szenarien"""
    return {
        'empty_query': [],
        'single_employee': [{'id_empleado': 1, 'nombre': 'Juan', 'apellido': 'Perez', 'ceco': '1001', 'activo': True}],
        'multiple_employees': [
            {'id_empleado': 1, 'nombre': 'Juan', 'apellido': 'Perez', 'ceco': '1001', 'activo': True},
            {'id_empleado': 2, 'nombre': 'Maria', 'apellido': 'Garcia', 'ceco': '1002', 'activo': True}
        ],
        'employee_complete': {
            'employee': {'id_empleado': 1, 'nombre': 'Juan', 'apellido': 'Perez', 'ceco': '1001', 'activo': True},
            'salaries': [{'id_empleado': 1, 'anio': 2025, 'salario_anual_bruto': 30000}],
            'ingresos': [{'id_empleado': 1, 'anio': 2025, 'ticket_restaurant': 100}],
            'deducciones': [{'id_empleado': 1, 'anio': 2025, 'seguro_accidentes': 30}]
        }
    }

@pytest.fixture
def error_scenarios():
    """Verschiedene Fehler-Szenarien für Tests"""
    return {
        'connection_error': Error("Connection failed"),
        'timeout_error': TimeoutError("Connection timeout"),
        'permission_error': PermissionError("Access denied"),
        'value_error': ValueError("Invalid value"),
        'key_error': KeyError("Missing key"),
        'attribute_error': AttributeError("Missing attribute")
    }

@pytest.fixture
def performance_data():
    """Performance-Test-Daten"""
    return {
        'large_dataset_size': 1000,
        'timeout_threshold': 5.0,
        'memory_threshold_mb': 50
    }

# Test-Marker für verschiedene Test-Typen
def pytest_configure(config):
    """Konfiguriere pytest Marker"""
    config.addinivalue_line("markers", "unit: Unit Tests")
    config.addinivalue_line("markers", "integration: Integration Tests")
    config.addinivalue_line("markers", "performance: Performance Tests")
    config.addinivalue_line("markers", "security: Security Tests")
    config.addinivalue_line("markers", "slow: Langsame Tests")

# Helper-Funktionen für Tests
@pytest.fixture
def create_test_database_manager():
    """Factory für Test-DatabaseManager"""
    def _create_manager(**kwargs):
        defaults = {
            'host': 'localhost',
            'database': 'test_db',
            'user': 'test_user',
            'password': 'test_password',
            'port': 3307
        }
        defaults.update(kwargs)
        return DatabaseManager(**defaults)
    return _create_manager

@pytest.fixture
def mock_pandas():
    """Mock pandas für Excel-Export Tests"""
    import sys
    from unittest.mock import Mock
    
    mock_pandas = Mock()
    mock_dataframe = Mock()
    mock_excel_writer = Mock()
    
    mock_pandas.DataFrame = mock_dataframe
    mock_pandas.ExcelWriter = mock_excel_writer
    
    with patch.dict('sys.modules', {'pandas': mock_pandas, 'openpyxl': Mock()}):
        yield mock_pandas

# Cleanup-Funktionen
@pytest.fixture(autouse=True)
def cleanup_temp_files():
    """Automatisches Aufräumen von temporären Dateien"""
    import tempfile
    import shutil
    
    temp_dirs = []
    
    yield  # Test läuft
    
    # Aufräumen
    for temp_dir in temp_dirs:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

# Logging für Tests
@pytest.fixture(autouse=True)
def configure_test_logging():
    """Konfiguriere Logging für Tests"""
    import logging
    
    # Reduziere Logging Lärm während Tests
    logging.getLogger('mysql.connector').setLevel(logging.CRITICAL)
    logging.getLogger('urllib3').setLevel(logging.CRITICAL)
    
    yield
    
    # Logging zurücksetzen
    logging.getLogger('mysql.connector').setLevel(logging.NOTSET)
    logging.getLogger('urllib3').setLevel(logging.NOTSET)
