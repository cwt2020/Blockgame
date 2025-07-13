const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const gameOverScreenEl = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restart-button');
const hintButton = document.getElementById('hint-button');

function updateScore(newScore) {
    scoreEl.textContent = newScore;
}

function showGameOverScreen(score) {
    finalScoreEl.textContent = score;
    gameOverScreenEl.classList.remove('hidden');
}

function hideGameOverScreen() {
    gameOverScreenEl.classList.add('hidden');
}