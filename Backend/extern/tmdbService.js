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

// ****** *Beliebte Filme von TMDB abrufen* ******
async function getPopularMovies() {
  const response = await tmdb.get("/movie/popular");
  return response.data;
}

// Trend-Filme der letzten Woche von TMDB abrufen
async function getTrendingMovies() {
  const response = await tmdb.get("/trending/movie/week"); // API-Aufruf zu TMDB
  return response.data; // Rückgabe der Filmdaten (Array mit Filmen)
}

// Filme nach Genres abrufen (z.B. Action, Comedy, etc.)
async function getMoviesByGenres(genres) {
    const genreMap = {
        action: 28,
        adventure: 12,
        animation: 16,
        comedy: 35,
        crime: 80,
        documentary: 99,
        drama: 18,
        family: 10751,
        fantasy: 14,
        history: 36,
        horror: 27,
        music: 10402,
        mystery: 9648,
        romance: 10749,
        science_fiction: 878,
        thriller: 53,
        war: 10752,
        western: 37
    };

    const genreIds = genres.map(g => genreMap[g]).join(","); // Genre-Namen in IDs umwandeln und als String für API-Aufruf formatieren

    const response = await tmdb.get(`/discover/movie?with_genres=${genreIds}`);
    return response.data; // API-Aufruf zu TMDB mit Genre-Filter
}

module.exports = { getPopularMovies, getTrendingMovies, getMoviesByGenres };
