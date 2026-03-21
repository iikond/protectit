let load = 0;
let score = 0;
let timeLeft = 60;
let gameActive = true;
let currentAttack = null;
let attackTimer = null;

const attackMessages = [
    { text: "💥 SYN Flood! Тысячи запросов в секунду!", correct: "rate", increase: 20, decrease: 15 },
    { text: "🤖 Ботнет атакует логин-форму!", correct: "captcha", increase: 18, decrease: 12 },
    { text: "📈 Трафик превысил лимит канала!", correct: "bandwidth", increase: 25, decrease: 20 },
    { text: "🔄 HTTP/2 Rapid Reset атака!", correct: "rate", increase: 22, decrease: 18 },
    { text: "🔁 Повторные запросы от ботов!", correct: "captcha", increase: 15, decrease: 10 },
    { text: "🌊 Амплификационная атака DNS!", correct: "bandwidth", increase: 30, decrease: 25 }
];

function getRandomAttack() {
    return { ...attackMessages[Math.floor(Math.random() * attackMessages.length)] };
}

function triggerAttack() {
    if (!gameActive) return;
    currentAttack = getRandomAttack();
    document.getElementById('attackMsg').innerHTML = `⚠️ ${currentAttack.text} ⚠️`;
    // increase load
    load = Math.min(100, load + currentAttack.increase);
    updateUI();
    if (load >= 100) {
        endGame("Сервер перегружен! DDoS успешен.");
    }
    // auto fail if not defended in 4 seconds
    if (attackTimer) clearTimeout(attackTimer);
    attackTimer = setTimeout(() => {
        if (gameActive && currentAttack) {
            load = Math.min(100, load + currentAttack.increase);
            updateUI();
            if (load >= 100) endGame("Сервер перегружен!");
            else triggerAttack(); // next attack
        }
    }, 4000);
}

function updateUI() {
    document.getElementById('load').innerText = load;
    document.getElementById('score').innerText = score;
    document.getElementById('timer').innerText = timeLeft;
}

function handleDefense(defenseType) {
    if (!gameActive || !currentAttack) return;
    if (defenseType === currentAttack.correct) {
        // successful mitigation
        load = Math.max(0, load - currentAttack.decrease);
        score++;
        updateUI();
        if (load <= 0) load = 0;
        clearTimeout(attackTimer);
        triggerAttack(); // next wave
    } else {
        // wrong defense: load increases more
        load = Math.min(100, load + 10);
        updateUI();
        if (load >= 100) endGame("Неверная защита! Атака прошла.");
        else {
            clearTimeout(attackTimer);
            triggerAttack();
        }
    }
    currentAttack = null;
}

let timerInterval;
function startGame() {
    gameActive = true;
    load = 20;
    score = 0;
    timeLeft = 60;
    updateUI();
    document.getElementById('gameOverMsg').innerHTML = '';
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameActive && timeLeft > 0) {
            timeLeft--;
            updateUI();
            if (timeLeft <= 0) endGame("Победа! Выдержали 60 секунд!");
        } else if (timeLeft <= 0) endGame("Победа!");
    }, 1000);
    triggerAttack();

    const btns = document.querySelectorAll('.defense-btn');
    btns.forEach(btn => {
        btn.removeEventListener('click', defenseHandler);
        btn.addEventListener('click', defenseHandler);
    });
}

function defenseHandler(e) {
    const defense = e.target.getAttribute('data-defense');
    handleDefense(defense);
}

function endGame(msg) {
    if (!gameActive) return;
    gameActive = false;
    clearInterval(timerInterval);
    if (attackTimer) clearTimeout(attackTimer);
    document.getElementById('gameOverMsg').innerHTML = `<span style="color:#DC7000">${msg}</span>`;
    document.getElementById('attackMsg').innerHTML = "Игра окончена.";
}

document.getElementById('restartBtn').addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    if (attackTimer) clearTimeout(attackTimer);
    startGame();
});

startGame();