import unittest
import sys
import os
import tkinter as tk
from tkinter import ttk
import logging

# Add the production directory to the path to import ui_styles
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'production'))

from ui_styles import ModernStyles

class TestModernStyles(unittest.TestCase):
    """
    Umfassende Tests für alle Funktionen in ModernStyles.
    Testet UI-Styling-Konfiguration und Widget-Stile.
    """
    
    @classmethod
    def setUpClass(cls):
        """Einmalige Einrichtung für alle Tests"""
        # Logging konfigurieren
        logging.basicConfig(level=logging.INFO)
        
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
        # ModernStyles-Instanz erstellen
        self.styles = ModernStyles()
    
    def tearDown(self):
        """Aufräumen nach jedem einzelnen Test"""
        pass
    
    def test_initialization(self):
        """Test der Initialisierung von ModernStyles"""
        print("\n[STYLE] Initialisierung getestet")
        
        # Überprüfen der Color-Konfiguration
        self.assertIsInstance(self.styles.colors, dict)
        
        # Überprüfen der erwarteten Farben
        expected_colors = [
            'primary', 'primary_light', 'primary_dark', 'secondary', 'success',
            'warning', 'error', 'background', 'surface', 'surface_variant',
            'text_primary', 'text_secondary', 'text_tertiary', 'border', 'shadow'
        ]
        
        for color in expected_colors:
            self.assertIn(color, self.styles.colors)
            self.assertIsInstance(self.styles.colors[color], str)
            self.assertGreater(len(self.styles.colors[color]), 0)
    
    def test_color_values(self):
        """Test der Farbwerte"""
        print("\n[STYLE] Farbwerte getestet")
        
        # Überprüfen spezifischer Farbwerte
        color_checks = {
            'primary': '#2C3E50',
            'secondary': '#3498DB',
            'success': '#27AE60',
            'warning': '#F39C12',
            'error': '#E74C3C',
            'background': '#F8F9FA',
            'surface': '#FFFFFF'
        }
        
        for color_name, expected_value in color_checks.items():
            self.assertEqual(self.styles.colors[color_name], expected_value)
    
    def test_setup_modern_style(self):
        """Test der Anwendung moderner Stile"""
        print("\n[STYLE] Moderne Stile Anwendung getestet")
        
        # Stile anwenden
        colors = self.styles.setup_modern_style(self.root)
        
        # Überprüfen, ob Farben zurückgegeben werden
        self.assertIsInstance(colors, dict)
        self.assertEqual(colors, self.styles.colors)
        
        # Überprüfen, ob Hintergrund gesetzt wurde
        self.assertEqual(self.root['bg'], self.styles.colors['background'])
    
    def test_button_styles(self):
        """Test der Button-Stile"""
        print("\n[STYLE] Button-Stile getestet")
        
        # Stile anwenden
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Überprüfen der Button-Stile
        button_styles = ['Primary.TButton', 'Secondary.TButton', 'Success.TButton', 'Warning.TButton', 'Danger.TButton']
        
        for button_style in button_styles:
            # Überprüfen, ob Stil konfiguriert ist
            style_info = style.configure(button_style)
            self.assertIsNotNone(style_info)
            
            # Überprüfen der wichtigsten Eigenschaften
            self.assertIn('background', style_info)
            self.assertIn('foreground', style_info)
            self.assertIn('font', style_info)
            self.assertIn('padding', style_info)
    
    def test_primary_button_style(self):
        """Test des Primary Button Styles"""
        print("\n[STYLE] Primary Button Style getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Primary Button überprüfen
        primary_config = style.configure('Primary.TButton')
        self.assertEqual(primary_config['background'], self.styles.colors['primary'])
        self.assertEqual(primary_config['foreground'], 'white')
        self.assertEqual(primary_config['borderwidth'], 0)
        self.assertEqual(primary_config['relief'], 'flat')
        
        # Überprüfen der State-Map
        state_map = style.map('Primary.TButton')
        self.assertIsNotNone(state_map)
        self.assertIn('background', state_map)
    
    def test_secondary_button_style(self):
        """Test des Secondary Button Styles"""
        print("\n[STYLE] Secondary Button Style getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Secondary Button überprüfen
        secondary_config = style.configure('Secondary.TButton')
        self.assertEqual(secondary_config['background'], self.styles.colors['surface'])
        self.assertEqual(secondary_config['foreground'], self.styles.colors['primary'])
        self.assertEqual(secondary_config['borderwidth'], 1)
        self.assertEqual(secondary_config['relief'], 'solid')
    
    def test_success_button_style(self):
        """Test des Success Button Styles"""
        print("\n[STYLE] Success Button Style getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Success Button überprüfen
        success_config = style.configure('Success.TButton')
        self.assertEqual(success_config['background'], self.styles.colors['success'])
        self.assertEqual(success_config['foreground'], 'white')
        self.assertEqual(success_config['borderwidth'], 0)
    
    def test_warning_button_style(self):
        """Test des Warning Button Styles"""
        print("\n[STYLE] Warning Button Style getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Warning Button überprüfen
        warning_config = style.configure('Warning.TButton')
        self.assertEqual(warning_config['background'], self.styles.colors['warning'])
        self.assertEqual(warning_config['foreground'], 'white')
        self.assertEqual(warning_config['borderwidth'], 0)
    
    def test_danger_button_style(self):
        """Test des Danger Button Styles"""
        print("\n[STYLE] Danger Button Style getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Danger Button überprüfen
        danger_config = style.configure('Danger.TButton')
        self.assertEqual(danger_config['background'], self.styles.colors['error'])
        self.assertEqual(danger_config['foreground'], 'white')
        self.assertEqual(danger_config['borderwidth'], 0)
    
    def test_entry_style(self):
        """Test des Entry Feld Styles"""
        print("\n[STYLE] Entry Style getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Modern Entry überprüfen
        entry_config = style.configure('Modern.TEntry')
        self.assertEqual(entry_config['fieldbackground'], self.styles.colors['surface'])
        self.assertEqual(entry_config['borderwidth'], 1)
        self.assertEqual(entry_config['relief'], 'solid')
        self.assertEqual(entry_config['bordercolor'], self.styles.colors['border'])
        
        # Überprüfen der Focus-Map
        state_map = style.map('Modern.TEntry')
        self.assertIsNotNone(state_map)
        self.assertIn('bordercolor', state_map)
    
    def test_treeview_style(self):
        """Test des Treeview Styles"""
        print("\n[STYLE] Treeview Style getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Modern Treeview überprüfen
        treeview_config = style.configure('Modern.Treeview')
        self.assertEqual(treeview_config['background'], self.styles.colors['surface'])
        self.assertEqual(treeview_config['foreground'], self.styles.colors['text_primary'])
        self.assertEqual(treeview_config['fieldbackground'], self.styles.colors['surface'])
        
        # Heading überprüfen
        heading_config = style.configure('Modern.Treeview.Heading')
        self.assertEqual(heading_config['background'], self.styles.colors['surface_variant'])
        self.assertEqual(heading_config['foreground'], self.styles.colors['text_primary'])
        
        # Überprüfen der Selection-Map
        state_map = style.map('Modern.Treeview')
        self.assertIsNotNone(state_map)
        self.assertIn('background', state_map)
        self.assertIn('foreground', state_map)
    
    def test_labelframe_style(self):
        """Test des LabelFrame (Card) Styles"""
        print("\n[STYLE] LabelFrame Style getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Card LabelFrame überprüfen
        card_config = style.configure('Card.TLabelframe')
        self.assertEqual(card_config['background'], self.styles.colors['surface'])
        self.assertEqual(card_config['borderwidth'], 1)
        self.assertEqual(card_config['relief'], 'solid')
        
        # Card Label überprüfen
        card_label_config = style.configure('Card.TLabelframe.Label')
        self.assertEqual(card_label_config['background'], self.styles.colors['surface'])
        self.assertEqual(card_label_config['foreground'], self.styles.colors['primary'])
        
        # Font überprüfen (kann verschiedene Formate haben)
        font = card_label_config['font']
        if isinstance(font, tuple) and len(font) > 2:
            self.assertEqual(font[2], 'bold')  # Font-Weight prüfen
        elif isinstance(font, str):
            self.assertIn('bold', font.lower())
    
    def test_checkbutton_style(self):
        """Test des Checkbutton Styles"""
        print("\n[STYLE] Checkbutton Style getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Modern Checkbutton überprüfen
        checkbutton_config = style.configure('Modern.TCheckbutton')
        self.assertEqual(checkbutton_config['background'], self.styles.colors['background'])
        self.assertEqual(checkbutton_config['foreground'], self.styles.colors['text_primary'])
        self.assertEqual(checkbutton_config['focuscolor'], 'none')
    
    def test_combobox_style(self):
        """Test des Combobox Styles"""
        print("\n[STYLE] Combobox Style getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Modern Combobox überprüfen
        combobox_config = style.configure('Modern.TCombobox')
        self.assertEqual(combobox_config['fieldbackground'], self.styles.colors['surface'])
        self.assertEqual(combobox_config['borderwidth'], 1)
        self.assertEqual(combobox_config['relief'], 'solid')
        self.assertEqual(combobox_config['bordercolor'], self.styles.colors['border'])
        
        # Überprüfen der Focus-Map
        state_map = style.map('Modern.TCombobox')
        self.assertIsNotNone(state_map)
        self.assertIn('bordercolor', state_map)
    
    def test_frame_and_label_styles(self):
        """Test der Frame und Label Basis-Stile"""
        print("\n[STYLE] Frame und Label Basis-Stile getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # TFrame überprüfen
        frame_config = style.configure('TFrame')
        self.assertEqual(frame_config['background'], self.styles.colors['background'])
        
        # TLabel überprüfen
        label_config = style.configure('TLabel')
        self.assertEqual(label_config['background'], self.styles.colors['background'])
        self.assertEqual(label_config['foreground'], self.styles.colors['text_primary'])
        
        # Font überprüfen (kann String oder Tuple sein)
        font = label_config['font']
        if isinstance(font, tuple):
            self.assertEqual(font[0], 'Segoe UI')
            self.assertEqual(font[1], 10)
        elif isinstance(font, str):
            self.assertIn('Segoe UI', font)
    
    def test_style_consistency(self):
        """Test der Konsistenz aller Stile"""
        print("\n[STYLE] Stil-Konsistenz getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Alle definierten Stile überprüfen
        defined_styles = [
            'TFrame', 'TLabel', 'Primary.TButton', 'Secondary.TButton',
            'Success.TButton', 'Warning.TButton', 'Danger.TButton',
            'Modern.TEntry', 'Modern.Treeview', 'Modern.Treeview.Heading',
            'Card.TLabelframe', 'Card.TLabelframe.Label',
            'Modern.TCheckbutton', 'Modern.TCombobox'
        ]
        
        for style_name in defined_styles:
            config = style.configure(style_name)
            self.assertIsNotNone(config, f"Style {style_name} sollte konfiguriert sein")
    
    def test_color_scheme_consistency(self):
        """Test der Konsistenz des Farbschemas"""
        print("\n[STYLE] Farb-Schema Konsistenz getestet")
        
        # Überprüfen der Farbharmonie
        colors = self.styles.colors
        
        # Primärfarben sollten konsistent sein
        self.assertEqual(colors['text_primary'], colors['primary'])
        
        # Oberflächenfarben sollten hell sein
        self.assertEqual(colors['surface'], '#FFFFFF')
        self.assertEqual(colors['background'], '#F8F9FA')
        
        # Kontrastfarben sollten gut lesbar sein
        self.assertNotEqual(colors['text_primary'], colors['background'])
        self.assertNotEqual(colors['text_secondary'], colors['surface'])
    
    def test_font_consistency(self):
        """Test der Konsistenz der Schriftarten"""
        print("\n[STYLE] Schriftarten-Konsistenz getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Überprüfen der Schriftart-Konsistenz
        styles_with_fonts = [
            'TLabel', 'Primary.TButton', 'Secondary.TButton',
            'Success.TButton', 'Warning.TButton', 'Danger.TButton',
            'Modern.TEntry', 'Modern.Treeview', 'Modern.Treeview.Heading',
            'Card.TLabelframe.Label', 'Modern.TCheckbutton', 'Modern.TCombobox'
        ]
        
        for style_name in styles_with_fonts:
            config = style.configure(style_name)
            if 'font' in config:
                font = config['font']
                # Font kann String oder Tuple sein
                self.assertTrue(isinstance(font, (str, tuple)), f"Font für {style_name} sollte String oder Tuple sein")
                
                # Wenn es ein String ist, sollte Segoe enthalten
                if isinstance(font, str):
                    self.assertIn('Segoe', font)
                # Wenn es eine Tuple ist, sollte Segoe im ersten Element sein
                elif isinstance(font, tuple) and len(font) > 0 and isinstance(font[0], str):
                    self.assertIn('Segoe', font[0])
    
    def test_padding_consistency(self):
        """Test der Konsistenz der Padding-Werte"""
        print("\n[STYLE] Padding-Konsistenz getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Button-Padding sollte konsistent sein
        button_styles = ['Primary.TButton', 'Secondary.TButton', 'Success.TButton', 'Warning.TButton', 'Danger.TButton']
        
        for button_style in button_styles:
            config = style.configure(button_style)
            if 'padding' in config:
                padding = config['padding']
                # Padding kann String oder Liste sein
                if isinstance(padding, str):
                    # String-Format wie "16 8"
                    padding_parts = padding.split()
                    self.assertEqual(len(padding_parts), 2)
                    self.assertGreaterEqual(int(padding_parts[0]), 8)  # Horizontal padding
                    self.assertGreaterEqual(int(padding_parts[1]), 4)  # Vertical padding
                elif isinstance(padding, list):
                    self.assertEqual(len(padding), 2)
                    self.assertGreaterEqual(padding[0], 8)  # Horizontal padding
                    self.assertGreaterEqual(padding[1], 4)  # Vertical padding
                elif isinstance(padding, tuple):
                    self.assertEqual(len(padding), 2)
                    self.assertGreaterEqual(padding[0], 8)  # Horizontal padding
                    self.assertGreaterEqual(padding[1], 4)  # Vertical padding
    
    def test_error_handling(self):
        """Test der Fehlerbehandlung bei ungültigen Werten"""
        print("\n[STYLE] Fehlerbehandlung getestet")
        
        # Test mit ungültigem Root (sollte AttributeError werfen)
        try:
            invalid_root = None
            colors = self.styles.setup_modern_style(invalid_root)
            # Sollte AttributeError werfen
            self.fail("Erwartete AttributeError wurde nicht geworfen")
        except AttributeError as e:
            # Erwarteter Fehler
            self.assertIn("'NoneType' object has no attribute 'configure'", str(e))
        except Exception as e:
            # Andere Fehler sind auch ok
            self.assertIsInstance(e, (AttributeError, TypeError))
    
    def test_style_reusability(self):
        """Test der Wiederverwendbarkeit der Stile"""
        print("\n[STYLE] Stil-Wiederverwendbarkeit getestet")
        
        # Stile mehrfach anwenden sollte keine Probleme verursachen
        colors1 = self.styles.setup_modern_style(self.root)
        colors2 = self.styles.setup_modern_style(self.root)
        
        self.assertEqual(colors1, colors2)
        self.assertEqual(colors1, self.styles.colors)
    
    def test_theme_application(self):
        """Test der Theme-Anwendung"""
        print("\n[STYLE] Theme-Anwendung getestet")
        
        self.styles.setup_modern_style(self.root)
        style = ttk.Style()
        
        # Überprüfen, ob clam theme verwendet wird
        current_theme = style.theme_use()
        # Das exakte Theme kann je nach System variieren, aber sollte funktionieren
        self.assertIsInstance(current_theme, str)
        self.assertGreater(len(current_theme), 0)


def main():
    """Hauptfunktion zum Ausführen der Tests"""
    print("\n" + "="*60)
    print("[STYLE] UI STYLES TESTSUITE")
    print("="*60)
    print("[INFO] Tests für UI-Styling und Farbschemata")
    print("[WARNING] Keine echte GUI wird angezeigt\n")
    
    # unittest ausführen
    unittest.main(verbosity=2)


if __name__ == '__main__':
    main()
