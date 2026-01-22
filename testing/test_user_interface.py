import unittest
import sys
import os
import tkinter as tk
from tkinter import ttk, messagebox
from unittest.mock import Mock, patch, MagicMock
import logging
from datetime import datetime

# Add the production directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'production'))

from user_interface import LoginDialog, EmployeeManagementUI

class TestLoginDialog(unittest.TestCase):
    """Tests for LoginDialog class"""
    
    @classmethod
    def setUpClass(cls):
        logging.basicConfig(level=logging.INFO)
        cls.root = tk.Tk()
        cls.root.withdraw()
        cls.root.update()
        
        # Mock database
        cls.mock_db = Mock()
    
    @classmethod
    def tearDownClass(cls):
        try:
            cls.root.destroy()
        except:
            pass
    
    def setUp(self):
        self.login_dialog = LoginDialog(self.root, self.mock_db)
        # Reset mock for each test
        self.mock_db.reset_mock()
    
    def tearDown(self):
        try:
            if hasattr(self.login_dialog, 'dialog'):
                self.login_dialog.dialog.destroy()
        except:
            pass
    
    def test_initialization(self):
        """Test LoginDialog initialization"""
        print("\n[LOGIN] LoginDialog Initialisierung getestet")
        self.assertEqual(self.login_dialog.parent, self.root)
        self.assertEqual(self.login_dialog.db, self.mock_db)
        self.assertIsNone(self.login_dialog.result)
    
    @patch('tkinter.messagebox.showinfo')
    def test_login_success(self, mock_messagebox):
        """Test successful login"""
        print("\n[LOGIN] Erfolgreiche Anmeldung getestet")
        
        # Mock successful verification
        self.mock_db.verify_user.return_value = {'nombre_usuario': 'test', 'nombre_completo': 'Test User'}
        
        # Set credentials
        self.login_dialog.username_var.set("test")
        self.login_dialog.password_var.set("password")
        
        # Login
        self.login_dialog.login()
        
        # Verify user was checked
        self.mock_db.verify_user.assert_called_once_with("test", "password")
        
        # Check result
        self.assertIsNotNone(self.login_dialog.result)
        self.assertEqual(self.login_dialog.result['nombre_usuario'], 'test')
    
    def test_login_empty_fields(self):
        """Test login with empty fields"""
        print("\n[LOGIN] Anmeldung mit leeren Feldern getestet")
        
        # Test empty username
        self.login_dialog.username_var.set("")
        self.login_dialog.password_var.set("password")
        self.login_dialog.login()
        self.assertIn("Bitte Benutzernamen", self.login_dialog.status_label['text'])
        
        # Test empty password
        self.login_dialog.username_var.set("test")
        self.login_dialog.password_var.set("")
        self.login_dialog.login()
        self.assertIn("Bitte Passwort", self.login_dialog.status_label['text'])
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        print("\n[LOGIN] Anmeldung mit ungültigen Daten getestet")
        
        # Mock failed verification
        self.mock_db.verify_user.return_value = None
        
        # Set credentials
        self.login_dialog.username_var.set("test")
        self.login_dialog.password_var.set("wrong")
        
        # Login
        self.login_dialog.login()
        
        # Check error message
        self.assertIn("Benutzername oder Passwort falsch", self.login_dialog.status_label['text'])
        self.assertEqual(self.login_dialog.password_var.get(), "")
    
    def test_cancel(self):
        """Test login cancellation"""
        print("\n[LOGIN] Anmeldungsabbruch getestet")
        
        self.login_dialog.cancel()
        self.assertIsNone(self.login_dialog.result)


class TestEmployeeManagementUI(unittest.TestCase):
    """Tests for EmployeeManagementUI class"""
    
    @classmethod
    def setUpClass(cls):
        logging.basicConfig(level=logging.INFO)
        
        # Database configuration
        cls.db_config = {
            'host': 'localhost',
            'database': 'nomina',
            'user': 'root',
            'password': 'Niklas-10',
            'port': 3307
        }
        
        cls.test_employee_ids = []
        cls.test_user_ids = []
        
        # Mock root for testing
        cls.root = tk.Tk()
        cls.root.withdraw()
        cls.root.update()
    
    @classmethod
    def tearDownClass(cls):
        """Cleanup after all tests"""
        cleanup_success = False
        max_retries = 3
        retry_count = 0
        
        while not cleanup_success and retry_count < max_retries:
            try:
                from database_manager import DatabaseManager
                db = DatabaseManager(**cls.db_config)
                if db.connect():
                    print(f"\n[CLEANUP] Aufräumen der Testdaten (Versuch {retry_count + 1}/{max_retries})")
                    
                    # Clean up test employees (this will cascade delete salaries, ingresos, deducciones)
                    employees_deleted = 0
                    for employee_id in cls.test_employee_ids:
                        result = db.delete_employee(employee_id)
                        if result:
                            employees_deleted += 1
                            print(f"[DELETE] Test-Mitarbeiter {employee_id} gelöscht")
                        else:
                            print(f"[WARNING] Mitarbeiter {employee_id} konnte nicht gelöscht werden")
                    
                    # Clean up test users
                    users_deleted = 0
                    for user_id in cls.test_user_ids:
                        delete_query = "DELETE FROM t005_benutzer WHERE id_usuario = %s"
                        rows_affected = db.execute_update(delete_query, (user_id,))
                        if rows_affected > 0:
                            users_deleted += 1
                            print(f"[DELETE] Test-Benutzer {user_id} gelöscht")
                        else:
                            print(f"[WARNING] Benutzer {user_id} konnte nicht gelöscht werden")
                    
                    # Verify cleanup was successful
                    if employees_deleted == len(cls.test_employee_ids) and users_deleted == len(cls.test_user_ids):
                        cleanup_success = True
                        print(f"[OK] Alle Testdaten erfolgreich entfernt: {employees_deleted} Mitarbeiter, {users_deleted} Benutzer")
                    else:
                        print(f"[WARNING] Nicht alle Testdaten entfernt: {employees_deleted}/{len(cls.test_employee_ids)} Mitarbeiter, {users_deleted}/{len(cls.test_user_ids)} Benutzer")
                    
                    db.disconnect()
                else:
                    print(f"[ERROR] Datenbankverbindung fehlgeschlagen (Versuch {retry_count + 1})")
                
                retry_count += 1
                
            except Exception as e:
                print(f"[ERROR] Fehler beim Aufräumen (Versuch {retry_count + 1}): {e}")
                retry_count += 1
                if retry_count >= max_retries:
                    print(f"[CRITICAL] Aufräumen nach {max_retries} Versuchen fehlgeschlagen")
                    print(f"[INFO] Verbleibende Testdaten: Mitarbeiter {cls.test_employee_ids}, Benutzer {cls.test_user_ids}")
        
        try:
            cls.root.destroy()
        except:
            pass
        
        if cleanup_success:
            print("\n[OK] UI-Tests abgeschlossen - alle Testdaten entfernt")
        else:
            print("\n[WARNING] UI-Tests abgeschlossen - einige Testdaten könnten verbleiben")
    
    def setUp(self):
        """Setup for each test"""
        # Mock database for most tests
        self.mock_db = Mock()
        self.mock_db.connect.return_value = True
        self.mock_db.verify_user.return_value = {'nombre_usuario': 'test', 'nombre_completo': 'Test User', 'rol': 'admin'}
        self.mock_db.get_all_employees.return_value = []
        self.mock_db.host = 'localhost'
        self.mock_db.database = 'nomina'
        self.mock_db.user = 'root'
        self.mock_db.password = 'Niklas-10'
    
    def create_mock_ui(self):
        """Helper method to create UI with proper mocking"""
        with patch('user_interface.DatabaseManager', return_value=self.mock_db):
            with patch('user_interface.LoginDialog') as mock_login_dialog:
                # Mock login dialog
                mock_login_instance = Mock()
                mock_login_instance.show.return_value = {'nombre_usuario': 'test', 'nombre_completo': 'Test User', 'rol': 'admin'}
                mock_login_dialog.return_value = mock_login_instance
                
                with patch.object(EmployeeManagementUI, 'show_welcome_message'):
                    return EmployeeManagementUI(self.root)
    
    @patch('tkinter.messagebox.showinfo')
    @patch('user_interface.LoginDialog')
    def test_initialization_with_mock(self, mock_login_dialog, mock_messagebox):
        """Test UI initialization with mock database"""
        print("\n[UI] UI Initialisierung mit Mock-Datenbank getestet")
        
        # Mock login dialog to return successful login
        mock_login_instance = Mock()
        mock_login_instance.show.return_value = {'nombre_usuario': 'test', 'nombre_completo': 'Test User', 'rol': 'admin'}
        mock_login_dialog.return_value = mock_login_instance
        
        with patch('user_interface.DatabaseManager', return_value=self.mock_db):
            # Create UI without actually showing it
            with patch.object(EmployeeManagementUI, 'show_welcome_message'):
                ui = EmployeeManagementUI(self.root)
                
                # Check basic initialization
                self.assertEqual(ui.root, self.root)
                self.assertEqual(ui.db, self.mock_db)
                self.assertIsNotNone(ui.current_user)
                
                # Check UI components
                self.assertTrue(hasattr(ui, 'styles'))
                self.assertTrue(hasattr(ui, 'tab_components'))
                self.assertTrue(hasattr(ui, 'employee_tree'))
                self.assertTrue(hasattr(ui, 'notebook'))
    
    def test_setup_ui_components(self):
        """Test UI component setup"""
        print("\n[UI] UI-Komponenten Setup getestet")
        
        ui = self.create_mock_ui()
        
        # Check main components
        self.assertTrue(hasattr(ui, 'employee_tree'))
        self.assertTrue(hasattr(ui, 'search_var'))
        self.assertTrue(hasattr(ui, 'delete_employee_btn'))
        self.assertTrue(hasattr(ui, 'notebook'))
        
        # Check treeview columns
        columns = ui.employee_tree['columns']
        expected_columns = ('ID', 'Name', 'CECO', 'Aktiv')
        self.assertEqual(columns, expected_columns)
    
    def test_load_employees(self):
        """Test loading employees"""
        print("\n[UI] Mitarbeiter laden getestet")
        
        # Mock employee data
        mock_employees = [
            {'id_empleado': 1, 'nombre': 'Test', 'apellido': 'User', 'ceco': 'TEST001', 'activo': True},
            {'id_empleado': 2, 'nombre': 'Another', 'apellido': 'User', 'ceco': 'TEST002', 'activo': False}
        ]
        self.mock_db.get_all_employees.return_value = mock_employees
        
        ui = self.create_mock_ui()
        ui.load_employees()
        
        # Check if treeview is populated
        children = ui.employee_tree.get_children()
        self.assertEqual(len(children), 2)
        
        # Check first item
        first_item = ui.employee_tree.item(children[0])
        values = first_item['values']
        self.assertEqual(values[0], 1)
        self.assertEqual(values[1], 'User, Test')
        self.assertEqual(values[2], 'TEST001')
        self.assertEqual(values[3], 'Ja')
    
    def test_search_employees(self):
        """Test employee search"""
        print("\n[UI] Mitarbeitersuche getestet")
        
        # Mock search results
        mock_results = [
            {'id_empleado': 1, 'nombre': 'Search', 'apellido': 'Test', 'ceco': 'SEARCH001', 'activo': True}
        ]
        self.mock_db.search_employees.return_value = mock_results
        
        ui = self.create_mock_ui()
        
        # Set search term and trigger search
        ui.search_var.set("Search")
        ui.on_search()
        
        # Verify search was called
        self.mock_db.search_employees.assert_called_with("Search")
        
        # Check results
        children = ui.employee_tree.get_children()
        self.assertEqual(len(children), 1)
    
    @patch('tkinter.messagebox.askyesno')
    @patch('tkinter.messagebox.showinfo')
    def test_delete_employee(self, mock_showinfo, mock_askyesno):
        """Test employee deletion"""
        print("\n[UI] Mitarbeiter löschen getestet")
        
        # Mock successful deletion
        self.mock_db.delete_employee.return_value = True
        mock_askyesno.return_value = True
        
        ui = self.create_mock_ui()
        
        # Mock selection
        ui.employee_tree.insert('', tk.END, values=(1, 'Test User', 'TEST001', 'Ja'))
        ui.employee_tree.selection_set(ui.employee_tree.get_children()[0])
        
        # Delete employee
        ui.delete_employee()
        
        # Verify deletion
        self.mock_db.delete_employee.assert_called_once_with(1)
        mock_askyesno.assert_called_once()
    
    @patch('tkinter.messagebox.showwarning')
    def test_delete_employee_no_selection(self, mock_warning):
        """Test employee deletion without selection"""
        print("\n[UI] Mitarbeiter löschen ohne Auswahl getestet")
        
        ui = self.create_mock_ui()
        
        # Try delete without selection
        ui.delete_employee()
        
        # Should not call delete
        self.mock_db.delete_employee.assert_not_called()
    
    def test_refresh_data(self):
        """Test data refresh"""
        print("\n[UI] Daten aktualisieren getestet")
        
        ui = self.create_mock_ui()
        
        # Mock selection
        ui.employee_tree.insert('', tk.END, values=(1, 'Test User', 'TEST001', 'Ja'))
        ui.employee_tree.selection_set(ui.employee_tree.get_children()[0])
        
        # Refresh data
        ui.refresh_data()
        
        # Verify reload
        self.mock_db.get_all_employees.assert_called()
    
    @patch('tkinter.messagebox.showwarning')
    def test_add_new_salary_no_employee(self, mock_warning):
        """Test adding salary without employee selection"""
        print("\n[UI] Gehalt hinzufügen ohne Mitarbeiter getestet")
        
        ui = self.create_mock_ui()
        
        # Try add salary without selection
        ui.add_new_salary()
        
        # Should show warning
        mock_warning.assert_called_once()
    
    def test_clear_forms(self):
        """Test clearing forms"""
        print("\n[UI] Formulare leeren getestet")
        
        ui = self.create_mock_ui()
        
        # Set some values
        ui.tab_components.stammdaten_vars['nombre'].set('Test')
        ui.tab_components.ingresos_vars['ticket_restaurant'].set('100.0')
        
        # Clear forms
        ui.clear_forms()
        
        # Check if cleared
        self.assertEqual(ui.tab_components.stammdaten_vars['nombre'].get(), '')
        self.assertEqual(ui.tab_components.ingresos_vars['ticket_restaurant'].get(), '0.0')
    
    def test_on_employee_select(self):
        """Test employee selection"""
        print("\n[UI] Mitarbeiter Auswahl getestet")
        
        # Mock employee data
        mock_employee_info = {
            'employee': {'id_empleado': 1, 'nombre': 'Test', 'apellido': 'User', 'ceco': 'TEST001', 'activo': True},
            'salaries': [],
            'ingresos': [],
            'deducciones': []
        }
        self.mock_db.get_employee_complete_info.return_value = mock_employee_info
        
        ui = self.create_mock_ui()
        
        # Mock selection
        ui.employee_tree.insert('', tk.END, values=(1, 'User, Test', 'TEST001', 'Ja'))
        ui.employee_tree.selection_set(ui.employee_tree.get_children()[0])
        
        # Trigger selection
        ui.on_employee_select(None)
        
        # Verify data loading
        self.mock_db.get_employee_complete_info.assert_called_with(1)
        
        # Check button states
        self.assertEqual(str(ui.delete_employee_btn['state']), 'normal')
    
    def test_on_employee_select_no_selection(self):
        """Test employee selection with no item selected"""
        print("\n[UI] Mitarbeiter Auswahl ohne Element getestet")
        
        ui = self.create_mock_ui()
        
        # Trigger selection without selection
        ui.on_employee_select(None)
        
        # Check button states
        self.assertEqual(str(ui.delete_employee_btn['state']), 'disabled')
    
    def test_year_change_handling(self):
        """Test year change handling"""
        print("\n[UI] Jahr-Wechsel Behandlung getestet")
        
        ui = self.create_mock_ui()
        
        # Test year change
        ui.on_year_change('ingresos')
        ui.on_year_change('deducciones')
        
        # Should not raise errors
        self.assertTrue(True)
    
    def test_salary_selection(self):
        """Test salary selection"""
        print("\n[UI] Gehalt Auswahl getestet")
        
        ui = self.create_mock_ui()
        
        # Mock salary selection
        ui.tab_components.salary_tree.insert('', tk.END, values=(2024, 12, '50000.00 €', '4166.67 €', '0.00 €', '4166.67 €'))
        ui.tab_components.salary_tree.selection_set(ui.tab_components.salary_tree.get_children()[0])
        
        # Mock employee selection
        ui.employee_tree.insert('', tk.END, values=(1, 'User, Test', 'TEST001', 'Ja'))
        ui.employee_tree.selection_set(ui.employee_tree.get_children()[0])
        
        # Mock employee info
        mock_info = {
            'employee': {'id_empleado': 1},
            'salaries': [{'anio': 2024, 'modalidad': 12, 'salario_anual_bruto': 50000.0, 'antiguedad': 1000.0}]
        }
        self.mock_db.get_employee_complete_info.return_value = mock_info
        
        # Trigger salary selection
        ui.on_salary_select(None)
        
        # Should not raise errors
        self.assertTrue(True)


class TestUserInterfaceIntegration(unittest.TestCase):
    """Integration tests with real database"""
    
    @classmethod
    def setUpClass(cls):
        logging.basicConfig(level=logging.INFO)
        
        # Database configuration
        cls.db_config = {
            'host': 'localhost',
            'database': 'nomina',
            'user': 'root',
            'password': 'Niklas-10',
            'port': 3307
        }
        
        cls.test_employee_ids = []
        cls.test_user_ids = []
        
        # Create test user
        from database_manager import DatabaseManager
        cls.db = DatabaseManager(**cls.db_config)
        if cls.db.connect():
            test_username = f"uitest_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            cls.db.create_user(test_username, "testpass123", "UI Test User", 'admin')
            
            # Get user ID for cleanup
            user_query = "SELECT id_usuario FROM t005_benutzer WHERE nombre_usuario = %s"
            user_result = cls.db.execute_query(user_query, (test_username,))
            if user_result:
                cls.test_user_ids.append(user_result[0]['id_usuario'])
            
            cls.test_username = test_username
            cls.db.disconnect()
        
        # Mock root for testing
        cls.root = tk.Tk()
        cls.root.withdraw()
        cls.root.update()
    
    @classmethod
    def tearDownClass(cls):
        """Cleanup after all tests"""
        cleanup_success = False
        max_retries = 3
        retry_count = 0
        
        while not cleanup_success and retry_count < max_retries:
            try:
                from database_manager import DatabaseManager
                db = DatabaseManager(**cls.db_config)
                if db.connect():
                    print(f"\n[CLEANUP] Aufräumen der Integrationstest-Daten (Versuch {retry_count + 1}/{max_retries})")
                    
                    # Clean up test employees (this will cascade delete salaries, ingresos, deducciones)
                    employees_deleted = 0
                    for employee_id in cls.test_employee_ids:
                        result = db.delete_employee(employee_id)
                        if result:
                            employees_deleted += 1
                            print(f"[DELETE] Test-Mitarbeiter {employee_id} gelöscht")
                        else:
                            print(f"[WARNING] Mitarbeiter {employee_id} konnte nicht gelöscht werden")
                    
                    # Clean up test users
                    users_deleted = 0
                    for user_id in cls.test_user_ids:
                        delete_query = "DELETE FROM t005_benutzer WHERE id_usuario = %s"
                        rows_affected = db.execute_update(delete_query, (user_id,))
                        if rows_affected > 0:
                            users_deleted += 1
                            print(f"[DELETE] Test-Benutzer {user_id} gelöscht")
                        else:
                            print(f"[WARNING] Benutzer {user_id} konnte nicht gelöscht werden")
                    
                    # Verify cleanup was successful
                    if employees_deleted == len(cls.test_employee_ids) and users_deleted == len(cls.test_user_ids):
                        cleanup_success = True
                        print(f"[OK] Alle Integrationstest-Daten erfolgreich entfernt: {employees_deleted} Mitarbeiter, {users_deleted} Benutzer")
                    else:
                        print(f"[WARNING] Nicht alle Integrationstest-Daten entfernt: {employees_deleted}/{len(cls.test_employee_ids)} Mitarbeiter, {users_deleted}/{len(cls.test_user_ids)} Benutzer")
                    
                    db.disconnect()
                else:
                    print(f"[ERROR] Datenbankverbindung fehlgeschlagen (Versuch {retry_count + 1})")
                
                retry_count += 1
                
            except Exception as e:
                print(f"[ERROR] Fehler beim Aufräumen (Versuch {retry_count + 1}): {e}")
                retry_count += 1
                if retry_count >= max_retries:
                    print(f"[CRITICAL] Aufräumen nach {max_retries} Versuchen fehlgeschlagen")
                    print(f"[INFO] Verbleibende Integrationstest-Daten: Mitarbeiter {cls.test_employee_ids}, Benutzer {cls.test_user_ids}")
        
        try:
            cls.root.destroy()
        except:
            pass
        
        if cleanup_success:
            print("\n[OK] UI-Integrationstests abgeschlossen - alle Testdaten entfernt")
        else:
            print("\n[WARNING] UI-Integrationstests abgeschlossen - einige Testdaten könnten verbleiben")
    
    @patch('tkinter.messagebox.showinfo')
    def test_full_ui_workflow(self, mock_messagebox):
        """Test complete UI workflow with real database"""
        print("\n[UI] Vollständiger UI-Workflow mit echter Datenbank getestet")
        
        # Create test employee first
        from database_manager import DatabaseManager
        db = DatabaseManager(**self.db_config)
        employee_id = None
        if db.connect():
            try:
                employee_data = {
                    'nombre': 'UI',
                    'apellido': 'Test',
                    'ceco': 'UITEST001',
                    'activo': True
                }
                employee_id = db.add_employee(employee_data)
                if employee_id > 0:
                    self.test_employee_ids.append(employee_id)
                    print(f"[CREATE] Test-Mitarbeiter {employee_id} erstellt")
                    
                    # Add salary data
                    salary_data = {
                        'anio': 2024,
                        'modalidad': 12,
                        'salario_anual_bruto': 40000.0,
                        'antiguedad': 1000.0
                    }
                    salary_success = db.add_salary(employee_id, salary_data)
                    if salary_success:
                        print(f"[CREATE] Gehaltsdaten für Mitarbeiter {employee_id} erstellt")
                    else:
                        print(f"[WARNING] Gehaltsdaten für Mitarbeiter {employee_id} konnten nicht erstellt werden")
                else:
                    print(f"[ERROR] Mitarbeiter konnte nicht erstellt werden")
            except Exception as e:
                print(f"[ERROR] Fehler bei der Erstellung von Testdaten: {e}")
                if employee_id and employee_id > 0:
                    self.test_employee_ids.append(employee_id)
            finally:
                db.disconnect()
        else:
            print("[ERROR] Datenbankverbindung für Testdatenerstellung fehlgeschlagen")
        
        # Skip test if employee creation failed
        if not employee_id or employee_id <= 0:
            self.skipTest("Test-Mitarbeiter konnte nicht erstellt werden - Test übersprungen")
        
        # Mock login with test user and completely mock the UI
        with patch('user_interface.DatabaseManager') as mock_db_class:
            mock_db = Mock()
            mock_db.connect.return_value = True
            mock_db.verify_user.return_value = {'nombre_usuario': self.test_username, 'nombre_completo': 'UI Test User', 'rol': 'admin'}
            mock_db.host = 'localhost'
            mock_db.database = 'nomina'
            mock_db.user = 'root'
            mock_db.password = 'Niklas-10'
            
            # Return real employee data
            real_db = DatabaseManager(**self.db_config)
            real_db.connect()
            mock_db.get_all_employees.return_value = real_db.get_all_employees()
            # Only set up employee-specific mocks if employee was created successfully
            if employee_id and employee_id > 0:
                mock_db.get_employee_complete_info.return_value = real_db.get_employee_complete_info(employee_id)
            else:
                mock_db.get_employee_complete_info.return_value = None
            mock_db.search_employees.return_value = real_db.search_employees("UI")
            mock_db_class.return_value = mock_db
            
            # Mock the entire UI creation to avoid GUI issues
            with patch('user_interface.LoginDialog') as mock_login_dialog:
                mock_login_instance = Mock()
                mock_login_instance.show.return_value = {'nombre_usuario': self.test_username, 'nombre_completo': 'UI Test User', 'rol': 'admin'}
                mock_login_dialog.return_value = mock_login_instance
                
                with patch.object(EmployeeManagementUI, 'show_welcome_message'):
                    ui = EmployeeManagementUI(self.root)
                    
                    # Test loading employees
                    ui.load_employees()
                    children = ui.employee_tree.get_children()
                    self.assertGreater(len(children), 0)
                    
                    # Test search
                    ui.search_var.set("UI")
                    ui.on_search()
                    
                    # Test employee selection
                    for item in ui.employee_tree.get_children():
                        values = ui.employee_tree.item(item)['values']
                        if 'UI' in values[1]:  # Check if name contains 'UI'
                            ui.employee_tree.selection_set(item)
                            ui.on_employee_select(None)
                            break
                    
                    # Test refresh
                    ui.refresh_data()
                    
                    # Test clear forms
                    ui.clear_forms()
                    
                    print(f"[UI] Workflow-Test abgeschlossen für Mitarbeiter ID {employee_id}")


def main():
    """Main function to run tests"""
    print("\n" + "="*60)
    print("[UI] USER INTERFACE TESTSUITE")
    print("="*60)
    print("[INFO] Tests für User Interface mit Mock und echter Datenbank")
    print("[WARNING] Alle Testdaten werden nach Abschluss gelöscht\n")
    
    unittest.main(verbosity=2)


if __name__ == '__main__':
    main()
