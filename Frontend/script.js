// Funktion zum Aktualisieren der sprachabhängigen Modal-Inhalte
function updateModalLanguage(details) {
  if (!details) return; // Keine Details vorhanden
  
  const currentLang = localStorage.getItem("cinematch.lang") || "de";
  
  const genresText = currentLang === "en"
    ? (details.genres_en || details.genres || 'Unknown')
    : (details.genres || details.genres_en || 'Unbekannt');

  const titleText = currentLang === "en"
    ? (details.title_en || details.title || details.name || 'Untitled')
    : (details.title || details.name || 'Unbenannt');
  document.getElementById('modalTitle').textContent = titleText;
  document.getElementById('modalGenres').textContent = genresText;
  const poster = document.getElementById('modalPoster');
  if (poster) poster.alt = titleText;
  
  // Wähle Beschreibung basierend auf aktiver Sprache
  const overviewText = currentLang === "en"
    ? (details.overview_en || details.overview || 'No description available')
    : (details.overview || details.overview_en || 'Keine Beschreibung verfügbar');
  document.getElementById('modalOverview').textContent = overviewText;
}

const WEB_BASE = "http://localhost:3001";
const API_BASE = "http://localhost:3001";
let currentUser = null;
const t = (key, fb) => (window.I18n ? window.I18n.t(key, fb) : fb || key);

// Event Listener für Sprachänderungen
document.addEventListener('languagechange', (event) => {
  // Wenn Modal offen ist, Sprache der Inhalte aktualisieren
  const modal = document.getElementById('movieModal');
  if (modal && modal.classList.contains('show')) {
    // Details aus dem Modal lesen (werden als data-attribute gespeichert)
    const details = modal.dataset.movieDetails ? JSON.parse(modal.dataset.movieDetails) : null;
    if (details) {
      updateModalLanguage(details);
    }
  }
});

// Promise, das aufgelöst wird sobald loadUserSession() einmal durchgelaufen ist.
// Wir nutzen das in der Suche, damit das History-Dropdown beim Fokus auf das
// leere Feld nicht "blind" rendert, bevor wir wissen, wer eingeloggt ist.
let _resolveSessionReady;
const sessionReady = new Promise(res => { _resolveSessionReady = res; });

async function loadUserSession() {
  try {
    const response = await fetch(`${API_BASE}/session`, { credentials: "include" });
    const user = await response.json();
    currentUser = user;
    updateUserArea(user);
  } catch (error) {
    console.error("Fehler beim Laden der Session:", error);
    currentUser = null;
    updateUserArea(null);
  } finally {
    if (typeof invalidateQueryHistoryCache === "function") {
      invalidateQueryHistoryCache();
    }
    if (_resolveSessionReady) {
      _resolveSessionReady(currentUser);
      _resolveSessionReady = null;
    }
    // Falls das Suchfeld schon fokussiert ist und leer ist, History
    // nachträglich rendern (Race-Condition zwischen Focus und Session-Load).
    const input = document.getElementById("searchInput");
    if (input && document.activeElement === input && input.value.trim().length === 0) {
      if (typeof getQueryHistory === "function" && typeof renderDropdown === "function") {
        getQueryHistory().then(history => renderDropdown({ history }));
      }
    }
  }
}

function updateUserArea(user) {
  const area = document.getElementById("userArea");

  if (!user) {
    // Benutzer nicht angemeldet - Login/Register Links anzeigen
    area.innerHTML = `
      <div class="auth-links">
        <a href="${WEB_BASE}/Login.html" class="login-link">${t("header.login")}</a>
        <a href="${WEB_BASE}/Register.html" class="register-link">${t("header.register")}</a>
      </div>
    `;
  } else {
    const firstInitial = (user.firstName || "").trim().charAt(0).toUpperCase();
    const lastInitial = (user.lastName || "").trim().charAt(0).toUpperCase();
    const initials = `${firstInitial}${lastInitial}` || "U";

    const avatar = user.profile_picture
      ? `<img class="user-initials-avatar user-avatar-img" src="${API_BASE}${user.profile_picture}" alt="Profilbild">`
      : `<span class="user-initials-avatar">${initials}</span>`;

    // Benutzer angemeldet - User Icon mit Dropdown anzeigen
    area.innerHTML = `
      <div class="user-dropdown-trigger" id="userDropdownTrigger">
        ${avatar}
        <span class="dropdown-arrow" id="dropdownArrow">▼</span>
      </div>
      <div class="user-dropdown-menu" id="userDropdownMenu">
        <div class="user-info">
          <div class="user-name">${user.firstName} ${user.lastName}</div>
          <div class="user-email">${user.email}</div>
        </div>
        <a href="${WEB_BASE}/Profil.html" class="dropdown-menu-item profile">
          <span>👤</span>
          <span>${t("header.profile")}</span>
        </a>
        <div class="dropdown-separator"></div>
        <a href="#" class="dropdown-menu-item logout" onclick="handleLogout(event)">
          <span>🚪</span>
          <span>${t("header.logout")}</span>
        </a>
      </div>
    `;

    // Event Listener für Dropdown Toggle
    const trigger = document.getElementById("userDropdownTrigger");
    const menu = document.getElementById("userDropdownMenu");
    const arrow = document.getElementById("dropdownArrow");

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("show");
      arrow.classList.toggle("open");
    });

    // Dropdown schließen wenn außerhalb geklickt wird
    document.addEventListener("click", (e) => {
      if (!trigger.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove("show");
        arrow.classList.remove("open");
      }
    });
  }
}

// Logout Funktion
async function handleLogout(event) {
  event.preventDefault();
  
  try {
    const response = await fetch(`${API_BASE}/logout`, { credentials: "include" });
    const data = await response.json();
    
    if (data.success) {
      // Session gelöscht - Seite neu laden
      const target = data.redirectTo || "/CineMatch.html";
      window.location.href = target.startsWith("http") ? target : `${WEB_BASE}${target}`;
    }
  } catch (error) {
    console.error("Logout Fehler:", error);
  }
}

// Quiz Button Funktion - Redirect zur Quiz Seite oder Login falls nicht angemeldet
function redirectToQuiz() {
  if (!currentUser) {
    const redirect = encodeURIComponent("Quiz.html");
    window.location.href = `Login.html?redirect=${redirect}`;
  } else {
    window.location.href = "Quiz.html";
  }
}

// Navigation zur Film-Detailseite. Wird von Trending-Klicks und Suchvorschlägen genutzt.
function goToMoviePage(movieId) {
  if (!movieId) return;
  window.location.href = `Movie.html?id=${encodeURIComponent(movieId)}`;
}
/*
// ==== Film-Details der Filme auf der Homepage anzeigen ====
// Modal Funktionen für Film-Details
// Film-Details vom Backend laden und Modal anzeigen
async function openMovieModal(movie) {
  try {
    console.log('Film-Modal geöffnet für:', movie.title || movie.name, 'ID:', movie.id);
    
    // Lade detaillierte Infos vom Backend (mit deutschem Text, Director, Writer, etc.)
    const response = await fetch(`${API_BASE}/api/movie-details/${movie.id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const details = await response.json();
    console.log('Film-Details geladen:', details);
    
    // Sprache direkt aus localStorage lesen (zuverlässiger als window.I18n.current)
    const currentLang = localStorage.getItem("cinematch.lang") || "de";
    const titleText = currentLang === "en"
      ? (details.title_en || details.title || details.name || 'Untitled')
      : (details.title || details.name || 'Unbenannt');
    
    // Film-Daten in Modal einfügen
    document.getElementById('modalTitle').textContent = titleText;
    document.getElementById('modalRating').textContent = details.vote_average.toFixed(1);
    document.getElementById('modalReleaseDate').textContent = details.release_date_formatted || 'Unbekannt';
    document.getElementById('modalRuntime').textContent = details.runtime_formatted || 'Unbekannt';
    
    // Details im Modal speichern für Sprachwechsel
    const modal = document.getElementById('movieModal');
    modal.dataset.movieDetails = JSON.stringify(details);
    
    const genresText = currentLang === "en"
      ? (details.genres_en || details.genres || 'Unknown')
      : (details.genres || details.genres_en || 'Unbekannt');

    document.getElementById('modalGenres').textContent = genresText;
    document.getElementById('modalDirector').textContent = details.director || 'Unbekannt';
    document.getElementById('modalWriter').textContent = details.writers || 'Unbekannt';
    document.getElementById('modalVoteCount').textContent = `${details.vote_count}`;
    
    // Wähle Beschreibung basierend auf aktiver Sprache
    const overviewText = currentLang === "en"
      ? (details.overview_en || details.overview || 'No description available')
      : (details.overview || details.overview_en || 'Keine Beschreibung verfügbar');
    document.getElementById('modalOverview').textContent = overviewText;
    
    // Poster-Bild setzen
    const posterUrl = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
    document.getElementById('modalPoster').src = posterUrl;
    document.getElementById('modalPoster').alt = titleText;
    
    // Modal anzeigen
    modal.classList.add('show');
    
    // Body scrollen verhindern wenn Modal offen ist
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Fehler beim Laden der Film-Details:', error);
    alert('Fehler beim Laden der Film-Details: ' + error.message);
  }
}

function closeMovieModal() {
  const modal = document.getElementById('movieModal');
  modal.classList.remove('show');
  
  // Body scrollen wieder erlauben
  document.body.style.overflow = 'auto';

  */

// Session beim Laden der Seite abrufen
loadUserSession();

// Bei Sprachwechsel die User-Area neu rendern, damit Login/Profil/Logout-Labels mitziehen
document.addEventListener("languagechange", () => {
  updateUserArea(currentUser);
  loadTrendingMovies();
});

// Trend-Filme laden und anzeigen
async function loadTrendingMovies() {
  console.log("loadTrendingMovies() gestartet");
  try {
    // API-Request zu Backend
    const currentLang = localStorage.getItem("cinematch.lang") || "de";
    const apiUrl = `${API_BASE}/api/trending-movies?lang=${currentLang}`;
    console.log("Fetching:", apiUrl);
    const response = await fetch(apiUrl);
    console.log("Response Status:", response.status, response.ok);
    
    // Fehlerbehandlung bei HTTP-Fehlern
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Response als JSON parsen
    const data = await response.json();
    console.log("API Response:", data);
    
    // Überprüfe ob Filmdaten vorhanden sind
    if (!data.results || !Array.isArray(data.results)) {
      console.error("Invalid response format:", data);
      return;
    }
    
    // Filme auf Seite rendern
    console.log("Calling displayMovies with", data.results.length, "movies");
    displayMovies(data.results, "trendingCarousel", currentLang);
  } catch (error) {
    console.error("Error loading trending movies:", error);
    const carousel = document.getElementById("trendingCarousel");
    if (carousel) {
      // Fehlermeldung anzeigen wenn API-Abruf fehlschlägt
      carousel.innerHTML = `<p style="color: red;">Fehler beim Laden der Filme: ${error.message}</p>`;
    }
  }
}

// Filme in HTML-Karten umwandeln und auf Seite anzeigen
//function displayMovies(movies, containerId)
function displayMovies(movies, containerId, lang) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = ''; // Container leeren

  let addedMovies = 0;
  movies.forEach(movie => {
    // Überspringe Filme ohne Poster-Bild
    if (!movie.poster_path) return;
    
    // Neue Film-Karte erstellen
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    
    // Poster-URL zusammensetzen (TMDB CDN)
    const posterPath = movie.poster_path;
    const posterUrl = `https://image.tmdb.org/t/p/w300${posterPath}`;
    
    // Poster als Hintergrund-Bild setzen
    movieCard.style.backgroundImage = `url('${posterUrl}')`;
    addedMovies++;
    
    const titleText = lang === "en"
      ? (movie.title_en || movie.title || movie.name)
      : (movie.title || movie.name);
    
    // Titel und Rating als HTML Content
    movieCard.innerHTML = `
      <div class="movie-card-info">
        <div class="movie-card-title">${titleText}</div>
        <div class="movie-card-rating">⭐ ${movie.vote_average.toFixed(1)}</div>
      </div>
    `;
    
    // Click-Event: zur Film-Detailseite navigieren
    movieCard.addEventListener('click', () => {
      goToMoviePage(movie.id);
    });
    
    // Film-Karte zum Carousel hinzufügen
    container.appendChild(movieCard);
  });
  console.log(`${addedMovies} Filme hinzugefügt zu ${containerId}`);
}

// Trend-Filme nur laden, wenn die Homepage geladen ist (Carousel vorhanden)
if (document.getElementById("trendingCarousel")) {
  loadTrendingMovies();
}

// ============================================================
// SUCHE: Live-Autocomplete + Suchanfragen-Historie (textbasiert)
// ============================================================
//
// Datenmodell für `searchCurrentItems` (Tastaturnavigation + Klicks):
//   { kind: "history", id: <int>, query: <string> }
//   { kind: "movie",   id: <int>, title, poster_path, release_date, vote_average }

const SEARCH_DEBOUNCE_MS = 220;
let searchDebounceTimer = null;
let searchAbortController = null;
let searchActiveIndex = -1;
let searchCurrentItems = [];

// Cache für die Query-Historie, damit wir nicht bei jedem Tastendruck neu fetchen.
// Wird beim Speichern/Löschen invalidiert.
let queryHistoryCache = null;
let queryHistoryPromise = null;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function posterThumb(path) {
  return path
    ? `https://image.tmdb.org/t/p/w92${path}`
    : "https://via.placeholder.com/40x60/2a2a2a/666?text=%3F";
}

// ---------- Query-Historie: Backend-Kommunikation ----------

function invalidateQueryHistoryCache() {
  queryHistoryCache = null;
  queryHistoryPromise = null;
}

async function getQueryHistory() {
  // Auf die initiale Session-Auflösung warten, damit der erste Fokus auf das
  // leere Suchfeld nicht "zu früh" mit currentUser=null abbricht.
  await sessionReady;
  if (!currentUser) return [];
  if (queryHistoryCache !== null) return queryHistoryCache;
  if (queryHistoryPromise) return queryHistoryPromise;
  queryHistoryPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/search-queries`, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      queryHistoryCache = data.queries || [];
      return queryHistoryCache;
    } catch (err) {
      console.error("Query-Historie laden fehlgeschlagen:", err);
      return [];
    } finally {
      queryHistoryPromise = null;
    }
  })();
  return queryHistoryPromise;
}

async function saveSearchQuery(query) {
  // Erst sicherstellen, dass wir wissen, ob/wer eingeloggt ist.
  await sessionReady;
  if (!currentUser) return;
  const q = (query || "").trim();
  if (!q) return;
  try {
    const res = await fetch(`${API_BASE}/api/search-queries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ query: q })
    });
    if (!res.ok) {
      console.warn("Suchanfrage speichern: HTTP", res.status);
      return;
    }
    invalidateQueryHistoryCache();
  } catch (err) {
    console.error("Suchanfrage speichern fehlgeschlagen:", err);
  }
}

async function removeQueryHistoryEntry(id) {
  if (!id) return;
  try {
    const res = await fetch(`${API_BASE}/api/search-queries/${id}`, {
      method: "DELETE",
      credentials: "include"
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    invalidateQueryHistoryCache();
    // Dropdown frisch aufbauen (Input-Wert berücksichtigen)
    refreshDropdownForCurrentInput();
  } catch (err) {
    console.error("Eintrag entfernen fehlgeschlagen:", err);
  }
}

async function clearQueryHistory() {
  try {
    await fetch(`${API_BASE}/api/search-queries`, {
      method: "DELETE",
      credentials: "include"
    });
    invalidateQueryHistoryCache();
    refreshDropdownForCurrentInput();
  } catch (err) {
    console.error("Verlauf löschen fehlgeschlagen:", err);
  }
}

// ---------- Live-Suche: TMDB-Vorschläge ----------

async function fetchSearchSuggestions(query) {
  if (searchAbortController) searchAbortController.abort();
  searchAbortController = new AbortController();
  const spinner = document.getElementById("searchSpinner");
  spinner.classList.add("active");

  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=6`, {
      signal: searchAbortController.signal
    });
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    if (err.name === "AbortError") return null;
    console.error("Suchfehler:", err);
    return [];
  } finally {
    spinner.classList.remove("active");
  }
}

// Historie nach Tippeingabe filtern (case-insensitive Substring, max. 5 Treffer).
function filterHistoryByPrefix(history, prefix) {
  const lower = prefix.toLowerCase();
  return history
    .filter(h => h.query.toLowerCase().includes(lower) && h.query.toLowerCase() !== lower)
    .slice(0, 5);
}

// ---------- Rendering ----------

// Einheitliches Rendering: oben Historie, darunter Live-Vorschläge.
function renderDropdown({ history = [], suggestions = [], emptyMessage = null }) {
  const dropdown = document.getElementById("searchDropdown");
  if (!dropdown) return;

  if (!history.length && !suggestions.length) {
    if (emptyMessage) {
      dropdown.innerHTML = `<div class="search-empty">${escapeHtml(emptyMessage)}</div>`;
      dropdown.hidden = false;
    } else {
      dropdown.hidden = true;
    }
    searchCurrentItems = [];
    searchActiveIndex = -1;
    return;
  }

  // Kombinierte Liste für Tastaturnavigation
  searchCurrentItems = [
    ...history.map(h => ({ kind: "history", id: h.id, query: h.query })),
    ...suggestions.map(m => ({
      kind: "movie",
      id: m.id,
      title: m.title,
      poster_path: m.poster_path,
      release_date: m.release_date,
      vote_average: m.vote_average
    }))
  ];
  searchActiveIndex = -1;

  const removeLabel = t("search.removeEntry", "Aus Verlauf entfernen");
  const clockSvg = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle>
      <polyline points="12 7 12 12 15 14"></polyline>
    </svg>`;
  const closeSvg = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
         stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18"></line>
      <line x1="18" y1="6" x2="6" y2="18"></line>
    </svg>`;

  let html = "";

  if (history.length) {
    html += `
      <div class="search-dropdown-header">
        <span>${t("search.history", "Suchverlauf")}</span>
      </div>
    `;
    history.forEach((h, i) => {
      html += `
        <div class="search-suggestion search-suggestion-history" data-index="${i}" data-query-id="${h.id}">
          <span class="search-suggestion-icon" aria-hidden="true">${clockSvg}</span>
          <div class="search-suggestion-info">
            <div class="search-suggestion-title">${escapeHtml(h.query)}</div>
          </div>
          <button type="button" class="search-suggestion-remove"
                  data-query-id="${h.id}"
                  aria-label="${removeLabel}" title="${removeLabel}">
            ${closeSvg}
          </button>
        </div>
      `;
    });
  }

  if (suggestions.length) {
    const offset = history.length;
    suggestions.forEach((m, i) => {
      const idx = offset + i;
      const year = (m.release_date || "").slice(0, 4);
      const rating = m.vote_average ? `⭐ ${m.vote_average.toFixed(1)}` : "";
      const meta = [year, rating].filter(Boolean).join(" · ");
      html += `
        <div class="search-suggestion search-suggestion-movie" data-index="${idx}" data-id="${m.id}">
          <img src="${posterThumb(m.poster_path)}" alt="">
          <div class="search-suggestion-info">
            <div class="search-suggestion-title">${escapeHtml(m.title)}</div>
            <div class="search-suggestion-meta">${meta}</div>
          </div>
        </div>
      `;
    });
  }

  dropdown.innerHTML = html;
  dropdown.hidden = false;

  // Click-Handler: für alle Items anhand des Item-Typs in searchCurrentItems
  dropdown.querySelectorAll(".search-suggestion").forEach(el => {
    el.addEventListener("click", (e) => {
      // Klick auf das ✕-Icon nicht als Auswahl werten
      if (e.target.closest(".search-suggestion-remove")) return;
      const i = parseInt(el.dataset.index, 10);
      pickItem(searchCurrentItems[i]);
    });
  });

  // ✕-Icon: einzelnen Query-Eintrag entfernen
  dropdown.querySelectorAll(".search-suggestion-remove").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const id = parseInt(btn.dataset.queryId, 10);
      await removeQueryHistoryEntry(id);
    });
  });
}

// Dropdown neu aufbauen anhand des aktuellen Input-Werts
// (z. B. nach Löschen eines History-Eintrags).
async function refreshDropdownForCurrentInput() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  const query = input.value.trim();
  if (!query) {
    const history = await getQueryHistory();
    renderDropdown({ history });
  } else {
    const all = await getQueryHistory();
    const history = filterHistoryByPrefix(all, query);
    // Vorschläge nicht neu fetchen, also leer lassen – schneller, und
    // die ursprünglichen Vorschläge sind nach DOM-Reset weg.
    renderDropdown({ history });
    // Frisch laden, damit Vorschläge wieder da sind
    const suggestions = await fetchSearchSuggestions(query);
    if (suggestions !== null) {
      renderDropdown({ history, suggestions });
    }
  }
}

// Klick / Enter auf einen Eintrag im Dropdown
function pickItem(item) {
  if (!item) return;
  closeSearchDropdown();
  if (item.kind === "history") {
    const input = document.getElementById("searchInput");
    if (input) input.value = item.query;
    window.location.href = `Search.html?q=${encodeURIComponent(item.query)}`;
  } else if (item.kind === "movie") {
    const input = document.getElementById("searchInput");
    if (input) input.value = "";
    window.location.href = `Movie.html?id=${encodeURIComponent(item.id)}`;
  }
}

function closeSearchDropdown() {
  const dropdown = document.getElementById("searchDropdown");
  if (!dropdown) return;
  dropdown.hidden = true;
  searchActiveIndex = -1;
  searchCurrentItems = [];
}

function highlightActiveSuggestion() {
  const dropdown = document.getElementById("searchDropdown");
  dropdown.querySelectorAll(".search-suggestion").forEach((el, i) => {
    el.classList.toggle("active", i === searchActiveIndex);
    if (i === searchActiveIndex) el.scrollIntoView({ block: "nearest" });
  });
}

// Allgemeine Suche: Enter im Input oder Klick auf die Lupe -> Ergebnisseite öffnen.
async function submitGeneralSearch() {
  const input = document.getElementById("searchInput");
  const query = (input?.value || "").trim();
  if (!query) return;
  closeSearchDropdown();
  // Wichtig: vor der Navigation auf den POST warten (mit Sicherheits-Timeout),
  // damit die Anfrage nicht durch window.location.href abgebrochen wird.
  try {
    await Promise.race([
      saveSearchQuery(query),
      new Promise(resolve => setTimeout(resolve, 1200))
    ]);
  } catch (_) { /* nicht blockieren */ }
  window.location.href = `Search.html?q=${encodeURIComponent(query)}`;
}

function initSearch() {
  const input = document.getElementById("searchInput");
  const form = document.getElementById("searchBar");
  if (!input) return;

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // Wenn ein Eintrag per Tastatur markiert ist: dieser hat Vorrang.
      if (searchActiveIndex >= 0 && searchCurrentItems.length) {
        pickItem(searchCurrentItems[searchActiveIndex]);
        return;
      }
      submitGeneralSearch();
    });
  }

  input.addEventListener("input", async () => {
    const query = input.value.trim();
    clearTimeout(searchDebounceTimer);

    if (query.length === 0) {
      // Leeres Feld -> reine Historie zeigen
      const history = await getQueryHistory();
      renderDropdown({ history });
      return;
    }

    // History sofort einblenden (lokal gefiltert), Movie-Vorschläge debounced.
    const allHistory = await getQueryHistory();
    const historyMatches = filterHistoryByPrefix(allHistory, query);
    renderDropdown({ history: historyMatches }); // zwischenzeitlicher Stand

    searchDebounceTimer = setTimeout(async () => {
      const suggestions = await fetchSearchSuggestions(query);
      if (suggestions === null) return; // abgebrochen
      // Historie könnte sich in der Zwischenzeit nicht geändert haben,
      // aber zur Sicherheit noch einmal frisch ziehen.
      const latestHistory = await getQueryHistory();
      const latestMatches = filterHistoryByPrefix(latestHistory, query);
      renderDropdown({
        history: latestMatches,
        suggestions
      });
    }, SEARCH_DEBOUNCE_MS);
  });

  input.addEventListener("focus", async () => {
    const query = input.value.trim();
    if (query.length === 0) {
      const history = await getQueryHistory();
      renderDropdown({ history });
    }
  });

  input.addEventListener("keydown", (e) => {
    const dropdown = document.getElementById("searchDropdown");
    if (dropdown.hidden || !searchCurrentItems.length) {
      if (e.key === "Enter") {
        // Default-Submit-Verhalten greifen lassen
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      searchActiveIndex = (searchActiveIndex + 1) % searchCurrentItems.length;
      highlightActiveSuggestion();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      searchActiveIndex = (searchActiveIndex - 1 + searchCurrentItems.length) % searchCurrentItems.length;
      highlightActiveSuggestion();
    } else if (e.key === "Escape") {
      closeSearchDropdown();
      input.blur();
    }
  });

  document.addEventListener("click", (e) => {
    const bar = document.querySelector(".search-bar");
    if (bar && !bar.contains(e.target)) {
      closeSearchDropdown();
    }
  });
}

// Wenn die Session asynchron geladen wird, sind beim ersten initSearch()
// vielleicht weder currentUser noch History bekannt. Bei "languagechange"
// (kommt nach Session-Update via updateUserArea nicht, aber bei Sprachwechsel)
// invalidieren wir den Cache, falls sich der User unterscheidet.
document.addEventListener("DOMContentLoaded", () => {
  initSearch();
});
