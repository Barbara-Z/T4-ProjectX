// Search.html: Ergebnisseite zur allgemeinen Suche.
// Liest ?q= aus der URL, holt Treffer vom Backend und rendert sie
// im selben Trending-Karten-Layout wie auf der Homepage.

(function () {
  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || "").trim();

  const headline = document.getElementById("searchHeadline");
  const subline = document.getElementById("searchSubline");
  const empty = document.getElementById("searchEmpty");
  const grid = document.getElementById("searchResults");
  const input = document.getElementById("searchInput");
  if (input) input.value = query;

  function showEmpty(message) {
    grid.innerHTML = "";
    empty.hidden = false;
    empty.textContent = message;
  }

  // Headline-Text in Abhängigkeit von der aktuellen Sprache + Suchbegriff bauen.
  // Wird sowohl initial als auch bei Sprachwechsel neu gesetzt, damit der
  // Suchbegriff stehen bleibt.
  function updateHeadline() {
    if (!headline) return;
    if (!query) {
      headline.textContent = t("search.resultsTitle", "Suchergebnisse");
      return;
    }
    const tpl = t("search.resultsFor", "Suchergebnisse für ‘{q}’");
    headline.textContent = tpl.replace("{q}", query);
  }

  function updateSubline() {
    if (subline) {
      subline.textContent = t("search.subline", "Klicke einen Film an, um Details zu sehen.");
    }
  }

  // i18n.js läuft mit defer und ruft auf DOMContentLoaded `I18n.apply()` auf,
  // wodurch [data-i18n]-Texte überschrieben werden. Deshalb setzen wir die
  // Headline jedes Mal NACH dem Apply-Lauf (DOMContentLoaded) und bei jedem
  // Sprachwechsel.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      updateHeadline();
      updateSubline();
    });
  } else {
    updateHeadline();
    updateSubline();
  }
  document.addEventListener("languagechange", () => {
    updateHeadline();
    updateSubline();
  });

  if (!query) {
    showEmpty(t("search.noQuery", "Bitte einen Suchbegriff eingeben."));
    return;
  }

  // Beim direkten Aufruf von Search.html mit ?q=... soll diese Anfrage
  // ebenfalls in der profilbezogenen Historie landen.
  // saveSearchQuery() wartet intern auf die Session-Auflösung, deshalb
  // reicht hier ein direkter Aufruf als Backup zum Submit-Save.
  if (typeof saveSearchQuery === "function") {
    saveSearchQuery(query);
  }

  // Sprache an Backend mitschicken, damit der Genre-Name lokalisiert ist.
  const lang = (window.I18n && window.I18n.current) || "de";

  // Direkte Treffer + ähnliche Filme aus dem Hauptgenre in einem Call holen.
  fetch(`${API_BASE}/api/search-with-similar?q=${encodeURIComponent(query)}&lang=${lang}`)
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(data => {
      const results = data.results || [];
      if (!results.length) {
        showEmpty(t("search.noResultsFor", "Keine Filme gefunden."));
        hideSimilar();
        return;
      }
      empty.hidden = true;
      displayMovies(results, "searchResults");

      // Ähnliche Filme zum Hauptgenre rendern (falls vorhanden)
      if (data.similar && data.similar.movies && data.similar.movies.length) {
        renderSimilar(data.similar);
      } else {
        hideSimilar();
      }
    })
    .catch(err => {
      console.error("Suche fehlgeschlagen:", err);
      showEmpty(t("search.error", "Suche fehlgeschlagen. Bitte später erneut versuchen."));
      hideSimilar();
    });

  function hideSimilar() {
    const section = document.getElementById("similarSection");
    if (section) section.hidden = true;
    currentSimilar = null;
  }

  // currentSimilar wird in der äußeren IIFE-Scope gespeichert, damit der
  // languagechange-Listener weiß, ob/welche Genre-Überschrift er neu setzen muss.
  let currentSimilar = null;

  function updateSimilarHeadline() {
    if (!currentSimilar) return;
    const headline = document.getElementById("similarHeadline");
    if (!headline) return;
    // Genre-Name in der aktuellen Sprache aus dem i18n-Lookup holen.
    // Fallback: der Name, den das Backend zur Ladezeit mitgeliefert hat.
    const localized =
      (window.I18n && I18n.genreName && I18n.genreName(currentSimilar.genre_id)) ||
      currentSimilar.genre_name ||
      "";
    const tpl = t("search.similarGenre", "Ähnliche {genre}-Filme");
    headline.textContent = tpl.replace("{genre}", localized);
  }

  function renderSimilar(similar) {
    const section = document.getElementById("similarSection");
    if (!section) return;
    currentSimilar = similar;
    updateSimilarHeadline();
    section.hidden = false;
    displayMovies(similar.movies, "similarResults");
  }

  // Sprachumschalter: Genre-Überschrift live mitwechseln.
  document.addEventListener("languagechange", updateSimilarHeadline);
})();
