// Minimal quiz UI: questions render plainly (per spec, the quiz itself is NOT
// designed). Answers are tracked and posted to /api/quiz-result, then the user
// is redirected to the designed result page.

let fragenArray = [];
let aktuelleFrage = 0;
const gewählteAntworten = [];
const t = (key, fb) => (window.I18n ? window.I18n.t(key, fb) : fb || key);

fetch("http://localhost:3001/api/questions")
  .then(res => res.json())
  .then(data => {
    fragenArray = data;
    zeigeFrage();
  })
  .catch(err => {
    console.error("Fehler beim Laden der Fragen:", err);
    document.getElementById("frage").innerHTML = "Fehler beim Laden der Fragen. Backend nicht erreichbar?";
  });

function lang() {
  return window.I18n ? window.I18n.current : "de";
}

function questionText(frageObj) {
  return lang() === "en" && frageObj.frage_en ? frageObj.frage_en : frageObj.frage;
}

function answerText(answer) {
  return lang() === "en" && answer.text_en ? answer.text_en : answer.text;
}

function updateProgressBar() {
  const progress = ((aktuelleFrage) / fragenArray.length) * 100;
  const progressFill = document.getElementById("progressFill");
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }
  
  // Fortschrittstext aktualisieren
  const fortschrittEl = document.getElementById("fortschritt");
  if (fortschrittEl) {
    fortschrittEl.textContent = `Frage ${aktuelleFrage + 1} von ${fragenArray.length}`;
  }
}

function zeigeFrage() {
  if (!fragenArray.length) return;
  const frageObj = fragenArray[aktuelleFrage];

  updateProgressBar();

  let html = `<div>${questionText(frageObj)}</div>`;
  frageObj.antworten.forEach((a, i) => {
    html += `
      <label style="display: flex; align-items: center; gap: 12px; padding: 15px; border: 1px solid rgba(187, 13, 19, 0.3); background: rgba(255, 255, 255, 0.05); border-radius: 10px; cursor: pointer; transition: all 0.3s ease; margin-bottom: 10px;">
        <input type="radio" name="antwort" value="${i}" style="width: 20px; height: 20px; cursor: pointer; accent-color: #bb0d13;">
        <span>${answerText(a)}</span>
      </label>
    `;
  });

  document.getElementById("frage").innerHTML = html;

  // Weiter-Button zurücksetzen
  const nextBtn = document.getElementById("nächsteFrage");
  nextBtn.disabled = true;
  nextBtn.style.opacity = "0.5";

  // Event-Listener für Radio-Buttons
  document.querySelectorAll('input[name="antwort"]').forEach(radio => {
    radio.addEventListener("change", () => {
      nextBtn.disabled = false;
      nextBtn.style.opacity = "1";
    });
  });

  // Hover-Effekte für Labels
  document.querySelectorAll('label').forEach(label => {
    label.addEventListener("mouseenter", () => {
      label.style.background = "rgba(187, 13, 19, 0.2)";
      label.style.borderColor = "#bb0d13";
      label.style.transform = "translateY(-2px)";
      label.style.boxShadow = "0 5px 15px rgba(187, 13, 19, 0.3)";
    });
    label.addEventListener("mouseleave", () => {
      label.style.background = "rgba(255, 255, 255, 0.05)";
      label.style.borderColor = "rgba(187, 13, 19, 0.3)";
      label.style.transform = "translateY(0)";
      label.style.boxShadow = "none";
    });
  });

  const backBtn = document.getElementById("vorherigerFrage");
  if (backBtn) {
    backBtn.style.display = aktuelleFrage === 0 ? "none" : "block";
  }
}

// Sprachwechsel: aktuelle Frage in der neuen Sprache neu zeichnen,
// dabei die bisherige Auswahl beibehalten
document.addEventListener("languagechange", () => {
  const previouslySelected = document.querySelector('input[name="antwort"]:checked')?.value;
  if (aktuelleFrage < fragenArray.length) {
    zeigeFrage();
    if (previouslySelected != null) {
      const restored = document.querySelector(`input[name="antwort"][value="${previouslySelected}"]`);
      if (restored) restored.checked = true;
    }
  }
});

document.getElementById("vorherigerFrage").addEventListener("click", () => {
  if (aktuelleFrage <= 0) return;
  aktuelleFrage--;
  gewählteAntworten.pop();
  zeigeFrage();
});

document.getElementById("nächsteFrage").addEventListener("click", async () => {
  const selected = document.querySelector('input[name="antwort"]:checked');
  if (!selected) {
    alert(t("quiz.selectAnswer"));
    return;
  }

  const frageObj = fragenArray[aktuelleFrage];
  const antwort = frageObj.antworten[Number(selected.value)];

  // Build a normalized payload-entry: scoring answer carries punkte;
  // filter answer carries filter+value. The backend handles both.
  const eintrag = {};
  if (antwort.punkte) eintrag.punkte = antwort.punkte;
  if (frageObj.filter) {
    eintrag.filter = frageObj.filter;
    eintrag.value = antwort.value;
  }
  gewählteAntworten.push(eintrag);

  aktuelleFrage++;

  if (aktuelleFrage < fragenArray.length) {
    zeigeFrage();
    return;
  }

  document.getElementById("frage").innerHTML = t("quiz.calculating");

  try {
    const res = await fetch("http://localhost:3001/api/quiz-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ answers: gewählteAntworten })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || t("quiz.error"));

    sessionStorage.setItem("quizResult", JSON.stringify(data));
    window.location.href = "./Result.html";
  } catch (err) {
    document.getElementById("frage").innerHTML = `${t("quiz.error")}: ${err.message}`;
  }
});
