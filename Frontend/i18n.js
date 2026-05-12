// Globaler Sprachumschalter für CineMatch (DE/EN).
// Lädt + speichert die Sprache in localStorage, ersetzt alle data-i18n-Strings
// im DOM und stellt window.I18n.t(key) für dynamisch gerenderten Text bereit.

const translations = {
  de: {
    // Header / Navigation (CineMatch.html)
    "header.searchPlaceholder": "Filme suchen...",
    "header.startQuiz": "Quiz starten",
    "header.login": "Anmelden",
    "header.register": "Registrieren",
    "header.profile": "Profil anzeigen",
    "header.logout": "Logout",
    "header.backHome": "Zurück zur Startseite",

    // Trending / Sektionen
    "section.trending": "Im Trend",

    // Modal (Filmdetails)
    "modal.releaseDate": "Veröffentlichungsdatum:",
    "modal.runtime": "Filmlänge:",
    "modal.genre": "Genre:",
    "modal.director": "Regisseur:",
    "modal.writer": "Drehbuchautor:",
    "modal.votes": "Bewertungen:",
    "modal.description": "Beschreibung",

    // Login / Register
    "auth.loginTitle": "Anmelden",
    "auth.registerTitle": "Registrieren",
    "auth.email": "E-Mail-Adresse",
    "auth.password": "Passwort",
    "auth.passwordConfirm": "Passwort bestätigen",
    "auth.firstName": "Vorname",
    "auth.lastName": "Nachname",
    "auth.birthDate": "Geburtsdatum",
    "auth.loginBtn": "Anmelden",
    "auth.registerBtn": "Registrieren",
    "auth.noAccount": "Noch kein Konto?",
    "auth.hasAccount": "Bereits registriert?",
    "auth.toRegister": "Jetzt registrieren",
    "auth.toLogin": "Jetzt anmelden",

    // Quiz
    "quiz.title": "Quiz",
    "quiz.next": "nächste Frage",
    "quiz.selectAnswer": "Bitte eine Antwort auswählen.",
    "quiz.calculating": "Ergebnis wird berechnet…",
    "quiz.error": "Fehler",
    "quiz.done": "Fertig!",

    // Result
    "result.pageTitle": "Deine Empfehlungen | CineMatch",
    "result.retake": "Quiz wiederholen",
    "result.eyebrow": "Dein Match-Ergebnis",
    "result.title": "Diese Filme passen zu dir",
    "result.topGenre": "Top-Genre:",
    "result.poweredBy": "Empfehlungen powered by",
    "result.noResult": "Es liegt noch kein Quiz-Ergebnis vor.",
    "result.startQuiz": "Jetzt das Quiz starten →",
    "result.empty": "Keine passenden Filme gefunden. Versuche es mit anderen Antworten.",
    "result.readError": "Ergebnis konnte nicht gelesen werden.",
    "result.match": "Match",
    "result.noPoster": "Kein Poster verfügbar",
    "result.noOverview": "Keine Beschreibung verfügbar.",
    "result.noTitle": "Ohne Titel",
    "result.loading": "Empfehlungen werden geladen…",

    // Provider / Runtime / Type / Audience labels
    "pref.provider.netflix": "Netflix",
    "pref.provider.amazon": "Amazon Prime",
    "pref.provider.disney": "Disney+",
    "pref.runtime.short": "kurz (<90 min)",
    "pref.runtime.medium": "mittel (90–120 min)",
    "pref.runtime.long": "lang (>120 min)",
    "pref.type.animation": "animiert",
    "pref.type.anime": "Anime",
    "pref.type.live_action": "Realfilm",
    "pref.audience.family": "familienfreundlich",
    "pref.audience.adult": "Erwachsene",

    // Profil
    "profile.pageTitle": "Mein Profil | CineMatch",
    "profile.backHome": "← Zurück zur Startseite",
    "profile.eyebrow": "Mein Profil",
    "profile.changeAvatar": "Profilbild ändern",
    "profile.email.title": "E-Mail-Adresse ändern",
    "profile.email.hint": "Zur Bestätigung benötigen wir dein aktuelles Passwort.",
    "profile.email.newLabel": "Neue E-Mail-Adresse",
    "profile.email.passwordLabel": "Aktuelles Passwort",
    "profile.email.submit": "E-Mail aktualisieren",
    "profile.password.title": "Passwort ändern",
    "profile.password.hint": "Du musst dein aktuelles Passwort kennen, um es zu ändern.",
    "profile.password.oldLabel": "Aktuelles Passwort",
    "profile.password.newLabel": "Neues Passwort (mind. 6 Zeichen)",
    "profile.password.confirmLabel": "Neues Passwort bestätigen",
    "profile.password.submit": "Passwort aktualisieren",

    // Profil-Statusmeldungen
    "msg.uploading": "Bild wird hochgeladen…",
    "msg.invalidImage": "Nur PNG, JPG, WEBP oder GIF erlaubt",
    "msg.imageTooLarge": "Bild zu groß (max. 5 MB)",
    "msg.avatarUpdated": "Profilbild aktualisiert",
    "msg.invalidEmail": "Bitte eine gültige E-Mail-Adresse eingeben",
    "msg.passwordRequired": "Passwort erforderlich",
    "msg.bothPasswordsRequired": "Beide Passwörter erforderlich",
    "msg.passwordTooShort": "Neues Passwort muss mindestens 6 Zeichen haben",
    "msg.passwordsMismatch": "Die neuen Passwörter stimmen nicht überein",
    "msg.saving": "Wird gespeichert…",
    "msg.emailUpdated": "E-Mail-Adresse aktualisiert",
    "msg.passwordUpdated": "Passwort erfolgreich geändert",
    "msg.profileLoadError": "Profil konnte nicht geladen werden",
    "msg.fileReadError": "Datei konnte nicht gelesen werden",

    // Generisch
    "generic.user": "Benutzer"
  },

  en: {
    "header.searchPlaceholder": "Search movies...",
    "header.startQuiz": "Start Quiz",
    "header.login": "Sign in",
    "header.register": "Sign up",
    "header.profile": "View profile",
    "header.logout": "Log out",
    "header.backHome": "Back to home",

    "section.trending": "Trending",

    "modal.releaseDate": "Release date:",
    "modal.runtime": "Runtime:",
    "modal.genre": "Genre:",
    "modal.director": "Director:",
    "modal.writer": "Writer:",
    "modal.votes": "Votes:",
    "modal.description": "Description",

    "auth.loginTitle": "Sign in",
    "auth.registerTitle": "Sign up",
    "auth.email": "Email address",
    "auth.password": "Password",
    "auth.passwordConfirm": "Confirm password",
    "auth.firstName": "First name",
    "auth.lastName": "Last name",
    "auth.birthDate": "Date of birth",
    "auth.loginBtn": "Sign in",
    "auth.registerBtn": "Create account",
    "auth.noAccount": "No account yet?",
    "auth.hasAccount": "Already registered?",
    "auth.toRegister": "Sign up now",
    "auth.toLogin": "Sign in now",

    "quiz.title": "Quiz",
    "quiz.next": "next question",
    "quiz.selectAnswer": "Please select an answer.",
    "quiz.calculating": "Calculating result…",
    "quiz.error": "Error",
    "quiz.done": "Done!",

    "result.pageTitle": "Your recommendations | CineMatch",
    "result.retake": "Retake quiz",
    "result.eyebrow": "Your match result",
    "result.title": "These movies match you",
    "result.topGenre": "Top genre:",
    "result.poweredBy": "Recommendations powered by",
    "result.noResult": "No quiz result yet.",
    "result.startQuiz": "Start the quiz now →",
    "result.empty": "No matching movies found. Try different answers.",
    "result.readError": "Result could not be loaded.",
    "result.match": "Match",
    "result.noPoster": "No poster available",
    "result.noOverview": "No description available.",
    "result.noTitle": "Untitled",
    "result.loading": "Loading recommendations…",

    "pref.provider.netflix": "Netflix",
    "pref.provider.amazon": "Amazon Prime",
    "pref.provider.disney": "Disney+",
    "pref.runtime.short": "short (<90 min)",
    "pref.runtime.medium": "medium (90–120 min)",
    "pref.runtime.long": "long (>120 min)",
    "pref.type.animation": "animated",
    "pref.type.anime": "Anime",
    "pref.type.live_action": "live action",
    "pref.audience.family": "family-friendly",
    "pref.audience.adult": "adult",

    "profile.pageTitle": "My profile | CineMatch",
    "profile.backHome": "← Back to home",
    "profile.eyebrow": "My profile",
    "profile.changeAvatar": "Change profile picture",
    "profile.email.title": "Change email address",
    "profile.email.hint": "We need your current password to confirm.",
    "profile.email.newLabel": "New email address",
    "profile.email.passwordLabel": "Current password",
    "profile.email.submit": "Update email",
    "profile.password.title": "Change password",
    "profile.password.hint": "You must know your current password to change it.",
    "profile.password.oldLabel": "Current password",
    "profile.password.newLabel": "New password (min. 6 characters)",
    "profile.password.confirmLabel": "Confirm new password",
    "profile.password.submit": "Update password",

    "msg.uploading": "Uploading image…",
    "msg.invalidImage": "Only PNG, JPG, WEBP or GIF allowed",
    "msg.imageTooLarge": "Image too large (max. 5 MB)",
    "msg.avatarUpdated": "Profile picture updated",
    "msg.invalidEmail": "Please enter a valid email address",
    "msg.passwordRequired": "Password required",
    "msg.bothPasswordsRequired": "Both passwords are required",
    "msg.passwordTooShort": "New password must be at least 6 characters",
    "msg.passwordsMismatch": "The new passwords don't match",
    "msg.saving": "Saving…",
    "msg.emailUpdated": "Email address updated",
    "msg.passwordUpdated": "Password successfully changed",
    "msg.profileLoadError": "Could not load profile",
    "msg.fileReadError": "File could not be read",

    "generic.user": "User"
  }
};

const I18n = {
  current: localStorage.getItem("cinematch.lang") || "de",

  set(lang) {
    if (!translations[lang]) return;
    this.current = lang;
    localStorage.setItem("cinematch.lang", lang);
    document.documentElement.lang = lang;
    this.apply();
    this.renderToggle();
    document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang } }));
  },

  t(key, fallback) {
    const dict = translations[this.current] || translations.de;
    if (dict[key] !== undefined) return dict[key];
    if (translations.de[key] !== undefined) return translations.de[key];
    return fallback !== undefined ? fallback : key;
  },

  apply(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      el.textContent = this.t(key);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = this.t(el.getAttribute("data-i18n-placeholder"));
    });
    root.querySelectorAll("[data-i18n-aria]").forEach(el => {
      el.setAttribute("aria-label", this.t(el.getAttribute("data-i18n-aria")));
    });
    root.querySelectorAll("[data-i18n-title]").forEach(el => {
      el.title = this.t(el.getAttribute("data-i18n-title"));
    });
  },

  renderToggle() {
    const containers = document.querySelectorAll("#langToggle, .lang-toggle[data-render]");
    containers.forEach(container => {
      container.innerHTML = `
        <button type="button" data-lang="de" class="${this.current === "de" ? "active" : ""}">DE</button>
        <button type="button" data-lang="en" class="${this.current === "en" ? "active" : ""}">EN</button>
      `;
      container.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => this.set(btn.dataset.lang));
      });
    });
  }
};

window.I18n = I18n;

// Geteiltes Styling für den Sprach-Toggle (wird auf jeder Seite injected,
// damit kein zusätzliches CSS in jeder Seite nötig ist).
function injectToggleStyles() {
  if (document.getElementById("i18n-toggle-style")) return;
  const style = document.createElement("style");
  style.id = "i18n-toggle-style";
  style.textContent = `
    .lang-toggle {
      display: inline-flex;
      background: rgba(229, 9, 20, 0.10);
      border: 1px solid rgba(229, 9, 20, 0.35);
      border-radius: 999px;
      padding: 3px;
      gap: 2px;
      vertical-align: middle;
    }
    .lang-toggle button {
      background: transparent;
      border: none;
      color: #c8c8d0;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 6px 12px;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.18s ease;
    }
    .lang-toggle button:hover { color: #fff; }
    .lang-toggle button.active {
      background: linear-gradient(135deg, #e50914, #7a070b);
      color: #fff;
      box-shadow: 0 4px 12px rgba(229, 9, 20, 0.45);
    }
  `;
  document.head.appendChild(style);
}

// Beim Initial-Load: Sprache anwenden, Toggle rendern
document.addEventListener("DOMContentLoaded", () => {
  injectToggleStyles();
  document.documentElement.lang = I18n.current;
  I18n.apply();
  I18n.renderToggle();
});
