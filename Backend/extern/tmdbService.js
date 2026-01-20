// Axios: HTTP-Client für API-Anfragen
const axios = require("axios");

// TMDB API-Token aus .env-Datei laden
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Axios-Instanz mit TMDB-Verbindungsdaten konfigurieren
// - BaseURL: Alle Requests gehen zu TMDB
// - Authorization: Bearer-Token für Authentifizierung (TMDB API v4)
const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: {
    Authorization: `Bearer ${TMDB_API_KEY}`,
    Accept: "application/json"
  }
});

async function getPopularMovies() {
  const res = await tmdb.get("/movie/popular");
  return res.data;
}

// Trend-Filme der letzten Woche von TMDB abrufen
async function getTrendingMovies() {
  const res = await tmdb.get("/trending/movie/week"); // API-Aufruf zu TMDB
  return res.data; // Rückgabe der Filmdaten (Array mit Filmen)
}

module.exports = { getPopularMovies, getTrendingMovies };
