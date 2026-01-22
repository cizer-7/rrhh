import unittest
import sys
import os
import tkinter as tk
from tkinter import ttk
from unittest.mock import Mock, patch, MagicMock
import logging
from datetime import datetime

# Add the production directory to the path to import ui_components
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'production'))

from ui_components import EmployeeTabComponents

class TestEmployeeTabComponents(unittest.TestCase):
    """
    Umfassende Tests für alle Funktionen in EmployeeTabComponents.
    Mockt UI-Komponenten für zuverlässige Tests ohne echte GUI.
    """
    
    @classmethod
    def setUpClass(cls):
        """Einmalige Einrichtung für alle Tests"""
        # Logging konfigurieren
        logging.basicConfig(level=logging.INFO)
        
        # Mock-Datenbank-Manager
        cls.mock_db = Mock()
        cls.mock_db.get_all_employees.return_value = [
            {'id_empleado': 1, 'nombre': 'Test', 'apellido': 'User', 'ceco': 'TEST001', 'activo': True},
            {'id_empleado': 2, 'nombre': 'Another', 'apellido': 'User', 'ceco': 'TEST002', 'activo': False}
        ]
        
        # Mock-Farben
        cls.colors = {
            'text_secondary': '#666666',
            'text_tertiary': '#999999',
            'success': '#4CAF50',
            'warning': '#FF9800',
            'danger': '#F44336'
        }
        
        # Hauptfenster für Tests erstellen
        cls.root = tk.Tk()
        cls.root.withdraw()  # Fenster verstecken
        cls.root.update()
    
    @classmethod
    def tearDownClass(cls):
        """Aufräumen nach allen Tests"""
        try:
            cls.root.destroy()
        except:
            pass
    
    def setUp(self):
        """Einrichtung für jeden einzelnen Test"""
        # Parent-Frame erstellen
        self.parent_frame = ttk.Frame(self.root)
        
        # EmployeeTabComponents erstellen
        self.ui_components = EmployeeTabComponents(self.parent_frame, self.mock_db, self.colors)
    
    def tearDown(self):
        """Aufräumen nach jedem einzelnen Test"""
        try:
            self.parent_frame.destroy()
        except:
            pass
    
    def test_initialization(self):
        """Test der Initialisierung von EmployeeTabComponents"""
        print("\n[UI] Initialisierung getestet")
        
        # Überprüfen der Initialisierung
        self.assertEqual(self.ui_components.parent, self.parent_frame)
        self.assertEqual(self.ui_components.db, self.mock_db)
        self.assertEqual(self.ui_components.colors, self.colors)
        
        # Überprüfen des edit_mode Status
        expected_edit_mode = {
            'stammdaten': False,
            'gehaelter': False,
            'ingresos': False,
            'deducciones': False
        }
        self.assertEqual(self.ui_components.edit_mode, expected_edit_mode)
    
    def test_setup_stammdaten_tab(self):
        """Test der Einrichtung des Stammdaten-Tabs"""
        print("\n[UI] Stammdaten-Tab Setup getestet")
        
        # Notebook erstellen
        notebook = ttk.Notebook(self.parent_frame)
        
        # Tab einrichten
        stammdaten_frame = self.ui_components.setup_stammdaten_tab(notebook)
        
        # Überprüfen, ob Frame erstellt wurde
        self.assertIsNotNone(stammdaten_frame)
        self.assertIsInstance(stammdaten_frame, ttk.Frame)
        
        # Überprüfen, ob Tab zum Notebook hinzugefügt wurde
        tabs = notebook.tabs()
        self.assertGreater(len(tabs), 0)
        
        # Überprüfen der Widgets
        self.assertTrue(hasattr(self.ui_components, 'stammdaten_vars'))
        self.assertTrue(hasattr(self.ui_components, 'stammdaten_widgets'))
        self.assertTrue(hasattr(self.ui_components, 'stammdaten_edit_btn'))
        self.assertTrue(hasattr(self.ui_components, 'stammdaten_save_btn'))
        self.assertTrue(hasattr(self.ui_components, 'stammdaten_status'))
        
        # Überprüfen der Felder
        expected_fields = ['id_empleado', 'nombre', 'apellido', 'ceco', 'activo']
        for field in expected_fields:
            self.assertIn(field, self.ui_components.stammdaten_vars)
            self.assertIn(field, self.ui_components.stammdaten_widgets)
    
    def test_setup_gehaelter_tab(self):
        """Test der Einrichtung der Gehälter-Tabs"""
        print("\n[UI] Gehälter-Tab Setup getestet")
        
        notebook = ttk.Notebook(self.parent_frame)
        gehaelter_frame = self.ui_components.setup_gehaelter_tab(notebook)
        
        # Überprüfen, ob Frame erstellt wurde
        self.assertIsNotNone(gehaelter_frame)
        self.assertIsInstance(gehaelter_frame, ttk.Frame)
        
        # Überprüfen der Widgets
        self.assertTrue(hasattr(self.ui_components, 'salary_vars'))
        self.assertTrue(hasattr(self.ui_components, 'salary_widgets'))
        self.assertTrue(hasattr(self.ui_components, 'salary_tree'))
        self.assertTrue(hasattr(self.ui_components, 'gehaelter_edit_btn'))
        self.assertTrue(hasattr(self.ui_components, 'gehaelter_save_btn'))
        self.assertTrue(hasattr(self.ui_components, 'add_gehalt_btn'))
        self.assertTrue(hasattr(self.ui_components, 'delete_gehalt_btn'))
        self.assertTrue(hasattr(self.ui_components, 'gehaelter_status'))
        
        # Überprüfen der Gehaltsfelder
        expected_fields = ['anio', 'modalidad', 'salario_anual_bruto', 'antiguedad']
        for field in expected_fields:
            self.assertIn(field, self.ui_components.salary_vars)
            self.assertIn(field, self.ui_components.salary_widgets)
    
    def test_setup_ingresos_tab(self):
        """Test der Einrichtung der Bruttoeinkünfte-Tabs"""
        print("\n[UI] Bruttoeinkünfte-Tab Setup getestet")
        
        notebook = ttk.Notebook(self.parent_frame)
        ingresos_frame = self.ui_components.setup_ingresos_tab(notebook)
        
        # Überprüfen, ob Frame erstellt wurde
        self.assertIsNotNone(ingresos_frame)
        self.assertIsInstance(ingresos_frame, ttk.Frame)
        
        # Überprüfen der Widgets
        self.assertTrue(hasattr(self.ui_components, 'ingresos_vars'))
        self.assertTrue(hasattr(self.ui_components, 'ingresos_widgets'))
        self.assertTrue(hasattr(self.ui_components, 'ingresos_year_var'))
        self.assertTrue(hasattr(self.ui_components, 'ingresos_edit_btn'))
        self.assertTrue(hasattr(self.ui_components, 'ingresos_save_btn'))
        self.assertTrue(hasattr(self.ui_components, 'ingresos_status'))
        
        # Überprüfen der Bruttoeinkünfte-Felder
        expected_fields = [
            'ticket_restaurant', 'primas', 'dietas_cotizables', 
            'horas_extras', 'dias_exentos', 'dietas_exentas', 'seguro_pensiones'
        ]
        for field in expected_fields:
            self.assertIn(field, self.ui_components.ingresos_vars)
            self.assertIn(field, self.ui_components.ingresos_widgets)
    
    def test_setup_deducciones_tab(self):
        """Test der Einrichtung der Abzüge-Tabs"""
        print("\n[UI] Abzüge-Tab Setup getestet")
        
        notebook = ttk.Notebook(self.parent_frame)
        deducciones_frame = self.ui_components.setup_deducciones_tab(notebook)
        
        # Überprüfen, ob Frame erstellt wurde
        self.assertIsNotNone(deducciones_frame)
        self.assertIsInstance(deducciones_frame, ttk.Frame)
        
        # Überprüfen der Widgets
        self.assertTrue(hasattr(self.ui_components, 'deducciones_vars'))
        self.assertTrue(hasattr(self.ui_components, 'deducciones_widgets'))
        self.assertTrue(hasattr(self.ui_components, 'deducciones_year_var'))
        self.assertTrue(hasattr(self.ui_components, 'deducciones_edit_btn'))
        self.assertTrue(hasattr(self.ui_components, 'deducciones_save_btn'))
        self.assertTrue(hasattr(self.ui_components, 'deducciones_status'))
        
        # Überprüfen der Abzüge-Felder
        expected_fields = [
            'seguro_accidentes', 'adelas', 'sanitas', 'gasolina_arval', 'cotizacion_especie'
        ]
        for field in expected_fields:
            self.assertIn(field, self.ui_components.deducciones_vars)
            self.assertIn(field, self.ui_components.deducciones_widgets)
    
    def test_setup_historie_tab(self):
        """Test der Einrichtung des Historie-Tabs"""
        print("\n[UI] Historie-Tab Setup getestet")
        
        notebook = ttk.Notebook(self.parent_frame)
        historie_frame = self.ui_components.setup_historie_tab(notebook)
        
        # Überprüfen, ob Frame erstellt wurde
        self.assertIsNotNone(historie_frame)
        self.assertIsInstance(historie_frame, ttk.Frame)
        
        # Überprüfen der Widgets
        self.assertTrue(hasattr(self.ui_components, 'historie_employee_var'))
        self.assertTrue(hasattr(self.ui_components, 'historie_employee_combo'))
        self.assertTrue(hasattr(self.ui_components, 'historie_search_var'))
        self.assertTrue(hasattr(self.ui_components, 'historie_search_entry'))
        self.assertTrue(hasattr(self.ui_components, 'historie_tree'))
        self.assertTrue(hasattr(self.ui_components, 'historie_filter_var'))
        
        # Überprüfen, ob Mitarbeiter geladen wurden
        self.mock_db.get_all_employees.assert_called()
    
    @patch('tkinter.messagebox.askyesno')
    def test_toggle_edit_mode_enable(self, mock_messagebox):
        """Test des Aktivierens des Edit-Modus"""
        print("\n[UI] Edit-Modus aktivieren getestet")
        
        # Mock für messagebox
        mock_messagebox.return_value = True
        
        # Stammdaten-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_stammdaten_tab(notebook)
        
        # Edit-Modus aktivieren
        self.ui_components.toggle_edit_mode('stammdaten')
        
        # Überprüfen, ob messagebox aufgerufen wurde
        mock_messagebox.assert_called_once()
        
        # Überprüfen, ob Edit-Modus aktiviert wurde
        self.assertTrue(self.ui_components.edit_mode['stammdaten'])
        
        # Überprüfen, ob Status aktualisiert wurde
        self.assertIn('Bearbeitungsmodus', self.ui_components.stammdaten_status['text'])
    
    def test_toggle_edit_mode_disable(self):
        """Test des Deaktivierens des Edit-Modus"""
        print("\n[UI] Edit-Modus deaktivieren getestet")
        
        # Stammdaten-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_stammdaten_tab(notebook)
        
        # Edit-Modus zuerst aktivieren
        self.ui_components.edit_mode['stammdaten'] = True
        
        # Edit-Modus deaktivieren
        self.ui_components.toggle_edit_mode('stammdaten')
        
        # Überprüfen, ob Edit-Modus deaktiviert wurde
        self.assertFalse(self.ui_components.edit_mode['stammdaten'])
    
    def test_set_fields_readonly(self):
        """Test des Setzungen von Feldern auf Readonly"""
        print("\n[UI] Felder Readonly-Status getestet")
        
        # Stammdaten-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_stammdaten_tab(notebook)
        
        # Felder auf readonly setzen
        self.ui_components.set_fields_readonly('stammdaten', True)
        
        # Felder auf editable setzen
        self.ui_components.set_fields_readonly('stammdaten', False)
        
        # Test sollte ohne Fehler durchlaufen
        self.assertTrue(True)
    
    def test_update_status_labels(self):
        """Test der Aktualisierung von Status-Labels"""
        print("\n[UI] Status-Labels Aktualisierung getestet")
        
        # Stammdaten-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_stammdaten_tab(notebook)
        
        # Status auf Bearbeitungsmodus setzen
        self.ui_components.update_status_labels('stammdaten', '(Bearbeitungsmodus)')
        
        # Status auf Nur Lesen setzen
        self.ui_components.update_status_labels('stammdaten', '(Nur Lesen)')
        
        # Test sollte ohne Fehler durchlaufen
        self.assertTrue(True)
    
    def test_on_year_change(self):
        """Test der Jahr-Wechsel-Funktion"""
        print("\n[UI] Jahr-Wechsel getestet")
        
        # Funktion sollte existieren und ohne Fehler aufrufbar sein
        self.ui_components.on_year_change('ingresos')
        self.ui_components.on_year_change('deducciones')
        
        self.assertTrue(True)
    
    def test_add_new_salary(self):
        """Test des Hinzufügens von neuen Gehaltsdaten"""
        print("\n[UI] Neues Gehalt hinzufügen getestet")
        
        # Funktion sollte existieren und ohne Fehler aufrufbar sein
        self.ui_components.add_new_salary()
        
        self.assertTrue(True)
    
    def test_load_historie_employees(self):
        """Test des Ladens von Mitarbeitern für Historie"""
        print("\n[UI] Historie-Mitarbeiter laden getestet")
        
        # Historie-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_historie_tab(notebook)
        
        # Mitarbeiter laden
        self.ui_components.load_historie_employees()
        
        # Überprüfen, ob Datenbank aufgerufen wurde
        self.mock_db.get_all_employees.assert_called()
        
        # Überprüfen, ob Mitarbeiter in Combo-Box geladen wurden
        self.assertIsNotNone(self.ui_components.all_historie_employees)
        self.assertGreater(len(self.ui_components.all_historie_employees), 0)
    
    def test_search_historie_employees(self):
        """Test der Suche nach Mitarbeitern in Historie"""
        print("\n[UI] Historie-Mitarbeiter Suche getestet")
        
        # Historie-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_historie_tab(notebook)
        
        # Mitarbeiter laden
        self.ui_components.load_historie_employees()
        
        # Suche durchführen
        self.ui_components.historie_search_var.set("Test")
        self.ui_components.search_historie_employees()
        
        # Suche mit leerem Text
        self.ui_components.historie_search_var.set("")
        self.ui_components.search_historie_employees()
        
        self.assertTrue(True)
    
    def test_on_historie_search_key(self):
        """Test der Tastatur-Eingabe in Suchfeld"""
        print("\n[UI] Historie-Suchfeld Tastatur-Eingabe getestet")
        
        # Historie-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_historie_tab(notebook)
        
        # Mock-Event erstellen
        mock_event = Mock()
        
        # Tastatur-Eingabe simulieren
        self.ui_components.on_historie_search_key(mock_event)
        
        self.assertTrue(True)
    
    def test_show_all_historie_employees(self):
        """Test des Anzeigens aller Mitarbeiter in Historie"""
        print("\n[UI] Alle Historie-Mitarbeiter anzeigen getestet")
        
        # Historie-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_historie_tab(notebook)
        
        # Mitarbeiter laden
        self.ui_components.load_historie_employees()
        
        # Alle Mitarbeiter anzeigen
        self.ui_components.show_all_historie_employees()
        
        self.assertTrue(True)
    
    def test_on_historie_employee_select(self):
        """Test der Auswahl eines Mitarbeiters in Historie"""
        print("\n[UI] Historie-Mitarbeiter Auswahl getestet")
        
        # Historie-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_historie_tab(notebook)
        
        # Mitarbeiter-Auswahl simulieren
        self.ui_components.on_historie_employee_select(None)
        
        self.assertTrue(True)
    
    def test_load_historie(self):
        """Test des Ladens der Historie"""
        print("\n[UI] Historie laden getestet")
        
        # Funktion sollte existieren und ohne Fehler aufrufbar sein
        self.ui_components.load_historie()
        
        self.assertTrue(True)
    
    def test_on_historie_filter_change(self):
        """Test des Filter-Wechsels in Historie"""
        print("\n[UI] Historie-Filter Wechsel getestet")
        
        # Funktion sollte existieren und ohne Fehler aufrufbar sein
        mock_event = Mock()
        self.ui_components.on_historie_filter_change(mock_event)
        
        self.assertTrue(True)
    
    @patch('tkinter.messagebox.askyesno')
    @patch('tkinter.messagebox.showinfo')
    def test_clear_historie(self, mock_showinfo, mock_askyesno):
        """Test des Leeren der Historie"""
        print("\n[UI] Historie leeren getestet")
        
        # Mock für messagebox
        mock_askyesno.return_value = True
        
        # Historie-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_historie_tab(notebook)
        
        # Historie leeren
        self.ui_components.clear_historie()
        
        # Überprüfen, ob messagebox aufgerufen wurde
        mock_askyesno.assert_called_once()
        mock_showinfo.assert_called_once()
        
        # Test mit Abbruch
        mock_askyesno.return_value = False
        self.ui_components.clear_historie()
        
        self.assertTrue(True)
    
    def test_error_handling(self):
        """Test der Fehlerbehandlung"""
        print("\n[UI] Fehlerbehandlung getestet")
        
        # Mock-Datenbank mit Exception
        error_db = Mock()
        error_db.get_all_employees.side_effect = Exception("Database error")
        
        # UI-Komponenten mit fehlerhafter DB erstellen
        error_ui = EmployeeTabComponents(self.parent_frame, error_db, self.colors)
        
        # Historie-Tab einrichten sollte Fehler behandeln
        notebook = ttk.Notebook(self.parent_frame)
        error_ui.setup_historie_tab(notebook)
        
        # Mitarbeiter laden sollte Fehler behandeln
        error_ui.load_historie_employees()
        
        self.assertTrue(True)
    
    def test_widget_states(self):
        """Test der Widget-Zustände"""
        print("\n[UI] Widget-Zustände getestet")
        
        # Stammdaten-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_stammdaten_tab(notebook)
        
        # Überprüfen der Anfangszustände
        self.assertEqual(str(self.ui_components.stammdaten_edit_btn['state']), 'normal')
        self.assertEqual(str(self.ui_components.stammdaten_save_btn['state']), 'disabled')
        
        # ID-Feld sollte immer readonly sein
        id_field = self.ui_components.stammdaten_widgets['id_empleado']
        self.assertEqual(str(id_field['state']), 'readonly')
        
        self.assertTrue(True)
    
    def test_data_binding(self):
        """Test der Datenbindung an Variablen"""
        print("\n[UI] Datenbindung getestet")
        
        # Stammdaten-Tab einrichten
        notebook = ttk.Notebook(self.parent_frame)
        self.ui_components.setup_stammdaten_tab(notebook)
        
        # Überprüfen der Variablen-Typen
        self.assertIsInstance(self.ui_components.stammdaten_vars['id_empleado'], tk.StringVar)
        self.assertIsInstance(self.ui_components.stammdaten_vars['nombre'], tk.StringVar)
        self.assertIsInstance(self.ui_components.stammdaten_vars['activo'], tk.BooleanVar)
        
        # Test der Wertezuweisung
        self.ui_components.stammdaten_vars['nombre'].set('Test Name')
        self.assertEqual(self.ui_components.stammdaten_vars['nombre'].get(), 'Test Name')
        
        self.assertTrue(True)


def main():
    """Hauptfunktion zum Ausführen der Tests"""
    print("\n" + "="*60)
    print("[UI] UI COMPONENTS TESTSUITE")
    print("="*60)
    print("[INFO] Tests für UI-Komponenten mit Mock-Objekten")
    print("[WARNING] Keine echte GUI wird angezeigt\n")
    
    # unittest ausführen
    unittest.main(verbosity=2)


if __name__ == '__main__':
    main()
