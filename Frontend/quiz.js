let fragenArray = [];
let aktuelleFrage = 0;

const progressFill = document.getElementById("progressFill");

fetch("/api/questions")
  function updateProgressBar() {

    const progress =
    ((aktuelleFrage + 1) / fragenArray.length) * 100;

    progressFill.style.width = `${progress}%`;
  }
  .then(res => res.json())
  .then(data => {
    fragenArray = data;
    zeigeFrage();
    updateProgressBar();
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

    updateProgressBar();

    zeigeFrage();

  } else {

    document.getElementById("frage").innerHTML = "Fertig!";
  }
});