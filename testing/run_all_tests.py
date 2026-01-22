#!/usr/bin/env python3
"""
Skript zum Ausführen aller Tests für die Gehaltsabrechnungsanwendung.
"""

import sys
import os
import unittest
import logging
from datetime import datetime

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def discover_and_run_tests():
    """Entdeckt und führt alle Tests im aktuellen Verzeichnis aus"""
    
    print("=" * 60)
    print("GEHALTSABRECHNUNG - TESTSUITE")
    print("=" * 60)
    print(f"Startzeit: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Sicherstellen, dass wir im richtigen Verzeichnis sind
    test_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(test_dir)
    
    # Tests entdecken
    loader = unittest.TestLoader()
    start_dir = '.'
    suite = loader.discover(start_dir, pattern='test_*.py')
    
    # Test-Runner erstellen
    runner = unittest.TextTestRunner(
        verbosity=2,
        stream=sys.stdout,
        descriptions=True,
        failfast=False
    )
    
    # Tests ausführen
    print("Führe Tests aus...\n")
    result = runner.run(suite)
    
    # Ergebnisse zusammenfassen
    print("\n" + "=" * 60)
    print("TESTERGEBNISSE")
    print("=" * 60)
    print(f"Tests ausgeführt: {result.testsRun}")
    print(f"Fehler: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Übersprungen: {len(result.skipped) if hasattr(result, 'skipped') else 0}")
    
    if result.failures:
        print(f"\nFEHLERHAFTE TESTS ({len(result.failures)}):")
        for test, traceback in result.failures:
            print(f"  - {test}: {traceback.split('AssertionError:')[-1].strip() if 'AssertionError:' in traceback else 'Siehe Traceback'}")
    
    if result.errors:
        print(f"\nERRORS ({len(result.errors)}):")
        for test, traceback in result.errors:
            print(f"  - {test}: {traceback.split('Exception:')[-1].strip() if 'Exception:' in traceback else 'Siehe Traceback'}")
    
    # Gesamterfolg
    success = len(result.failures) == 0 and len(result.errors) == 0
    print(f"\nGesamtergebnis: {'[OK] ERFOLGREICH' if success else '[ERROR] FEHLERGESCHLAGEN'}")
    print(f"Endzeit: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    return success

def run_specific_test(test_module):
    """Führt einen spezifischen Test aus"""
    print(f"Führe spezifischen Test aus: {test_module}")
    
    try:
        # Modul laden
        suite = unittest.TestLoader().loadTestsFromName(test_module)
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        
        return len(result.failures) == 0 and len(result.errors) == 0
        
    except Exception as e:
        logger.error(f"Fehler beim Ausführen des Tests {test_module}: {e}")
        return False

def main():
    """Hauptfunktion"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Tests für die Gehaltsabrechnungsanwendung ausführen')
    parser.add_argument(
        '--test', 
        type=str, 
        help='Spezifischen Test ausführen (z.B. test_database_manager.TestDatabaseManager.test_add_employee)'
    )
    parser.add_argument(
        '--list', 
        action='store_true',
        help='Verfügbare Tests auflisten'
    )
    
    args = parser.parse_args()
    
    if args.list:
        print("Verfügbare Testdateien:")
        for file in os.listdir('.'):
            if file.startswith('test_') and file.endswith('.py'):
                print(f"  - {file}")
        return
    
    if args.test:
        success = run_specific_test(args.test)
    else:
        success = discover_and_run_tests()
    
    # Exit-Code basierend auf dem Ergebnis
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
