const fragenArray = [
  {
    frage: "Welche Art von Erlebnis suchst du?",
    antworten: [
      { text: "Actionreiche Spannung", punkte: { action: 2, thriller: 1 } },
      { text: "Lustige Unterhaltung", punkte: { comedy: 2, family: 1 } },
      { text: "Emotionale Geschichte", punkte: { drama: 2, romance: 1 } },
      { text: "Fantastische Welten", punkte: { fantasy: 2, science_fiction: 1 } }
    ]
  },
  {
    frage: "Welches Thema interessiert dich am meisten?",
    antworten: [
      { text: "Verbrechen und Ermittlungen", punkte: { crime: 2, mystery: 1, thriller: 1 } },
      { text: "Historische Ereignisse", punkte: { history: 2, war: 1 } },
      { text: "Musik und Kunst", punkte: { music: 3 } },
      { text: "Natur / echte Geschichten", punkte: { documentary: 2 } }
    ]
  },
  {
    frage: "Welche Atmosphäre bevorzugst du?",
    antworten: [
      { text: "Spannend und nervenaufreibend", punkte: { thriller: 2, horror: 1 } },
      { text: "Leicht und positiv", punkte: { comedy: 2 } },
      { text: "Ernst und emotional", punkte: { drama: 2 } },
      { text: "Episch und groß", punkte: { adventure: 2, fantasy: 1 } }
    ]
  },
  {
    frage: "Welche Art von Geschichte möchtest du sehen?",
    antworten: [
      { text: "Heldenreise / Abenteuer", punkte: { adventure: 2, action: 1 } },
      { text: "Liebesgeschichte", punkte: { romance: 2 } },
      { text: "Rätsel / Geheimnisse", punkte: { mystery: 2 } },
      { text: "Zukunft / Technologie", punkte: { science_fiction: 2 } }
    ]
  },
  {
    frage: "Wie intensiv darf der Film sein?",
    antworten: [
      { text: "Sehr intensiv / beängstigend", punkte: { horror: 2, thriller: 1 } },
      { text: "Mittelmäßig spannend", punkte: { action: 1, crime: 1 } },
      { text: "Entspannt", punkte: { comedy: 2, family: 1 } }
    ]
  },
  {
    frage: "Welches Setting interessiert dich?",
    antworten: [
      { text: "Vergangenheit", punkte: { history: 2, war: 1 } },
      { text: "Gegenwart", punkte: { drama: 1, crime: 1 } },
      { text: "Zukunft / andere Welten", punkte: { science_fiction: 2, fantasy: 1 } },
      { text: "Wilder Westen", punkte: { western: 2 } }
    ]
  },
  {
    frage: "Was soll im Mittelpunkt stehen?",
    antworten: [
      { text: "Action & Kämpfe", punkte: { action: 2, war: 1 } },
      { text: "Beziehungen", punkte: { romance: 2, drama: 1 } },
      { text: "Ermittlungen", punkte: { crime: 2, mystery: 1 } },
      { text: "Entdeckung & Reise", punkte: { adventure: 2 } }
    ]
  },
  {
    frage: "Welchen Stil bevorzugst du?",
    antworten: [
      { text: "Realistisch", punkte: { drama: 2, documentary: 1 } },
      { text: "Kreativ / fantasievoll", punkte: { fantasy: 2 } },
      { text: "Technisch / futuristisch", punkte: { science_fiction: 2 } },
      { text: "Klassisch / traditionell", punkte: { western: 2, history: 2 } }
    ]
  },
  {
    frage: "Welche Emotion soll im Vordergrund stehen?",
    antworten: [
      { text: "Spannung", punkte: { thriller: 2 } },
      { text: "Angst", punkte: { horror: 2 } },
      { text: "Freude", punkte: { comedy: 2, family: 2 } },
      { text: "Mitgefühl", punkte: { drama: 2, romance: 1, family: 1 } }
    ]
  },
  {
    frage: "Was soll der Film zusätzlich bieten?",
    antworten: [
      { text: "Musik / Performance", punkte: { music: 3 } },
      { text: "Reale Hintergründe", punkte: { documentary: 3 } },
      { text: "Große Schlachten", punkte: { war: 2 } },
      { text: "Nichts Spezielles", punkte: { drama: 1 } }
    ]
  },
  {
    frage: "Wie sehr magst du Fantasy?",
    antworten: [
      { text: "Sehr", punkte: { fantasy: 3 } },
      { text: "Eher weniger", punkte: { fantasy: 2 } },
      { text: "Wenig", punkte: { fantasy: 0 } }
    ]
  },
  {
    frage: "Wie stehst du zu gruseligen oder beängstigenden Filmen?",
    antworten: [
      { text: "Mag ich sehr", punkte: { horror: 2 } },
      { text: "Geht so", punkte: { horror: 1 } },
      { text: "Gar nicht", punkte: { horror: 0 } }
    ]
  },
  {
    frage: "Wie wichtig sind dir romantische Elemente?",
    antworten: [
      { text: "Sehr wichtig", punkte: { romance: 2 } },
      { text: "Teilweise", punkte: { romance: 1 } },
      { text: "Unwichtig", punkte: { romance: 0 } }
    ]
  },
  {
    frage: "Wie sehr legst du Wert auf Humor?",
    antworten: [
      { text: "Sehr", punkte: { comedy: 2 } },
      { text: "Etwas", punkte: { comedy: 1 } },
      { text: "Kaum", punkte: { comedy: 0 } }
    ]
  },
  {
    frage: "Wie sehr interessieren dich historische oder kriegsbezogene Themen?",
    antworten: [
      { text: "Sehr", punkte: { history: 2, war: 2 } },
      { text: "Etwas", punkte: { history: 1, war: 1 } },
      { text: "Kaum", punkte: { history: 0, war: 0 } }
    ]
  },
  {
    frage: "Wie wichtig sind Musik oder Performance im Film?",
    antworten: [
      { text: "Sehr", punkte: { music: 3 } },
      { text: "Etwas", punkte: { music: 2 } },
      { text: "Kaum", punkte: { music: 0 } }
    ]
  },
  {
    frage: "Für wen ist der Film gedacht?",
    antworten: [
      { text: "Nur für Erwachsene" },
      { text: "Mit Familie / Kindern" },
      { text: "Egal" }
    ]
  },
  {
    frage: "In welchem Rahmen schaust du den Film?",
    antworten: [
      { text: "Alleine" },
      { text: "Mit Freunden" },
      { text: "Mit Familie / Kindern" }
    ]
  },
  {
    frage: "Auf welcher Plattform möchtest du den Film schauen?",
    antworten: [
      { text: "Netflix" },
      { text: "Amazon Prime" },
      { text: "Disney+" },
      { text: "Egal" }
    ]
  },
  {
    frage: "Welche Art von Film bevorzugst du?",
    antworten: [
      { text: "Animiert" },
      { text: "Anime" },
      { text: "Realfilm" },
      { text: "Egal" }
    ]
  },
  {
    frage: "Welche Filmlänge passt dir am besten?",
    antworten: [
      { text: "Unter 90 Minuten" },
      { text: "90–120 Minuten" },
      { text: "Über 120 Minuten" },
      { text: "Egal" }
    ]
  },
  {
    frage: "Welche Streaming-Anbieter stehen dir zur Verfügung?",
    antworten: [
      { text: "Netflix" },
      { text: "Amazon Prime" },
      { text: "Disney+" },
      { text: "Mehrere / Egal" }
    ]
  }
];

// ---------- Zustand ----------
let aktuelleFrage = 0;
let scores = {};
let metaData = {};

// ---------- Elemente ----------
const progressFill = document.getElementById("progressFill");
const frageEl = document.getElementById("frage");
const antwortenEl = document.querySelector(".antworten");
const nextBtn = document.getElementById("nächsteFrage");
const fortschrittEl = document.querySelector(".fortschritt");

// ---------- Fortschrittsbalken ----------
function updateProgressBar() {
  const progress = ((aktuelleFrage) / fragenArray.length) * 100;
  progressFill.style.width = `${progress}%`;
}

// ---------- Frage anzeigen ----------
function zeigeFrage() {
  const frageObj = fragenArray[aktuelleFrage];

  // Fortschritt-Text
  fortschrittEl.textContent = `Frage ${aktuelleFrage + 1} von ${fragenArray.length}`;

  // Frage
  frageEl.textContent = frageObj.frage;

  // Antwort-Buttons neu aufbauen
  antwortenEl.innerHTML = "";
  frageObj.antworten.forEach((a) => {
    const btn = document.createElement("button");
    btn.className = "antwort-btn";
    btn.textContent = a.text;
    btn.addEventListener("click", () => waehleAntwort(btn, a, frageObj));
    antwortenEl.appendChild(btn);
  });

  // Weiter-Button zurücksetzen
  nextBtn.disabled = true;
  nextBtn.style.opacity = "0.5";
}

// ---------- Antwort auswählen ----------
function waehleAntwort(btn, antwort, frageObj) {
  // Alle Buttons deselektieren
  antwortenEl.querySelectorAll(".antwort-btn").forEach(b => {
    b.style.background = "rgba(255,255,255,0.05)";
    b.style.borderColor = "rgba(187,13,19,0.3)";
    b.style.fontWeight = "normal";
  });

  // Gewählten Button markieren
  btn.style.background = "rgba(187,13,19,0.3)";
  btn.style.borderColor = "#bb0d13";
  btn.style.fontWeight = "bold";

  // Punkte merken (alte Punkte dieser Frage überschreiben)
  if (antwort.punkte) {
    Object.entries(antwort.punkte).forEach(([genre, punkte]) => {
      scores[genre] = (scores[genre] || 0) + punkte;
    });
  }

  // Weiter-Button aktivieren
  nextBtn.disabled = false;
  nextBtn.style.opacity = "1";
}

// ---------- Nächste Frage / Ergebnis ----------
nextBtn.addEventListener("click", () => {
  aktuelleFrage++;

  if (aktuelleFrage < fragenArray.length) {
    updateProgressBar();
    zeigeFrage();
  } else {
    zeigeErgebnis();
  }
});

// ---------- Ergebnis ----------
function zeigeErgebnis() {
  progressFill.style.width = "100%";
  fortschrittEl.textContent = "Fertig! 🎬";

  // Top-Genres sortieren
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top3 = sorted.slice(0, 3).map(([g]) => g);

  const genreLabels = {
    action: "Action", thriller: "Thriller", comedy: "Komödie", family: "Familie",
    drama: "Drama", romance: "Romance", fantasy: "Fantasy", science_fiction: "Sci-Fi",
    crime: "Crime", mystery: "Mystery", history: "Geschichte", war: "Krieg",
    music: "Musik", documentary: "Dokumentation", horror: "Horror",
    adventure: "Abenteuer", western: "Western"
  };

  const tagHTML = top3.map(g =>
    `<span style="
      background: rgba(187,13,19,0.2);
      border: 1px solid #bb0d13;
      border-radius: 20px;
      padding: 6px 18px;
      font-size: 14px;
      color: #ff6b75;
      font-weight: 500;
    ">${genreLabels[g] || g}</span>`
  ).join("");

  frageEl.innerHTML = `
    <div style="text-align:center; padding: 10px 0;">
      <div style="font-size: 48px; margin-bottom: 15px;">🎬</div>
      <h2 style="color: #bb0d13; font-size: 24px; margin-bottom: 10px;">Dein Filmprofil</h2>
      <p style="color: #aaa; font-size: 14px; margin-bottom: 20px;">Basierend auf deinen Antworten passen diese Genres am besten zu dir:</p>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 25px;">
        ${tagHTML}
      </div>
    </div>
  `;

  antwortenEl.innerHTML = "";

  nextBtn.textContent = "↺ Nochmal starten";
  nextBtn.disabled = false;
  nextBtn.style.opacity = "1";
  nextBtn.removeEventListener("click", () => {});
  nextBtn.onclick = () => {
    aktuelleFrage = 0;
    scores = {};
    metaData = {};
    nextBtn.textContent = "Nächste Frage";
    nextBtn.onclick = null;
    updateProgressBar();
    zeigeFrage();
  };
}

// ---------- Start ----------
zeigeFrage();
updateProgressBar();