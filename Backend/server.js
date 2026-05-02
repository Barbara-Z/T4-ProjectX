// Umgebungsvariablen aus .env-Datei laden (z.B. TMDB_API_KEY)
const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");
const app = express();

// Upload-Verzeichnis für Profilbilder
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// CORS aktivieren - erlaubt Anfragen von verschiedenen Origins (z.B. Live Server Port 5500)
app.use(cors({
  origin: true,
  credentials: true
}));
// Body-Limit erhöht, damit base64-Profilbilder durchpassen (5MB roh ≈ 7MB base64)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Profilbilder statisch ausliefern
app.use("/uploads", express.static(UPLOADS_DIR));

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

const { getPopularMovies, getTrendingMovies, getMovieDetails, searchMovies } = require("./extern/tmdbService");

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
        profile_picture TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error("Fehler beim Erstellen der User Tabelle:", err);
        return;
      }
      console.log("User Tabelle existiert oder wurde erstellt");
      // Migration für bestehende DB ohne profile_picture-Spalte
      db.run(`ALTER TABLE users ADD COLUMN profile_picture TEXT`, (alterErr) => {
        if (alterErr && !/duplicate column/i.test(alterErr.message)) {
          console.error("Migration profile_picture fehlgeschlagen:", alterErr);
        }
      });
    });

    // Suchverlauf (pro User). Wir speichern die TMDB-Movie-ID + Titel + Poster,
    // damit Klicks im Verlauf ohne erneuten TMDB-Aufruf gerendert werden können.
    db.run(`
      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        movie_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        poster_path TEXT,
        searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Kommentare zu Filmen (pro User, pro Film, mehrere Einträge möglich)
    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        movie_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }
});

// ===== Auth-Helfer =====
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Nicht angemeldet" });
  }
  next();
}

function loadUser(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    profile_picture: row.profile_picture || null
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Session Endpoint - gibt aktuellen User zurück (immer frisch aus DB,
// damit Profilbild-/Email-Updates ohne Re-Login wirken)
app.get("/session", async (req, res) => {
  if (!req.session.user) return res.json(null);
  try {
    const row = await loadUser(req.session.user.id);
    if (!row) {
      req.session.destroy(() => {});
      return res.json(null);
    }
    const user = publicUser(row);
    req.session.user = user;
    res.json(user);
  } catch (err) {
    console.error("Session-Lade-Fehler:", err);
    res.json(req.session.user || null);
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

// ===== SUCH-ENDPOINTS =====

// Live-Autocomplete: liefert kompakte Treffer für die Dropdown-Vorschläge.
// GET /api/search?q=har
app.get("/api/search", async (req, res) => {
  const query = (req.query.q || "").toString().trim();
  if (!query) return res.json({ results: [] });
  // limit kommt vom Frontend: Dropdown nutzt klein (8), Search-Page groß (z. B. 40)
  const limitRaw = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 8;
  try {
    const results = await searchMovies(query, limit);
    res.json({ query, results });
  } catch (err) {
    console.error("Suche fehlgeschlagen:", err.message);
    res.status(500).json({ error: "Suche fehlgeschlagen" });
  }
});

// Suchverlauf des aktuellen Users laden (nur wenn eingeloggt).
// Letzte 10 Treffer, neueste zuerst, ohne Duplikate.
app.get("/api/search-history", requireAuth, (req, res) => {
  const userId = req.session.user.id;
  db.all(
    `SELECT movie_id, title, poster_path, MAX(searched_at) AS searched_at
       FROM search_history
      WHERE user_id = ?
      GROUP BY movie_id
      ORDER BY searched_at DESC
      LIMIT 10`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error("Suchverlauf-Fehler:", err);
        return res.status(500).json({ error: "Verlauf konnte nicht geladen werden" });
      }
      res.json({ history: rows || [] });
    }
  );
});

// Eintrag in den Suchverlauf schreiben (z. B. wenn ein Vorschlag angeklickt wird).
app.post("/api/search-history", requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const movieId = parseInt(req.body.movie_id, 10);
  const title = (req.body.title || "").toString().trim();
  const posterPath = (req.body.poster_path || "").toString().trim() || null;

  if (!movieId || !title) {
    return res.status(400).json({ error: "movie_id und title erforderlich" });
  }

  db.run(
    `INSERT INTO search_history (user_id, movie_id, title, poster_path) VALUES (?, ?, ?, ?)`,
    [userId, movieId, title, posterPath],
    function (err) {
      if (err) {
        console.error("Suchverlauf-Speicher-Fehler:", err);
        return res.status(500).json({ error: "Speichern fehlgeschlagen" });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Suchverlauf komplett leeren.
app.delete("/api/search-history", requireAuth, (req, res) => {
  db.run(`DELETE FROM search_history WHERE user_id = ?`, [req.session.user.id], (err) => {
    if (err) return res.status(500).json({ error: "Löschen fehlgeschlagen" });
    res.json({ success: true });
  });
});

// ===== KOMMENTAR-ENDPOINTS =====

// Kommentare eines Films laden (öffentlich, auch für Gäste sichtbar).
app.get("/api/comments/:movieId", (req, res) => {
  const movieId = parseInt(req.params.movieId, 10);
  if (!movieId) return res.status(400).json({ error: "Ungültige Film-ID" });

  db.all(
    `SELECT c.id, c.content, c.created_at,
            u.firstName, u.lastName, u.profile_picture
       FROM comments c
       JOIN users u ON u.id = c.user_id
      WHERE c.movie_id = ?
      ORDER BY c.created_at DESC`,
    [movieId],
    (err, rows) => {
      if (err) {
        console.error("Kommentare-Fehler:", err);
        return res.status(500).json({ error: "Kommentare konnten nicht geladen werden" });
      }
      const comments = (rows || []).map(r => ({
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        author: `${r.firstName} ${r.lastName}`.trim(),
        profile_picture: r.profile_picture || null
      }));
      res.json({ comments });
    }
  );
});

// Neuen Kommentar schreiben (nur eingeloggte User).
app.post("/api/comments/:movieId", requireAuth, (req, res) => {
  const movieId = parseInt(req.params.movieId, 10);
  const content = (req.body.content || "").toString().trim();

  if (!movieId) return res.status(400).json({ error: "Ungültige Film-ID" });
  if (!content) return res.status(400).json({ error: "Kommentar darf nicht leer sein" });
  if (content.length > 1000) return res.status(400).json({ error: "Kommentar zu lang (max. 1000 Zeichen)" });

  const userId = req.session.user.id;
  db.run(
    `INSERT INTO comments (user_id, movie_id, content) VALUES (?, ?, ?)`,
    [userId, movieId, content],
    function (err) {
      if (err) {
        console.error("Kommentar-Speicher-Fehler:", err);
        return res.status(500).json({ error: "Speichern fehlgeschlagen" });
      }
      // Frischen Kommentar inkl. Autor zurückgeben, damit das Frontend ihn ohne Reload anhängen kann
      db.get(
        `SELECT c.id, c.content, c.created_at,
                u.firstName, u.lastName, u.profile_picture
           FROM comments c
           JOIN users u ON u.id = c.user_id
          WHERE c.id = ?`,
        [this.lastID],
        (loadErr, row) => {
          if (loadErr || !row) {
            return res.json({ success: true });
          }
          res.json({
            success: true,
            comment: {
              id: row.id,
              content: row.content,
              created_at: row.created_at,
              author: `${row.firstName} ${row.lastName}`.trim(),
              profile_picture: row.profile_picture || null
            }
          });
        }
      );
    }
  );
});

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

// ***** *Quiz-Auswertung* *****
const { buildUserScore, getTopGenre } = require("./utils/scoreCalculator");
const {
  buildUserPreferences,
  buildDiscoverParams,
  applyFilters
} = require("./utils/filterEngine");
const { rankMovies } = require("./utils/rankingEngine");
const {
  discoverMovies,
  enrichMovies,
  genreMapTMDB,
  genreNameById
} = require("./extern/tmdbService");

// POST /api/quiz-result
// Body: { answers: [...] } where each entry corresponds to a question (in order)
// and is either a scoring answer ({ punkte: {...} }) or a filter answer
// ({ filter: "provider", value: "netflix" }).
app.post("/api/quiz-result", async (req, res) => {
  try {
    const answers = req.body.answers;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Ungültige Antworten" });
    }

    const userScore = buildUserScore(answers);
    const topGenreName = getTopGenre(userScore);
    const topGenreId = topGenreName ? genreMapTMDB[topGenreName] : null;

    if (!topGenreName) {
      return res.status(400).json({ error: "Keine Genre-Punkte gefunden" });
    }

    const userPreferences = buildUserPreferences(answers);

    const discoverParams = buildDiscoverParams(userPreferences, topGenreId);
    let movies = await discoverMovies(discoverParams, 2);

    movies = await enrichMovies(movies);
    movies = applyFilters(movies, userPreferences, topGenreId);

    const top3 = rankMovies(movies, userScore, topGenreId, 3);

    const recommendations = top3.map(m => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      vote_average: m.vote_average,
      release_date: m.release_date,
      runtime: m.runtime,
      score: Math.round(m.score * 100) / 100,
      genres: (m.genre_ids || []).map(id => genreNameById[id]).filter(Boolean)
    }));

    res.json({
      success: true,
      userScore,
      topGenre: topGenreName,
      userPreferences,
      recommendations
    });
  } catch (error) {
    console.error("Quiz-Auswertungsfehler:", error);
    res.status(500).json({ error: "Fehler bei der Quiz-Auswertung", message: error.message });
  }
});

// ===== PROFIL-ENDPOINTS =====

// Aktuelle Profildaten laden (inkl. Profilbild-URL)
app.get("/profile", requireAuth, async (req, res) => {
  try {
    const row = await loadUser(req.session.user.id);
    if (!row) return res.status(404).json({ error: "Benutzer nicht gefunden" });
    res.json(publicUser(row));
  } catch (err) {
    console.error("/profile GET-Fehler:", err);
    res.status(500).json({ error: "Profil konnte nicht geladen werden" });
  }
});

// Profilbild hochladen (base64 dataURL im Body)
app.post("/profile/picture", requireAuth, async (req, res) => {
  try {
    const { image } = req.body || {};
    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return res.status(400).json({ error: "Ungültiges Bildformat" });
    }

    const match = image.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i);
    if (!match) return res.status(400).json({ error: "Nur PNG, JPG, WEBP oder GIF erlaubt" });

    const ext = match[1].toLowerCase().replace("jpeg", "jpg");
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length === 0) return res.status(400).json({ error: "Leeres Bild" });
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: "Bild zu groß (max. 5MB)" });
    }

    const userId = req.session.user.id;
    const row = await loadUser(userId);
    if (!row) return res.status(404).json({ error: "Benutzer nicht gefunden" });

    // Alte Datei (falls vorhanden) wegräumen, damit nach Format-Wechsel keine Leichen bleiben
    if (row.profile_picture) {
      const oldPath = path.join(__dirname, row.profile_picture.replace(/^\/+/, ""));
      fs.promises.unlink(oldPath).catch(() => {});
    }

    const filename = `user_${userId}_${Date.now()}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    await fs.promises.writeFile(filepath, buffer);

    const publicPath = `/uploads/${filename}`;
    db.run(
      `UPDATE users SET profile_picture = ? WHERE id = ?`,
      [publicPath, userId],
      (err) => {
        if (err) {
          console.error("/profile/picture DB-Fehler:", err);
          return res.status(500).json({ error: "Speichern fehlgeschlagen" });
        }
        req.session.user = { ...req.session.user, profile_picture: publicPath };
        res.json({ success: true, profile_picture: publicPath });
      }
    );
  } catch (err) {
    console.error("/profile/picture-Fehler:", err);
    res.status(500).json({ error: "Upload fehlgeschlagen" });
  }
});

// Passwort ändern (altes Passwort wird verifiziert)
app.post("/profile/password", requireAuth, async (req, res) => {
  try {
    const oldPassword = req.body.oldPassword || "";
    const newPassword = req.body.newPassword || "";

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Beide Passwörter erforderlich" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Neues Passwort muss mindestens 6 Zeichen lang sein" });
    }
    if (newPassword === oldPassword) {
      return res.status(400).json({ error: "Neues Passwort darf nicht identisch mit dem alten sein" });
    }

    const row = await loadUser(req.session.user.id);
    if (!row) return res.status(404).json({ error: "Benutzer nicht gefunden" });

    const ok = await bcrypt.compare(oldPassword, row.password);
    if (!ok) return res.status(401).json({ error: "Aktuelles Passwort ist falsch" });

    const hashed = await bcrypt.hash(newPassword, 10);
    db.run(
      `UPDATE users SET password = ? WHERE id = ?`,
      [hashed, row.id],
      (err) => {
        if (err) {
          console.error("/profile/password DB-Fehler:", err);
          return res.status(500).json({ error: "Speichern fehlgeschlagen" });
        }
        res.json({ success: true, message: "Passwort aktualisiert" });
      }
    );
  } catch (err) {
    console.error("/profile/password-Fehler:", err);
    res.status(500).json({ error: "Passwortänderung fehlgeschlagen" });
  }
});

// E-Mail-Adresse ändern (Passwort als Bestätigung erforderlich)
app.post("/profile/email", requireAuth, async (req, res) => {
  try {
    const password = req.body.password || "";
    const newEmail = (req.body.newEmail || "").trim().toLowerCase();

    if (!password) return res.status(400).json({ error: "Passwort erforderlich" });
    if (!newEmail) return res.status(400).json({ error: "Neue E-Mail erforderlich" });
    if (!EMAIL_REGEX.test(newEmail)) {
      return res.status(400).json({ error: "Ungültige E-Mail-Adresse" });
    }

    const row = await loadUser(req.session.user.id);
    if (!row) return res.status(404).json({ error: "Benutzer nicht gefunden" });

    if (newEmail === row.email.toLowerCase()) {
      return res.status(400).json({ error: "Diese E-Mail ist bereits hinterlegt" });
    }

    const ok = await bcrypt.compare(password, row.password);
    if (!ok) return res.status(401).json({ error: "Passwort ist falsch" });

    db.get(
      `SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?`,
      [newEmail, row.id],
      (checkErr, taken) => {
        if (checkErr) {
          console.error("/profile/email Check-Fehler:", checkErr);
          return res.status(500).json({ error: "Speichern fehlgeschlagen" });
        }
        if (taken) return res.status(400).json({ error: "E-Mail bereits vergeben" });

        db.run(
          `UPDATE users SET email = ? WHERE id = ?`,
          [newEmail, row.id],
          (err) => {
            if (err) {
              console.error("/profile/email Update-Fehler:", err);
              return res.status(500).json({ error: "Speichern fehlgeschlagen" });
            }
            req.session.user = { ...req.session.user, email: newEmail };
            res.json({ success: true, email: newEmail });
          }
        );
      }
    );
  } catch (err) {
    console.error("/profile/email-Fehler:", err);
    res.status(500).json({ error: "E-Mail-Änderung fehlgeschlagen" });
  }
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
