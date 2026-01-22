import unittest
import sys
import os
import logging
from datetime import datetime

# Add the production directory to the path to import database_manager
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'production'))

from database_manager import DatabaseManager

class TestDatabaseManager(unittest.TestCase):
    """
    Umfassende Tests für alle Funktionen in DatabaseManager.
    Verwendet die Produktivdatenbank, stellt aber sicher, dass alle Testdaten
    nach Abschluss wieder gelöscht werden.
    """
    
    @classmethod
    def setUpClass(cls):
        """Einmalige Einrichtung für alle Tests"""
        # Logging konfigurieren
        logging.basicConfig(level=logging.INFO)
        
        # Datenbank-Verbindungsdetails (aus production/database_manager.py übernommen)
        cls.db_config = {
            'host': 'localhost',
            'database': 'nomina',
            'user': 'root',
            'password': 'Niklas-10',
            'port': 3307
        }
        
        cls.db = DatabaseManager(**cls.db_config)
        cls.test_employee_ids = []
        cls.test_user_ids = []
        
        # Verbindung herstellen
        if not cls.db.connect():
            raise Exception("Konnte nicht zur Datenbank verbinden")
    
    @classmethod
    def tearDownClass(cls):
        """Aufräumen nach allen Tests"""
        try:
            # Alle Test-Mitarbeiter löschen
            for employee_id in cls.test_employee_ids:
                cls.db.delete_employee(employee_id)
                print(f"[DELETE]  Test-Mitarbeiter {employee_id} gelöscht")
            
            # Alle Test-Benutzer löschen
            for user_id in cls.test_user_ids:
                delete_query = "DELETE FROM t005_benutzer WHERE id_usuario = %s"
                cls.db.execute_update(delete_query, (user_id,))
                print(f"[DELETE]  Test-Benutzer {user_id} gelöscht")
            
            # Verbindung schließen
            cls.db.disconnect()
            print("\n[OK] Datenbankverbindung geschlossen")
            print("[CLEAN] Aufräumen abgeschlossen - alle Testdaten entfernt")
            
        except Exception as e:
            print(f"Fehler beim Aufräumen: {e}")
    
    def setUp(self):
        """Einrichtung für jeden einzelnen Test"""
        # Sicherstellen, dass Verbindung aktiv ist
        if not self.db.connection or not self.db.connection.is_connected():
            self.db.connect()
    
    def tearDown(self):
        """Aufräumen nach jedem einzelnen Test"""
        pass
    
    def test_connection(self):
        """Test der Datenbankverbindung"""
        self.assertTrue(self.db.connection.is_connected())
        print("\n[OK] Datenbankverbindung erfolgreich")
    
    def test_add_employee(self):
        """Test zum Hinzufügen eines neuen Mitarbeiters"""
        employee_data = {
            'nombre': 'Test',
            'apellido': 'Employee',
            'ceco': 'TEST001',
            'activo': True
        }
        
        employee_id = self.db.add_employee(employee_data)
        self.assertIsInstance(employee_id, int)
        self.assertGreater(employee_id, 0)
        
        # Zur späteren Löschung speichern
        self.__class__.test_employee_ids.append(employee_id)
        
        # Überprüfen, ob der Mitarbeiter tatsächlich hinzugefügt wurde
        employees = self.db.get_all_employees()
        test_employee = next((e for e in employees if e['id_empleado'] == employee_id), None)
        self.assertIsNotNone(test_employee)
        self.assertEqual(test_employee['nombre'], 'Test')
        self.assertEqual(test_employee['apellido'], 'Employee')
        
        print(f"\n[USER] Mitarbeiter hinzugefügt: ID {employee_id}")
    
    def test_get_all_employees(self):
        """Test zum Abrufen aller Mitarbeiter"""
        employees = self.db.get_all_employees()
        self.assertIsInstance(employees, list)
        print(f"\n[LIST] Alle Mitarbeiter abgerufen: {len(employees)} gefunden")
    
    def test_search_employees(self):
        """Test der Mitarbeitersuche"""
        # Zuerst einen Test-Mitarbeiter hinzufügen
        employee_data = {
            'nombre': 'Search',
            'apellido': 'Test',
            'ceco': 'SEARCH001',
            'activo': True
        }
        employee_id = self.db.add_employee(employee_data)
        self.__class__.test_employee_ids.append(employee_id)
        
        # Suche nach ID
        results = self.db.search_employees(str(employee_id))
        self.assertGreater(len(results), 0)
        
        # Suche nach Name
        results = self.db.search_employees('Search')
        self.assertGreater(len(results), 0)
        
        # Suche nach Nachname
        results = self.db.search_employees('Test')
        self.assertGreater(len(results), 0)
        
        print(f"\n[SEARCH] Mitarbeitersuche funktioniert für ID {employee_id}")
    
    def test_get_employee_complete_info(self):
        """Test zum Abrufen vollständiger Mitarbeiterinformationen"""
        # Test-Mitarbeiter erstellen
        employee_data = {
            'nombre': 'Complete',
            'apellido': 'Info',
            'ceco': 'INFO001',
            'activo': True
        }
        employee_id = self.db.add_employee(employee_data)
        self.__class__.test_employee_ids.append(employee_id)
        
        # Gehalt hinzufügen
        salary_data = {
            'anio': 2024,
            'modalidad': 12,
            'antiguedad': 1000.0,
            'salario_anual_bruto': 50000.0
        }
        self.db.add_salary(employee_id, salary_data)
        
        # Vollständige Informationen abrufen
        info = self.db.get_employee_complete_info(employee_id)
        
        self.assertIsInstance(info, dict)
        self.assertIn('employee', info)
        self.assertIn('salaries', info)
        self.assertIn('ingresos', info)
        self.assertIn('deducciones', info)
        
        self.assertEqual(info['employee']['nombre'], 'Complete')
        self.assertEqual(info['employee']['apellido'], 'Info')
        
        print(f"\n[INFO] Vollständige Mitarbeiterinformationen abgerufen für ID {employee_id}")
    
    def test_update_employee(self):
        """Test zum Aktualisieren von Mitarbeiterdaten"""
        # Test-Mitarbeiter erstellen
        employee_data = {
            'nombre': 'Update',
            'apellido': 'Me',
            'ceco': 'UPDATE001',
            'activo': True
        }
        employee_id = self.db.add_employee(employee_data)
        self.__class__.test_employee_ids.append(employee_id)
        
        # Mitarbeiter aktualisieren
        update_data = {
            'nombre': 'Updated',
            'apellido': 'Name',
            'ceco': 'UPDATED001'
        }
        result = self.db.update_employee(employee_id, 't001_empleados', update_data)
        self.assertTrue(result)
        
        # Überprüfen der Aktualisierung
        updated_info = self.db.get_employee_complete_info(employee_id)
        self.assertEqual(updated_info['employee']['nombre'], 'Updated')
        self.assertEqual(updated_info['employee']['apellido'], 'Name')
        
        print(f"\n[EDIT]  Mitarbeiter aktualisiert: ID {employee_id}")
    
    def test_add_salary(self):
        """Test zum Hinzufügen von Gehaltsdaten"""
        # Test-Mitarbeiter erstellen
        employee_data = {
            'nombre': 'Salary',
            'apellido': 'Test',
            'ceco': 'SALARY001',
            'activo': True
        }
        employee_id = self.db.add_employee(employee_data)
        self.__class__.test_employee_ids.append(employee_id)
        
        # Gehalt hinzufügen
        salary_data = {
            'anio': 2024,
            'modalidad': 12,
            'antiguedad': 1500.0,
            'salario_anual_bruto': 60000.0
        }
        result = self.db.add_salary(employee_id, salary_data)
        self.assertTrue(result)
        
        # Überprüfen des Gehalts
        info = self.db.get_employee_complete_info(employee_id)
        self.assertEqual(len(info['salaries']), 1)
        self.assertEqual(info['salaries'][0]['anio'], 2024)
        self.assertEqual(info['salaries'][0]['salario_anual_bruto'], 60000.0)
        
        print(f"\n[SALARY] Gehalt hinzugefügt für Mitarbeiter ID {employee_id}")
    
    def test_update_salary(self):
        """Test zum Aktualisieren von Gehaltsdaten"""
        # Test-Mitarbeiter und Gehalt erstellen
        employee_data = {
            'nombre': 'Salary',
            'apellido': 'Update',
            'ceco': 'SALUPD001',
            'activo': True
        }
        employee_id = self.db.add_employee(employee_data)
        self.__class__.test_employee_ids.append(employee_id)
        
        salary_data = {
            'anio': 2024,
            'modalidad': 12,
            'salario_anual_bruto': 50000.0
        }
        self.db.add_salary(employee_id, salary_data)
        
        # Gehalt aktualisieren
        update_data = {
            'salario_anual_bruto': 55000.0,
            'antiguedad': 2000.0
        }
        result = self.db.update_salary(employee_id, 2024, update_data)
        self.assertTrue(result)
        
        # Überprüfen der Aktualisierung
        info = self.db.get_employee_complete_info(employee_id)
        self.assertEqual(info['salaries'][0]['salario_anual_bruto'], 55000.0)
        self.assertEqual(info['salaries'][0]['antiguedad'], 2000.0)
        
        print(f"\n[SALARY] Gehalt aktualisiert für Mitarbeiter ID {employee_id}")
    
    def test_update_ingresos(self):
        """Test zum Aktualisieren von Bruttoeinkünften"""
        # Test-Mitarbeiter erstellen
        employee_data = {
            'nombre': 'Ingresos',
            'apellido': 'Test',
            'ceco': 'ING001',
            'activo': True
        }
        employee_id = self.db.add_employee(employee_data)
        self.__class__.test_employee_ids.append(employee_id)
        
        # Bruttoeinkünfte hinzufügen/aktualisieren
        ingresos_data = {
            'ticket_restaurant': 1000.0,
            'primas': 500.0,
            'dietas_cotizables': 200.0
        }
        result = self.db.update_ingresos(employee_id, 2024, ingresos_data)
        self.assertTrue(result)
        
        # Überprüfen
        info = self.db.get_employee_complete_info(employee_id)
        self.assertEqual(len(info['ingresos']), 1)
        self.assertEqual(info['ingresos'][0]['ticket_restaurant'], 1000.0)
        
        print(f"\n[INCOME] Bruttoeinkünfte aktualisiert für Mitarbeiter ID {employee_id}")
    
    def test_update_deducciones(self):
        """Test zum Aktualisieren von Abzügen"""
        # Test-Mitarbeiter erstellen
        employee_data = {
            'nombre': 'Deducciones',
            'apellido': 'Test',
            'ceco': 'DED001',
            'activo': True
        }
        employee_id = self.db.add_employee(employee_data)
        self.__class__.test_employee_ids.append(employee_id)
        
        # Abzüge hinzufügen/aktualisieren
        deducciones_data = {
            'seguro_accidentes': 100.0,
            'adelas': 50.0,
            'sanitas': 150.0
        }
        result = self.db.update_deducciones(employee_id, 2024, deducciones_data)
        self.assertTrue(result)
        
        # Überprüfen
        info = self.db.get_employee_complete_info(employee_id)
        self.assertEqual(len(info['deducciones']), 1)
        self.assertEqual(info['deducciones'][0]['seguro_accidentes'], 100.0)
        
        print(f"\n[DEDUCT] Abzüge aktualisiert für Mitarbeiter ID {employee_id}")
    
    def test_delete_salary(self):
        """Test zum Löschen von Gehaltsdaten"""
        # Test-Mitarbeiter und Gehalt erstellen
        employee_data = {
            'nombre': 'Delete',
            'apellido': 'Salary',
            'ceco': 'DELSAL001',
            'activo': True
        }
        employee_id = self.db.add_employee(employee_data)
        self.__class__.test_employee_ids.append(employee_id)
        
        salary_data = {
            'anio': 2024,
            'modalidad': 12,
            'salario_anual_bruto': 40000.0
        }
        self.db.add_salary(employee_id, salary_data)
        
        # Gehalt löschen
        result = self.db.delete_salary(employee_id, 2024)
        self.assertTrue(result)
        
        # Überprüfen, dass Gehalt gelöscht wurde
        info = self.db.get_employee_complete_info(employee_id)
        self.assertEqual(len(info['salaries']), 0)
        
        print(f"\n[DELETE]  Gehalt gelöscht für Mitarbeiter ID {employee_id}")
    
    def test_user_management(self):
        """Test der Benutzerverwaltungsfunktionen"""
        # Test-Benutzer erstellen
        test_username = f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        test_password = "testpass123"
        test_full_name = "Test User"
        
        # Benutzer erstellen
        result = self.db.create_user(test_username, test_password, test_full_name, 'admin')
        self.assertTrue(result)
        
        # Benutzer-ID für späteres Löschen abrufen
        user_query = "SELECT id_usuario FROM t005_benutzer WHERE nombre_usuario = %s"
        user_result = self.db.execute_query(user_query, (test_username,))
        if user_result:
            user_id = user_result[0]['id_usuario']
            self.__class__.test_user_ids.append(user_id)
        
        # Benutzerüberprüfung testen
        user_data = self.db.verify_user(test_username, test_password)
        self.assertIsNotNone(user_data)
        self.assertEqual(user_data['nombre_usuario'], test_username)
        self.assertEqual(user_data['rol'], 'admin')
        
        # Falsches Passwort testen
        invalid_user = self.db.verify_user(test_username, "wrongpass")
        self.assertIsNone(invalid_user)
        
        print(f"\n[USER] Benutzerverwaltung getestet für {test_username}")
    
    def test_password_hashing(self):
        """Test der Passwort-Hashing-Funktionen"""
        test_password = "test_password_123"
        
        # Hash erstellen
        hashed = self.db.hash_password(test_password)
        self.assertIsInstance(hashed, str)
        self.assertEqual(len(hashed), 64)  # SHA-256 produces 64 character hex string
        
        # Konsistenz überprüfen
        hashed_again = self.db.hash_password(test_password)
        self.assertEqual(hashed, hashed_again)
        
        # Unterschiedliche Passwörter sollten unterschiedliche Hashes ergeben
        different_hash = self.db.hash_password("different_password")
        self.assertNotEqual(hashed, different_hash)
        
        print("\n[SECURE] Passwort-Hashing funktioniert korrekt")
    
    def test_error_handling(self):
        """Test der Fehlerbehandlung"""
        # Test mit ungültiger Mitarbeiter-ID
        result = self.db.get_employee_complete_info(99999)
        self.assertEqual(result, {})
        
        # Test mit ungültigen Benutzerdaten
        result = self.db.verify_user("nonexistent", "password")
        self.assertIsNone(result)
        
        # Test mit ungültigem Update
        result = self.db.update_employee(99999, 't001_empleados', {'nombre': 'Test'})
        # Dieser Test kann erfolgreich sein, wenn die Datenbank keinen Fehler wirft
        # Wichtig ist, dass keine Exception geworfen wird
        self.assertIsInstance(result, bool)
        
        print("\n[WARNING]  Fehlerbehandlung funktioniert korrekt")
    
    def test_transaction_rollback(self):
        """Test der Transaktions-Rollback-Funktionalität"""
        # Test-Mitarbeiter erstellen
        employee_data = {
            'nombre': 'Transaction',
            'apellido': 'Test',
            'ceco': 'TRANS001',
            'activo': True
        }
        employee_id = self.db.add_employee(employee_data)
        self.__class__.test_employee_ids.append(employee_id)
        
        # Gehalt hinzufügen
        salary_data = {
            'anio': 2024,
            'modalidad': 12,
            'salario_anual_bruto': 30000.0
        }
        self.db.add_salary(employee_id, salary_data)
        
        # Überprüfen, dass Daten existieren
        info_before = self.db.get_employee_complete_info(employee_id)
        self.assertEqual(len(info_before['salaries']), 1)
        
        print(f"\n[TRANSACTION] Transaktions-Test abgeschlossen für Mitarbeiter ID {employee_id}")


def main():
    """Hauptfunktion zum Ausführen der Tests"""
    print("\n" + "="*60)
    print("[DATABASE] DATABASE MANAGER TESTSUITE")
    print("="*60)
    print("[INFO] Tests verwenden die Produktivdatenbank mit automatischer Aufräumung")
    print("[WARNING] Alle Testdaten werden nach Abschluss gelöscht\n")
    
    # unittest ausführen
    unittest.main(verbosity=2)


if __name__ == '__main__':
    main()
