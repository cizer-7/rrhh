import pytest
import os
import sys
from unittest.mock import Mock, MagicMock
from mysql.connector import Error

# Backend-Verzeichnis zum Pfad hinzufügen
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

from database_manager import DatabaseManager

@pytest.fixture
def mock_db_connection():
    """Mock-Datenbankverbindung für Tests"""
    mock_conn = Mock()
    mock_conn.is_connected.return_value = True
    mock_conn.cursor.return_value = Mock()
    return mock_conn

@pytest.fixture
def mock_db_manager():
    """Mock DatabaseManager für Tests"""
    manager = Mock(spec=DatabaseManager)
    
    # Mock alle wichtigen Methoden
    manager.execute_query = Mock()
    manager.execute_update = Mock()
    manager.add_salary = Mock()
    manager.update_ingresos = Mock()
    manager.update_deducciones = Mock()
    manager.create_user = Mock()
    manager.export_nomina_excel = Mock()
    manager.get_all_employees = Mock()
    manager.get_employee_complete_info = Mock()
    manager.add_employee = Mock()
    manager.update_employee = Mock()
    manager.delete_employee = Mock()
    manager.delete_salary = Mock()
    manager.search_employees = Mock()
    manager.verify_user = Mock()
    manager.hash_password = Mock()
    manager.connect = Mock()
    manager.disconnect = Mock()
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
        'gasolina_arval': 60.0,
        'cotizacion_especie': 20.0
    }

@pytest.fixture
def flask_app():
    """Flask App für API-Tests"""
    import sys
    sys.path.insert(0, backend_path)
    
    from flask_api_server import app
    
    # Konfiguriere für Testing
    app.config['TESTING'] = True
    
    with app.test_client() as client:
        with app.app_context():
            yield client
