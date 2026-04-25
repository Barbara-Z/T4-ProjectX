// Umgebungsvariablen aus .env-Datei laden (z.B. TMDB_API_KEY)
const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");
const app = express();

// CORS aktivieren - erlaubt Anfragen von verschiedenen Origins (z.B. Live Server Port 5500)
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Konfiguration
app.use(session({
  secret: "dein-geheimes-schlüssel-hier", // In Produktion aus Umgebungsvariable!
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // true wenn HTTPS verwendet wird
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
  }
}));

console.log(
  "TMDB v4 token loaded:",
  process.env.TMDB_API_KEY?.startsWith("eyJ")
);

const { getPopularMovies, getTrendingMovies, getMovieDetails } = require("./extern/tmdbService");

// SQLite Datenbank Initialisierung
const db = new sqlite3.Database(path.join(__dirname, "users.db"), (err) => {
  if (err) {
    console.error("Fehler beim Öffnen der Datenbank:", err);
  } else {
    console.log("Verbunden mit SQLite Datenbank");
    // User Tabelle erstellen falls nicht vorhanden
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        birthDate TEXT NOT NULL,
        password TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error("Fehler beim Erstellen der User Tabelle:", err);
      } else {
        console.log("User Tabelle existiert oder wurde erstellt");
      }
    });
  }
});

// Session Endpoint - gibt aktuellen User zurück
app.get("/session", (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.json(null);
  }
});

// TEST ENDPOINT - um zu überprüfen, ob der Server läuft
app.get("/test", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server läuft und antwortet ordnungsgemäß",
    timestamp: new Date().toISOString()
  });
});

// API-Endpoint: Frontend ruft hier Trend-Filme ab
// GET http://localhost:3001/api/trending-movies
app.get("/api/trending-movies", async (req, res) => {
  console.log("API Endpoint /api/trending-movies wurde aufgerufen");
  try {
    // TMDB-Daten über tmdbService abrufen
    const data = await getTrendingMovies();
    console.log("TMDB Response erfolgreich:", data.results?.length || 0, "Filme");
    // Filmdaten als JSON an Frontend zurückschicken
    res.json(data);
  } catch (err) {
    console.error("Error fetching trending movies:", err);
    res.status(500).json({ 
      error: "Failed to fetch trending movies",
      message: err.message,
      details: err.toString()
    });
  }
});

// API-Endpoint: Film-Details abrufen (mit Deutsch, Director, Writer, Runtime, Genre)
// GET http://localhost:3001/api/movie-details/:movieId
app.get("/api/movie-details/:movieId", async (req, res) => {
  console.log("API Endpoint /api/movie-details/:movieId wurde aufgerufen für ID:", req.params.movieId);
  try {
    const movieId = req.params.movieId;
    
    // Film-Details über tmdbService abrufen
    const details = await getMovieDetails(movieId);
    console.log("Film-Details erfolgreich geladen:", details.title);
    
    // Filmdaten als JSON an Frontend zurückschicken
    res.json(details);
  } catch (err) {
    console.error("Error fetching movie details:", err);
    res.status(500).json({ 
      error: "Failed to fetch movie details",
      message: err.message,
      details: err.toString()
    });
  }
});
// Ende Film-Details Endpoint

// REGISTRIERUNGS-ENDPOINT
app.post("/register", async (req, res) => {
  try {
    const firstName = (req.body.firstName || "").trim();
    const lastName = (req.body.lastName || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const birthDate = (req.body.birthDate || "").trim();
    const password = req.body.password || "";
    const passwordConfirm = req.body.passwordConfirm || "";

    // Validierung
    if (!firstName || !lastName || !email || !birthDate || !password || !passwordConfirm) {
      return res.status(400).json({ error: "Alle Felder sind erforderlich" });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ error: "Passwörter stimmen nicht überein" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Passwort muss mindestens 6 Zeichen lang sein" });
    }

    db.get(
      `SELECT id FROM users WHERE lower(email) = lower(?)`,
      [email],
      async (checkErr, existingUser) => {
        if (checkErr) {
          console.error("Registrierungsfehler bei E-Mail-Check:", checkErr);
          return res.status(500).json({ error: "Registrierung fehlgeschlagen" });
        }

        if (existingUser) {
          return res.status(400).json({ error: "E-Mail-Adresse existiert bereits" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
          `INSERT INTO users (firstName, lastName, email, birthDate, password) VALUES (?, ?, ?, ?, ?)`,
          [firstName, lastName, email, birthDate, hashedPassword],
          function(err) {
            if (err) {
              console.error("Registrierungsfehler:", err);
              if (err.message.includes("UNIQUE")) {
                return res.status(400).json({ error: "E-Mail-Adresse existiert bereits" });
              }
              return res.status(500).json({ error: "Registrierung fehlgeschlagen" });
            }

            req.session.user = {
              id: this.lastID,
              firstName,
              lastName,
              email
            };
            
            res.status(201).json({ 
              success: true, 
              message: "Registrierung erfolgreich",
              user: req.session.user,
              redirectTo: "http://localhost:3001/CineMatch.html"
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Registrierungsfehler:", error);
    res.status(500).json({ error: "Ein Fehler ist aufgetreten" });
  }
});

// LOGIN-ENDPOINT
app.post("/login", (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ error: "E-Mail und Passwort erforderlich" });
    }

    // User in Datenbank suchen
    db.get(
      `SELECT * FROM users WHERE lower(email) = lower(?)`,
      [email],
      async (err, user) => {
        if (err) {
          console.error("Login-Fehler:", err);
          return res.status(500).json({ error: "Ein Fehler ist aufgetreten" });
        }

        if (!user) {
          return res.status(401).json({ error: "E-Mail oder Passwort falsch" });
        }

        // Passwort vergleichen
        try {
          const isPasswordValid = await bcrypt.compare(password, user.password);
          
          if (!isPasswordValid) {
            return res.status(401).json({ error: "E-Mail oder Passwort falsch" });
          }

          // Session erstellen
          req.session.user = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          };

          const response = {
            success: true, 
            message: "Login erfolgreich",
            user: req.session.user,
            redirectTo: "http://localhost:3001/CineMatch.html"
          };
          return res.status(200).json(response);
        } catch (error) {
          console.error("Passwort-Vergleich Fehler:", error);
          return res.status(500).json({ error: "Ein Fehler ist aufgetreten" });
        }
      }
    );
  } catch (error) {
    console.error("Login-Fehler (outer catch):", error);
    res.status(500).json({ error: "Ein Fehler ist aufgetreten" });
  }
});

// LOGOUT-ENDPOINT
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout-Fehler:", err);
      return res.status(500).json({ error: "Logout fehlgeschlagen" });
    }
    res.status(200).json({ 
      success: true, 
      message: "Erfolgreich abgemeldet",
      redirectTo: "http://localhost:3001/CineMatch.html"
    });
  });
});

// API-Endpoint für Quiz-Fragen
app.get("/api/questions", (req, res) => {
  const questionsPath = path.join(__dirname, "intern", "fragen.json");
  res.sendFile(questionsPath);
});

// ===== STATISCHE DATEIEN UND FALLBACK (IMMER AM ENDE) =====

// Statische Dateien (HTML, CSS, JS) vom Frontend-Ordner servieren
app.use(express.static(path.join(__dirname, "../Frontend")));

// Fallback für SPA - wenn Route nicht gefunden, index.html servieren
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/CineMatch.html"));
});

// Alle nicht definierten Routes -> 404
app.use((req, res) => {
  res.status(404).json({ error: "Route nicht gefunden" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({ 
    error: "Ein Fehler ist aufgetreten",
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Server auf Port 3001 starten (oder anderen Port aus Umgebungsvariable)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

// ***** *Quiz-Auswertung* *****
const { evaluateQuiz, getTopGenres } = require("./utils/quizEvaluator");
const { getMoviesByGenres } = require("./extern/tmdbService");

app.post("/api/quiz-result", async (req, res) => {
  try {
    const answers = req.body.answers;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Ungültige Antworten" });
    }

    //1. Punkte berechnen
    const scores = evaluateQuiz(answers);

    //2. Top Genres ermitteln
    const topGenres = getTopGenres(scores);
    console.log("Top Genres:", topGenres);

    //3. Filme zu den Top Genres abrufen
    const movies = await getMoviesByGenres(topGenres);

    res.json({ 
      success: true, 
      scores,
      message: "Quiz ausgewertet",
      topGenres,
      movies: movies.results
    });

  } catch (error) {
    console.error("Quiz-Auswertungsfehler:", error);
    res.status(500).json({ error: "Fehler bei der Quiz-Auswertung" });
  }
});
