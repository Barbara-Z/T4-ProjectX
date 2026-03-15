# CineMatch - Authentication System (Login & Registration)

## Übersicht
Ein vollständiges Benutzer-Authentifizierungssystem wurde implementiert, um Benutzer zu registrieren, zu authentifizieren und zu verwalten.

## Features

### 1. **Registrierung** (`/Register.html`)
- Erforderliche Eingabefelder:
  - Vorname
  - Familienname
  - E-Mail-Adresse
  - Geburtsdatum
  - Passwort (mind. 6 Zeichen)
  - Passwort Bestätigung
- Passwort wird mit bcrypt verschlüsselt
- E-Mail-Validierung (eindeutige E-Mail-Adressen)
- Fehlerbehandlung mit Benutzerfreundlichen Meldungen

### 2. **Login** (`/Login.html`)
- E-Mail + Passwort Authentifizierung
- Session Management mit express-session
- 24-Stunden Session Timeout
- Sicheres Passwort-Vergleichen mit bcrypt
- Automatische Weiterleitung nach erfolgreichem Login

### 3. **User Menu** (Hauptseite)
- Benutzer-Icon (👤) mit Dropdown-Menü
- Zeigt Vorname, Nachname und E-Mail an
- Logout-Button mit sofortiger Session-Löschung
- Automatisches Ausblenden des Dropdown bei Klick außerhalb

### 4. **Quiz Button**
- Direkte Links zur Login-Seite wenn kein Benutzer angemeldet ist
- Quiz-Funktion nur für angemeldete Benutzer verfügbar

## Technologie Stack

### Backend
- **Framework**: Express.js
- **Datenbank**: SQLite3
- **Authentifizierung**: bcrypt (Passwort Hashing)
- **Sessions**: express-session
- **Port**: 3000

### Frontend
- HTML5 mit modernes Design
- CSS3 mit Glasmorphism Effect
- JavaScript (Vanilla, kein Framework)
- Responsive Design für Mobile/Desktop

## Datenbank Struktur

### Users Tabelle
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  birthDate TEXT NOT NULL,
  password TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## API Endpoints

### `POST /register`
Neue Benutzer registrieren
```json
Request Body:
{
  "firstName": "Max",
  "lastName": "Mustermann",
  "email": "max@example.com",
  "birthDate": "2005-01-15",
  "password": "sicheresPasswort123",
  "passwordConfirm": "sicheresPasswort123"
}

Response (201 Created):
{
  "success": true,
  "message": "Registrierung erfolgreich",
  "redirectTo": "/login.html"
}
```

### `POST /login`
Benutzer anmelden
```json
Request Body:
{
  "email": "max@example.com",
  "password": "sicheresPasswort123"
}

Response (200 OK):
{
  "success": true,
  "message": "Login erfolgreich",
  "user": {
    "id": 1,
    "firstName": "Max",
    "lastName": "Mustermann",
    "email": "max@example.com"
  },
  "redirectTo": "/CineMatch.html"
}
```

### `GET /session`
Aktuelle Benutzer-Session abrufen
```json
Response (200 OK):
{
  "id": 1,
  "firstName": "Max",
  "lastName": "Mustermann",
  "email": "max@example.com"
}

Response wenn nicht angemeldet:
null
```

### `GET /logout`
Benutzer abmelden
```json
Response (200 OK):
{
  "success": true,
  "message": "Erfolgreich abgemeldet",
  "redirectTo": "/CineMatch.html"
}
```

## Sicherheitsfeatures

✅ **Passwort-Hashing**: Alle Passwörter werden mit bcrypt verschlüsselt  
✅ **Session Security**: HTTPOnly Cookies mit 24h Timeout  
✅ **Email-Validierung**: Eindeutige E-Mail-Adressen pro Konto  
✅ **Input-Validierung**: Beide Backend und Frontend Validierung  
✅ **Fehlerbehandlung**: Keine Preisgabe von Systeminformationen  
✅ **CORS**: Konfiguriert für Frontend-Backend Kommunikation  

## Fehlerbehandlung

### Backend Fehler
- Ungültige Eingaben → 400 Bad Request
- Datenbank Fehler → 500 Internal Server Error
- Authentifizierungsfehler → 401 Unauthorized

### Frontend Fehler
- Passwörter stimmen nicht überein
- E-Mail bereits registriert
- Ungültige Anmeldedaten
- Netzwerkfehler

## Verwendung

### Server starten
```bash
cd Backend
node server.js
```

### Zum Frontend zugreifen
```
http://localhost:3001
```

### Benutzer registrieren
1. Auf "Registrieren" Button klicken oder zur `/Register.html` gehen
2. Alle erforderlichen Felder ausfüllen
3. Auf "Konto erstellen" klicken
4. Automatische Weiterleitung zur Login-Seite

### Anmelden
1. E-Mail und Passwort eingeben
2. Auf "Anmelden" klicken
3. Automatische Weiterleitung zur Hauptseite
4. Benutzer-Icon erscheint oben rechts

### Abmelden
1. Auf Benutzer-Icon klicken
2. Auf "Logout" klicken
3. Session wird gelöscht und zur Hauptseite weitergeleitet

## Zukünftige Erweiterungen

- [ ] Passwort-Zurücksetzen Funktion
- [ ] E-Mail Verifikation bei Registrierung
- [ ] Benutzer-Profil Verwaltung
- [ ] Admin Dashboard
- [ ] 2-Faktor-Authentifizierung
- [ ] Social Login (Google, GitHub, etc.)

## Dateien

### Frontend
- `CineMatch.html` - Hauptseite mit User-Area
- `Login.html` - Login-Seite mit Formular
- `Register.html` - Registrierungs-Seite mit allen Feldern
- `CineMatch.css` - Styling für User-Dropdown und Formulare
- `script.js` - JavaScript für Session Management und Logout

### Backend
- `Backend/server.js` - Express Server mit Auth-Endpoints
- `users.db` - SQLite Datenbank (wird automatisch erstellt)

---
**Erstellt**: 2026-03-15  
**Version**: 1.0
