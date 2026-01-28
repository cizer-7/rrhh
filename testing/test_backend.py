#!/usr/bin/env python3
"""
Einfacher Backend-Test-Runner
Führt alle Backend-Tests mit einem einzigen Befehl aus
"""

import sys
import os
import subprocess

# Backend-Verzeichnis zum Pfad hinzufügen
backend_path = os.path.join(os.path.dirname(__file__), '..')
sys.path.insert(0, backend_path)

def main():
    """Hauptfunktion - führt alle Backend-Tests aus"""
    print("🚀 Backend-Tests starten...")
    
    # Wir sind bereits im testing-Verzeichnis
    os.chdir(os.path.dirname(__file__))
    
    # Alle Tests ausführen
    cmd = 'python run_backend_tests.py --unit-only --no-coverage --no-cleanup'
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=False, text=True)
        return result.returncode
    except KeyboardInterrupt:
        print("\n⚠️ Tests durch Benutzer abgebrochen")
        return 1
    except Exception as e:
        print(f"❌ Fehler bei der Testausführung: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
