// scoreCalculator: builds the userScore object from the user's quiz answers.
// Only answers that carry a "punkte" object contribute. Filter answers are ignored.
//
// Input shape (one entry per answered question, in question order):
//   [ { punkte: { action: 2, thriller: 1 } }, { value: "netflix" }, ... ]
//
// Output: { action: 2, thriller: 1, ... }

function buildUserScore(answers) {
  const userScore = {};
  if (!Array.isArray(answers)) return userScore;

  for (const answer of answers) {
    if (!answer || typeof answer !== "object" || !answer.punkte) continue;
    for (const genre of Object.keys(answer.punkte)) {
      const points = Number(answer.punkte[genre]) || 0;
      userScore[genre] = (userScore[genre] || 0) + points;
    }
  }

  return userScore;
}

function getTopGenre(userScore) {
  let topGenre = null;
  let topValue = -Infinity;
  for (const genre of Object.keys(userScore)) {
    if (userScore[genre] > topValue) {
      topGenre = genre;
      topValue = userScore[genre];
    }
  }
  return topGenre;
}

module.exports = { buildUserScore, getTopGenre };
