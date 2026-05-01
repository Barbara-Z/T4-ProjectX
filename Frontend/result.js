// Renders the final, designed result page from the data quiz.js stashed
// in sessionStorage. Falls back to fetching nothing — the page only displays
// what the quiz pipeline produced.

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

const PROVIDER_LABELS = {
  netflix: "Netflix",
  amazon: "Amazon Prime",
  disney: "Disney+",
  any: null
};

const RUNTIME_LABELS = {
  short: "kurz (<90 min)",
  medium: "mittel (90–120 min)",
  long: "lang (>120 min)",
  any: null
};

const TYPE_LABELS = {
  animation: "animiert",
  anime: "Anime",
  live_action: "Realfilm",
  any: null
};

const AUDIENCE_LABELS = {
  family: "familienfreundlich",
  adult: "Erwachsene",
  any: null
};

document.addEventListener("DOMContentLoaded", () => {
  const raw = sessionStorage.getItem("quizResult");
  const cards = document.getElementById("cards");

  if (!raw) {
    cards.innerHTML = `
      <div class="empty">
        Es liegt noch kein Quiz-Ergebnis vor.
        <br><br>
        <a href="/Quiz.html" style="color:#bb0d13; font-weight:600;">Jetzt das Quiz starten →</a>
      </div>`;
    return;
  }

  let result;
  try {
    result = JSON.parse(raw);
  } catch (err) {
    cards.innerHTML = `<div class="error">Ergebnis konnte nicht gelesen werden.</div>`;
    return;
  }

  document.getElementById("top-genre").textContent = formatGenre(result.topGenre);
  document.getElementById("prefs-summary").textContent = formatPrefs(result.userPreferences);

  const recs = Array.isArray(result.recommendations) ? result.recommendations : [];

  if (recs.length === 0) {
    cards.innerHTML = `
      <div class="empty">
        Keine passenden Filme gefunden. Versuche es mit anderen Antworten.
        <br><br>
        <a href="/Quiz.html" style="color:#bb0d13; font-weight:600;">Quiz wiederholen →</a>
      </div>`;
    return;
  }

  cards.innerHTML = recs.map(renderCard).join("");
});

function renderCard(movie, index) {
  const poster = movie.poster_path
    ? `<img class="card-poster" src="${POSTER_BASE}${movie.poster_path}" alt="${escapeHtml(movie.title)} Poster" loading="lazy">`
    : `<div class="card-poster placeholder">Kein Poster verfügbar</div>`;

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const runtime = movie.runtime ? `${movie.runtime} min` : null;
  const rating = typeof movie.vote_average === "number" ? `★ ${movie.vote_average.toFixed(1)}` : null;
  const meta = [year, runtime, rating].filter(Boolean).join(" • ");

  const genres = (movie.genres || [])
    .map(g => `<span class="genre-tag">${escapeHtml(formatGenre(g))}</span>`)
    .join("");

  return `
    <article class="card">
      <span class="card-rank">#${index + 1}</span>
      <span class="card-score">Match ${movie.score?.toFixed?.(2) ?? movie.score}</span>
      ${poster}
      <div class="card-body">
        <h2 class="card-title">${escapeHtml(movie.title || "Ohne Titel")}</h2>
        <p class="card-meta">${meta}</p>
        <p class="card-overview">${escapeHtml(movie.overview || "Keine Beschreibung verfügbar.")}</p>
        <div class="card-genres">${genres}</div>
      </div>
    </article>
  `;
}

function formatGenre(name) {
  if (!name) return "–";
  return name.replace(/_/g, " ");
}

function formatPrefs(prefs) {
  if (!prefs) return "";
  const parts = [
    PROVIDER_LABELS[prefs.provider],
    RUNTIME_LABELS[prefs.runtime],
    TYPE_LABELS[prefs.type],
    AUDIENCE_LABELS[prefs.audience]
  ].filter(Boolean);
  return parts.length ? `• ${parts.join(" • ")}` : "";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
