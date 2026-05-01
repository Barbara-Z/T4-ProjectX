// rankingEngine: scores each movie against the userScore and returns the top N.
//
// Score formula (per spec):
//   for each genre on the movie:
//     if genre == topGenre   -> score += userScore[genre] * 2
//     else                   -> score += userScore[genre] || 0
//   score = score / movie.genres.length

const { genreNameById } = require("../extern/tmdbService");

function scoreMovie(movie, userScore, topGenreId) {
  const genreIds = movie.genre_ids || [];
  if (genreIds.length === 0) return 0;

  let score = 0;
  for (const id of genreIds) {
    const genreName = genreNameById[id];
    const points = (genreName && userScore[genreName]) || 0;
    if (id === topGenreId) {
      score += points * 2;
    } else {
      score += points;
    }
  }
  return score / genreIds.length;
}

function rankMovies(movies, userScore, topGenreId, limit = 3) {
  if (!Array.isArray(movies)) return [];

  const scored = movies
    .map(movie => ({ ...movie, score: scoreMovie(movie, userScore, topGenreId) }))
    .filter(movie => movie.score > 0);

  scored.sort((a, b) => b.score - a.score);

  // Deduplicate by id while preserving order
  const seen = new Set();
  const unique = [];
  for (const movie of scored) {
    if (seen.has(movie.id)) continue;
    seen.add(movie.id);
    unique.push(movie);
    if (unique.length >= limit) break;
  }
  return unique;
}

module.exports = { rankMovies, scoreMovie };
