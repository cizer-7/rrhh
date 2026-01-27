#!/usr/bin/env python3
"""
Test Runner für das Gehaltsabrechnungssystem
Führt alle Tests aus und generiert Berichte
"""

import os
import sys
import subprocess
import argparse
from datetime import datetime
import json
import shutil

def run_command(command, description):
    """Führt einen Befehl aus und gibt das Ergebnis zurück"""
    print(f"\n{'='*60}")
    print(f"Ausführe: {description}")
    print(f"Befehl: {command}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=os.path.dirname(__file__)
        )
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        print(f"Fehler bei der Ausführung: {e}")
        return False, "", str(e)

def check_frontend_dependencies():
    """Prüfe ob Frontend Dependencies installiert sind"""
    frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
    node_modules = os.path.join(frontend_dir, 'node_modules')
    
    if not os.path.exists(node_modules):
        print("Installiere Frontend Dependencies...")
        os.chdir(frontend_dir)
        result = subprocess.run(['npm', 'install'], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Fehler bei npm install: {result.stderr}")
            return False
        return True
    return True

def run_frontend_tests():
    """Führe Frontend Tests aus"""
    print("\n🌐 Führe Frontend Tests aus...")
    
    # Prüfe Dependencies
    if not check_frontend_dependencies():
        return False, "Frontend dependencies nicht installiert"
    
    # Wechsle in frontend Verzeichnis
    frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
    
    # Installiere Test Dependencies falls nötig
    test_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    if os.path.exists(os.path.join(test_dir, 'package.json')):
        os.chdir(test_dir)
        
        # Prüfe ob npm verfügbar ist
        try:
            result = subprocess.run(['npm', '--version'], capture_output=True, text=True, shell=True)
            if result.returncode != 0:
                print("npm nicht gefunden, überspringe Frontend Tests")
                return True, "npm nicht verfügbar"
        except:
            print("npm nicht verfügbar, überspringe Frontend Tests")
            return True, "npm nicht verfügbar"
        
        result = subprocess.run(['npm', 'install'], capture_output=True, text=True, shell=True)
        if result.returncode != 0:
            print(f"Fehler bei npm install im test Verzeichnis: {result.stderr}")
            return False, "Test dependencies nicht installiert"
    
    # Führe Jest Tests aus
    if os.path.exists(os.path.join(test_dir, 'jest.config.js')):
        os.chdir(test_dir)
        result = subprocess.run(['npx', 'jest', '--passWithNoTests'], capture_output=True, text=True, shell=True)
        stdout = result.stdout or ""
        stderr = result.stderr or ""
        return result.returncode == 0, stdout + stderr
    
    return True, "Keine Frontend Tests konfiguriert"

def run_e2e_tests():
    """Führe E2E Tests aus"""
    print("\n🎭 Führe E2E Tests aus...")
    
    e2e_dir = os.path.join(os.path.dirname(__file__), 'e2e')
    
    if not os.path.exists(os.path.join(e2e_dir, 'playwright.config.js')):
        return True, "Keine E2E Tests konfiguriert"
    
    os.chdir(e2e_dir)
    
    # Prüfe ob Playwright installiert ist
    try:
        result = subprocess.run(['npx', 'playwright', '--version'], capture_output=True, text=True, shell=True)
        if result.returncode != 0:
            print("Playwright nicht gefunden, überspringe E2E Tests")
            return True, "Playwright nicht installiert"
    except Exception as e:
        print(f"Playwright nicht verfügbar: {e}, überspringe E2E Tests")
        return True, "Playwright nicht verfügbar"
    
    # Führe Tests aus
    result = subprocess.run(['npx', 'playwright', 'test'], capture_output=True, text=True, shell=True)
    stdout = result.stdout or ""
    stderr = result.stderr or ""
    return result.returncode == 0, stdout + stderr

def main():
    parser = argparse.ArgumentParser(description="Test Runner für Gehaltsabrechnungssystem")
    parser.add_argument("--unit", action="store_true", help="Nur Unit Tests ausführen")
    parser.add_argument("--frontend", action="store_true", help="Nur Frontend Tests ausführen")
    parser.add_argument("--e2e", action="store_true", help="Nur E2E Tests ausführen")
    parser.add_argument("--integration", action="store_true", help="Nur Integration Tests ausführen")
    parser.add_argument("--fast", action="store_true", help="Schnelle Tests (ohne langsame Tests)")
    parser.add_argument("--coverage", action="store_true", help="Coverage Report generieren")
    parser.add_argument("--html", action="store_true", help="HTML Coverage Report generieren")
    parser.add_argument("--verbose", action="store_true", help="Verbose Ausgabe")
    parser.add_argument("--all", action="store_true", help="Alle Tests ausführen (default)")
    
    args = parser.parse_args()
    
    # Wenn keine spezifischen Tests angegeben, führe alle aus
    if not any([args.unit, args.frontend, args.e2e, args.integration]):
        args.all = True
    
    start_time = datetime.now()
    test_dir = os.path.dirname(__file__)
    results = {}
    
    # Installiere Dependencies nur wenn nötig
    if args.all or args.unit or args.integration:
        print("Prüfe Python Dependencies...")
        success, stdout, stderr = run_command("pip install -r requirements.txt", "Installiere Test Dependencies")
        if not success:
            print("❌ Fehler bei der Installation von Dependencies")
            sys.exit(1)
    
    results = {
        'unit': {'success': True, 'output': ''},
        'frontend': {'success': True, 'output': ''},
        'e2e': {'success': True, 'output': ''},
        'integration': {'success': True, 'output': ''}
    }
    
    start_time = datetime.now()
    
    # Unit Tests
    if args.all or args.unit:
        pytest_cmd = "python -m pytest"
        
        if args.fast:
            pytest_cmd += " test_basic_functionality.py test_flask_api.py::TestFlaskAPI::test_create_access_token test_flask_api.py::TestFlaskAPI::test_health_check"
        else:
            pytest_cmd += " test_basic_functionality.py test_flask_api.py test_database_manager.py test_integration.py"
        
        if args.verbose:
            pytest_cmd += " -v"
        else:
            pytest_cmd += " -q"
        
        if args.coverage or args.html:
            pytest_cmd += " --cov=../backend"
            if args.html:
                pytest_cmd += " --cov-report=html --cov-report=term"
            else:
                pytest_cmd += " --cov-report=term-missing"
        
        pytest_cmd += " --tb=short"
        
        success, stdout, stderr = run_command(pytest_cmd, "Unit Tests")
        results['unit'] = {'success': success, 'output': stdout + stderr}
    
    # Frontend Tests
    if args.all or args.frontend:
        success, output = run_frontend_tests()
        results['frontend'] = {'success': success, 'output': output}
    
    # E2E Tests
    if args.all or args.e2e:
        success, output = run_e2e_tests()
        results['e2e'] = {'success': success, 'output': output}
    
    # Integration Tests
    if args.all or args.integration:
        pytest_cmd = "python -m pytest test_integration.py -v --tb=short"
        success, stdout, stderr = run_command(pytest_cmd, "Integration Tests")
        results['integration'] = {'success': success, 'output': stdout + stderr}
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    # Generiere Bericht
    all_success = all(result['success'] for result in results.values())
    
    report = {
        "timestamp": start_time.isoformat(),
        "duration_seconds": duration,
        "overall_success": all_success,
        "results": results,
        "args": vars(args)
    }
    
    # Speichere Bericht
    report_file = os.path.join(test_dir, "test_report.json")
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    # Zeige Zusammenfassung
    print(f"\n{'='*60}")
    print("TEST ZUSAMMENFASSUNG")
    print(f"{'='*60}")
    print(f"Startzeit: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Endzeit: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Dauer: {duration:.2f} Sekunden")
    print(f"Gesamt-Erfolg: {'✅ JA' if all_success else '❌ NEIN'}")
    
    print(f"\n📊 Einzelergebnisse:")
    for test_type, result in results.items():
        status = "✅" if result['success'] else "❌"
        print(f"  {status} {test_type.title()} Tests")
    
    print(f"\n📄 Bericht gespeichert: {report_file}")
    
    if args.html and results['unit']['success']:
        html_report = os.path.join(test_dir, "htmlcov", "index.html")
        if os.path.exists(html_report):
            print(f"📈 HTML Coverage Report: {html_report}")
    
    if results['e2e']['success']:
        e2e_report = os.path.join(test_dir, "e2e", "playwright-report")
        if os.path.exists(e2e_report):
            print(f"🎭 E2E Report: {e2e_report}")
    
    print(f"{'='*60}")
    
    if all_success:
        print("🎉 Alle Tests erfolgreich!")
        sys.exit(0)
    else:
        print("💥 Einige Tests sind fehlgeschlagen!")
        sys.exit(1)

if __name__ == "__main__":
    main()
