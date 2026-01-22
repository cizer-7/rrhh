"""
UI Styling module for Employee Management System
Contains modern styling configuration for ttk widgets
"""

import tkinter as tk
from tkinter import ttk


class ModernStyles:
    """Modern UI styling configuration"""
    
    def __init__(self):
        self.colors = {
            'primary': '#2C3E50',       # Dunkelblau/Anthrazit
            'primary_light': '#34495E',  # Etwas hellere Variante
            'primary_dark': '#1A252F',   # Dunklere Variante
            'secondary': '#3498DB',      # Hellblau für Akzente
            'success': '#27AE60',        # Modernes Grün
            'warning': '#F39C12',        # Modernes Orange
            'error': '#E74C3C',          # Modernes Rot
            'background': '#F8F9FA',     # Sehr helles Grau-Weiß
            'surface': '#FFFFFF',          # Reinweiß für Karten
            'surface_variant': '#ECF0F1', # Leicht grau für alternative Oberflächen
            'text_primary': '#2C3E50',   # Haupttextfarbe
            'text_secondary': '#6C757D', # Sekundärer Text
            'text_tertiary': '#ADB5BD',   # Tertiärer Text
            'border': '#DEE2E6',         # Dezente Ränder
            'shadow': 'rgba(0, 0, 0, 0.08)' # Leichte Schatten
        }
    
    def setup_modern_style(self, root):
        """Apply modern styling to the application"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # Hauptfarben setzen
        style.configure('TFrame', background=self.colors['background'])
        style.configure('TLabel', background=self.colors['background'], 
                     foreground=self.colors['text_primary'], font=('Segoe UI', 10))
        
        # Moderne Buttons mit subtilerem Design
        style.configure('Primary.TButton', 
                       background=self.colors['primary'],
                       foreground='white',
                       borderwidth=0,
                       focuscolor='none',
                       font=('Segoe UI', 9, 'normal'),
                       padding=[16, 8],
                       relief='flat')
        style.map('Primary.TButton',
                 background=[('active', self.colors['primary_light']), ('pressed', self.colors['primary_dark'])])
        
        # Secondary Button
        style.configure('Secondary.TButton', 
                       background=self.colors['surface'],
                       foreground=self.colors['primary'],
                       borderwidth=1,
                       relief='solid',
                       focuscolor='none',
                       font=('Segoe UI', 9, 'normal'),
                       padding=[16, 8],
                       bordercolor=self.colors['border'])
        style.map('Secondary.TButton',
                 background=[('active', self.colors['surface_variant']), ('pressed', '#E8EAF6')])
        
        # Success Button
        style.configure('Success.TButton', 
                       background=self.colors['success'],
                       foreground='white',
                       borderwidth=0,
                       focuscolor='none',
                       font=('Segoe UI', 9, 'normal'),
                       padding=[16, 8],
                       relief='flat')
        style.map('Success.TButton',
                 background=[('active', '#229954'), ('pressed', '#1E7E34')])
        
        # Warning Button
        style.configure('Warning.TButton', 
                       background=self.colors['warning'],
                       foreground='white',
                       borderwidth=0,
                       focuscolor='none',
                       font=('Segoe UI', 9, 'normal'),
                       padding=[16, 8],
                       relief='flat')
        
        # Danger Button
        style.configure('Danger.TButton', 
                       background=self.colors['error'],
                       foreground='white',
                       borderwidth=0,
                       focuscolor='none',
                       font=('Segoe UI', 9, 'normal'),
                       padding=[16, 8],
                       relief='flat')
        
        # Moderne Entry-Felder
        style.configure('Modern.TEntry', 
                       fieldbackground=self.colors['surface'],
                       borderwidth=1,
                       relief='solid',
                       bordercolor=self.colors['border'],
                       font=('Segoe UI', 10),
                       padding=[12, 8],
                       selectbackground=self.colors['secondary'],
                       selectforeground='white')
        style.map('Modern.TEntry',
                 bordercolor=[('focus', self.colors['secondary'])])
        
        # Modernes Treeview
        style.configure('Modern.Treeview', 
                       background=self.colors['surface'],
                       foreground=self.colors['text_primary'],
                       fieldbackground=self.colors['surface'],
                       borderwidth=1,
                       relief='solid',
                       bordercolor=self.colors['border'],
                       font=('Segoe UI', 10))
        style.configure('Modern.Treeview.Heading', 
                       background=self.colors['surface_variant'],
                       foreground=self.colors['text_primary'],
                       font=('Segoe UI', 10, 'bold'),
                       relief='flat')
        style.map('Modern.Treeview',
                 background=[('selected', '#E3F2FD')],
                 foreground=[('selected', self.colors['primary'])])
        
        # Moderne LabelFrame (Karten)
        style.configure('Card.TLabelframe', 
                       background=self.colors['surface'], 
                       foreground=self.colors['text_primary'],
                       borderwidth=1,
                       relief='solid',
                       bordercolor=self.colors['border'],
                       padding=[24, 20])
        style.configure('Card.TLabelframe.Label', 
                       background=self.colors['surface'], 
                       foreground=self.colors['primary'],
                       font=('Segoe UI', 12, 'bold'),
                       padding=[0, 0, 8, 0])
        
        # Moderne Checkbutton
        style.configure('Modern.TCheckbutton', 
                       background=self.colors['background'],
                       foreground=self.colors['text_primary'],
                       font=('Segoe UI', 10),
                       focuscolor='none')
        
        # Moderne Combobox
        style.configure('Modern.TCombobox', 
                       fieldbackground=self.colors['surface'],
                       borderwidth=1,
                       relief='solid',
                       bordercolor=self.colors['border'],
                       font=('Segoe UI', 10),
                       padding=[8, 6])
        style.map('Modern.TCombobox',
                 bordercolor=[('focus', self.colors['secondary'])])
        
        root.configure(bg=self.colors['background'])
        
        return self.colors
