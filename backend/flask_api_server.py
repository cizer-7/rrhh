"""
Flask API Server für Mitarbeiter Gehaltsabrechnung
Einfache Alternative zu FastAPI ohne Pydantic-Probleme
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import logging
from datetime import datetime, timedelta
import jwt
import json
import os
from database_manager import DatabaseManager

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask App
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Security
SECRET_KEY = "dein-geheimer-schlüssel-hier-ändern"
ALGORITHM = "HS256"

# Database Manager Initialisierung
db_manager = DatabaseManager(
    host='localhost',
    database='nomina',
    user='root',
    password='Niklas-10',
    port=3307
)

# JWT Token Funktionen
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except jwt.PyJWTError:
        return None

def token_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({"message": "Token format invalid"}), 401
        
        if not token:
            return jsonify({"message": "Token is missing"}), 401
        
        current_user = verify_token(token)
        if not current_user:
            return jsonify({"message": "Token is invalid"}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Datenbankverbindung herstellen
def setup_database():
    if not db_manager.connect():
        logger.error("Konnte nicht zur Datenbank verbinden!")
        raise Exception("Datenbankverbindung fehlgeschlagen")
    logger.info("API Server gestartet und Datenbank verbunden")

# Initialisierung
setup_database()

@app.before_request
def before_request():
    """Stelle sicher, dass die Datenbankverbindung aktiv ist"""
    if not db_manager.connection or not db_manager.connection.is_connected():
        db_manager.connect()

@app.teardown_appcontext
def shutdown_database(exception=None):
    pass  # Nicht bei jedem Request disconnecten

# Authentifizierung Endpunkte
@app.route('/auth/login', methods=['POST'])
def login():
    """Benutzeranmeldung"""
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        
        logger.info(f"Login-Versuch für Benutzer: {username}")
        
        if not username or not password:
            return jsonify({"error": "Username und Password erforderlich"}), 400
        
        user_data = db_manager.verify_user(username, password)
        logger.info(f"verify_user Ergebnis: {user_data}")
        
        if not user_data:
            return jsonify({"error": "Falscher Benutzername oder Passwort"}), 401
        
        access_token = create_access_token(data={"sub": user_data["nombre_usuario"]})
        return jsonify({
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        })
    except Exception as e:
        logger.error(f"Login Fehler: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Interner Serverfehler"}), 500

# Mitarbeiter Endpunkte
@app.route('/employees', methods=['GET'])
@token_required
def get_all_employees(current_user):
    """Alle Mitarbeiter abrufen"""
    try:
        employees = db_manager.get_all_employees()
        return jsonify(employees)
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Mitarbeiter: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

@app.route('/employees/<int:employee_id>', methods=['GET'])
@token_required
def get_employee(current_user, employee_id):
    """Vollständige Mitarbeiterinformationen abrufen"""
    try:
        employee_info = db_manager.get_employee_complete_info(employee_id)
        if not employee_info:
            return jsonify({"error": "Mitarbeiter nicht gefunden"}), 404
        return jsonify(employee_info)
    except Exception as e:
        logger.error(f"Fehler beim Abrufen des Mitarbeiters {employee_id}: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

@app.route('/employees', methods=['POST'])
@token_required
def create_employee(current_user):
    """Neuen Mitarbeiter erstellen"""
    try:
        employee = request.get_json()
        new_id = db_manager.add_employee(employee)
        if new_id <= 0:
            return jsonify({"error": "Fehler beim Erstellen des Mitarbeiters"}), 400
        
        # Mitarbeiter mit neuer ID abrufen
        employees = db_manager.get_all_employees()
        for emp in employees:
            if emp['id_empleado'] == new_id:
                return jsonify(emp)
        
        return jsonify({"error": "Neuer Mitarbeiter nicht gefunden"}), 404
    except Exception as e:
        logger.error(f"Fehler beim Erstellen des Mitarbeiters: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

@app.route('/employees/<int:employee_id>', methods=['PUT'])
@token_required
def update_employee(current_user, employee_id):
    """Mitarbeiter aktualisieren"""
    try:
        employee = request.get_json()
        # Filter out None values
        employee_data = {k: v for k, v in employee.items() if v is not None}
        if not employee_data:
            return jsonify({"error": "Keine Daten zum Aktualisieren angegeben"}), 400
        
        success = db_manager.update_employee(employee_id, 't001_empleados', employee_data)
        if not success:
            return jsonify({"error": "Fehler beim Aktualisieren des Mitarbeiters"}), 400
        
        return jsonify({"message": "Mitarbeiter erfolgreich aktualisiert"})
    except Exception as e:
        logger.error(f"Fehler beim Aktualisieren des Mitarbeiters {employee_id}: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

@app.route('/employees/<int:employee_id>', methods=['DELETE'])
@token_required
def delete_employee(current_user, employee_id):
    """Mitarbeiter löschen"""
    try:
        success = db_manager.delete_employee(employee_id)
        if not success:
            return jsonify({"error": "Fehler beim Löschen des Mitarbeiters"}), 400
        
        return jsonify({"message": "Mitarbeiter erfolgreich gelöscht"})
    except Exception as e:
        logger.error(f"Fehler beim Löschen des Mitarbeiters {employee_id}: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

@app.route('/employees/search/<search_term>', methods=['GET'])
@token_required
def search_employees(search_term, current_user):
    """Mitarbeiter suchen"""
    try:
        employees = db_manager.search_employees(search_term)
        return jsonify(employees)
    except Exception as e:
        logger.error(f"Fehler bei der Mitarbeitersuche: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

# Gehalts Endpunkte
@app.route('/employees/<int:employee_id>/salaries', methods=['POST'])
@token_required
def add_salary(current_user, employee_id):
    """Gehalt für Mitarbeiter hinzufügen"""
    try:
        salary = request.get_json()
        success = db_manager.add_salary(employee_id, salary)
        if not success:
            return jsonify({"error": "Fehler beim Hinzufügen des Gehalts"}), 400
        
        return jsonify({"message": "Gehalt erfolgreich hinzugefügt"})
    except Exception as e:
        logger.error(f"Fehler beim Hinzufügen des Gehalts für Mitarbeiter {employee_id}: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

@app.route('/employees/<int:employee_id>/salaries/<int:year>', methods=['PUT'])
@token_required
def update_salary(current_user, employee_id, year):
    """Gehalt für Mitarbeiter aktualisieren"""
    try:
        salary = request.get_json()
        success = db_manager.update_salary(employee_id, year, salary)
        if not success:
            return jsonify({"error": "Fehler beim Aktualisieren des Gehalts"}), 400
        
        return jsonify({"message": "Gehalt erfolgreich aktualisiert"})
    except Exception as e:
        logger.error(f"Fehler beim Aktualisieren des Gehalts für Mitarbeiter {employee_id}: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

@app.route('/employees/<int:employee_id>/salaries/<int:year>', methods=['DELETE'])
@token_required
def delete_salary(current_user, employee_id, year):
    """Gehalt für Mitarbeiter löschen"""
    try:
        success = db_manager.delete_salary(employee_id, year)
        if not success:
            return jsonify({"error": "Fehler beim Löschen des Gehalts"}), 400
        
        return jsonify({"message": "Gehalt erfolgreich gelöscht"})
    except Exception as e:
        logger.error(f"Fehler beim Löschen des Gehalts für Mitarbeiter {employee_id}: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

# Einkünfte Endpunkte
@app.route('/employees/<int:employee_id>/ingresos/<int:year>', methods=['PUT'])
@token_required
def update_ingresos(current_user, employee_id, year):
    """Bruttoeinkünfte für Mitarbeiter aktualisieren"""
    try:
        ingresos = request.get_json()
        success = db_manager.update_ingresos(employee_id, year, ingresos)
        if not success:
            return jsonify({"error": "Fehler beim Aktualisieren der Bruttoeinkünfte"}), 400
        
        return jsonify({"message": "Bruttoeinkünfte erfolgreich aktualisiert"})
    except Exception as e:
        logger.error(f"Fehler beim Aktualisieren der Bruttoeinkünfte für Mitarbeiter {employee_id}: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

# Abzüge Endpunkte
@app.route('/employees/<int:employee_id>/deducciones/<int:year>', methods=['PUT'])
@token_required
def update_deducciones(current_user, employee_id, year):
    """Abzüge für Mitarbeiter aktualisieren"""
    try:
        deducciones = request.get_json()
        success = db_manager.update_deducciones(employee_id, year, deducciones)
        if not success:
            return jsonify({"error": "Fehler beim Aktualisieren der Abzüge"}), 400
        
        return jsonify({"message": "Abzüge erfolgreich aktualisiert"})
    except Exception as e:
        logger.error(f"Fehler beim Aktualisieren der Abzüge für Mitarbeiter {employee_id}: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

# Excel Export Endpunkt
@app.route('/export/excel/<int:year>', methods=['GET'])
@token_required
def export_excel(current_user, year):
    """Excel-Export für Gehaltsdaten"""
    try:
        # Temporäre Datei erstellen
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"gehaltsabrechnung_{year}_{timestamp}.xlsx"
        filepath = f"C:/temp/{filename}"
        
        # Temp-Verzeichnis erstellen falls nicht vorhanden
        os.makedirs("C:/temp", exist_ok=True)
        
        success = db_manager.export_nomina_excel(year, filepath)
        if not success:
            return jsonify({"error": "Fehler beim Excel-Export"}), 400
        
        # Datei zurückgeben
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        logger.error(f"Fehler beim Excel-Export für Jahr {year}: {e}")
        return jsonify({"error": "Interner Serverfehler"}), 500

# Health Check
@app.route('/health', methods=['GET'])
def health_check():
    """Health Check Endpunkt"""
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.now().isoformat()
    })

if __name__ == "__main__":
    print("Starte Flask API Server auf http://localhost:8000")
    print("API-Dokumentation: http://localhost:8000/health")
    print("Health Check: http://localhost:8000/health")
    
    app.run(host="0.0.0.0", port=8000, debug=True)
