//berechnet die Punktzahl eines Quiz basierend auf den Antworten des Benutzers und den richtigen Antworten
//alles was gerechnet wird in diesem File

//berechnet die Punktzahl eines Quiz basierend auf den Antworten des Benutzers 
function evaluateQuiz(answers) {
  const scores = {};

  answers.forEach(answer => {
    for (const genre in answer) {
      scores[genre] = (scores[genre] || 0) + answer[genre];
    }
  });

  return scores;
}

function getTopGenres(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(entry => entry[0]);
}

module.exports = { evaluateQuiz, getTopGenres };