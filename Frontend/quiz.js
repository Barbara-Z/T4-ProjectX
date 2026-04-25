let fragenArray = [];
let aktuelleFrage = 0;

fetch("/api/questions")
  .then(res => res.json())
  .then(data => {
    fragenArray = data;
    zeigeFrage(); // direkt erste Frage anzeigen
  });

function zeigeFrage() {
  const frageObj = fragenArray[aktuelleFrage];

  let html = `<div>${frageObj.frage}</div>`;

  frageObj.antworten.forEach(a => {
    html += `
      <div>
        <input type="radio" name="antwort" value="${a.text}">
        ${a.text}
      </div>
    `;
  });

  document.getElementById("frage").innerHTML = html;
}

document.getElementById("nächsteFrage").addEventListener("click", () => {
  aktuelleFrage++;

  if (aktuelleFrage < fragenArray.length) {
    zeigeFrage();
  } else {
    document.getElementById("frage").innerHTML = "Fertig!";
  }
});