#!/usr/bin/env python3
"""
Start-Script für das Flask Backend
"""

import os
import sys

def main():
    # Überprüfen ob die erforderlichen Pakete installiert sind
    try:
        import flask
        import flask_cors
        import mysql.connector
        print("✓ Benötigte Pakete gefunden")
    except ImportError as e:
        print(f"✗ Fehlendes Paket: {e}")
        print("Bitte installieren Sie die Anforderungen mit:")
        print("pip install -r requirements.txt")
        sys.exit(1)

    # API Server starten
    print("🚀 Starte Flask Backend auf http://localhost:8000")
    print("🔧 Health Check: http://localhost:8000/health")
    
    try:
        from app import app
        app.run(
            host="0.0.0.0",
            port=8000,
            debug=True
        )
    except KeyboardInterrupt:
        print("\n👋 Backend wird heruntergefahren...")
    except Exception as e:
        print(f"✗ Fehler beim Starten des Backends: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
