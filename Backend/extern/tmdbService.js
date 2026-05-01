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

// Genre-Map: Genre-Name (wie in quizData verwendet) -> TMDB-ID
const genreMapTMDB = {
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

// Reverse-Map für Display-Zwecke (TMDB-ID -> Genre-Name)
const genreNameById = Object.fromEntries(
  Object.entries(genreMapTMDB).map(([name, id]) => [id, name])
);

// Filme nach Genres abrufen (Legacy-Variante, weiterhin von /api/quiz-result genutzt)
async function getMoviesByGenres(genres) {
  const genreIds = genres.map(g => genreMapTMDB[g]).filter(Boolean).join(",");
  const response = await tmdb.get(`/discover/movie?with_genres=${genreIds}`);
  return response.data;
}

// Generischer Discover-Aufruf mit beliebigen Query-Parametern (Filter-Engine baut sie).
// Holt mehrere Seiten, damit das Ranking eine gute Auswahl hat.
async function discoverMovies(params = {}, pages = 2) {
  const all = [];
  for (let page = 1; page <= pages; page++) {
    const response = await tmdb.get("/discover/movie", { params: { ...params, page } });
    if (response.data && Array.isArray(response.data.results)) {
      all.push(...response.data.results);
    }
    if (!response.data || page >= (response.data.total_pages || 1)) break;
  }
  return all;
}

// Vor dem Ranking brauchen wir runtime + saubere genre_ids für jeden Film.
// Discover liefert genre_ids und (manchmal) origin_country, aber keine runtime.
async function enrichMovieForRanking(movie) {
  if (typeof movie.runtime === "number") return movie;
  try {
    const detail = await tmdb.get(`/movie/${movie.id}`, { params: { language: "de-DE" } });
    return {
      ...movie,
      runtime: detail.data.runtime,
      genre_ids: movie.genre_ids?.length
        ? movie.genre_ids
        : (detail.data.genres || []).map(g => g.id),
      origin_country: detail.data.origin_country || movie.origin_country || []
    };
  } catch (err) {
    return movie;
  }
}

async function enrichMovies(movies) {
  return Promise.all(movies.map(enrichMovieForRanking));
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

module.exports = {
  getPopularMovies,
  getTrendingMovies,
  getMoviesByGenres,
  getMovieDetails,
  discoverMovies,
  enrichMovies,
  genreMapTMDB,
  genreNameById
};
