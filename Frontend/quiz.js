// Minimal quiz UI: questions render plainly (per spec, the quiz itself is NOT
// designed). Answers are tracked and posted to /api/quiz-result, then the user
// is redirected to the designed result page.

let fragenArray = [];
let aktuelleFrage = 0;
const gewählteAntworten = [];
const t = (key, fb) => (window.I18n ? window.I18n.t(key, fb) : fb || key);

fetch("/api/questions")
  .then(res => res.json())
  .then(data => {
    fragenArray = data;
    zeigeFrage();
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

function zeigeFrage() {
  if (!fragenArray.length) return;
  const frageObj = fragenArray[aktuelleFrage];

  let html = `<div>${questionText(frageObj)}</div>`;
  frageObj.antworten.forEach((a, i) => {
    html += `
      <div>
        <input type="radio" name="antwort" value="${i}">
        ${answerText(a)}
      </div>
    `;
  });

  document.getElementById("frage").innerHTML = html;
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
    const res = await fetch("/api/quiz-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ answers: gewählteAntworten })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || t("quiz.error"));

    sessionStorage.setItem("quizResult", JSON.stringify(data));
    window.location.href = "/Result.html";
  } catch (err) {
    document.getElementById("frage").innerHTML = `${t("quiz.error")}: ${err.message}`;
  }
});
