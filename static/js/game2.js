let score = 0;
let timeLeft = 60;
let gameActive = true;
let currentAttackerIndex = -1;
let ips = [];
let timeoutId = null;

const ipPanel = document.getElementById('ipPanel');

function generateRandomIP() {
    return `${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
}

function newRound() {
    if (!gameActive) return;
    // generate 4 random IPs, pick one as attacker
    ips = [];
    for (let i=0; i<4; i++) {
        ips.push(generateRandomIP());
    }
    currentAttackerIndex = Math.floor(Math.random() * 4);
    
    ipPanel.innerHTML = '';
    ips.forEach((ip, idx) => {
        const card = document.createElement('div');
        card.className = 'ip-card';
        const ipSpan = document.createElement('div');
        ipSpan.className = 'ip-address';
        ipSpan.innerText = ip;
        const btn = document.createElement('button');
        btn.innerText = 'Блокировать';
        btn.className = 'block-btn';
        btn.addEventListener('click', () => {
            if (!gameActive) return;
            if (idx === currentAttackerIndex) {
                score++;
                document.getElementById('score').innerText = score;
                newRound(); // success, next round
            } else {
                // penalty: time -5 seconds
                timeLeft = Math.max(0, timeLeft - 5);
                document.getElementById('timer').innerText = timeLeft;
                if (timeLeft <= 0) endGame('Время вышло из-за ложной блокировки!');
                else newRound(); // continue with new set
            }
        });
        card.appendChild(ipSpan);
        card.appendChild(btn);
        ipPanel.appendChild(card);
    });
    
    // auto fail if no block in 3 seconds (attacker gets through)
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        if (gameActive) {
            timeLeft = Math.max(0, timeLeft - 10);
            document.getElementById('timer').innerText = timeLeft;
            if (timeLeft <= 0) endGame('Слишком долго — атака прошла!');
            else newRound();
        }
    }, 3000);
}

let timerInterval;
function startGame() {
    gameActive = true;
    score = 0;
    timeLeft = 60;
    document.getElementById('score').innerText = '0';
    document.getElementById('timer').innerText = '60';
    document.getElementById('gameOverMsg').innerHTML = '';
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameActive && timeLeft > 0) {
            timeLeft--;
            document.getElementById('timer').innerText = timeLeft;
            if (timeLeft <= 0) endGame('Время истекло!');
        } else if (timeLeft <= 0) endGame('Время истекло!');
    }, 1000);
    newRound();
}

function endGame(msg) {
    if (!gameActive) return;
    gameActive = false;
    clearInterval(timerInterval);
    if (timeoutId) clearTimeout(timeoutId);
    document.getElementById('gameOverMsg').innerHTML = `<span style="color:#DC7000">${msg}</span>`;
}

document.getElementById('restartBtn').addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    if (timeoutId) clearTimeout(timeoutId);
    startGame();
});

startGame();