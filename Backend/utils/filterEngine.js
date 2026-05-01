// filterEngine: extracts userPreferences from filter-typed answers,
// translates them into TMDB discover params, and post-filters fetched movies.
//
// userPreferences shape:
//   { provider: "netflix"|..., runtime: "short"|"medium"|"long"|"any",
//     audience: "family"|"adult"|"any", type: "animation"|"anime"|"live_action"|"any" }

const ANIMATION_GENRE_ID = 16;

const TMDB_PROVIDER_IDS = {
  netflix: 8,
  amazon: 9,
  disney: 337
};

function buildUserPreferences(answers) {
  const prefs = { provider: "any", runtime: "any", audience: "any", type: "any" };
  if (!Array.isArray(answers)) return prefs;

  for (const answer of answers) {
    if (!answer || typeof answer !== "object") continue;
    if (!answer.filter || !answer.value) continue;
    prefs[answer.filter] = answer.value;
  }
  return prefs;
}

// Maps preferences to TMDB /discover/movie query params.
// Provider/audience adjust the query; runtime is also enforced post-fetch in case
// providers don't respect with_runtime in every region.
function buildDiscoverParams(preferences, topGenreId) {
  const params = {
    sort_by: "popularity.desc",
    include_adult: false,
    "vote_count.gte": 50,
    language: "de-DE",
    watch_region: "DE"
  };

  if (topGenreId) params.with_genres = String(topGenreId);

  if (preferences.runtime === "short") params["with_runtime.lte"] = 89;
  else if (preferences.runtime === "medium") {
    params["with_runtime.gte"] = 90;
    params["with_runtime.lte"] = 120;
  } else if (preferences.runtime === "long") params["with_runtime.gte"] = 121;

  if (preferences.audience === "family") {
    params.certification_country = "DE";
    params["certification.lte"] = "12";
    params.include_adult = false;
  } else if (preferences.audience === "adult") {
    params.include_adult = true;
  }

  if (preferences.type === "animation") {
    params.with_genres = params.with_genres
      ? `${params.with_genres},${ANIMATION_GENRE_ID}`
      : String(ANIMATION_GENRE_ID);
  } else if (preferences.type === "anime") {
    params.with_genres = params.with_genres
      ? `${params.with_genres},${ANIMATION_GENRE_ID}`
      : String(ANIMATION_GENRE_ID);
    params.with_origin_country = "JP";
  } else if (preferences.type === "live_action") {
    params.without_genres = String(ANIMATION_GENRE_ID);
  }

  const providerId = TMDB_PROVIDER_IDS[preferences.provider];
  if (providerId) {
    params.with_watch_providers = String(providerId);
    params.watch_region = "DE";
  }

  return params;
}

// Post-filter: enforces invariants that TMDB discover may not have honored,
// plus the "must include topGenre" rule from the spec.
function applyFilters(movies, preferences, topGenreId) {
  if (!Array.isArray(movies)) return [];

  return movies.filter(movie => {
    const genreIds = movie.genre_ids || [];

    if (topGenreId && !genreIds.includes(topGenreId)) return false;

    const runtime = movie.runtime;
    if (typeof runtime === "number" && runtime > 0) {
      if (preferences.runtime === "short" && runtime >= 90) return false;
      if (preferences.runtime === "medium" && (runtime < 90 || runtime > 120)) return false;
      if (preferences.runtime === "long" && runtime <= 120) return false;
    }

    if (preferences.type === "animation" && !genreIds.includes(ANIMATION_GENRE_ID)) return false;
    if (preferences.type === "live_action" && genreIds.includes(ANIMATION_GENRE_ID)) return false;
    if (preferences.type === "anime") {
      const origins = movie.origin_country || [];
      const isJP = origins.includes("JP") || movie.original_language === "ja";
      if (!genreIds.includes(ANIMATION_GENRE_ID) || !isJP) return false;
    }

    if (preferences.audience === "family" && movie.adult === true) return false;

    return true;
  });
}

module.exports = {
  buildUserPreferences,
  buildDiscoverParams,
  applyFilters,
  TMDB_PROVIDER_IDS
};
