// User-Session laden und User Area aktualisieren
let currentUser = null;
const WEB_BASE = "http://localhost:3001";
const API_BASE = "http://localhost:3001";
const t = (key, fb) => (window.I18n ? window.I18n.t(key, fb) : fb || key);

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

// Session beim Laden der Seite abrufen
loadUserSession();

// Bei Sprachwechsel die User-Area neu rendern, damit Login/Profil/Logout-Labels mitziehen
document.addEventListener("languagechange", () => updateUserArea(currentUser));

// Trend-Filme laden und anzeigen
async function loadTrendingMovies() {
  console.log("loadTrendingMovies() gestartet");
  try {
    // API-Request zu Backend
    const apiUrl = `${API_BASE}/api/trending-movies`;
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
    displayMovies(data.results, "trendingCarousel");
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
// (wird auch von Search.html genutzt, deshalb global verfügbar)
function displayMovies(movies, containerId) {
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
    
    // Titel und Rating als HTML Content
    movieCard.innerHTML = `
      <div class="movie-card-info">
        <div class="movie-card-title">${movie.title || movie.name}</div>
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
// SUCHE: Live-Autocomplete + Suchverlauf
// ============================================================

const SEARCH_DEBOUNCE_MS = 220;
let searchDebounceTimer = null;
let searchAbortController = null;
let searchActiveIndex = -1;
let searchCurrentItems = []; // {id, title, poster_path} für Tastaturnavigation

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

// Vorschläge im Dropdown rendern (Autocomplete-Treffer)
function renderSearchSuggestions(items) {
  const dropdown = document.getElementById("searchDropdown");
  searchCurrentItems = items;
  searchActiveIndex = -1;

  if (!items.length) {
    dropdown.innerHTML = `<div class="search-empty">${t("search.noResults", "Keine Ergebnisse gefunden")}</div>`;
    dropdown.hidden = false;
    return;
  }

  const html = items.map((m, i) => {
    const year = (m.release_date || "").slice(0, 4);
    const rating = m.vote_average ? `⭐ ${m.vote_average.toFixed(1)}` : "";
    const meta = [year, rating].filter(Boolean).join(" · ");
    return `
      <div class="search-suggestion" data-index="${i}" data-id="${m.id}">
        <img src="${posterThumb(m.poster_path)}" alt="">
        <div class="search-suggestion-info">
          <div class="search-suggestion-title">${escapeHtml(m.title)}</div>
          <div class="search-suggestion-meta">${meta}</div>
        </div>
      </div>
    `;
  }).join("");

  dropdown.innerHTML = html;
  dropdown.hidden = false;

  dropdown.querySelectorAll(".search-suggestion").forEach(el => {
    el.addEventListener("click", () => {
      const i = parseInt(el.dataset.index, 10);
      handleSuggestionPick(searchCurrentItems[i]);
    });
  });
}

// Suchverlauf rendern (wenn Input leer & User eingeloggt)
function renderSearchHistory(history) {
  const dropdown = document.getElementById("searchDropdown");
  searchCurrentItems = history;
  searchActiveIndex = -1;

  if (!history.length) {
    dropdown.hidden = true;
    return;
  }

  const items = history.map((m, i) => `
    <div class="search-suggestion" data-index="${i}" data-id="${m.movie_id}">
      <img src="${posterThumb(m.poster_path)}" alt="">
      <div class="search-suggestion-info">
        <div class="search-suggestion-title">${escapeHtml(m.title)}</div>
        <div class="search-suggestion-meta">${t("search.previousSearch", "Zuletzt gesucht")}</div>
      </div>
    </div>
  `).join("");

  dropdown.innerHTML = `
    <div class="search-dropdown-header">
      <span>${t("search.history", "Suchverlauf")}</span>
      <button type="button" class="search-clear-btn" id="searchClearBtn">
        ${t("search.clear", "Verlauf löschen")}
      </button>
    </div>
    ${items}
  `;
  dropdown.hidden = false;

  dropdown.querySelectorAll(".search-suggestion").forEach(el => {
    el.addEventListener("click", () => {
      const i = parseInt(el.dataset.index, 10);
      const entry = searchCurrentItems[i];
      handleSuggestionPick({
        id: entry.movie_id,
        title: entry.title,
        poster_path: entry.poster_path
      });
    });
  });

  document.getElementById("searchClearBtn")?.addEventListener("click", async (e) => {
    e.stopPropagation();
    await clearSearchHistory();
  });
}

async function fetchSearchSuggestions(query) {
  if (searchAbortController) searchAbortController.abort();
  searchAbortController = new AbortController();
  const spinner = document.getElementById("searchSpinner");
  spinner.classList.add("active");

  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`, {
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

async function loadAndShowHistory() {
  if (!currentUser) {
    document.getElementById("searchDropdown").hidden = true;
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/search-history`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    renderSearchHistory(data.history || []);
  } catch (err) {
    console.error("Suchverlauf-Fehler:", err);
  }
}

async function clearSearchHistory() {
  try {
    await fetch(`${API_BASE}/api/search-history`, {
      method: "DELETE",
      credentials: "include"
    });
    document.getElementById("searchDropdown").hidden = true;
  } catch (err) {
    console.error("Suchverlauf-Löschen fehlgeschlagen:", err);
  }
}

async function saveToSearchHistory(movie) {
  if (!currentUser) return;
  try {
    await fetch(`${API_BASE}/api/search-history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path || null
      })
    });
  } catch (err) {
    console.error("Verlauf speichern fehlgeschlagen:", err);
  }
}

// Wird ausgelöst, wenn der User einen Vorschlag oder Verlaufseintrag wählt.
// Direkter Klick während der Suche -> direkt zur Film-Detailseite.
function handleSuggestionPick(movie) {
  if (!movie) return;
  closeSearchDropdown();
  document.getElementById("searchInput").value = "";
  saveToSearchHistory(movie);
  window.location.href = `Movie.html?id=${encodeURIComponent(movie.id)}`;
}

function closeSearchDropdown() {
  const dropdown = document.getElementById("searchDropdown");
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
function submitGeneralSearch() {
  const input = document.getElementById("searchInput");
  const query = (input?.value || "").trim();
  if (!query) return;
  closeSearchDropdown();
  window.location.href = `Search.html?q=${encodeURIComponent(query)}`;
}

function initSearch() {
  const input = document.getElementById("searchInput");
  const form = document.getElementById("searchBar");
  if (!input) return;

  // Form-Submit fängt Enter UND Klick auf den Lupen-Button ab.
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // Wenn ein Vorschlag aktiv markiert ist, hat das keydown-Handling Vorrang.
      if (searchActiveIndex >= 0 && searchCurrentItems.length) return;
      submitGeneralSearch();
    });
  }

  input.addEventListener("input", () => {
    const query = input.value.trim();
    clearTimeout(searchDebounceTimer);

    if (query.length === 0) {
      // Leeres Feld -> Verlauf zeigen, falls eingeloggt
      loadAndShowHistory();
      return;
    }

    if (query.length < 2) {
      // Erst ab 2 Zeichen sinnvoll suchen
      document.getElementById("searchDropdown").hidden = true;
      return;
    }

    searchDebounceTimer = setTimeout(async () => {
      const items = await fetchSearchSuggestions(query);
      if (items === null) return; // abgebrochen
      renderSearchSuggestions(items);
    }, SEARCH_DEBOUNCE_MS);
  });

  // Beim Fokussieren mit leerem Feld: Verlauf zeigen
  input.addEventListener("focus", () => {
    if (input.value.trim().length === 0) {
      loadAndShowHistory();
    }
  });

  // Tastaturnavigation: ↑ ↓ Enter Esc
  input.addEventListener("keydown", (e) => {
    const dropdown = document.getElementById("searchDropdown");
    if (dropdown.hidden || !searchCurrentItems.length) {
      if (e.key === "Enter") e.preventDefault();
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
    } else if (e.key === "Enter") {
      if (searchActiveIndex >= 0) {
        e.preventDefault();
        const item = searchCurrentItems[searchActiveIndex];
        // Verlaufs-Einträge haben movie_id, Vorschläge haben id
        const movie = item.movie_id
          ? { id: item.movie_id, title: item.title, poster_path: item.poster_path }
          : item;
        handleSuggestionPick(movie);
      }
    } else if (e.key === "Escape") {
      closeSearchDropdown();
      input.blur();
    }
  });

  // Klick außerhalb -> Dropdown schließen
  document.addEventListener("click", (e) => {
    const bar = document.querySelector(".search-bar");
    if (bar && !bar.contains(e.target)) {
      closeSearchDropdown();
    }
  });
}

// Auf jeder Seite mit Header: Suche initialisieren.
document.addEventListener("DOMContentLoaded", () => {
  initSearch();
});
