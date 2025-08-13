# Vermietertools

Eine minimalistische Web-App zur Verwaltung von Mietobjekten und Mieteinnahmen.

## Features

- **Benutzerregistrierung & Anmeldung**: Sichere lokale Authentifizierung mit bcrypt
- **Objektverwaltung**: Erfassen und verwalten von Mietobjekten
- **Mieteinnahmen-Tracking**: Übersichtliche Darstellung monatlicher und jährlicher Einnahmen
- **Dashboard**: Übersicht über alle Objekte und Einnahmen
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Lokale Datenhaltung**: Alle Daten bleiben bei Ihnen - keine externen Services

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS mit custom Design System
- **Backend**: Next.js API Routes
- **Datenbank**: PostgreSQL 16 (Docker)
- **ORM**: Prisma
- **Authentifizierung**: Lokale Sessions mit Cookies, bcrypt für Passwort-Hashing
- **Entwicklung**: Docker Compose für PostgreSQL

## Voraussetzungen

- Node.js 20+
- Docker & Docker Compose
- Git

## Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd vermietertools
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp .env.example .env.local
   ```
   
   Bearbeiten Sie `.env.local` und setzen Sie:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vermietertools"
   SESSION_SECRET="ihr-super-geheimer-session-schlüssel"
   ```

4. **PostgreSQL starten**
   ```bash
   npm run docker:up
   ```

5. **Datenbank initialisieren**
   ```bash
   npm run db:generate
   npm run db:push
   ```

6. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

Die App ist jetzt unter `http://localhost:3000` verfügbar.

## Entwicklung

### Verfügbare Scripts

- `npm run dev` - Entwicklungsserver starten
- `npm run build` - Produktionsbuild erstellen
- `npm run start` - Produktionsserver starten
- `npm run lint` - ESLint ausführen
- `npm run db:generate` - Prisma Client generieren
- `npm run db:push` - Datenbankschema pushen
- `npm run db:migrate` - Migration erstellen und ausführen
- `npm run db:studio` - Prisma Studio öffnen
- `npm run docker:up` - PostgreSQL Container starten
- `npm run docker:down` - PostgreSQL Container stoppen

### Projektstruktur

```
vermietertools/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard Seite
│   ├── login/             # Login Seite
│   ├── properties/        # Objektverwaltung
│   ├── register/          # Registrierung
│   └── globals.css        # Globale Styles
├── components/            # React Komponenten
│   └── ui/               # UI Komponenten (Button, Input, etc.)
├── lib/                  # Utilities
│   ├── auth.ts           # Authentifizierung
│   ├── db.ts             # Datenbankverbindung
│   └── utils.ts          # Hilfsfunktionen
├── prisma/               # Prisma Schema
└── public/               # Statische Dateien
```

### Datenbank

Die App verwendet PostgreSQL mit folgendem Schema:

- **User**: Benutzerkonten
- **Property**: Mietobjekte
- **Rental**: Mieteinnahmen pro Monat/Jahr

### Authentifizierung

Die App verwendet lokale Sessions mit Cookies. Passwörter werden mit bcrypt gehashed.

## Verwendung

1. **Registrierung**: Erstellen Sie ein neues Konto
2. **Anmeldung**: Melden Sie sich mit Ihren Zugangsdaten an
3. **Objekt hinzufügen**: Erfassen Sie Ihre Mietobjekte
4. **Dashboard**: Übersicht über alle Objekte und Einnahmen

## Sicherheit

- Passwort-Hashing mit bcrypt
- Sichere Session-Cookies
- Input-Validierung
- SQL-Injection-Schutz durch Prisma

## Deployment

Die App kann auf verschiedenen Plattformen deployed werden:

- **Vercel**: Optimiert für Next.js
- **Railway**: Einfaches Deployment mit PostgreSQL
- **Docker**: Container-basiertes Deployment

## Erweiterungen

Die App ist modular aufgebaut und kann einfach erweitert werden:

- Mietverträge verwalten
- Ausgaben erfassen
- Berichte generieren
- Export-Funktionen
- Mehrere Benutzer pro Objekt

## Lizenz

MIT License

## Support

Bei Fragen oder Problemen erstellen Sie ein Issue im Repository.
