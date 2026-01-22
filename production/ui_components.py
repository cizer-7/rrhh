"""
UI Components module for Employee Management System
Contains individual tab components and widgets
"""

import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
import logging


class EmployeeTabComponents:
    """Contains all tab components for employee management"""
    
    def __init__(self, parent, db_manager, colors):
        self.parent = parent
        self.db = db_manager
        self.colors = colors
        self.edit_mode = {
            'stammdaten': False,
            'gehaelter': False,
            'ingresos': False,
            'deducciones': False
        }
        
        # Initialize sorting state for salary tree
        self.salary_sort_column = None
        self.salary_sort_reverse = False
        
        # Initialize sorting state for history tree
        self.historie_sort_column = None
        self.historie_sort_reverse = False
    
    def setup_stammdaten_tab(self, notebook):
        """Setup for the master data tab"""
        stammdaten_frame = ttk.Frame(notebook, padding="24")
        notebook.add(stammdaten_frame, text="👤 Stammdaten")
        
        # Edit button with modern design
        button_frame = ttk.Frame(stammdaten_frame)
        button_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        self.stammdaten_edit_btn = ttk.Button(button_frame, text="✏️ Stammdaten bearbeiten", 
                                               style='Material.TButton',
                                               command=lambda: self.toggle_edit_mode('stammdaten'))
        self.stammdaten_edit_btn.grid(row=0, column=0, padx=(0, 12))
        
        self.stammdaten_save_btn = ttk.Button(button_frame, text="💾 Änderungen speichern", 
                                            style='Success.TButton',
                                            state='disabled',
                                            command=lambda: self.parent_ui.save_changes() if hasattr(self, 'parent_ui') else None)
        self.stammdaten_save_btn.grid(row=0, column=1, padx=(0, 12))
        
        self.stammdaten_status = ttk.Label(button_frame, text="🔒 (Nur Lesen)", 
                                          font=('Segoe UI', 10, 'bold'),
                                          foreground=self.colors['text_tertiary'])
        self.stammdaten_status.grid(row=0, column=2)
        
        # Input fields for master data
        fields = [
            ("ID:", "id_empleado"),
            ("Vorname:", "nombre"),
            ("Nachname:", "apellido"),
            ("CECO:", "ceco"),
            ("Aktiv:", "activo")
        ]
        
        self.stammdaten_vars = {}
        self.stammdaten_widgets = {}  # Store widget references
        
        for i, (label, field) in enumerate(fields):
            row = i + 1
            ttk.Label(stammdaten_frame, text=label, font=('Segoe UI', 11), 
                      foreground=self.colors['text_secondary']).grid(row=row, column=0, sticky=tk.W, pady=8, padx=(0, 16))
            if field == "id_empleado":
                var = tk.StringVar()
                entry = ttk.Entry(stammdaten_frame, textvariable=var, state='readonly', style='Modern.TEntry')
            elif field == "activo":
                var = tk.BooleanVar()
                entry = ttk.Checkbutton(stammdaten_frame, variable=var, state='disabled', style='Modern.TCheckbutton')
            else:
                var = tk.StringVar()
                entry = ttk.Entry(stammdaten_frame, textvariable=var, state='readonly', style='Modern.TEntry')
            
            entry.grid(row=row, column=1, sticky=(tk.W, tk.E), pady=5, padx=5)
            self.stammdaten_vars[field] = var
            self.stammdaten_widgets[field] = entry  # Store widget
        
        stammdaten_frame.columnconfigure(1, weight=1)
        return stammdaten_frame
    
    def setup_gehaelter_tab(self, notebook):
        """Setup for the salaries tab"""
        gehaelter_frame = ttk.Frame(notebook, padding="24")
        notebook.add(gehaelter_frame, text="💰 Gehälter")
        
        # Edit buttons with modern design
        button_frame = ttk.Frame(gehaelter_frame)
        button_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        self.gehaelter_edit_btn = ttk.Button(button_frame, text="✏️ Gehälter bearbeiten", 
                                            style='Material.TButton',
                                            command=lambda: self.toggle_edit_mode('gehaelter'))
        self.gehaelter_edit_btn.grid(row=0, column=0, padx=(0, 12))
        
        self.gehaelter_save_btn = ttk.Button(button_frame, text="💾 Änderungen speichern", 
                                            style='Success.TButton',
                                            state='disabled',
                                            command=lambda: self.parent_ui.save_changes() if hasattr(self, 'parent_ui') else None)
        self.gehaelter_save_btn.grid(row=0, column=1, padx=(0, 12))
        
        self.add_gehalt_btn = ttk.Button(button_frame, text="➕ Neues Gehalt", 
                                        style='Success.TButton')
        self.add_gehalt_btn.grid(row=0, column=2, padx=(0, 12))
        
        self.delete_gehalt_btn = ttk.Button(button_frame, text="🗑️ Gehalt löschen", 
                                           style='Danger.TButton',
                                           state='disabled')
        self.delete_gehalt_btn.grid(row=0, column=3, padx=(0, 12))
        
        self.gehaelter_status = ttk.Label(button_frame, text="🔒 (Nur Lesen)", 
                                         font=('Segoe UI', 10, 'bold'),
                                         foreground=self.colors['text_tertiary'])
        self.gehaelter_status.grid(row=0, column=4)
        
        # Salary overview
        ttk.Label(gehaelter_frame, text="Gehaltsdaten pro Jahr:", 
                  font=('Segoe UI', 12, 'bold'),
                  foreground=self.colors['text_secondary']).grid(row=1, column=0, sticky=tk.W, pady=(0, 12))
        
        # Treeview with horizontal scrollbars
        tree_frame = ttk.Frame(gehaelter_frame)
        tree_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=5)
        
        self.salary_tree = ttk.Treeview(tree_frame, columns=('Jahr', 'Modalität', 'Jahresgehalt', 'Monatsgehalt', 'Atrasos', 'Monatsgehalt m. Atrasos', 'Antigüedad'), show='headings', height=6)
        self.salary_tree.heading('Jahr', text='Jahr', command=lambda: self.sort_salaries('Jahr'))
        self.salary_tree.heading('Modalität', text='Modalität', command=lambda: self.sort_salaries('Modalität'))
        self.salary_tree.heading('Jahresgehalt', text='Jahresgehalt', command=lambda: self.sort_salaries('Jahresgehalt'))
        self.salary_tree.heading('Monatsgehalt', text='Monatsgehalt', command=lambda: self.sort_salaries('Monatsgehalt'))
        self.salary_tree.heading('Atrasos', text='Atrasos', command=lambda: self.sort_salaries('Atrasos'))
        self.salary_tree.heading('Monatsgehalt m. Atrasos', text='Monatsgehalt m. Atrasos', command=lambda: self.sort_salaries('Monatsgehalt m. Atrasos'))
        self.salary_tree.heading('Antigüedad', text='Antigüedad', command=lambda: self.sort_salaries('Antigüedad'))
        
        # Configure column widths
        self.salary_tree.column('Jahr', width=60)
        self.salary_tree.column('Modalität', width=80)
        self.salary_tree.column('Jahresgehalt', width=120)
        self.salary_tree.column('Monatsgehalt', width=120)
        self.salary_tree.column('Atrasos', width=100)
        self.salary_tree.column('Monatsgehalt m. Atrasos', width=150)
        self.salary_tree.column('Antigüedad', width=100)
        
        # Vertical scrollbar
        v_scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.salary_tree.yview)
        v_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.salary_tree.configure(yscrollcommand=v_scrollbar.set)
        
        # Horizontal scrollbar
        h_scrollbar = ttk.Scrollbar(tree_frame, orient=tk.HORIZONTAL, command=self.salary_tree.xview)
        h_scrollbar.grid(row=1, column=0, sticky=(tk.W, tk.E))
        self.salary_tree.configure(xscrollcommand=h_scrollbar.set)
        
        # Place treeview
        self.salary_tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure frame for scrollbars
        tree_frame.rowconfigure(0, weight=1)
        tree_frame.columnconfigure(0, weight=1)
        
        # Edit fields with modern design
        edit_frame = ttk.LabelFrame(gehaelter_frame, text="Gehalt bearbeiten", 
                                   style='Card.TLabelframe', padding="20")
        edit_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=20)
        
        self.salary_vars = {}
        fields = [
            ("Jahr:", "anio"),
            ("Modalität (12/14):", "modalidad"),
            ("Jahresgehalt (brutto):", "salario_anual_bruto"),
            ("Antigüedad:", "antiguedad")
        ]
        
        self.salary_vars = {}
        self.salary_widgets = {}  # Store widget references
        
        for i, (label, field) in enumerate(fields):
            ttk.Label(edit_frame, text=label).grid(row=i, column=0, sticky=tk.W, pady=5, padx=5)
            var = tk.StringVar()
            entry = ttk.Entry(edit_frame, textvariable=var, state='readonly')
            entry.grid(row=i, column=1, sticky=(tk.W, tk.E), pady=5, padx=5)
            self.salary_vars[field] = var
            self.salary_widgets[field] = entry  # Store widget
        
        edit_frame.columnconfigure(1, weight=1)
        gehaelter_frame.columnconfigure(0, weight=1)
        return gehaelter_frame
    
    def setup_ingresos_tab(self, notebook):
        """Setup for the gross income tab"""
        ingresos_frame = ttk.Frame(notebook, padding="24")
        notebook.add(ingresos_frame, text="💶 Bruttoeinkünfte")
        
        # Edit button
        button_frame = ttk.Frame(ingresos_frame)
        button_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        self.ingresos_edit_btn = ttk.Button(button_frame, text="✏️ Bruttoeinkünfte bearbeiten", 
                                            style='Material.TButton',
                                            command=lambda: self.toggle_edit_mode('ingresos'))
        self.ingresos_edit_btn.grid(row=0, column=0, padx=(0, 12))
        
        self.ingresos_save_btn = ttk.Button(button_frame, text="💾 Änderungen speichern", 
                                           style='Success.TButton',
                                           state='disabled',
                                           command=lambda: self.parent_ui.save_changes() if hasattr(self, 'parent_ui') else None)
        self.ingresos_save_btn.grid(row=0, column=1, padx=(0, 12))
        
        self.ingresos_status = ttk.Label(button_frame, text="🔒 (Nur Lesen)", 
                                        font=('Segoe UI', 10, 'bold'),
                                        foreground=self.colors['text_tertiary'])
        self.ingresos_status.grid(row=0, column=2)
        
        # Year selection
        year_frame = ttk.Frame(ingresos_frame)
        year_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        ttk.Label(year_frame, text="Jahr:", font=('Segoe UI', 11), 
                  foreground=self.colors['text_secondary']).grid(row=0, column=0, padx=(0, 12))
        
        self.ingresos_vars = {}
        self.ingresos_widgets = {}  # Store widget references
        
        # Year dropdown with current and last years
        current_year = datetime.now().year
        years = [current_year, current_year - 1, current_year - 2]
        self.ingresos_year_var = tk.StringVar(value=str(current_year))
        year_combo = ttk.Combobox(year_frame, textvariable=self.ingresos_year_var, 
                                 values=years, state='readonly', width=10)
        year_combo.grid(row=0, column=1, padx=(0, 12))
        year_combo.bind('<<ComboboxSelected>>', lambda e: self.on_year_change('ingresos'))
        
        ttk.Label(year_frame, text="(Bruttoeinkünfte sind jahresabhängig)", 
                 font=('Segoe UI', 9),
                 foreground=self.colors['text_tertiary']).grid(row=0, column=2)
        
        # Fields for gross income
        fields = [
            ("Ticket Restaurant:", "ticket_restaurant"),
            ("Primas:", "primas"),
            ("Dietas Cotizables:", "dietas_cotizables"),
            ("Stunden Überstunden:", "horas_extras"),
            ("Tage Steuerfrei:", "dias_exentos"),
            ("Dietas Steuerfrei:", "dietas_exentas"),
            ("Sicherheitspension:", "seguro_pensiones"),
            ("Auto Wäsche:", "lavado_coche")
        ]
        
        for i, (label, field) in enumerate(fields):
            row = i + 2
            ttk.Label(ingresos_frame, text=label, font=('Segoe UI', 11), 
                      foreground=self.colors['text_secondary']).grid(row=row, column=0, sticky=tk.W, pady=6, padx=(0, 16))
            var = tk.StringVar()
            entry = ttk.Entry(ingresos_frame, textvariable=var, state='readonly')
            entry.grid(row=row, column=1, sticky=(tk.W, tk.E), pady=6, padx=5)
            self.ingresos_vars[field] = var
            self.ingresos_widgets[field] = entry  # Store widget
        
        ingresos_frame.columnconfigure(1, weight=1)
        return ingresos_frame
    
    def setup_deducciones_tab(self, notebook):
        """Setup for the deductions tab"""
        deducciones_frame = ttk.Frame(notebook, padding="24")
        notebook.add(deducciones_frame, text="🛡️ Abzüge")
        
        # Edit button
        button_frame = ttk.Frame(deducciones_frame)
        button_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        self.deducciones_edit_btn = ttk.Button(button_frame, text="✏️ Abzüge bearbeiten", 
                                               style='Material.TButton',
                                               command=lambda: self.toggle_edit_mode('deducciones'))
        self.deducciones_edit_btn.grid(row=0, column=0, padx=(0, 12))
        
        self.deducciones_save_btn = ttk.Button(button_frame, text="💾 Änderungen speichern", 
                                              style='Success.TButton',
                                              state='disabled',
                                              command=lambda: self.parent_ui.save_changes() if hasattr(self, 'parent_ui') else None)
        self.deducciones_save_btn.grid(row=0, column=1, padx=(0, 12))
        
        self.deducciones_status = ttk.Label(button_frame, text="🔒 (Nur Lesen)", 
                                          font=('Segoe UI', 10, 'bold'),
                                          foreground=self.colors['text_tertiary'])
        self.deducciones_status.grid(row=0, column=2)
        
        # Year selection
        year_frame = ttk.Frame(deducciones_frame)
        year_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        ttk.Label(year_frame, text="Jahr:", font=('Segoe UI', 11), 
                  foreground=self.colors['text_secondary']).grid(row=0, column=0, padx=(0, 12))
        
        self.deducciones_vars = {}
        self.deducciones_widgets = {}  # Store widget references
        
        # Year dropdown with current and last years
        current_year = datetime.now().year
        years = [current_year, current_year - 1, current_year - 2]
        self.deducciones_year_var = tk.StringVar(value=str(current_year))
        year_combo = ttk.Combobox(year_frame, textvariable=self.deducciones_year_var, 
                                 values=years, state='readonly', width=10)
        year_combo.grid(row=0, column=1, padx=(0, 12))
        year_combo.bind('<<ComboboxSelected>>', lambda e: self.on_year_change('deducciones'))
        
        ttk.Label(year_frame, text="(Abzüge sind jahresabhängig)", 
                 font=('Segoe UI', 9),
                 foreground=self.colors['text_tertiary']).grid(row=0, column=2)
        
        # Fields for deductions
        fields = [
            ("Unfallversicherung:", "seguro_accidentes"),
            ("Adelas:", "adelas"),
            ("Sanitas:", "sanitas"),
            ("Benzin Arval:", "gasolina_arval"),
            ("Cotización Especie:", "cotizacion_especie")
        ]
        
        for i, (label, field) in enumerate(fields):
            row = i + 2
            ttk.Label(deducciones_frame, text=label, font=('Segoe UI', 11), 
                      foreground=self.colors['text_secondary']).grid(row=row, column=0, sticky=tk.W, pady=6, padx=(0, 16))
            var = tk.StringVar()
            entry = ttk.Entry(deducciones_frame, textvariable=var, state='readonly')
            entry.grid(row=row, column=1, sticky=(tk.W, tk.E), pady=6, padx=5)
            self.deducciones_vars[field] = var
            self.deducciones_widgets[field] = entry  # Store widget
        
        deducciones_frame.columnconfigure(1, weight=1)
        return deducciones_frame
    
    def setup_historie_tab(self, notebook):
        """Setup for the history tab with year-dependent changes"""
        historie_frame = ttk.Frame(notebook, padding="24")
        notebook.add(historie_frame, text="📊 Historie")
        
        # Header with employee selection and search
        header_frame = ttk.Frame(historie_frame)
        header_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        # Employee selection
        selection_frame = ttk.Frame(header_frame)
        selection_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 12))
        
        ttk.Label(selection_frame, text="Mitarbeiter:", font=('Segoe UI', 11, 'bold'),
                  foreground=self.colors['text_secondary']).grid(row=0, column=0, padx=(0, 12))
        
        self.historie_employee_var = tk.StringVar()
        self.historie_employee_combo = ttk.Combobox(selection_frame, textvariable=self.historie_employee_var,
                                                   style='Modern.TCombobox', width=30)
        self.historie_employee_combo.grid(row=0, column=1, padx=(0, 12))
        
        # Search field
        search_frame = ttk.Frame(header_frame)
        search_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E))
        
        ttk.Label(search_frame, text="Suche:", font=('Segoe UI', 11, 'bold'),
                  foreground=self.colors['text_secondary']).grid(row=0, column=0, padx=(0, 12))
        
        self.historie_search_var = tk.StringVar()
        self.historie_search_entry = ttk.Entry(search_frame, textvariable=self.historie_search_var,
                                            style='Modern.TEntry', width=30)
        self.historie_search_entry.grid(row=0, column=1, padx=(0, 12))
        
        # Search button
        ttk.Button(search_frame, text="🔍 Suchen", style='Secondary.TButton',
                  command=self.search_historie_employees).grid(row=0, column=2, padx=(0, 12))
        
        # Show all button
        ttk.Button(search_frame, text="👥 Suche zurücksetzen", style='Secondary.TButton',
                  command=self.show_all_historie_employees).grid(row=0, column=3)
        
        # Load employees
        self.load_historie_employees()
        self.historie_employee_combo.bind('<<ComboboxSelected>>', self.on_historie_employee_select)
        self.historie_search_entry.bind('<KeyRelease>', self.on_historie_search_key)
        
        # History view with horizontal scrollbars
        historie_tree_frame = ttk.Frame(historie_frame)
        historie_tree_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 20))
        
        self.historie_tree = ttk.Treeview(historie_tree_frame, 
                                         columns=('Datum', 'Typ', 'Jahr', 'Beschreibung', 'Wert'),
                                         show='headings', height=20, style='Modern.Treeview')
        
        # Configure columns
        self.historie_tree.heading('Datum', text='Datum')
        self.historie_tree.heading('Typ', text='Typ')
        self.historie_tree.heading('Jahr', text='Jahr', command=lambda: self.sort_historie('Jahr'))
        self.historie_tree.heading('Beschreibung', text='Beschreibung')
        self.historie_tree.heading('Wert', text='Wert')
        
        self.historie_tree.column('Datum', width=120)
        self.historie_tree.column('Typ', width=100)
        self.historie_tree.column('Jahr', width=80)
        self.historie_tree.column('Beschreibung', width=150)
        self.historie_tree.column('Wert', width=120)
        
        # Vertical scrollbar
        historie_v_scrollbar = ttk.Scrollbar(historie_tree_frame, orient=tk.VERTICAL, command=self.historie_tree.yview)
        historie_v_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.historie_tree.configure(yscrollcommand=historie_v_scrollbar.set)
        
        # Horizontal scrollbar
        historie_h_scrollbar = ttk.Scrollbar(historie_tree_frame, orient=tk.HORIZONTAL, command=self.historie_tree.xview)
        historie_h_scrollbar.grid(row=1, column=0, sticky=(tk.W, tk.E))
        self.historie_tree.configure(xscrollcommand=historie_h_scrollbar.set)
        
        # Place treeview
        self.historie_tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure frame for scrollbars
        historie_tree_frame.rowconfigure(0, weight=1)
        historie_tree_frame.columnconfigure(0, weight=1)
        
        # Filter options
        filter_frame = ttk.Frame(historie_frame)
        filter_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(20, 0))
        
        ttk.Label(filter_frame, text="Filter:", font=('Segoe UI', 11, 'bold'),
                  foreground=self.colors['text_secondary']).grid(row=0, column=0, padx=(0, 12))
        
        self.historie_filter_var = tk.StringVar(value="Alle")
        filter_combo = ttk.Combobox(filter_frame, textvariable=self.historie_filter_var,
                                      values=["Alle", "Bruttoeinkünfte", "Abzüge", "Gehaelter"],
                                      style='Modern.TCombobox', width=20)
        filter_combo.grid(row=0, column=1, padx=(0, 12))
        filter_combo.bind('<<ComboboxSelected>>', lambda e: self.on_historie_filter_change(e))
        
        # Buttons
        button_frame = ttk.Frame(historie_frame)
        button_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(20, 0))
        
        ttk.Button(button_frame, text="🔄 Aktualisieren", style='Secondary.TButton',
                  command=self.load_historie).grid(row=0, column=0, padx=(0, 12))
        ttk.Button(button_frame, text="🗑️ Historie leeren", style='Danger.TButton',
                  command=self.clear_historie).grid(row=0, column=1, padx=(12, 0))
        
        historie_frame.columnconfigure(0, weight=1)
        historie_frame.rowconfigure(1, weight=1)
        return historie_frame
    
    def toggle_edit_mode(self, section):
        """Toggle edit mode for a specific section"""
        if self.edit_mode[section]:
            # End edit mode
            self.edit_mode[section] = False
            self.set_fields_readonly(section, True)
            self.update_status_labels(section, "(Nur Lesen)")
            
            # Disable save button for stammdaten and gehaelter
            if section == 'stammdaten':
                self.stammdaten_save_btn.config(state='disabled')
            elif section == 'gehaelter':
                self.gehaelter_save_btn.config(state='disabled')
            elif section == 'ingresos':
                self.ingresos_save_btn.config(state='disabled')
            elif section == 'deducciones':
                self.deducciones_save_btn.config(state='disabled')
        else:
            # Confirmation before editing
            section_names = {
                'stammdaten': 'Stammdaten',
                'gehaelter': 'Gehälter',
                'ingresos': 'Bruttoeinkünfte',
                'deducciones': 'Abzüge'
            }
            
            result = messagebox.askyesno(
                "Bearbeitung bestätigen", 
                f"Möchten Sie die {section_names[section]} wirklich bearbeiten?\n\n"
                "Klicken Sie 'Ja' um den Bearbeitungsmodus zu aktivieren."
            )
            
            if result:
                self.edit_mode[section] = True
                self.set_fields_readonly(section, False)
                self.update_status_labels(section, "(Bearbeitungsmodus)")
                
                # Enable save button for stammdaten and gehaelter
                if section == 'stammdaten':
                    self.stammdaten_save_btn.config(state='normal')
                elif section == 'gehaelter':
                    self.gehaelter_save_btn.config(state='normal')
                elif section == 'ingresos':
                    self.ingresos_save_btn.config(state='normal')
                elif section == 'deducciones':
                    self.deducciones_save_btn.config(state='normal')
                
                # Disable other edit modes
                for other_section in self.edit_mode:
                    if other_section != section and self.edit_mode[other_section]:
                        self.toggle_edit_mode(other_section)
    
    def set_fields_readonly(self, section, readonly):
        """Set fields of a section to readonly or editable"""
        state = 'readonly' if readonly else 'normal'
        check_state = 'disabled' if readonly else 'normal'
        
        if section == 'stammdaten':
            for field, widget in self.stammdaten_widgets.items():
                if field != 'id_empleado':  # ID stays readonly
                    if isinstance(widget, ttk.Checkbutton):
                        widget.configure(state=check_state)
                    else:
                        widget.configure(state=state)
        elif section == 'gehaelter':
            for widget in self.salary_widgets.values():
                widget.configure(state=state)
        elif section == 'ingresos':
            for widget in self.ingresos_widgets.values():
                widget.configure(state=state)
        elif section == 'deducciones':
            for widget in self.deducciones_widgets.values():
                widget.configure(state=state)
    
    def update_status_labels(self, section, text):
        """Update status labels"""
        if section == 'stammdaten':
            self.stammdaten_status.config(text=text)
            if text == "(Bearbeitungsmodus)":
                self.stammdaten_status.config(text="✅ (Bearbeitungsmodus)", foreground=self.colors['success'])
            else:
                self.stammdaten_status.config(text="🔒 (Nur Lesen)", foreground=self.colors['text_tertiary'])
        elif section == 'gehaelter':
            self.gehaelter_status.config(text=text)
            if text == "(Bearbeitungsmodus)":
                self.gehaelter_status.config(text="✅ (Bearbeitungsmodus)", foreground=self.colors['success'])
            else:
                self.gehaelter_status.config(text="🔒 (Nur Lesen)", foreground=self.colors['text_tertiary'])
        elif section == 'ingresos':
            self.ingresos_status.config(text=text)
            if text == "(Bearbeitungsmodus)":
                self.ingresos_status.config(text="✅ (Bearbeitungsmodus)", foreground=self.colors['success'])
            else:
                self.ingresos_status.config(text="🔒 (Nur Lesen)", foreground=self.colors['text_tertiary'])
        elif section == 'deducciones':
            self.deducciones_status.config(text=text)
            if text == "(Bearbeitungsmodus)":
                self.deducciones_status.config(text="✅ (Bearbeitungsmodus)", foreground=self.colors['success'])
            else:
                self.deducciones_status.config(text="🔒 (Nur Lesen)", foreground=self.colors['text_tertiary'])
    
    def on_year_change(self, section):
        """Called when year is changed in ingresos or deducciones"""
        # This will be implemented in the main class
        pass
    
    def add_new_salary(self):
        """Add new salary data for current employee"""
        # This will be implemented in the main class
        pass
    
    def load_historie_employees(self):
        """Load all employees into history selection"""
        try:
            # Check if history widgets exist
            if not hasattr(self, 'historie_employee_combo'):
                return
                
            employees = self.db.get_all_employees()
            employee_list = []
            
            # Store all employees for search
            self.all_historie_employees = employees
            
            for emp in employees:
                display_name = f"{emp['apellido']}, {emp['nombre']} (ID: {emp['id_empleado']})"
                employee_list.append(display_name)
            
            self.historie_employee_combo['values'] = employee_list
            if employee_list:
                self.historie_employee_combo.set(employee_list[0])
                self.on_historie_employee_select(None)
                
        except Exception as e:
            logging.error(f"Fehler beim Laden der Mitarbeiter für Historie: {e}")
    
    def search_historie_employees(self):
        """Search employees based on search text"""
        try:
            search_text = self.historie_search_var.get().strip().lower()
            
            if not search_text:
                self.show_all_historie_employees()
                return
            
            # Filter employees
            filtered_employees = []
            for emp in self.all_historie_employees:
                # Search in name, surname and ID
                name_match = search_text in emp['nombre'].lower()
                surname_match = search_text in emp['apellido'].lower()
                id_match = search_text in str(emp['id_empleado'])
                ceco_match = emp['ceco'] and search_text in emp['ceco'].lower()
                
                if name_match or surname_match or id_match or ceco_match:
                    display_name = f"{emp['apellido']}, {emp['nombre']} (ID: {emp['id_empleado']})"
                    filtered_employees.append(display_name)
            
            # Update dropdown
            self.historie_employee_combo['values'] = filtered_employees
            
            # If exactly one result found, auto-select
            if len(filtered_employees) == 1:
                self.historie_employee_combo.set(filtered_employees[0])
                self.on_historie_employee_select(None)
            elif len(filtered_employees) == 0:
                self.historie_employee_combo.set("")
                # Clear history
                if hasattr(self, 'historie_tree'):
                    for item in self.historie_tree.get_children():
                        self.historie_tree.delete(item)
                        
        except Exception as e:
            logging.error(f"Fehler bei der Mitarbeitersuche: {e}")
    
    def on_historie_search_key(self, event):
        """Called on every key release in search field"""
        # Auto search on input
        self.search_historie_employees()
    
    def show_all_historie_employees(self):
        """Show all employees in dropdown list"""
        try:
            # Clear search field
            self.historie_search_var.set("")
            
            # Show all employees
            employee_list = []
            for emp in self.all_historie_employees:
                display_name = f"{emp['apellido']}, {emp['nombre']} (ID: {emp['id_empleado']})"
                employee_list.append(display_name)
            
            self.historie_employee_combo['values'] = employee_list
            
            # Select first employee
            if employee_list:
                self.historie_employee_combo.set(employee_list[0])
                self.on_historie_employee_select(None)
                
        except Exception as e:
            logging.error(f"Fehler beim Anzeigen aller Mitarbeiter: {e}")
    
    def on_historie_employee_select(self, event):
        """Called when employee is selected in history"""
        if hasattr(self, 'historie_tree'):
            self.load_historie()
    
    def load_historie(self):
        """Load history for selected employee"""
        # This will be implemented in the main class
        pass
    
    def on_historie_filter_change(self, event):
        """Filter history based on selected type"""
        # This will be implemented in the main class
        pass
    
    def clear_historie(self):
        """Clear history view"""
        try:
            # Check if history widgets exist
            if not hasattr(self, 'historie_tree'):
                return
                
            result = messagebox.askyesno(
                "Historie leeren",
                "Möchten Sie die gesamte Historie wirklich leeren?\n\n"
                "Diese Aktion kann nicht rückgängig gemacht werden!",
                icon='warning'
            )
            
            if result:
                # In a real application, you would clear the database here
                # Here we just show a message and clear the display
                for item in self.historie_tree.get_children():
                    self.historie_tree.delete(item)
                
                messagebox.showinfo("Historie geleert", "Die Historie-Ansicht wurde geleert.")
                
        except Exception as e:
            logging.error(f"Fehler beim Leeren der Historie: {e}")
    
    def sort_historie(self, column):
        """Sort history by clicked column"""
        # Toggle sort direction if same column, otherwise start with ascending
        if self.historie_sort_column == column:
            self.historie_sort_reverse = not self.historie_sort_reverse
        else:
            self.historie_sort_column = column
            self.historie_sort_reverse = False
        
        # Get all items from treeview
        items = [(self.historie_tree.item(item)['values'], item) for item in self.historie_tree.get_children()]
        
        # Determine sort key based on column
        column_index = {'Datum': 0, 'Typ': 1, 'Jahr': 2, 'Beschreibung': 3, 'Wert': 4}[column]
        
        # Sort items
        def sort_key(item):
            values, _ = item
            value = values[column_index]
            
            # Handle different data types
            if column == 'Jahr':
                return int(value) if value is not None and value != '' and str(value).isdigit() else 0
            elif column == 'Wert':
                # For monetary values, remove currency symbols and convert to float
                if isinstance(value, str) and '€' in value:
                    value = value.replace('€', '').strip().replace('.', '').replace(',', '.')
                try:
                    return float(value) if value is not None and value != '' else 0.0
                except (ValueError, TypeError):
                    return 0.0
            else:
                return str(value).lower()
        
        items.sort(key=sort_key, reverse=self.historie_sort_reverse)
        
        # Update treeview with sorted items
        for index, (values, item) in enumerate(items):
            self.historie_tree.move(item, '', index)
        
        # Update column headers to show sort direction
        columns = ['Datum', 'Typ', 'Jahr', 'Beschreibung', 'Wert']
        for col in columns:
            if col == column:
                direction = " ↓" if self.historie_sort_reverse else " ↑"
                self.historie_tree.heading(col, text=col + direction)
            else:
                self.historie_tree.heading(col, text=col)
    
    def sort_salaries(self, column):
        """Sort salaries by clicked column"""
        # Toggle sort direction if same column, otherwise start with ascending
        if self.salary_sort_column == column:
            self.salary_sort_reverse = not self.salary_sort_reverse
        else:
            self.salary_sort_column = column
            self.salary_sort_reverse = False
        
        # Get all items from treeview
        items = [(self.salary_tree.item(item)['values'], item) for item in self.salary_tree.get_children()]
        
        # Determine sort key based on column
        column_index = {
            'Jahr': 0, 'Modalität': 1, 'Jahresgehalt': 2, 'Monatsgehalt': 3, 
            'Atrasos': 4, 'Monatsgehalt m. Atrasos': 5, 'Antigüedad': 6
        }[column]
        
        # Sort items
        def sort_key(item):
            values, _ = item
            value = values[column_index]
            
            # Handle different data types
            if column in ['Jahr', 'Modalität']:
                return int(value) if value is not None and value != '' else 0
            else:
                # For monetary values, remove currency symbols and convert to float
                if isinstance(value, str) and '€' in value:
                    value = value.replace('€', '').strip().replace('.', '').replace(',', '.')
                try:
                    return float(value) if value is not None and value != '' else 0.0
                except (ValueError, TypeError):
                    return 0.0
        
        items.sort(key=sort_key, reverse=self.salary_sort_reverse)
        
        # Update treeview with sorted items
        for index, (values, item) in enumerate(items):
            self.salary_tree.move(item, '', index)
        
        # Update column headers to show sort direction
        columns = ['Jahr', 'Modalität', 'Jahresgehalt', 'Monatsgehalt', 'Atrasos', 'Monatsgehalt m. Atrasos', 'Antigüedad']
        for col in columns:
            if col == column:
                direction = " ↓" if self.salary_sort_reverse else " ↑"
                self.salary_tree.heading(col, text=col + direction)
            else:
                self.salary_tree.heading(col, text=col)
