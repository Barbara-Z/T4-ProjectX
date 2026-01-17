require("dotenv").config({ path: "../.env" });

// Verify that the TMDB_API_KEY is loaded correctly
console.log(
  "TMDB v4 token loaded:",
  process.env.TMDB_API_KEY?.startsWith("eyJ")
);

const { getPopularMovies } = require("./extern/tmdbService");

getPopularMovies()
  .then(data => console.log(data))
  .catch(err => console.error(err.response?.data || err));
