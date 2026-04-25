// User-Session laden und User Area aktualisieren
let currentUser = null;
const WEB_BASE = "http://localhost:3001";
const API_BASE = "http://localhost:3001";

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
        <a href="${WEB_BASE}/Login.html" class="login-link">Anmelden</a>
        <a href="${WEB_BASE}/Register.html" class="register-link">Registrieren</a>
      </div>
    `;
  } else {
    const firstInitial = (user.firstName || "").trim().charAt(0).toUpperCase();
    const lastInitial = (user.lastName || "").trim().charAt(0).toUpperCase();
    const initials = `${firstInitial}${lastInitial}` || "U";

    // Benutzer angemeldet - User Icon mit Dropdown anzeigen
    area.innerHTML = `
      <div class="user-dropdown-trigger" id="userDropdownTrigger">
        <span class="user-initials-avatar">${initials}</span>
        <span class="dropdown-arrow" id="dropdownArrow">▼</span>
      </div>
      <div class="user-dropdown-menu" id="userDropdownMenu">
        <div class="user-info">
          <div class="user-name">${user.firstName} ${user.lastName}</div>
          <div class="user-email">${user.email}</div>
        </div>
        <a href="#" class="dropdown-menu-item profile">
          <span>👤</span>
          <span>Profil anzeigen</span>
        </a>
        <div class="dropdown-separator"></div>
        <a href="#" class="dropdown-menu-item logout" onclick="handleLogout(event)">
          <span>🚪</span>
          <span>Logout</span>
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
    window.location.href = "Login.html";
  } else {
    window.location.href = "Quiz.html";
  }
}

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
    
    // Film-Daten in Modal einfügen
    document.getElementById('modalTitle').textContent = details.title;
    document.getElementById('modalRating').textContent = details.vote_average.toFixed(1);
    document.getElementById('modalReleaseDate').textContent = details.release_date_formatted || 'Unbekannt';
    document.getElementById('modalRuntime').textContent = details.runtime_formatted || 'Unbekannt';
    document.getElementById('modalGenres').textContent = details.genres || 'Unbekannt';
    document.getElementById('modalDirector').textContent = details.director || 'Unbekannt';
    document.getElementById('modalWriter').textContent = details.writers || 'Unbekannt';
    document.getElementById('modalVoteCount').textContent = `${details.vote_count}`;
    document.getElementById('modalOverview').textContent = details.overview || 'Keine Beschreibung verfügbar';
    
    // Poster-Bild setzen
    const posterUrl = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
    document.getElementById('modalPoster').src = posterUrl;
    document.getElementById('modalPoster').alt = details.title;
    
    // Modal anzeigen
    const modal = document.getElementById('movieModal');
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
}
// ==== Ende Film-Details Funktionen ====

// Session beim Laden der Seite abrufen
loadUserSession();

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
function displayMovies(movies, containerId) {
  const container = document.getElementById(containerId);
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
    
    // Click-Event für Film-Details - Modal öffnen
    movieCard.addEventListener('click', () => {
      openMovieModal(movie);
    });
    
    // Film-Karte zum Carousel hinzufügen
    container.appendChild(movieCard);
  });
  console.log(`${addedMovies} Filme hinzugefügt zu ${containerId}`);
}

// Beim Laden der Seite - Trend-Filme laden
loadTrendingMovies();

// Modal Close Button und Hintergrund Event-Listener
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('movieModal');
  const closeButton = document.querySelector('.modal-close');
  
  // Close Button Listener
  closeButton.addEventListener('click', closeMovieModal);
  
  // Modal Hintergrund Listener - Schließen wenn außerhalb geklickt wird
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeMovieModal();
    }
  });
  
  // Escape-Taste zum Schließen des Modals
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeMovieModal();
    }
  });
});
