#!/usr/bin/env python3
"""
Test script to verify that antigüedad is displayed in the salary table
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'production'))

import unittest
from unittest.mock import Mock, patch
import tkinter as tk
import tkinter.ttk as ttk
from ui_components import EmployeeTabComponents

class TestAntiguedadDisplay(unittest.TestCase):
    """Test that antigüedad is properly displayed in salary table"""
    
    def setUp(self):
        """Set up test environment"""
        self.root = tk.Tk()
        self.root.withdraw()  # Hide the window
        
        # Mock database manager
        self.db_mock = Mock()
        
        # Mock colors
        self.colors = {
            'primary': '#007acc',
            'text_secondary': '#666666',
            'text_tertiary': '#999999',
            'success': '#28a745'
        }
        
        # Create components
        self.components = EmployeeTabComponents(self.root, self.db_mock, self.colors)
        
    def tearDown(self):
        """Clean up test environment"""
        self.root.destroy()
    
    def test_salary_tree_has_antiguedad_column(self):
        """Test that the salary tree has the antigüedad column"""
        # Create notebook
        notebook = ttk.Notebook(self.root)
        
        # Setup gehaelter tab
        gehaelter_frame = self.components.setup_gehaelter_tab(notebook)
        
        # Check that antigüedad column exists
        columns = self.components.salary_tree['columns']
        self.assertIn('Antigüedad', columns)
        
        # Check that the heading is set
        heading_text = self.components.salary_tree.heading('Antigüedad', 'text')
        self.assertEqual(heading_text, 'Antigüedad')
        
        # Check that column width is configured
        width = self.components.salary_tree.column('Antigüedad', 'width')
        self.assertEqual(width, 100)
    
    def test_salary_data_includes_antiguedad(self):
        """Test that salary data includes antigüedad when inserted"""
        # Mock salary data
        salary_data = {
            'anio': 2024,
            'modalidad': 12,
            'salario_anual_bruto': 50000.0,
            'salario_mensual_bruto': 4166.67,
            'atrasos': 100.0,
            'salario_mensual_con_atrasos': 4066.67,
            'antiguedad': 150.0
        }
        
        # Create notebook and setup tab
        notebook = ttk.Notebook(self.root)
        self.components.setup_gehaelter_tab(notebook)
        
        # Insert salary data (simulating what the main UI does)
        self.components.salary_tree.insert('', tk.END, values=(
            salary_data['anio'],
            salary_data['modalidad'],
            f"{salary_data['salario_anual_bruto']:.2f} €",
            f"{salary_data['salario_mensual_bruto']:.2f} €",
            f"{salary_data.get('atrasos', 0):.2f} €",
            f"{salary_data.get('salario_mensual_con_atrasos', salary_data['salario_mensual_bruto']):.2f} €",
            f"{salary_data.get('antiguedad', 0):.2f} €"
        ))
        
        # Check that the data was inserted correctly
        children = self.components.salary_tree.get_children()
        self.assertEqual(len(children), 1)
        
        # Get the inserted values
        values = self.components.salary_tree.item(children[0])['values']
        self.assertEqual(len(values), 7)  # Should have 7 columns including antigüedad
        self.assertEqual(values[6], "150.00 €")  # Antigüedad should be the 7th column (index 6)

if __name__ == '__main__':
    unittest.main()
