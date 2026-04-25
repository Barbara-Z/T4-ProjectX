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

// Film-Details abrufen (mit deutscher Übersetzung, Credits, Runtime, etc.)
async function getMovieDetails(movieId) {
  try {
    // Hauptdetails mit deutschen Texten
    const detailResponse = await tmdb.get(`/movie/${movieId}?language=de-DE`);
    const details = detailResponse.data;

    // Credits (Director, Writer) abrufen
    const creditsResponse = await tmdb.get(`/movie/${movieId}/credits`);
    const credits = creditsResponse.data;

    // Englische Beschreibung auch abrufen (falls die deutsche nicht vorhanden ist)
    let englishOverview = details.overview;
    if (!details.overview || details.overview.length < 20) {
      const engResponse = await tmdb.get(`/movie/${movieId}?language=en-US`);
      englishOverview = engResponse.data.overview;
    }

    // Director (Regisseur) extrahieren
    const director = credits.crew?.find(member => member.job === 'Director')?.name || 'Unbekannt';

    // Writer (Drehbuchautor) extrahieren
    const writers = credits.crew
      ?.filter(member => member.job === 'Writer' || member.job === 'Screenplay')
      .map(w => w.name)
      .join(', ') || 'Unbekannt';

    // Genres als String
    const genres = details.genres?.map(g => g.name).join(', ') || 'Unbekannt';

    // Runtime in Stunden und Minuten formatieren
    const hours = Math.floor(details.runtime / 60);
    const minutes = details.runtime % 60;
    const runtimeFormatted = `${hours}h ${minutes}min`;

    // Release Date formatieren (z.B. "20.04.2026")
    const releaseDate = new Date(details.release_date);
    const releaseDateFormatted = isNaN(releaseDate) ? 'Unbekannt' : releaseDate.toLocaleDateString('at-AT');

    return {
      id: details.id,
      title: details.title,
      overview: details.overview || englishOverview,
      overview_en: englishOverview,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      vote_average: details.vote_average,
      vote_count: details.vote_count,
      release_date: details.release_date,
      release_date_formatted: releaseDateFormatted,
      runtime: details.runtime,
      runtime_formatted: runtimeFormatted,
      director: director,
      writers: writers,
      genres: genres,
      director_object: credits.crew?.find(member => member.job === 'Director'),
      writers_objects: credits.crew?.filter(member => member.job === 'Writer' || member.job === 'Screenplay') || []
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Film-Details:', error);
    throw error;
  }
}
// Ende Modal Film-Details Funktion

module.exports = { getPopularMovies, getTrendingMovies, getMoviesByGenres, getMovieDetails };
