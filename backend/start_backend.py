#!/usr/bin/env python3
"""
Start-Script für das FastAPI Backend
"""

import uvicorn
import os
import sys

def main():
    # Überprüfen ob die erforderlichen Pakete installiert sind
    try:
        import fastapi
        import mysql.connector
        print("✓ Benötigte Pakete gefunden")
    except ImportError as e:
        print(f"✗ Fehlendes Paket: {e}")
        print("Bitte installieren Sie die Anforderungen mit:")
        print("pip install -r requirements_api.txt")
        sys.exit(1)

    # API Server starten
    print("🚀 Starte FastAPI Backend auf http://localhost:8000")
    print("📚 API-Dokumentation: http://localhost:8000/docs")
    print("🔧 Health Check: http://localhost:8000/health")
    
    try:
        uvicorn.run(
            "api_server:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Backend wird heruntergefahren...")
    except Exception as e:
        print(f"✗ Fehler beim Starten des Backends: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
