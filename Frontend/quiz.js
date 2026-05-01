// Minimal quiz UI: questions render plainly (per spec, the quiz itself is NOT
// designed). Answers are tracked and posted to /api/quiz-result, then the user
// is redirected to the designed result page.

let fragenArray = [];
let aktuelleFrage = 0;
const gewählteAntworten = [];

fetch("/api/questions")
  .then(res => res.json())
  .then(data => {
    fragenArray = data;
    zeigeFrage();
  });

function zeigeFrage() {
  const frageObj = fragenArray[aktuelleFrage];

  let html = `<div>${frageObj.frage}</div>`;
  frageObj.antworten.forEach((a, i) => {
    html += `
      <div>
        <input type="radio" name="antwort" value="${i}">
        ${a.text}
      </div>
    `;
  });

  document.getElementById("frage").innerHTML = html;
}

document.getElementById("nächsteFrage").addEventListener("click", async () => {
  const selected = document.querySelector('input[name="antwort"]:checked');
  if (!selected) {
    alert("Bitte eine Antwort auswählen.");
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

  document.getElementById("frage").innerHTML = "Ergebnis wird berechnet…";

  try {
    const res = await fetch("/api/quiz-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ answers: gewählteAntworten })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Quiz-Auswertung fehlgeschlagen");

    sessionStorage.setItem("quizResult", JSON.stringify(data));
    window.location.href = "/Result.html";
  } catch (err) {
    document.getElementById("frage").innerHTML = `Fehler: ${err.message}`;
  }
});
