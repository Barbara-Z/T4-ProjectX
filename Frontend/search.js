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

  if (!query) {
    showEmpty(t("search.noQuery", "Bitte einen Suchbegriff eingeben."));
    if (headline) headline.textContent = t("search.resultsTitle", "Suchergebnisse");
    return;
  }

  // Headline mit dem Suchbegriff anreichern
  if (headline) {
    const tpl = t("search.resultsFor", "Ergebnisse für „{q}“");
    headline.textContent = tpl.replace("{q}", query);
  }
  if (subline) subline.textContent = t("search.subline", "Klicke einen Film an, um Details zu sehen.");

  // Treffer holen (bis zu 40, damit eine ganze Seite gefüllt ist).
  fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=40`)
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(data => {
      const results = data.results || [];
      if (!results.length) {
        showEmpty(t("search.noResultsFor", "Keine Filme gefunden."));
        return;
      }
      empty.hidden = true;
      // Backend liefert {id,title,release_date,poster_path,vote_average};
      // displayMovies braucht title + poster_path + vote_average -> passt direkt.
      displayMovies(results, "searchResults");
    })
    .catch(err => {
      console.error("Suche fehlgeschlagen:", err);
      showEmpty(t("search.error", "Suche fehlgeschlagen. Bitte später erneut versuchen."));
    });
})();
