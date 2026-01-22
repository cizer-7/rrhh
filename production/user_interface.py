"""
Refactored Employee Management UI
Uses modular components for better maintainability
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from database_manager import DatabaseManager
import logging
from datetime import datetime

# Import modular components
from ui_styles import ModernStyles
from ui_components import EmployeeTabComponents


class LoginDialog:
    """Login dialog for user authentication"""
    
    def __init__(self, parent, db_manager):
        self.parent = parent
        self.db = db_manager
        self.result = None
        self.create_login_dialog()
    
    def create_login_dialog(self):
        """Create the login dialog window"""
        self.dialog = tk.Toplevel(self.parent)
        self.dialog.title("Anmeldung - Mitarbeiter Gehaltsabrechnung")
        self.dialog.geometry("400x300")
        self.dialog.transient(self.parent)
        self.dialog.grab_set()
        
        # Center the dialog
        self.dialog.update_idletasks()
        x = (self.dialog.winfo_screenwidth() // 2) - (400 // 2)
        y = (self.dialog.winfo_screenheight() // 2) - (300 // 2)
        self.dialog.geometry(f"400x300+{x}+{y}")
        
        # Main frame
        main_frame = ttk.Frame(self.dialog, padding="40")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(main_frame, text="🔐 Anmeldung", 
                              font=('Segoe UI', 16, 'bold'))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 30))
        
        # Username field
        ttk.Label(main_frame, text="Benutzername:", 
                 font=('Segoe UI', 11)).grid(row=1, column=0, sticky=tk.W, pady=(0, 8))
        self.username_var = tk.StringVar()
        self.username_entry = ttk.Entry(main_frame, textvariable=self.username_var, 
                                      width=25, font=('Segoe UI', 11))
        self.username_entry.grid(row=1, column=1, pady=(0, 8), padx=(10, 0))
        
        # Password field
        ttk.Label(main_frame, text="Passwort:", 
                 font=('Segoe UI', 11)).grid(row=2, column=0, sticky=tk.W, pady=(0, 20))
        self.password_var = tk.StringVar()
        self.password_entry = ttk.Entry(main_frame, textvariable=self.password_var, 
                                      width=25, show="*", font=('Segoe UI', 11))
        self.password_entry.grid(row=2, column=1, pady=(0, 20), padx=(10, 0))
        
        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=3, column=0, columnspan=2, pady=(20, 0))
        
        self.login_btn = ttk.Button(button_frame, text="Anmelden", 
                                   command=self.login, style='Success.TButton')
        self.login_btn.grid(row=0, column=0, padx=(0, 10))
        
        ttk.Button(button_frame, text="Abbrechen", 
                  command=self.cancel).grid(row=0, column=1, padx=(10, 0))
        
        # Status label
        self.status_label = ttk.Label(main_frame, text="", 
                                    font=('Segoe UI', 10), foreground='red')
        self.status_label.grid(row=4, column=0, columnspan=2, pady=(10, 0))
        
        # Bind Enter key to login
        self.password_entry.bind('<Return>', lambda e: self.login())
        self.username_entry.bind('<Return>', lambda e: self.password_entry.focus_set())
        
        # Focus on username field
        self.username_entry.focus_set()
        
        # Handle dialog close
        self.dialog.protocol("WM_DELETE_WINDOW", self.cancel)
    
    def login(self):
        """Attempt to login with provided credentials"""
        username = self.username_var.get().strip()
        password = self.password_var.get().strip()
        
        if not username:
            self.status_label.config(text="Bitte Benutzernamen eingeben")
            return
        
        if not password:
            self.status_label.config(text="Bitte Passwort eingeben")
            return
        
        # Verify credentials
        user_data = self.db.verify_user(username, password)
        
        if user_data:
            self.result = user_data
            self.dialog.destroy()
        else:
            self.status_label.config(text="Benutzername oder Passwort falsch")
            self.password_var.set("")
            self.password_entry.focus_set()
    
    def cancel(self):
        """Cancel login"""
        self.result = None
        self.dialog.destroy()
    
    def show(self):
        """Show dialog and return result"""
        self.dialog.wait_window()
        return self.result


class EmployeeManagementUI:
    """Main Employee Management UI with modular architecture"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("Mitarbeiter Gehaltsabrechnung")
        self.root.geometry("1400x800")
        self.root.configure(bg='#f5f5f5')
        
        # Setup logging
        self.setup_logging()
        
        # Initialize database connection
        self.db = DatabaseManager(
            host='localhost',
            database='nomina',
            user='root',
            password='Niklas-10',
            port=3307  # Korrekter Port
        )
        
        # Initialize sorting state
        self.sort_column = None
        self.sort_reverse = False
        
        print(f"Versuche Verbindung mit: host={self.db.host}, database={self.db.database}, user={self.db.user}, password={'*' * len(self.db.password)}")
        
        if not self.db.connect():
            messagebox.showerror("Fehler", "Konnte nicht zur Datenbank verbinden!")
            self.root.destroy()
            return
        
        # Show login dialog first
        self.current_user = self.authenticate_user()
        if not self.current_user:
            messagebox.showinfo("Abbruch", "Anmeldung abgebrochen. Anwendung wird beendet.")
            self.root.destroy()
            return
        
        # Initialize modular components
        self.styles = ModernStyles()
        self.colors = self.styles.setup_modern_style(self.root)
        
        self.tab_components = EmployeeTabComponents(self.root, self.db, self.colors)
        self.tab_components.parent_ui = self  # Connect tab components to main UI
        
        # Setup UI and load data
        self.setup_ui()
        self.load_employees()
        
        # Show welcome message with user info
        self.show_welcome_message()
    
    def authenticate_user(self):
        """Authenticate user before showing main application"""
        login_dialog = LoginDialog(self.root, self.db)
        return login_dialog.show()
    
    def show_welcome_message(self):
        """Show welcome message with current user info"""
        welcome_text = f"Willkommen {self.current_user['nombre_completo']}!"
        messagebox.showinfo("Anmeldung erfolgreich", welcome_text)
    
    def setup_logging(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    def setup_ui(self):
        # Main frame with modern design
        main_frame = ttk.Frame(self.root, padding="24")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Header with app title
        header_frame = ttk.Frame(main_frame)
        header_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 32))
        
        # App title
        title_label = ttk.Label(header_frame, text="🏢 Mitarbeiter Gehaltsabrechnung", 
                              font=('Segoe UI', 20, 'bold'), 
                              foreground=self.colors['primary'])
        title_label.grid(row=0, column=0, sticky=tk.W)
        
        header_frame.columnconfigure(0, weight=1)
        
        # Left side - employee list with card design
        left_frame = ttk.LabelFrame(main_frame, text="Mitarbeiterliste", 
                                   style='Card.TLabelframe', padding="24")
        left_frame.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 24))
        
        # Search function with modern design
        search_frame = ttk.Frame(left_frame)
        search_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        ttk.Label(search_frame, text="🔍 Suche:", font=('Segoe UI', 11, 'bold'), 
                  foreground=self.colors['text_secondary']).grid(row=0, column=0, padx=(0, 12))
        self.search_var = tk.StringVar()
        self.search_entry = ttk.Entry(search_frame, textvariable=self.search_var, 
                                     style='Modern.TEntry', width=35)
        self.search_entry.grid(row=0, column=1, padx=(0, 12))
        self.search_entry.bind('<KeyRelease>', self.on_search)
        
        ttk.Button(search_frame, text="Suchen", style='Primary.TButton',
                  command=self.on_search).grid(row=0, column=2, padx=(0, 8))
        ttk.Button(search_frame, text="Alle anzeigen", style='Secondary.TButton',
                  command=self.load_employees).grid(row=0, column=3, padx=(0, 8))
        ttk.Button(search_frame, text="➕ Neuer Mitarbeiter", style='Success.TButton',
                  command=self.add_new_employee).grid(row=0, column=4)
        
        # Employee treeview with modern design
        self.employee_tree = ttk.Treeview(left_frame, columns=('ID', 'Name', 'CECO', 'Aktiv'), 
                                         show='headings', height=14, style='Modern.Treeview')
        self.employee_tree.heading('ID', text='ID', command=lambda: self.sort_employees('ID'))
        self.employee_tree.heading('Name', text='Name', command=lambda: self.sort_employees('Name'))
        self.employee_tree.heading('CECO', text='CECO', command=lambda: self.sort_employees('CECO'))
        self.employee_tree.heading('Aktiv', text='Aktiv', command=lambda: self.sort_employees('Aktiv'))
        
        self.employee_tree.column('ID', width=50)
        self.employee_tree.column('Name', width=200)
        self.employee_tree.column('CECO', width=80)
        self.employee_tree.column('Aktiv', width=60)
        
        self.employee_tree.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        self.employee_tree.bind('<<TreeviewSelect>>', self.on_employee_select)
        
        # Scrollbar for employee list
        scrollbar = ttk.Scrollbar(left_frame, orient=tk.VERTICAL, command=self.employee_tree.yview)
        scrollbar.grid(row=1, column=1, sticky=(tk.N, tk.S))
        self.employee_tree.configure(yscrollcommand=scrollbar.set)
        
        # Delete button under employee list
        delete_frame = ttk.Frame(left_frame)
        delete_frame.grid(row=2, column=0, columnspan=2, pady=(12, 0))
        
        self.delete_employee_btn = ttk.Button(delete_frame, text="🗑️ Mitarbeiter löschen", 
                                              style='Danger.TButton',
                                              command=self.delete_employee,
                                              state='disabled')
        self.delete_employee_btn.grid(row=0, column=0)
        
        # Right side - detail view with card design
        right_frame = ttk.Frame(main_frame)
        right_frame.grid(row=1, column=1, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Buttons with modern design - above notebook
        button_frame = ttk.Frame(right_frame)
        button_frame.grid(row=0, column=0, pady=(0, 12))
        
        ttk.Button(button_frame, text="🔄 Aktualisieren", style='Secondary.TButton',
                  command=self.refresh_data).grid(row=0, column=0, padx=12)
        
        ttk.Button(button_frame, text="📊 Excel Export", style='Primary.TButton',
                  command=self.export_excel_dialog).grid(row=0, column=1, padx=12)
        
        # Notebook with modern design
        self.notebook = ttk.Notebook(right_frame, style='Modern.TNotebook')
        self.notebook.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Setup tabs using modular components
        self.tab_components.setup_stammdaten_tab(self.notebook)
        self.tab_components.setup_gehaelter_tab(self.notebook)
        self.tab_components.setup_ingresos_tab(self.notebook)
        self.tab_components.setup_deducciones_tab(self.notebook)
        self.tab_components.setup_historie_tab(self.notebook)
        
        # Bind salary tree selection
        self.tab_components.salary_tree.bind('<<TreeviewSelect>>', self.on_salary_select)
        
        # Connect delete button
        self.tab_components.delete_gehalt_btn.config(command=self.delete_salary)
        
        # Set up year change handlers
        self.tab_components.on_year_change = self.on_year_change
        self.tab_components.add_new_salary = self.add_new_salary
        self.tab_components.load_historie = self.load_historie
        self.tab_components.on_historie_filter_change = self.on_historie_filter_change
        
        # Connect the "Neues Gehalt" button to the actual method
        self.tab_components.add_gehalt_btn.config(command=self.add_new_salary)
        
        # Configure grid
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=3)
        main_frame.rowconfigure(0, weight=1)
        right_frame.columnconfigure(0, weight=1)
        right_frame.rowconfigure(0, weight=1)
    
    def load_employees(self):
        employees = self.db.get_all_employees()
        
        # Clear treeview
        for item in self.employee_tree.get_children():
            self.employee_tree.delete(item)
        
        # Add employees
        for emp in employees:
            name = f"{emp['apellido']}, {emp['nombre']}"
            activo = "Ja" if emp['activo'] else "Nein"
            self.employee_tree.insert('', tk.END, values=(emp['id_empleado'], name, emp['ceco'], activo))
        
        # Apply current sort if exists
        if self.sort_column:
            self.sort_employees(self.sort_column)
    
    def sort_employees(self, column):
        """Sort employees by clicked column"""
        # Toggle sort direction if same column, otherwise start with ascending
        if self.sort_column == column:
            self.sort_reverse = not self.sort_reverse
        else:
            self.sort_column = column
            self.sort_reverse = False
        
        # Get all items from treeview
        items = [(self.employee_tree.item(item)['values'], item) for item in self.employee_tree.get_children()]
        
        # Determine sort key based on column
        column_index = {'ID': 0, 'Name': 1, 'CECO': 2, 'Aktiv': 3}[column]
        
        # Sort items
        def sort_key(item):
            values, _ = item
            value = values[column_index]
            
            # Handle different data types
            if column == 'ID':
                return int(value) if value else 0
            elif column == 'CECO':
                return int(value) if value is not None and value != '' else 0
            else:
                return str(value).lower()
        
        items.sort(key=sort_key, reverse=self.sort_reverse)
        
        # Update treeview with sorted items
        for index, (values, item) in enumerate(items):
            self.employee_tree.move(item, '', index)
        
        # Update column headers to show sort direction
        for col in ['ID', 'Name', 'CECO', 'Aktiv']:
            if col == column:
                direction = " ↓" if self.sort_reverse else " ↑"
                self.employee_tree.heading(col, text=col + direction)
            else:
                self.employee_tree.heading(col, text=col)
    
    def on_employee_select(self, event):
        selection = self.employee_tree.selection()
        if not selection:
            self.delete_employee_btn.config(state='disabled')
            # Also disable salary delete button when no employee is selected
            self.tab_components.delete_gehalt_btn.config(state='disabled')
            return
        
        item = self.employee_tree.item(selection[0])
        employee_id = item['values'][0]
        
        # Enable delete button
        self.delete_employee_btn.config(state='normal')
        
        # Disable salary delete button initially (will be enabled when salary is selected)
        self.tab_components.delete_gehalt_btn.config(state='disabled')
        
        # Load all information for employee
        employee_info = self.db.get_employee_complete_info(employee_id)
        
        if not employee_info:
            return
        
        # Fill master data
        emp = employee_info['employee']
        self.tab_components.stammdaten_vars['id_empleado'].set(str(emp['id_empleado']))
        self.tab_components.stammdaten_vars['nombre'].set(emp['nombre'])
        self.tab_components.stammdaten_vars['apellido'].set(emp['apellido'])
        self.tab_components.stammdaten_vars['ceco'].set(emp['ceco'] or '')
        self.tab_components.stammdaten_vars['activo'].set(emp['activo'])
        
        # Fill salaries
        self.tab_components.salary_tree.delete(*self.tab_components.salary_tree.get_children())
        for salary in employee_info['salaries']:
            self.tab_components.salary_tree.insert('', tk.END, values=(
                salary['anio'],
                salary['modalidad'],
                f"{salary['salario_anual_bruto']:.2f} €",
                f"{salary['salario_mensual_bruto']:.2f} €",
                f"{salary.get('atrasos', 0):.2f} €",
                f"{salary.get('salario_mensual_con_atrasos', salary['salario_mensual_bruto']):.2f} €",
                f"{salary.get('antiguedad', 0):.2f} €"
            ))
        
        # Fill gross income - year dependent
        ingresos = employee_info['ingresos']
        selected_year = int(self.tab_components.ingresos_year_var.get())
        
        # Find data for selected year
        year_ingresos = None
        if ingresos:
            for year_data in ingresos:
                if year_data.get('anio') == selected_year:
                    year_ingresos = year_data
                    break
        
        if year_ingresos:
            for field, var in self.tab_components.ingresos_vars.items():
                var.set(str(year_ingresos.get(field, 0.0)))
        else:
            # For new year without data: set all to 0
            for field, var in self.tab_components.ingresos_vars.items():
                var.set("0.0")
        
        # Fill deductions - year dependent
        deducciones = employee_info['deducciones']
        selected_year = int(self.tab_components.deducciones_year_var.get())
        
        # Find data for selected year
        year_deducciones = None
        if deducciones:
            for year_data in deducciones:
                if year_data.get('anio') == selected_year:
                    year_deducciones = year_data
                    break
        
        if year_deducciones:
            for field, var in self.tab_components.deducciones_vars.items():
                var.set(str(year_deducciones.get(field, 0.0)))
        else:
            # For new year without data: set all to 0
            for field, var in self.tab_components.deducciones_vars.items():
                var.set("0.0")
    
    def on_year_change(self, section):
        """Called when year is changed in ingresos or deducciones"""
        # Keep current selection and reload data
        selection = self.employee_tree.selection()
        if selection:
            self.on_employee_select(None)
    
    def on_salary_select(self, event):
        selection = self.tab_components.salary_tree.selection()
        if not selection:
            # Disable delete button when no salary is selected
            self.tab_components.delete_gehalt_btn.config(state='disabled')
            return
        
        # Enable delete button when salary is selected
        self.tab_components.delete_gehalt_btn.config(state='normal')
        
        item = self.tab_components.salary_tree.item(selection[0])
        year = item['values'][0]
        
        # Get current employee
        emp_selection = self.employee_tree.selection()
        if not emp_selection:
            return
        
        emp_item = self.employee_tree.item(emp_selection[0])
        employee_id = emp_item['values'][0]
        
        # Get salary data for this year
        employee_info = self.db.get_employee_complete_info(employee_id)
        for salary in employee_info['salaries']:
            if salary['anio'] == year:
                self.tab_components.salary_vars['anio'].set(str(salary['anio']))
                self.tab_components.salary_vars['modalidad'].set(str(salary['modalidad']))
                self.tab_components.salary_vars['salario_anual_bruto'].set(str(salary['salario_anual_bruto']))
                self.tab_components.salary_vars['antiguedad'].set(str(salary['antiguedad']))
                break
    
    def save_changes(self):
        emp_selection = self.employee_tree.selection()
        if not emp_selection:
            messagebox.showwarning("Warnung", "Bitte wählen Sie einen Mitarbeiter aus!")
            return
        
        emp_item = self.employee_tree.item(emp_selection[0])
        employee_id = emp_item['values'][0]
        
        # Check if at least one edit mode is active
        if not any(self.tab_components.edit_mode.values()):
            messagebox.showwarning("Warnung", "Bitte aktivieren Sie zuerst einen Bearbeitungsmodus!")
            return
        
        try:
            # Only save if corresponding edit mode is active
            success = True
            
            # Save master data
            if self.tab_components.edit_mode['stammdaten']:
                stammdaten_data = {
                    'nombre': self.tab_components.stammdaten_vars['nombre'].get(),
                    'apellido': self.tab_components.stammdaten_vars['apellido'].get(),
                    'ceco': self.tab_components.stammdaten_vars['ceco'].get() or None,
                    'activo': self.tab_components.stammdaten_vars['activo'].get()
                }
                
                if not self.db.update_employee(employee_id, 't001_empleados', stammdaten_data):
                    messagebox.showerror("Fehler", "Fehler beim Speichern der Stammdaten!")
                    success = False
            
            # Save gross income
            if self.tab_components.edit_mode['ingresos'] and success:
                ingresos_data = {}
                for field, var in self.tab_components.ingresos_vars.items():
                    try:
                        ingresos_data[field] = float(var.get() or 0)
                    except ValueError:
                        ingresos_data[field] = 0.0
                
                # Add year and save
                year = int(self.tab_components.ingresos_year_var.get())
                if ingresos_data and not self.db.update_ingresos(employee_id, year, ingresos_data):
                    messagebox.showerror("Fehler", "Fehler beim Speichern der Bruttoeinkünfte!")
                    success = False
            
            # Save deductions
            if self.tab_components.edit_mode['deducciones'] and success:
                deducciones_data = {}
                for field, var in self.tab_components.deducciones_vars.items():
                    try:
                        deducciones_data[field] = float(var.get() or 0)
                    except ValueError:
                        deducciones_data[field] = 0.0
                
                # Add year and save
                year = int(self.tab_components.deducciones_year_var.get())
                if deducciones_data and not self.db.update_deducciones(employee_id, year, deducciones_data):
                    messagebox.showerror("Fehler", "Fehler beim Speichern der Abzüge!")
                    success = False
            
            # Save salary data (if selected and edit mode active)
            if self.tab_components.edit_mode['gehaelter'] and success:
                salary_selection = self.tab_components.salary_tree.selection()
                if salary_selection:
                    salary_item = self.tab_components.salary_tree.item(salary_selection[0])
                    original_year = salary_item['values'][0]  # Use original year from selection
                    new_year = int(self.tab_components.salary_vars['anio'].get())
                    
                    salary_data = {
                        'modalidad': int(self.tab_components.salary_vars['modalidad'].get()),
                        'salario_anual_bruto': float(self.tab_components.salary_vars['salario_anual_bruto'].get()),
                        'antiguedad': float(self.tab_components.salary_vars['antiguedad'].get())
                    }
                    
                    # If year changed, delete old entry and create new one
                    if original_year != new_year:
                        # Delete old salary entry
                        if not self.db.delete_salary(employee_id, original_year):
                            messagebox.showerror("Fehler", "Fehler beim Löschen des alten Gehaltseintrags!")
                            success = False
                        # Add new salary entry with new year
                        elif not self.db.add_salary(employee_id, {**salary_data, 'anio': new_year}):
                            messagebox.showerror("Fehler", "Fehler beim Erstellen des neuen Gehaltseintrags!")
                            success = False
                    else:
                        # Year unchanged, update existing entry
                        if not self.db.update_salary(employee_id, original_year, salary_data):
                            messagebox.showerror("Fehler", "Fehler beim Speichern der Gehaltsdaten!")
                            success = False
            
            if success:
                messagebox.showinfo("Erfolg", "Änderungen wurden erfolgreich gespeichert!")
                self.refresh_data()
                
                # Deactivate all edit modes
                for section in list(self.tab_components.edit_mode.keys()):
                    if self.tab_components.edit_mode[section]:
                        self.tab_components.toggle_edit_mode(section)
            
        except Exception as e:
            messagebox.showerror("Fehler", f"Fehler beim Speichern: {str(e)}")
    
    def refresh_data(self):
        self.load_employees()
        # Keep current selection
        selection = self.employee_tree.selection()
        if selection:
            self.on_employee_select(None)
    
    def on_search(self, event=None):
        search_term = self.search_var.get().strip()
        if not search_term:
            self.load_employees()
            return
        
        employees = self.db.search_employees(search_term)
        
        # Clear treeview
        for item in self.employee_tree.get_children():
            self.employee_tree.delete(item)
        
        # Add employees
        for emp in employees:
            name = f"{emp['apellido']}, {emp['nombre']}"
            activo = "Ja" if emp['activo'] else "Nein"
            self.employee_tree.insert('', tk.END, values=(emp['id_empleado'], name, emp['ceco'], activo))
        
        # Apply current sort if exists
        if self.sort_column:
            self.sort_employees(self.sort_column)
    
    def add_new_employee(self):
        # Dialog for new employee
        dialog = tk.Toplevel(self.root)
        dialog.title("Neuer Mitarbeiter anlegen")
        dialog.geometry("400x300")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Input fields
        fields = [
            ("Vorname:", "nombre"),
            ("Nachname:", "apellido"),
            ("CECO:", "ceco"),
            ("Aktiv:", "activo")
        ]
        
        vars_dict = {}
        for i, (label, field) in enumerate(fields):
            ttk.Label(dialog, text=label).grid(row=i, column=0, sticky=tk.W, pady=5, padx=10)
            
            if field == "activo":
                var = tk.BooleanVar(value=True)
                entry = ttk.Checkbutton(dialog, variable=var)
            else:
                var = tk.StringVar()
                entry = ttk.Entry(dialog, textvariable=var)
            
            entry.grid(row=i, column=1, sticky=(tk.W, tk.E), pady=5, padx=(0, 10))
            vars_dict[field] = var
        
        dialog.columnconfigure(1, weight=1)
        
        # Buttons
        button_frame = ttk.Frame(dialog)
        button_frame.grid(row=len(fields), column=0, columnspan=2, pady=20)
        
        def save_employee():
            try:
                # Validation
                if not vars_dict['nombre'].get().strip():
                    messagebox.showerror("Fehler", "Bitte geben Sie einen Vornamen ein!")
                    return
                
                if not vars_dict['apellido'].get().strip():
                    messagebox.showerror("Fehler", "Bitte geben Sie einen Nachnamen ein!")
                    return
                
                # Collect data
                employee_data = {
                    'nombre': vars_dict['nombre'].get().strip(),
                    'apellido': vars_dict['apellido'].get().strip(),
                    'ceco': vars_dict['ceco'].get().strip() or None,
                    'activo': vars_dict['activo'].get()
                }
                
                # Create employee
                new_id = self.db.add_employee(employee_data)
                
                if new_id > 0:
                    messagebox.showinfo("Erfolg", f"Neuer Mitarbeiter mit ID {new_id} wurde angelegt!")
                    dialog.destroy()
                    self.load_employees()
                    
                    # Update history
                    self.tab_components.load_historie_employees()
                    
                    # Select new employee
                    for item in self.employee_tree.get_children():
                        item_values = self.employee_tree.item(item)['values']
                        if item_values[0] == new_id:
                            self.employee_tree.selection_set(item)
                            self.employee_tree.see(item)
                            self.on_employee_select(None)
                            break
                else:
                    messagebox.showerror("Fehler", "Fehler beim Anlegen des Mitarbeiters!")
                    
            except Exception as e:
                messagebox.showerror("Fehler", f"Fehler: {str(e)}")
        
        ttk.Button(button_frame, text="Speichern", command=save_employee).grid(row=0, column=0, padx=5)
        ttk.Button(button_frame, text="Abbrechen", command=dialog.destroy).grid(row=0, column=1, padx=5)
        
        # Focus on first input field
        vars_dict['nombre'].set("")
        vars_dict['apellido'].set("")
        vars_dict['ceco'].set("")
        dialog.focus_set()
    
    def add_new_salary(self):
        """Add new salary data for current employee"""
        emp_selection = self.employee_tree.selection()
        if not emp_selection:
            messagebox.showwarning("Warnung", "Bitte wählen Sie zuerst einen Mitarbeiter aus!")
            return
        
        emp_item = self.employee_tree.item(emp_selection[0])
        employee_id = emp_item['values'][0]
        
        # Dialog for new salary
        dialog = tk.Toplevel(self.root)
        dialog.title("Neues Gehalt hinzufügen")
        dialog.geometry("400x300")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Input fields
        fields = [
            ("Jahr:", "anio"),
            ("Modalität (12/14):", "modalidad"),
            ("Jahresgehalt (brutto):", "salario_anual_bruto"),
            ("Antigüedad:", "antiguedad")
        ]
        
        vars_dict = {}
        for i, (label, field) in enumerate(fields):
            ttk.Label(dialog, text=label).grid(row=i, column=0, sticky=tk.W, pady=5, padx=10)
            var = tk.StringVar()
            entry = ttk.Entry(dialog, textvariable=var)
            entry.grid(row=i, column=1, sticky=(tk.W, tk.E), pady=5, padx=(0, 10))
            vars_dict[field] = var
        
        # Default values
        current_year = datetime.now().year
        vars_dict['anio'].set(str(current_year))
        vars_dict['modalidad'].set("12")
        vars_dict['antiguedad'].set("0")
        
        dialog.columnconfigure(1, weight=1)
        
        # Buttons
        button_frame = ttk.Frame(dialog)
        button_frame.grid(row=len(fields), column=0, columnspan=2, pady=20)
        
        def save_salary():
            try:
                # Validation
                year = vars_dict['anio'].get().strip()
                if not year or not year.isdigit():
                    messagebox.showerror("Fehler", "Bitte geben Sie ein gültiges Jahr ein!")
                    return
                
                modalidad = vars_dict['modalidad'].get().strip()
                if modalidad not in ['12', '14']:
                    messagebox.showerror("Fehler", "Modalität muss 12 oder 14 sein!")
                    return
                
                salario = vars_dict['salario_anual_bruto'].get().strip()
                if not salario or not self._is_float(salario):
                    messagebox.showerror("Fehler", "Bitte geben Sie ein gültiges Jahresgehalt ein!")
                    return
                
                antiguedad = vars_dict['antiguedad'].get().strip()
                if not self._is_float(antiguedad):
                    messagebox.showerror("Fehler", "Bitte geben Sie einen gültigen Wert für Antigüedad ein!")
                    return
                
                # Collect data
                salary_data = {
                    'anio': int(year),
                    'modalidad': int(modalidad),
                    'salario_anual_bruto': float(salario),
                    'antiguedad': float(antiguedad)
                }
                
                # Add salary
                if self.db.add_salary(employee_id, salary_data):
                    messagebox.showinfo("Erfolg", f"Gehalt für Jahr {year} wurde hinzugefügt!")
                    dialog.destroy()
                    self.refresh_data()
                else:
                    messagebox.showerror("Fehler", "Fehler beim Hinzufügen des Gehalts!")
                    
            except Exception as e:
                messagebox.showerror("Fehler", f"Fehler: {str(e)}")
        
        ttk.Button(button_frame, text="Speichern", style='Success.TButton', command=save_salary).grid(row=0, column=0, padx=5)
        ttk.Button(button_frame, text="Abbrechen", style='Danger.TButton', command=dialog.destroy).grid(row=0, column=1, padx=5)
        
        dialog.focus_set()
    
    def _is_float(self, value):
        """Check if a value is a valid float"""
        try:
            float(value)
            return True
        except ValueError:
            return False
    
    def load_historie(self):
        """Load history for selected employee"""
        try:
            # Check if history widgets exist
            if not hasattr(self.tab_components, 'historie_employee_var') or not hasattr(self.tab_components, 'historie_tree'):
                return
                
            # Get current employee from combo box
            selected = self.tab_components.historie_employee_var.get()
            if not selected:
                return
            
            # Extract employee ID
            employee_id = None
            for part in selected.split('('):
                if 'ID:' in part:
                    employee_id = int(part.split('ID:')[1].split(')')[0].strip())
                    break
            
            if not employee_id:
                return
            
            # Load history from database (simplified implementation)
            # In a real application you would have a separate history table
            # Here we show the current data as "history"
            self.display_historie_data(employee_id)
            
        except Exception as e:
            logging.error(f"Fehler beim Laden der Historie: {e}")
    
    def display_historie_data(self, employee_id):
        """Display current employee data as history"""
        try:
            # Check if history widgets exist
            if not hasattr(self.tab_components, 'historie_tree'):
                return
                
            # Clear history
            for item in self.tab_components.historie_tree.get_children():
                self.tab_components.historie_tree.delete(item)
            
            # Get employee data
            emp_info = self.db.get_employee_complete_info(employee_id)
            if not emp_info:
                return
            
            emp_name = f"{emp_info['employee']['apellido']}, {emp_info['employee']['nombre']}"
            
            # Show salaries as history
            if emp_info['salaries']:
                for salary in emp_info['salaries']:
                    self.tab_components.historie_tree.insert('', tk.END, values=(
                        salary.get('fecha_modificacion', 'Kein Datum'),
                        'Gehalt',
                        str(salary['anio']),
                        f"Modalität {salary['modalidad']}",
                        f"€{salary['salario_anual_bruto']:.2f}"
                    ))
            
            # Show gross income as history
            if emp_info['ingresos']:
                for year_data in emp_info['ingresos']:
                    year = year_data['anio']
                    modification_date = year_data.get('fecha_modificacion', 'Kein Datum')
                    field_names = {
                        'ticket_restaurant': 'Ticket Restaurant',
                        'cotizacion_especie': 'Cotización Especie',
                        'primas': 'Primas',
                        'dietas_cotizables': 'Dietas Cotizables',
                        'horas_extras': 'Stunden Überstunden',
                        'dias_exentos': 'Tage Steuerfrei',
                        'gasolina_arval': 'Benzin Arval',
                        'dietas_exentas': 'Dietas Steuerfrei',
                        'seguro_pensiones': 'Sicherheitspension'
                    }
                    
                    for field, name in field_names.items():
                        if field in year_data:
                            value = f"€{year_data[field]:.2f}"
                            self.tab_components.historie_tree.insert('', tk.END, values=(
                                modification_date,
                                'Bruttoeinkünfte',
                                str(year),
                                name,
                                value
                            ))
            
            # Show deductions as history
            if emp_info['deducciones']:
                for year_data in emp_info['deducciones']:
                    year = year_data['anio']
                    modification_date = year_data.get('fecha_modificacion', 'Kein Datum')
                    field_names = {
                        'seguro_pensiones': 'Sicherheitspension',
                        'seguro_accidentes': 'Unfallversicherung',
                        'adelas': 'Adelas',
                        'sanitas': 'Sanitas',
                        'gasolina_arval': 'Benzin Arval',
                        'cotizacion_especie': 'Cotización Especie'
                    }
                    
                    for field, name in field_names.items():
                        if field in year_data:
                            value = f"€{year_data[field]:.2f}"
                            self.tab_components.historie_tree.insert('', tk.END, values=(
                                modification_date,
                                'Abzüge',
                                str(year),
                                name,
                                value
                            ))
            
        except Exception as e:
            logging.error(f"Fehler beim Anzeigen der Historie-Daten: {e}")
    
    def on_historie_filter_change(self, event):
        """Filter history based on selected type"""
        try:
            # Check if history widgets exist
            if not hasattr(self.tab_components, 'historie_filter_var') or not hasattr(self.tab_components, 'historie_tree'):
                return
                
            filter_value = self.tab_components.historie_filter_var.get()
            
            # Remove all entries
            for item in self.tab_components.historie_tree.get_children():
                self.tab_components.historie_tree.delete(item)
            
            # If "All" selected, show everything
            if filter_value == "Alle":
                self.load_historie()
                return
            
            # Otherwise filter
            selected = self.tab_components.historie_employee_var.get()
            if not selected:
                return
            
            # Extract employee ID
            employee_id = None
            for part in selected.split('('):
                if 'ID:' in part:
                    employee_id = int(part.split('ID:')[1].split(')')[0].strip())
                    break
            
            if not employee_id:
                return
            
            # Show filtered data
            emp_info = self.db.get_employee_complete_info(employee_id)
            if not emp_info:
                return
            
            emp_name = f"{emp_info['employee']['apellido']}, {emp_info['employee']['nombre']}"
            
            if filter_value == "Gehaelter" and emp_info['salaries']:
                for salary in emp_info['salaries']:
                    self.tab_components.historie_tree.insert('', tk.END, values=(
                        salary.get('fecha_modificacion', 'Kein Datum'),
                        'Gehalt',
                        str(salary['anio']),
                        f"Modalität {salary['modalidad']}",
                        f"€{salary['salario_anual_bruto']:.2f}"
                    ))
            
            elif filter_value == "Bruttoeinkünfte" and emp_info['ingresos']:
                for year_data in emp_info['ingresos']:
                    year = year_data['anio']
                    modification_date = year_data.get('fecha_modificacion', 'Kein Datum')
                    field_names = {
                        'ticket_restaurant': 'Ticket Restaurant',
                        'cotizacion_especie': 'Cotización Especie',
                        'primas': 'Primas',
                        'dietas_cotizables': 'Dietas Cotizables',
                        'horas_extras': 'Stunden Überstunden',
                        'dias_exentos': 'Tage Steuerfrei',
                        'gasolina_arval': 'Benzin Arval',
                        'dietas_exentas': 'Dietas Steuerfrei',
                        'seguro_pensiones': 'Sicherheitspension'
                    }
                    
                    for field, name in field_names.items():
                        if field in year_data:
                            value = f"€{year_data[field]:.2f}"
                            self.tab_components.historie_tree.insert('', tk.END, values=(
                                modification_date,
                                'Bruttoeinkünfte',
                                str(year),
                                name,
                                value
                            ))
            
            elif filter_value == "Abzüge" and emp_info['deducciones']:
                for year_data in emp_info['deducciones']:
                    year = year_data['anio']
                    modification_date = year_data.get('fecha_modificacion', 'Kein Datum')
                    field_names = {
                        'seguro_pensiones': 'Sicherheitspension',
                        'seguro_accidentes': 'Unfallversicherung',
                        'adelas': 'Adelas',
                        'sanitas': 'Sanitas',
                        'gasolina_arval': 'Benzin Arval',
                        'cotizacion_especie': 'Cotización Especie'
                    }
                    
                    for field, name in field_names.items():
                        if field in year_data:
                            value = f"€{year_data[field]:.2f}"
                            self.tab_components.historie_tree.insert('', tk.END, values=(
                                modification_date,
                                'Abzüge',
                                str(year),
                                name,
                                value
                            ))
        except Exception as e:
            logging.error(f"Fehler beim Filtern der Historie: {e}")
    
    def delete_employee(self):
        """Delete selected employee"""
        try:
            selection = self.employee_tree.selection()
            if not selection:
                return
            
            item = self.employee_tree.item(selection[0])
            employee_id = item['values'][0]
            employee_name = item['values'][1]
            
            # Security confirmation
            result = messagebox.askyesno(
                "Mitarbeiter löschen",
                f"Möchten Sie den Mitarbeiter '{employee_name}' (ID: {employee_id}) wirklich löschen?\n\n"
                "Diese Aktion kann nicht rückgängig gemacht werden!",
                icon='warning'
            )
            
            if not result:
                return
            
            # Delete employee from database
            if self.db.delete_employee(employee_id):
                messagebox.showinfo("Erfolg", f"Mitarbeiter '{employee_name}' wurde erfolgreich gelöscht!")
                
                # Reset selection and update UI
                self.employee_tree.selection_remove(selection)
                self.delete_employee_btn.config(state='disabled')
                
                # Clear forms
                self.clear_forms()
                
                # Reload employee list
                self.load_employees()
                
                # Update history
                self.tab_components.load_historie_employees()
            else:
                messagebox.showerror("Fehler", "Fehler beim Löschen des Mitarbeiters!")
                
        except Exception as e:
            messagebox.showerror("Fehler", f"Fehler beim Löschen: {str(e)}")
    
    def delete_salary(self):
        """Delete selected salary record"""
        try:
            # Check if employee is selected
            emp_selection = self.employee_tree.selection()
            if not emp_selection:
                messagebox.showwarning("Warnung", "Bitte wählen Sie zuerst einen Mitarbeiter aus!")
                return
            
            # Check if salary is selected
            salary_selection = self.tab_components.salary_tree.selection()
            if not salary_selection:
                messagebox.showwarning("Warnung", "Bitte wählen Sie zuerst ein Gehalt aus der Liste aus!")
                return
            
            emp_item = self.employee_tree.item(emp_selection[0])
            employee_id = emp_item['values'][0]
            employee_name = emp_item['values'][1]
            
            salary_item = self.tab_components.salary_tree.item(salary_selection[0])
            year = salary_item['values'][0]
            modalidad = salary_item['values'][1]
            jahresgehalt = salary_item['values'][2]
            
            # Security confirmation
            result = messagebox.askyesno(
                "Gehalt löschen",
                f"Möchten Sie das Gehalt für Jahr {year} ({modalidad}-Monats-Modalität, {jahresgehalt}) "
                f"von Mitarbeiter '{employee_name}' (ID: {employee_id}) wirklich löschen?\n\n"
                "Diese Aktion kann nicht rückgängig gemacht werden!",
                icon='warning'
            )
            
            if not result:
                return
            
            # Delete salary from database
            if self.db.delete_salary(employee_id, year):
                messagebox.showinfo("Erfolg", f"Gehalt für Jahr {year} wurde erfolgreich gelöscht!")
                
                # Refresh data
                self.refresh_data()
                
                # Clear salary form
                for var in self.tab_components.salary_vars.values():
                    var.set("")
                
                # Update history
                self.tab_components.load_historie_employees()
            else:
                messagebox.showerror("Fehler", "Fehler beim Löschen des Gehalts!")
                
        except Exception as e:
            messagebox.showerror("Fehler", f"Fehler beim Löschen: {str(e)}")
    
    def export_excel_dialog(self):
        """Dialog für Excel-Export mit Jahresauswahl"""
        try:
            # Dialog erstellen
            dialog = tk.Toplevel(self.root)
            dialog.title("Excel Export - Gehaltsabrechnung")
            dialog.geometry("400x250")
            dialog.transient(self.root)
            dialog.grab_set()
            
            # Center the dialog
            dialog.update_idletasks()
            x = (dialog.winfo_screenwidth() // 2) - (400 // 2)
            y = (dialog.winfo_screenheight() // 2) - (250 // 2)
            dialog.geometry(f"400x250+{x}+{y}")
            
            # Main frame
            main_frame = ttk.Frame(dialog, padding="30")
            main_frame.pack(fill=tk.BOTH, expand=True)
            
            # Title
            title_label = ttk.Label(main_frame, text="📊 Excel Export", 
                                  font=('Segoe UI', 16, 'bold'))
            title_label.grid(row=0, column=0, columnspan=2, pady=(0, 25))
            
            # Year selection
            ttk.Label(main_frame, text="Export-Jahr:", 
                     font=('Segoe UI', 11)).grid(row=1, column=0, sticky=tk.W, pady=(0, 8))
            
            current_year = datetime.now().year
            years = list(range(current_year - 5, current_year + 2))
            year_var = tk.StringVar(value=str(current_year))
            year_combo = ttk.Combobox(main_frame, textvariable=year_var, 
                                     values=years, width=15, font=('Segoe UI', 11))
            year_combo.grid(row=1, column=1, pady=(0, 8), padx=(10, 0), sticky=tk.W)
            
            # File path
            ttk.Label(main_frame, text="Speicherort:", 
                     font=('Segoe UI', 11)).grid(row=2, column=0, sticky=tk.W, pady=(0, 8))
            
            path_var = tk.StringVar()
            path_entry = ttk.Entry(main_frame, textvariable=path_var, 
                                  width=30, font=('Segoe UI', 11))
            path_entry.grid(row=2, column=1, pady=(0, 8), padx=(10, 0), sticky=tk.W+tk.E)
            
            def browse_file():
                filename = filedialog.asksaveasfilename(
                    title="Excel-Datei speichern",
                    defaultextension=".xlsx",
                    filetypes=[("Excel-Dateien", "*.xlsx"), ("Alle Dateien", "*.*")],
                    initialfile=f"DATOS NOMINA {year_var.get()}.xlsx"
                )
                if filename:
                    path_var.set(filename)
            
            ttk.Button(main_frame, text="Durchsuchen...", 
                      command=browse_file).grid(row=2, column=2, padx=(5, 0))
            
            # Buttons
            button_frame = ttk.Frame(main_frame)
            button_frame.grid(row=3, column=0, columnspan=3, pady=(25, 0))
            
            def export_data():
                try:
                    year = int(year_var.get())
                    output_path = path_var.get().strip()
                    
                    if not output_path:
                        messagebox.showerror("Fehler", "Bitte wählen Sie einen Speicherort!")
                        return
                    
                    # Export durchführen
                    if self.db.export_nomina_excel(year, output_path):
                        messagebox.showinfo("Erfolg", 
                                          f"Excel-Export erfolgreich!\n\n"
                                          f"Jahr: {year}\n"
                                          f"Datei: {output_path}")
                        dialog.destroy()
                    else:
                        messagebox.showerror("Fehler", 
                                          f"Export fehlgeschlagen!\n\n"
                                          f"Mögliche Ursachen:\n"
                                          f"- Keine Daten für Jahr {year} vorhanden\n"
                                          f"- Datenbankverbindungsprobleme")
                        
                except ValueError:
                    messagebox.showerror("Fehler", "Bitte geben Sie ein gültiges Jahr ein!")
                except Exception as e:
                    messagebox.showerror("Fehler", f"Export fehlgeschlagen: {str(e)}")
            
            ttk.Button(button_frame, text="Exportieren", 
                      command=export_data, style='Success.TButton').grid(row=0, column=0, padx=(0, 10))
            ttk.Button(button_frame, text="Abbrechen", 
                      command=dialog.destroy).grid(row=0, column=1, padx=(10, 0))
            
            main_frame.columnconfigure(1, weight=1)
            
        except Exception as e:
            messagebox.showerror("Fehler", f"Fehler beim Öffnen des Export-Dialogs: {str(e)}")
    
    def clear_forms(self):   
        """Clear all forms"""
        # Clear master data
        for var in self.tab_components.stammdaten_vars.values():
            if isinstance(var, tk.StringVar):
                var.set("")
            elif isinstance(var, tk.BooleanVar):
                var.set(False)
        
        # Clear salaries
        self.tab_components.salary_tree.delete(*self.tab_components.salary_tree.get_children())
        for var in self.tab_components.salary_vars.values():
            var.set("")
        
        # Clear gross income
        for var in self.tab_components.ingresos_vars.values():
            var.set("0.0")
        
        # Clear deductions
        for var in self.tab_components.deducciones_vars.values():
            var.set("0.0")
    
    def __del__(self):
        if hasattr(self, 'db'):
            self.db.disconnect()


if __name__ == "__main__":
    root = tk.Tk()
    app = EmployeeManagementUI(root)
    root.mainloop()
