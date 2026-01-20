// User-Session laden (Login-Status abrufen)
fetch("/session")
  .then(res => res.json())
  .then(user => {
    const area = document.getElementById("userArea");

    // Wenn kein User angemeldet: Login/Register Links anzeigen
    if (!user) {
      area.innerHTML = `
        <a href="login.html">Login</a>
        <a href="register.html">Registrieren</a>
      `;
    } else {
      // Wenn User angemeldet: Username und Logout-Button anzeigen
      area.innerHTML = `
        <span class="user-icon">👤</span>
        ${user.username}
        <a href="/logout">Logout</a>
      `;
    }
  });

// Trend-Filme laden und anzeigen
async function loadTrendingMovies() {
  console.log("loadTrendingMovies() gestartet");
  try {
    // API-Request zu Backend (http://localhost:3000)
    const apiUrl = "http://localhost:3000/api/trending-movies";
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
    
    // Click-Event für Film-Details (optional)
    movieCard.addEventListener('click', () => {
      console.log('Film geklickt:', movie.title || movie.name);
    });
    
    // Film-Karte zum Carousel hinzufügen
    container.appendChild(movieCard);
  });
  console.log(`${addedMovies} Filme hinzugefügt zu ${containerId}`);
}

// Beim Laden der Seite: Trend-Filme abrufen und anzeigen
document.addEventListener('DOMContentLoaded', loadTrendingMovies);
