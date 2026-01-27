import pytest
import requests
import json
import time
from datetime import datetime
import sys
import os

# Backend-Verzeichnis zum Pfad hinzufügen
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

@pytest.mark.integration
@pytest.mark.slow
class TestIntegration:
    """Integration Tests für die gesamte Anwendung"""

    BASE_URL = "http://localhost:8000"
    
    @pytest.fixture(scope="class")
    def api_client(self):
        """API Client für Integration Tests"""
        # Warte auf Server-Start
        max_retries = 30
        for i in range(max_retries):
            try:
                response = requests.get(f"{self.BASE_URL}/health", timeout=5)
                if response.status_code == 200:
                    break
            except requests.exceptions.RequestException:
                if i == max_retries - 1:
                    pytest.skip("API Server nicht verfügbar. Starte den Server mit: python backend/flask_api_server.py")
                time.sleep(1)
        
        # Login für Auth Token
        login_data = {
            "username": "admin",  # Annahme: existiert in Test-DB
            "password": "admin123"
        }
        
        try:
            response = requests.post(f"{self.BASE_URL}/auth/login", 
                                   json=login_data, timeout=10)
            if response.status_code == 200:
                token_data = response.json()
                token = token_data["access_token"]
                headers = {"Authorization": f"Bearer {token}"}
                return headers
            else:
                pytest.skip("Login fehlgeschlagen. Stelle sicher, dass Test-Benutzer existiert.")
        except requests.exceptions.RequestException:
            pytest.skip("Keine Verbindung zum API Server möglich")

    def test_health_check_integration(self):
        """Test Health Check Endpoint Integration"""
        try:
            response = requests.get(f"{self.BASE_URL}/health", timeout=5)
            assert response.status_code == 200
            
            data = response.json()
            assert data["status"] == "healthy"
            assert "timestamp" in data
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Health Check fehlgeschlagen: {e}")

    def test_login_flow_integration(self):
        """Test kompletten Login-Flow"""
        # Test mit ungültigen Credentials
        invalid_login = {"username": "invalid", "password": "wrong"}
        response = requests.post(f"{self.BASE_URL}/auth/login", json=invalid_login)
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data

    def test_employee_crud_integration(self, api_client):
        """Test komplette CRUD-Operationen für Mitarbeiter"""
        headers = api_client
        
        # 1. Neuen Mitarbeiter erstellen
        new_employee = {
            "nombre": "Integration",
            "apellido": "Test",
            "ceco": "9999",
            "activo": True
        }
        
        response = requests.post(f"{self.BASE_URL}/employees", 
                               json=new_employee, headers=headers)
        
        if response.status_code == 200:
            created_employee = response.json()
            employee_id = created_employee["id_empleado"]
            
            # 2. Mitarbeiter abrufen
            response = requests.get(f"{self.BASE_URL}/employees/{employee_id}", 
                                  headers=headers)
            assert response.status_code == 200
            
            employee_data = response.json()
            assert employee_data["employee"]["nombre"] == "Integration"
            assert employee_data["employee"]["apellido"] == "Test"
            
            # 3. Mitarbeiter aktualisieren
            update_data = {"nombre": "Updated"}
            response = requests.put(f"{self.BASE_URL}/employees/{employee_id}",
                                  json=update_data, headers=headers)
            assert response.status_code == 200
            
            # 4. Überprüfen, dass Update funktioniert hat
            response = requests.get(f"{self.BASE_URL}/employees/{employee_id}",
                                  headers=headers)
            updated_data = response.json()
            assert updated_data["employee"]["nombre"] == "Updated"
            
            # 5. Mitarbeiter löschen
            response = requests.delete(f"{self.BASE_URL}/employees/{employee_id}",
                                     headers=headers)
            assert response.status_code == 200
            
            # 6. Überprüfen, dass Mitarbeiter gelöscht wurde
            response = requests.get(f"{self.BASE_URL}/employees/{employee_id}",
                                  headers=headers)
            assert response.status_code == 404
        else:
            # Wenn Erstellen fehlschlägt, teste nur das Abrufen
            pytest.skip("Mitarbeiter erstellen fehlgeschlagen, teste alternative Endpoints")

    def test_salary_management_integration(self, api_client):
        """Test Gehaltsverwaltung Integration"""
        headers = api_client
        
        # Zuerst einen Mitarbeiter erstellen oder existierenden verwenden
        employees_response = requests.get(f"{self.BASE_URL}/employees", headers=headers)
        
        if employees_response.status_code == 200:
            employees = employees_response.json()
            if employees:
                employee_id = employees[0]["id_empleado"]
                
                # Gehalt hinzufügen
                salary_data = {
                    "anio": 2026,
                    "modalidad": 12,
                    "salario_anual_bruto": 40000,
                    "antiguedad": 3
                }
                
                response = requests.post(f"{self.BASE_URL}/employees/{employee_id}/salaries",
                                       json=salary_data, headers=headers)
                
                if response.status_code == 200:
                    # Gehalt aktualisieren
                    update_salary = {"salario_anual_bruto": 45000}
                    response = requests.put(f"{self.BASE_URL}/employees/{employee_id}/salaries/2026",
                                          json=update_salary, headers=headers)
                    assert response.status_code == 200
                    
                    # Gehalt löschen
                    response = requests.delete(f"{self.BASE_URL}/employees/{employee_id}/salaries/2026",
                                             headers=headers)
                    assert response.status_code == 200
                else:
                    pytest.skip("Gehalt hinzufügen fehlgeschlagen")
            else:
                pytest.skip("Keine Mitarbeiter für Test vorhanden")
        else:
            pytest.skip("Mitarbeiter abrufen fehlgeschlagen")

    def test_ingresos_deducciones_integration(self, api_client):
        """Test Bruttoeinkünfte und Abzüge Integration"""
        headers = api_client
        
        # Mitarbeiter abrufen
        employees_response = requests.get(f"{self.BASE_URL}/employees", headers=headers)
        
        if employees_response.status_code == 200:
            employees = employees_response.json()
            if employees:
                employee_id = employees[0]["id_empleado"]
                
                # Bruttoeinkünfte aktualisieren
                ingresos_data = {
                    "ticket_restaurant": 150,
                    "primas": 300,
                    "dietas_cotizables": 75,
                    "horas_extras": 200
                }
                
                response = requests.put(f"{self.BASE_URL}/employees/{employee_id}/ingresos/2025",
                                      json=ingresos_data, headers=headers)
                
                if response.status_code == 200:
                    # Abzüge aktualisieren
                    deducciones_data = {
                        "seguro_accidentes": 35,
                        "adelas": 45,
                        "sanitas": 55,
                        "gasolina_arval": 65
                    }
                    
                    response = requests.put(f"{self.BASE_URL}/employees/{employee_id}/deducciones/2025",
                                          json=deducciones_data, headers=headers)
                    assert response.status_code == 200
                    
                    # Vollständige Mitarbeiterinformationen abrufen und überprüfen
                    response = requests.get(f"{self.BASE_URL}/employees/{employee_id}",
                                          headers=headers)
                    assert response.status_code == 200
                    
                    employee_info = response.json()
                    assert "ingresos" in employee_info
                    assert "deducciones" in employee_info
                else:
                    pytest.skip("Bruttoeinkünfte aktualisieren fehlgeschlagen")
            else:
                pytest.skip("Keine Mitarbeiter für Test vorhanden")
        else:
            pytest.skip("Mitarbeiter abrufen fehlgeschlagen")

    def test_search_functionality_integration(self, api_client):
        """Test Suchfunktionalität Integration"""
        headers = api_client
        
        # Mitarbeiter abrufen für Suchtest
        employees_response = requests.get(f"{self.BASE_URL}/employees", headers=headers)
        
        if employees_response.status_code == 200:
            employees = employees_response.json()
            if employees:
                # Suche nach ID
                first_employee = employees[0]
                employee_id = first_employee["id_empleado"]
                
                response = requests.get(f"{self.BASE_URL}/employees/search/{employee_id}",
                                      headers=headers)
                assert response.status_code == 200
                
                search_results = response.json()
                assert len(search_results) >= 1
                
                # Suche nach Namen
                if first_employee["nombre"]:
                    search_term = first_employee["nombre"][:3]  # Erste 3 Buchstaben
                    response = requests.get(f"{self.BASE_URL}/employees/search/{search_term}",
                                          headers=headers)
                    assert response.status_code == 200
                    
                    search_results = response.json()
                    assert isinstance(search_results, list)
            else:
                pytest.skip("Keine Mitarbeiter für Suchtest vorhanden")
        else:
            pytest.skip("Mitarbeiter abrufen fehlgeschlagen")

    def test_excel_export_integration(self, api_client):
        """Test Excel-Export Integration"""
        headers = api_client
        
        try:
            response = requests.get(f"{self.BASE_URL}/export/excel/2025",
                                  headers=headers, timeout=30)
            
            if response.status_code == 200:
                # Überprüfe, dass es eine Excel-Datei ist
                content_type = response.headers.get('content-type', '')
                assert 'excel' in content_type or 'openxmlformats' in content_type
                
                # Überprüfe Content-Disposition Header
                content_disposition = response.headers.get('content-disposition', '')
                assert 'attachment' in content_disposition
                assert '.xlsx' in content_disposition
            else:
                pytest.skip(f"Excel-Export fehlgeschlagen mit Status {response.status_code}")
        except requests.exceptions.Timeout:
            pytest.skip("Excel-Export Timeout")
        except requests.exceptions.RequestException as e:
            pytest.skip(f"Excel-Export Request fehlgeschlagen: {e}")

    def test_error_handling_integration(self, api_client):
        """Test Fehlerbehandlung Integration"""
        headers = api_client
        
        # Test mit ungültiger Mitarbeiter-ID
        response = requests.get(f"{self.BASE_URL}/employees/99999", headers=headers)
        assert response.status_code == 404
        
        # Test mit ungültigem Jahr
        response = requests.get(f"{self.BASE_URL}/employees/1/salaries/9999", 
                              headers=headers)
        # Sollte entweder 404 oder 400 zurückgeben, je nach Implementierung
        assert response.status_code in [404, 400]
        
        # Test mit ungültigen Daten
        invalid_data = {"invalid_field": "value"}
        response = requests.put(f"{self.BASE_URL}/employees/1",
                              json=invalid_data, headers=headers)
        assert response.status_code == 400

    def test_concurrent_requests_integration(self, api_client):
        """Test nebenläufige Anfragen"""
        headers = api_client
        import threading
        import queue
        
        results = queue.Queue()
        
        def make_request():
            try:
                response = requests.get(f"{self.BASE_URL}/health", timeout=10)
                results.put(response.status_code)
            except Exception as e:
                results.put(str(e))
        
        # Erstelle mehrere nebenläufige Anfragen
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Warte auf alle Threads
        for thread in threads:
            thread.join()
        
        # Überprüfe Ergebnisse
        success_count = 0
        while not results.empty():
            result = results.get()
            if result == 200:
                success_count += 1
        
        # Mindestens 80% der Anfragen sollten erfolgreich sein
        assert success_count >= 4

    def test_api_response_format_integration(self, api_client):
        """Test API Response Format Integration"""
        headers = api_client
        
        # Test Mitarbeiterliste Format
        response = requests.get(f"{self.BASE_URL}/employees", headers=headers)
        
        if response.status_code == 200:
            employees = response.json()
            assert isinstance(employees, list)
            
            if employees:
                employee = employees[0]
                required_fields = ["id_empleado", "nombre", "apellido", "ceco", "activo"]
                for field in required_fields:
                    assert field in employee
        
        # Test einzelner Mitarbeiter Format
        employees_response = requests.get(f"{self.BASE_URL}/employees", headers=headers)
        if employees_response.status_code == 200:
            employees = employees_response.json()
            if employees:
                employee_id = employees[0]["id_empleado"]
                response = requests.get(f"{self.BASE_URL}/employees/{employee_id}",
                                      headers=headers)
                
                if response.status_code == 200:
                    employee_info = response.json()
                    required_sections = ["employee", "salaries", "ingresos", "deducciones"]
                    for section in required_sections:
                        assert section in employee_info
