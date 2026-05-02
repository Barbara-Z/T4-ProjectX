// Renders the final, designed result page from the data quiz.js stashed
// in sessionStorage. Falls back to fetching nothing — the page only displays
// what the quiz pipeline produced.

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const t = (key, fb) => (window.I18n ? window.I18n.t(key, fb) : fb || key);

const PREF_KEYS = {
  provider: { netflix: "pref.provider.netflix", amazon: "pref.provider.amazon", disney: "pref.provider.disney" },
  runtime: { short: "pref.runtime.short", medium: "pref.runtime.medium", long: "pref.runtime.long" },
  type: { animation: "pref.type.animation", anime: "pref.type.anime", live_action: "pref.type.live_action" },
  audience: { family: "pref.audience.family", adult: "pref.audience.adult" }
};

let cachedResult = null;

document.addEventListener("DOMContentLoaded", () => {
  const raw = sessionStorage.getItem("quizResult");
  if (!raw) {
    renderEmptyState();
    return;
  }
  try {
    cachedResult = JSON.parse(raw);
  } catch (err) {
    document.getElementById("cards").innerHTML =
      `<div class="error">${t("result.readError")}</div>`;
    return;
  }
  renderResult();
});

document.addEventListener("languagechange", renderResult);

function renderEmptyState() {
  document.getElementById("cards").innerHTML = `
    <div class="empty">
      ${t("result.noResult")}
      <br><br>
      <a href="/Quiz.html" style="color:#e50914; font-weight:600;">${t("result.startQuiz")}</a>
    </div>`;
}

function renderResult() {
  if (!cachedResult) return;
  const cards = document.getElementById("cards");
  document.getElementById("top-genre").textContent = formatGenre(cachedResult.topGenre);
  document.getElementById("prefs-summary").textContent = formatPrefs(cachedResult.userPreferences);

  const recs = Array.isArray(cachedResult.recommendations) ? cachedResult.recommendations : [];
  if (recs.length === 0) {
    cards.innerHTML = `
      <div class="empty">
        ${t("result.empty")}
        <br><br>
        <a href="/Quiz.html" style="color:#e50914; font-weight:600;">${t("result.retake")} →</a>
      </div>`;
    return;
  }
  cards.innerHTML = recs.map(renderCard).join("");
}

function renderCard(movie, index) {
  const poster = movie.poster_path
    ? `<img class="card-poster" src="${POSTER_BASE}${movie.poster_path}" alt="${escapeHtml(movie.title)} Poster" loading="lazy">`
    : `<div class="card-poster placeholder">${t("result.noPoster")}</div>`;

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
      <span class="card-score">${t("result.match")} ${movie.score?.toFixed?.(2) ?? movie.score}</span>
      ${poster}
      <div class="card-body">
        <h2 class="card-title">${escapeHtml(movie.title || t("result.noTitle"))}</h2>
        <p class="card-meta">${meta}</p>
        <p class="card-overview">${escapeHtml(movie.overview || t("result.noOverview"))}</p>
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
  const parts = ["provider", "runtime", "type", "audience"]
    .map(field => {
      const value = prefs[field];
      const key = PREF_KEYS[field][value];
      return key ? t(key) : null;
    })
    .filter(Boolean);
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
