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

// Функция проверки регистрации на сервере
async function checkAndFixRegistration() {
    const playerId = localStorage.getItem('player_id');
    if (!playerId) return false;
    
    try {
        const response = await fetch(`/check_player/${playerId}`);
        const data = await response.json();
        
        if (!data.exists) {
            localStorage.removeItem('player_id');
            alert('Ваша сессия устарела. Пожалуйста, зарегистрируйтесь заново.');
            window.location.href = '/';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error checking player:', error);
        return false;
    }
}

// Функция отправки очков на сервер
async function submitScore(finalScore) {
    const isValid = await checkAndFixRegistration();
    if (!isValid) return;
    
    const playerId = localStorage.getItem('player_id');
    if (!playerId) {
        console.log('Пользователь не зарегистрирован');
        return;
    }
    
    try {
        const response = await fetch('/update_score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_id: playerId,
                game: 'game3',
                score: finalScore
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'ok') {
            console.log('✅ Score saved successfully!');
        } else if (data.status === 'error' && data.message.includes('not found')) {
            localStorage.removeItem('player_id');
            alert('Ваша сессия устарела. Пожалуйста, зарегистрируйтесь заново.');
            window.location.href = '/';
        } else {
            console.error('Error saving score:', data.message);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}

function getRandomAttack() {
    const attack = attackMessages[Math.floor(Math.random() * attackMessages.length)];
    return { ...attack };
}

function triggerAttack() {
    if (!gameActive) return;
    
    if (attackTimer) {
        clearTimeout(attackTimer);
        attackTimer = null;
    }
    
    currentAttack = getRandomAttack();
    document.getElementById('attackMsg').innerHTML = `⚠️ ${currentAttack.text} ⚠️`;
    document.getElementById('attackMsg').style.borderLeftColor = '#ff4444';
    
    attackTimer = setTimeout(() => {
        if (gameActive && currentAttack) {
            load = Math.min(100, load + currentAttack.increase);
            updateUI();
            
            if (load >= 100) {
                endGame("💀 Сервер перегружен! Вы не успели защититься! 💀");
            } else {
                triggerAttack();
            }
        }
    }, 3000);
}

function updateUI() {
    document.getElementById('load').innerText = load;
    document.getElementById('score').innerText = score;
    document.getElementById('timer').innerText = timeLeft;
    
    const loadElement = document.getElementById('load');
    if (load >= 80) {
        loadElement.style.color = '#ff4444';
        loadElement.style.fontWeight = 'bold';
    } else if (load >= 50) {
        loadElement.style.color = '#ffaa44';
    } else {
        loadElement.style.color = '#4caf50';
    }
}

function handleDefense(defenseType) {
    if (!gameActive || !currentAttack) {
        console.log('Игра не активна или нет атаки');
        return;
    }
    
    if (attackTimer) {
        clearTimeout(attackTimer);
        attackTimer = null;
    }
    
    if (defenseType === currentAttack.correct) {
        load = Math.max(0, load - currentAttack.decrease);
        score++;
        
        document.getElementById('attackMsg').innerHTML = `✅ УСПЕШНО! ${currentAttack.text} отражена! +${currentAttack.decrease}% к разгрузке`;
        document.getElementById('attackMsg').style.borderLeftColor = '#4caf50';
        
        updateUI();
        
        if (load <= 0) {
            load = 0;
            updateUI();
        }
        
        setTimeout(() => {
            if (gameActive) {
                triggerAttack();
            }
        }, 1000);
        
    } else {
        load = Math.min(100, load + 15);
        updateUI();
        
        document.getElementById('attackMsg').innerHTML = `❌ НЕВЕРНО! ${currentAttack.text} НЕ отражена! +15% к нагрузке`;
        document.getElementById('attackMsg').style.borderLeftColor = '#ff4444';
        
        if (load >= 100) {
            endGame("💀 Неверная защита! Сервер пал под атакой! 💀");
        } else {
            setTimeout(() => {
                if (gameActive) {
                    triggerAttack();
                }
            }, 1500);
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
    currentAttack = null;
    
    if (attackTimer) clearTimeout(attackTimer);
    if (timerInterval) clearInterval(timerInterval);
    
    updateUI();
    document.getElementById('gameOverMsg').innerHTML = '';
    document.getElementById('attackMsg').innerHTML = '⚡ Готовься к атаке...';
    document.getElementById('attackMsg').style.borderLeftColor = 'var(--primary-orange)';
    
    timerInterval = setInterval(() => {
        if (gameActive && timeLeft > 0) {
            timeLeft--;
            updateUI();
            
            if (timeLeft <= 0) {
                endGame("🎉 ПОБЕДА! 🎉 Вы выдержали 60 секунд атак!");
            }
        }
    }, 1000);
    
    setTimeout(() => {
        if (gameActive) {
            triggerAttack();
        }
    }, 1000);
    
    const btns = document.querySelectorAll('.defense-btn');
    btns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const defense = newBtn.getAttribute('data-defense');
            console.log('Нажата защита:', defense);
            handleDefense(defense);
        });
    });
}

function endGame(msg) {
    if (!gameActive) return;
    
    gameActive = false;
    
    if (timerInterval) clearInterval(timerInterval);
    if (attackTimer) clearTimeout(attackTimer);
    
    document.getElementById('gameOverMsg').innerHTML = `<span style="color:#DC7000; font-size: 28px; text-shadow: 0 0 10px rgba(220,112,0,0.5);">${msg}</span>`;
    document.getElementById('attackMsg').innerHTML = "🏁 Игра окончена 🏁";
    
    const btns = document.querySelectorAll('.defense-btn');
    btns.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });
    
    // ✅ СОХРАНЯЕМ И ОТПРАВЛЯЕМ РЕЗУЛЬТАТ
    if (score > 0) {
        localStorage.setItem('game3_score', score);
        submitScore(score); // Отправляем на сервер
    } else {
        console.log('Игра закончена со счетом 0, очки не отправляются');
    }
}

startGame();