// Movie.html: Film-Detailseite.
// Liest ?id= aus der URL, lädt Filmdetails + Kommentare,
// behandelt Kommentar-Posten und das Login-Pop-up für Gäste.

(function () {
  const params = new URLSearchParams(window.location.search);
  const movieId = parseInt(params.get("id"), 10);

  const loading = document.getElementById("movieLoading");
  const body = document.getElementById("movieBody");
  const commentsBlock = document.getElementById("movieCommentsBlock");

  if (!movieId) {
    loading.textContent = t("movie.invalidId", "Ungültige Film-ID.");
    return;
  }

  // ---------- Filmdetails laden ----------
  fetch(`${API_BASE}/api/movie-details/${movieId}`)
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(details => {
      const unknown = t("movie.unknown", "Unbekannt");
      document.title = `${details.title} | CineMatch`;
      document.getElementById("movieDetailTitle").textContent = details.title;

      setRatingRing(details.vote_average);

      const year = (details.release_date || "").slice(0, 4);
      document.getElementById("movieDetailReleaseYear").textContent = year || unknown;
      document.getElementById("movieDetailRuntimeShort").textContent =
        formatRuntimeShort(details.runtime) || unknown;

      document.getElementById("movieDetailReleaseDate").textContent =
        details.release_date_formatted || details.release_date || unknown;
      document.getElementById("movieDetailRuntime").textContent =
        details.runtime_formatted || (details.runtime ? `${details.runtime} min` : unknown);
      document.getElementById("movieDetailGenre").textContent = details.genres || unknown;
      document.getElementById("movieDetailDirector").textContent = details.director || unknown;

      renderGenrePills(details.genres);

      document.getElementById("movieDetailOverview").textContent =
        details.overview || t("movie.noOverview", "Keine Beschreibung verfügbar.");

      const posterEl = document.getElementById("movieDetailPoster");
      if (details.poster_path) {
        posterEl.src = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
        posterEl.alt = details.title;
      } else {
        posterEl.alt = t("result.noPoster", "Kein Poster verfügbar");
      }

      setBackdrop(details.backdrop_path);
      renderProviders(details.providers || []);

      loading.hidden = true;
      body.hidden = false;
      commentsBlock.hidden = false;

      loadComments(movieId);
    })
    .catch(err => {
      console.error("Filmdetails laden fehlgeschlagen:", err);
      loading.textContent = t("movie.loadError", "Film konnte nicht geladen werden.");
    });

  // ---------- Hero-Helpers ----------
  function setBackdrop(path) {
    const el = document.getElementById("movieBackdrop");
    if (!el) return;
    if (path) {
      el.style.backgroundImage = `url('https://image.tmdb.org/t/p/w1280${path}')`;
    } else {
      el.style.backgroundImage = "none";
      el.style.background = "linear-gradient(135deg, #1c1c22, #2a2a35)";
    }
  }

  function setRatingRing(value) {
    const arc = document.getElementById("movieRatingArc");
    const text = document.getElementById("movieDetailRating");
    const r = 17;
    const circ = 2 * Math.PI * r;
    if (arc) {
      arc.setAttribute("stroke-dasharray", `${circ.toFixed(2)} ${circ.toFixed(2)}`);
      arc.style.strokeDashoffset = String(circ.toFixed(2));
      // Farbe nach Score-Klasse (rot/orange/grün)
      const num = typeof value === "number" ? value : 0;
      const color = num >= 7.5 ? "#3fd07a" : num >= 5.5 ? "#ffb33a" : "#ff5252";
      arc.style.stroke = color;
      // Im nächsten Frame animieren
      requestAnimationFrame(() => {
        const fraction = Math.max(0, Math.min(1, num / 10));
        arc.style.strokeDashoffset = String((circ * (1 - fraction)).toFixed(2));
      });
    }
    if (text) {
      text.textContent = typeof value === "number" ? value.toFixed(1) : "–";
    }
  }

  function renderGenrePills(genresStr) {
    const container = document.getElementById("movieGenrePills");
    if (!container) return;
    const items = (genresStr || "")
      .split(",")
      .map(s => s.trim())
      .filter(s => s && s.toLowerCase() !== "unbekannt");
    if (!items.length) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = items
      .map(g => `<span class="genre-pill">${escapeHtml(g)}</span>`)
      .join("");
  }

  function formatRuntimeShort(minutes) {
    if (!minutes || typeof minutes !== "number") return "";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  }

  // ---------- Provider-Liste rendern ----------
  function renderProviders(providers) {
    const block = document.getElementById("movieProvidersBlock");
    const list = document.getElementById("movieProvidersList");
    if (!providers.length) {
      block.hidden = true;
      list.innerHTML = "";
      return;
    }
    list.innerHTML = providers.map(p => {
      const logo = p.logo_path
        ? `<img src="https://image.tmdb.org/t/p/w92${p.logo_path}" alt="">`
        : "";
      return `<div class="provider-chip">${logo}<span>${escapeHtml(p.name)}</span></div>`;
    }).join("");
    block.hidden = false;
  }

  // ---------- Kommentare ----------
  function formatCommentDate(iso) {
    if (!iso) return "";
    // SQLite liefert "YYYY-MM-DD HH:MM:SS" (UTC ohne Z) - explizit als UTC interpretieren
    const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
    if (isNaN(d)) return iso;
    return d.toLocaleString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function commentAvatarHtml(c) {
    if (c.profile_picture) {
      return `<div class="comment-avatar"><img src="${API_BASE}${c.profile_picture}" alt=""></div>`;
    }
    const initial = (c.author || "?").trim().charAt(0).toUpperCase() || "?";
    return `<div class="comment-avatar">${escapeHtml(initial)}</div>`;
  }

  function commentItemHtml(c) {
    return `
      <div class="comment-item">
        ${commentAvatarHtml(c)}
        <div class="comment-body">
          <div class="comment-meta">
            <span class="comment-author">${escapeHtml(c.author)}</span>
            <span class="comment-date">${formatCommentDate(c.created_at)}</span>
          </div>
          <div class="comment-content">${escapeHtml(c.content)}</div>
        </div>
      </div>
    `;
  }

  function renderComments(comments) {
    const list = document.getElementById("commentList");
    if (!comments.length) {
      list.innerHTML = `<div class="comment-empty">${t("comments.empty", "Noch keine Kommentare. Sei der Erste!")}</div>`;
      return;
    }
    list.innerHTML = comments.map(commentItemHtml).join("");
  }

  function loadComments(id) {
    const list = document.getElementById("commentList");
    list.innerHTML = `<div class="comment-empty">${t("comments.loading", "Kommentare werden geladen...")}</div>`;
    fetch(`${API_BASE}/api/comments/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)))
      .then(data => renderComments(data.comments || []))
      .catch(err => {
        console.error("Kommentare laden fehlgeschlagen:", err);
        list.innerHTML = `<div class="comment-empty">${t("comments.error", "Kommentare konnten nicht geladen werden.")}</div>`;
      });
  }

  // ---------- Kommentar-Form ----------
  const form = document.getElementById("commentForm");
  const input = document.getElementById("commentInput");
  const counter = document.getElementById("commentCounter");

  input.addEventListener("input", () => {
    counter.textContent = `${input.value.length} / 1000`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = input.value.trim();
    if (!content) return;

    if (!currentUser) {
      showLoginRequired();
      return;
    }

    const btn = form.querySelector(".comment-submit");
    btn.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/api/comments/${movieId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");

      input.value = "";
      counter.textContent = "0 / 1000";

      if (data.comment) {
        const list = document.getElementById("commentList");
        if (list.querySelector(".comment-empty")) list.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.innerHTML = commentItemHtml(data.comment);
        list.prepend(wrapper.firstElementChild);
      } else {
        loadComments(movieId);
      }
    } catch (err) {
      console.error("Kommentar senden fehlgeschlagen:", err);
      alert(err.message || "Kommentar konnte nicht gespeichert werden.");
    } finally {
      btn.disabled = false;
    }
  });

  // ---------- Login-Required-Modal ----------
  function showLoginRequired() {
    document.getElementById("loginRequiredModal").classList.add("show");
  }
  function hideLoginRequired() {
    document.getElementById("loginRequiredModal").classList.remove("show");
  }
  const lrModal = document.getElementById("loginRequiredModal");
  document.getElementById("lrClose").addEventListener("click", hideLoginRequired);
  lrModal.addEventListener("click", (e) => {
    if (e.target === lrModal) hideLoginRequired();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lrModal.classList.contains("show")) hideLoginRequired();
  });
})();
