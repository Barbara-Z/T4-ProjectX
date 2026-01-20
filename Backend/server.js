// Umgebungsvariablen aus .env-Datei laden (z.B. TMDB_API_KEY)
require("dotenv").config({ path: "../.env" });
const express = require("express");
const path = require("path");
const cors = require("cors"); // Cross-Origin Requests erlauben
const app = express();

// CORS aktivieren - erlaubt Anfragen von verschiedenen Origins (z.B. Live Server Port 5500)
app.use(cors());
console.log(
  "TMDB v4 token loaded:",
  process.env.TMDB_API_KEY?.startsWith("eyJ")
);

const { getPopularMovies, getTrendingMovies } = require("./extern/tmdbService");

// Session Endpoint (temporär - immer null)
app.get("/session", (req, res) => {
  res.json(null);
});

// API-Endpoint: Frontend ruft hier Trend-Filme ab
// GET http://localhost:3000/api/trending-movies
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

// Statische Dateien (HTML, CSS, JS) vom Frontend-Ordner servieren
// Ermöglicht: http://localhost:3000 → zeigt CineMatch.html an
app.use(express.static(path.join(__dirname, "../Frontend")));

// Fallback für SPA - wenn Route nicht gefunden, index.html servieren
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/CineMatch.html"));
});

// Server auf Port 3000 starten (oder anderen Port aus Umgebungsvariable)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
