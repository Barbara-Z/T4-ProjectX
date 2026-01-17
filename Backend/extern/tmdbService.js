// api call example using axios with v4 Bearer token
const axios = require("axios");

const TMDB_API_KEY = process.env.TMDB_API_KEY; // v4 access token

const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: {
    Authorization: `Bearer ${TMDB_API_KEY}`,   // REQUIRED for v4
    Accept: "application/json"                 // REQUIRED
  }
});

async function getPopularMovies() {
  const res = await tmdb.get("/movie/popular");
  return res.data;
}

module.exports = { getPopularMovies };
