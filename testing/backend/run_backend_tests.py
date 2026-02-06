#!/usr/bin/env python3
"""
Umfassender Backend-Test-Runner
Führt alle Backend-Tests mit einem einzigen Befehl aus
"""

import sys
import os
import subprocess
import argparse
import time
from pathlib import Path

# Backend-Verzeichnis zum Pfad hinzufügen
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
sys.path.insert(0, backend_path)

def run_command(cmd, cwd=None, capture_output=True, env=None):
    """Führt einen Befehl aus und gibt das Ergebnis zurück"""
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            cwd=cwd, 
            capture_output=capture_output, 
            text=True,
            env=env,
            timeout=300  # 5 Minuten Timeout
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Command timed out after 5 minutes"
    except Exception as e:
        return False, "", str(e)

def print_section(title):
    """Printet eine Sektionsüberschrift"""
    print("\n" + "="*80)
    print(f" {title}")
    print("="*80)

def print_subsection(title):
    """Printet eine Untersektionsüberschrift"""
    print(f"\n--- {title} ---")

def check_dependencies():
    """Überprüft ob alle Abhängigkeiten installiert sind"""
    print_section("Abhängigkeiten überprüfen")
    
    required_packages = [
        'pytest',
        'pytest-cov',
        'mysql-connector-python',
        'flask',
        'pandas',
        'openpyxl'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'mysql-connector-python':
                import mysql.connector
            elif package == 'pytest-cov':
                import pytest_cov
            elif package == 'openpyxl':
                import openpyxl
            else:
                __import__(package)
            print(f"✓ {package}")
        except ImportError:
            print(f"✗ {package} - FEHLT")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\nFehlende Pakete: {', '.join(missing_packages)}")
        print("Installieren Sie mit: pip install " + " ".join(missing_packages))
        return False
    
    print("\nAlle Abhängigkeiten sind installiert!")
    return True

def run_unit_tests():
    """Führt Unit-Tests aus"""
    print_section("Unit-Tests")
    
    test_files = [
        'test_backend_core.py',
        'test_integration_simple.py',
        'test_api_core.py',
        'test_api_missing_endpoints.py',
        'test_edge_cases.py'
    ]
    
    all_passed = True
    
    for test_file in test_files:
        print_subsection(f"Teste {test_file}")
        
        backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
        env = os.environ.copy()
        env['PYTHONPATH'] = backend_path + ';' + env.get('PYTHONPATH', '')
        cmd = f'python -m pytest {test_file} -v --tb=short'
        success, stdout, stderr = run_command(cmd, env=env)
        
        print(stdout)
        if stderr:
            print("STDERR:", stderr)
        
        if not success:
            all_passed = False
            print(f"❌ {test_file} fehlgeschlagen")
        else:
            print(f"✅ {test_file} bestanden")
    
    return all_passed

def run_integration_tests():
    """Führt Integration-Tests aus"""
    print_section("Integration-Tests")
    
    backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
    env = os.environ.copy()
    env['PYTHONPATH'] = backend_path + ';' + env.get('PYTHONPATH', '')
    cmd = f'python -m pytest test_integration_simple.py -v --tb=short'
    success, stdout, stderr = run_command(cmd, env=env)
    
    print(stdout)
    if stderr:
        print("STDERR:", stderr)
    
    if success:
        print("✅ Integration-Tests bestanden")
        return True
    else:
        print("❌ Integration-Tests fehlgeschlagen")
        return False

def run_performance_tests():
    """Führt Performance-Tests aus"""
    print_section("Performance-Tests")
    
    backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
    env = os.environ.copy()
    env['PYTHONPATH'] = backend_path + ';' + env.get('PYTHONPATH', '')
    cmd = f'python -m pytest test_backend_core.py::TestDatabaseManagerCore::test_performance_hash_password -v --tb=short'
    success, stdout, stderr = run_command(cmd, env=env)
    
    print(stdout)
    if stderr:
        print("STDERR:", stderr)
    
    if success:
        print("✅ Performance-Tests bestanden")
        return True
    else:
        print("❌ Performance-Tests fehlgeschlagen")
        return False

def run_coverage_analysis():
    """Führt Coverage-Analyse durch"""
    print_section("Code-Coverage Analyse")
    
    # DatabaseManager Coverage
    print_subsection("DatabaseManager Coverage")
    backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
    env = os.environ.copy()
    env['PYTHONPATH'] = backend_path + ';' + env.get('PYTHONPATH', '')
    cmd = f'python -m pytest test_backend_core.py --cov=../backend/database_manager --cov-report=term-missing'
    success, stdout, stderr = run_command(cmd, env=env)
    
    print(stdout)
    if stderr:
        print("STDERR:", stderr)
    
    if success:
        print("✅ DatabaseManager Coverage analysiert")
    else:
        print("❌ DatabaseManager Coverage fehlgeschlagen")
    
    # Flask API Coverage
    print_subsection("Flask API Coverage")
    backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
    env = os.environ.copy()
    env['PYTHONPATH'] = backend_path + ';' + env.get('PYTHONPATH', '')
    cmd = f'python -m pytest test_api_core.py --cov=../backend/flask_api_server --cov-report=term-missing'
    success2, stdout2, stderr2 = run_command(cmd, env=env)
    
    print(stdout2)
    if stderr2:
        print("STDERR:", stderr2)
    
    if success2:
        print("✅ Flask API Coverage analysiert")
    else:
        print("❌ Flask API Coverage fehlgeschlagen")
    
    return success and success2

def run_security_tests():
    """Führt Security-Tests aus"""
    print_section("Security-Tests")
    
    security_tests = [
        'test_backend_core.py::TestDatabaseManagerCore::test_hash_password_functionality',
        'test_backend_core.py::TestDatabaseManagerCore::test_hash_password_edge_cases',
        'test_api_core.py::TestFlaskAPICore::test_jwt_token_creation_and_verification',
        'test_api_core.py::TestFlaskAPICore::test_security_headers_basic'
    ]
    
    all_passed = True
    
    for test in security_tests:
        print_subsection(f"Security Test: {test.split('::')[-1]}")
        
        backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
        env = os.environ.copy()
        env['PYTHONPATH'] = backend_path + ';' + env.get('PYTHONPATH', '')
        cmd = f'python -m pytest {test} -v --tb=short'
        success, stdout, stderr = run_command(cmd, env=env)
        
        print(stdout)
        if stderr:
            print("STDERR:", stderr)
        
        if not success:
            all_passed = False
            print(f"❌ Security Test fehlgeschlagen")
        else:
            print(f"✅ Security Test bestanden")
    
    return all_passed

def run_error_scenario_tests():
    """Führt Fehler-Szenario Tests aus"""
    print_section("Fehler-Szenario Tests")
    
    backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
    env = os.environ.copy()
    env['PYTHONPATH'] = backend_path + ';' + env.get('PYTHONPATH', '')
    cmd = f'python -m pytest test_backend_core.py::TestDatabaseManagerCore::test_error_recovery -v --tb=short'
    success, stdout, stderr = run_command(cmd, env=env)
    
    print(stdout)
    if stderr:
        print("STDERR:", stderr)
    
    if success:
        print("✅ Fehler-Szenario Tests bestanden")
        return True
    else:
        print("❌ Fehler-Szenario Tests fehlgeschlagen")
        return False

def generate_test_report():
    """Generiert einen Test-Report"""
    print_section("Test-Report generieren")
    
    # HTML und XML Report deaktiviert - nur Terminal-Ausgabe
    print("ℹ️  Report-Generierung ist deaktiviert - nur Terminal-Ausgabe")
    
    return True

def cleanup_test_artifacts():
    """Räumt Test-Artefakte auf"""
    print_section("Test-Artefakte aufräumen")
    
    artifacts = [
        '__pycache__',
        '.pytest_cache',
        '*.pyc',
        '.coverage'
    ]
    
    cleaned = 0
    
    for artifact in artifacts:
        if '*' in artifact:
            # Glob pattern
            import glob
            files = glob.glob(artifact)
            for file in files:
                try:
                    if os.path.isfile(file):
                        os.remove(file)
                        cleaned += 1
                        print(f"🗑️  Datei entfernt: {file}")
                except Exception as e:
                    print(f"⚠️  Konnte {file} nicht entfernen: {e}")
        else:
            # Directory
            try:
                if os.path.exists(artifact):
                    import shutil
                    shutil.rmtree(artifact)
                    cleaned += 1
                    print(f"🗑️  Verzeichnis entfernt: {artifact}")
            except Exception as e:
                print(f"⚠️  Konnte {artifact} nicht entfernen: {e}")
    
    print(f"✅ {cleaned} Artefakte aufgeräumt")
    return True

def main():
    """Hauptfunktion"""
    parser = argparse.ArgumentParser(description='Umfassender Backend-Test-Runner')
    parser.add_argument('--unit-only', action='store_true', help='Nur Unit-Tests ausführen')
    parser.add_argument('--integration-only', action='store_true', help='Nur Integration-Tests ausführen')
    parser.add_argument('--performance-only', action='store_true', help='Nur Performance-Tests ausführen')
    parser.add_argument('--security-only', action='store_true', help='Nur Security-Tests ausführen')
    parser.add_argument('--coverage-only', action='store_true', help='Nur Coverage-Analyse durchführen')
    parser.add_argument('--no-coverage', action='store_true', help='Coverage-Analyze überspringen')
    parser.add_argument('--no-cleanup', action='store_true', help='Aufräumen überspringen')
    parser.add_argument('--cleanup-only', action='store_true', help='Nur aufräumen')
    parser.add_argument('--fast', action='store_true', help='Schnelle Tests (überspringt langsame Tests)')
    
    args = parser.parse_args()
    
    print("🚀 Backend-Test-Runner gestartet")
    print(f"📁 Arbeitsverzeichnis: {os.getcwd()}")
    print(f"⏰ Startzeit: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Nur aufräumen?
    if args.cleanup_only:
        return cleanup_test_artifacts()
    
    # Abhängigkeiten überprüfen
    if not check_dependencies():
        print("\n❌ Abhängigkeitsprüfung fehlgeschlagen")
        return 1
    
    start_time = time.time()
    results = {}
    
    try:
        # Unit-Tests
        if not args.integration_only and not args.performance_only and not args.security_only and not args.coverage_only:
            results['unit'] = run_unit_tests()
        
        # Integration-Tests
        if not args.unit_only and not args.performance_only and not args.security_only and not args.coverage_only:
            if not args.fast:
                results['integration'] = run_integration_tests()
        
        # Performance-Tests
        if not args.unit_only and not args.integration_only and not args.security_only and not args.coverage_only:
            if not args.fast:
                results['performance'] = run_performance_tests()
        
        # Security-Tests
        if not args.unit_only and not args.integration_only and not args.performance_only and not args.coverage_only:
            results['security'] = run_security_tests()
        
        # Fehler-Szenario Tests
        if not args.unit_only and not args.integration_only and not args.performance_only and not args.security_only and not args.coverage_only:
            results['error_scenarios'] = run_error_scenario_tests()
        
        # Coverage-Analyse
        if not args.no_coverage and not args.unit_only and not args.integration_only and not args.performance_only and not args.security_only and not args.coverage_only:
            results['coverage'] = run_coverage_analysis()
        
        # Test-Report
        generate_test_report()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests durch Benutzer abgebrochen")
        return 1
    except Exception as e:
        print(f"\n\n❌ Unerwarteter Fehler: {e}")
        return 1
    
    finally:
        # Aufräumen
        if not args.no_cleanup:
            cleanup_test_artifacts()
    
    # Zusammenfassung
    end_time = time.time()
    duration = end_time - start_time
    
    print_section("Test-Zusammenfassung")
    print(f"⏱️  Gesamtdauer: {duration:.2f} Sekunden")
    print(f"🕐 Endzeit: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    passed_tests = sum(1 for result in results.values() if result)
    total_tests = len(results)
    
    print(f"\n📊 Test-Ergebnisse:")
    for test_type, result in results.items():
        status = "✅ BESTANDEN" if result else "❌ FEHLGESCHLAGEN"
        print(f"   {test_type.replace('_', ' ').title()}: {status}")
    
    print(f"\n🎯 Gesamt-Ergebnis: {passed_tests}/{total_tests} Test-Gruppen bestanden")
    
    if passed_tests == total_tests:
        print("🎉 Alle Tests erfolgreich!")
        return 0
    else:
        print("⚠️  Einige Tests sind fehlgeschlagen")
        return 1

if __name__ == '__main__':
    sys.exit(main())
