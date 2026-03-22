let score = 0;
let timeLeft = 60;
let gameActive = true;
let currentAttackerIndex = -1;
let ips = [];
let timeoutId = null;

const ipPanel = document.getElementById('ipPanel');

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
                game: 'game2',
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
        card.style.animation = 'fadeIn 0.3s ease';
        
        const isAttacker = (idx === currentAttackerIndex);
        
        // Создаем контейнер для IP с иконкой
        const ipContainer = document.createElement('div');
        ipContainer.style.display = 'flex';
        ipContainer.style.alignItems = 'center';
        ipContainer.style.justifyContent = 'center';
        ipContainer.style.gap = '8px';
        ipContainer.style.marginBottom = '12px';
        
        const ipSpan = document.createElement('div');
        ipSpan.className = 'ip-address';
        ipSpan.innerText = ip;
        
        ipContainer.appendChild(ipSpan);
        
        // Добавляем иконку для хакера
        if (isAttacker) {
            const hackerIcon = document.createElement('span');
            hackerIcon.innerHTML = '👾';
            hackerIcon.style.fontSize = '24px';
            hackerIcon.style.animation = 'shake 0.5s ease infinite';
            ipContainer.appendChild(hackerIcon);
            
            // Добавляем предупреждение
            const warning = document.createElement('div');
            warning.innerHTML = '⚠️ АТАКУЕТ! ⚠️';
            warning.style.color = '#ff4444';
            warning.style.fontSize = '12px';
            warning.style.fontWeight = 'bold';
            warning.style.marginTop = '5px';
            warning.style.animation = 'pulse 1s infinite';
            card.appendChild(warning);
        }
        
        card.appendChild(ipContainer);
        
        // Стилизуем карточку в зависимости от типа
        if (isAttacker) {
            card.style.background = 'linear-gradient(135deg, rgba(255, 68, 68, 0.2), rgba(255, 68, 68, 0.1))';
            card.style.border = '3px solid #ff4444';
            card.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.5)';
            card.style.transform = 'scale(1.02)';
        } else {
            card.style.background = 'rgba(17, 33, 46, 0.8)';
            card.style.border = '2px solid rgba(220, 112, 0, 0.3)';
        }
        
        const btn = document.createElement('button');
        btn.innerText = isAttacker ? '🔴 БЛОКИРОВАТЬ ХАКЕРА! 🔴' : '⚪ Блокировать';
        btn.className = 'block-btn';
        
        // Стилизуем кнопку хакера
        if (isAttacker) {
            btn.style.background = '#ff4444';
            btn.style.fontWeight = 'bold';
            btn.style.fontSize = '16px';
            btn.style.padding = '12px 20px';
            btn.style.animation = 'pulse 1s infinite';
        } else {
            btn.style.background = 'var(--primary-orange)';
        }
        
        btn.addEventListener('click', () => {
            if (!gameActive) return;
            
            // Визуальная обратная связь
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 100);
            
            if (idx === currentAttackerIndex) {
                // Правильная блокировка
                score++;
                document.getElementById('score').innerText = score;
                
                // Эффект успеха
                card.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(76, 175, 80, 0.2))';
                card.style.border = '3px solid #4caf50';
                card.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.5)';
                
                // Визуальный фидбек
                showFeedback('✅ ХАКЕР ЗАБЛОКИРОВАН! +1 очко', '#4caf50');
                
                // Анимация взрыва/удаления хакера
                const hackerIcon = card.querySelector('span');
                if (hackerIcon) {
                    hackerIcon.style.animation = 'explode 0.3s ease';
                    setTimeout(() => {
                        hackerIcon.innerHTML = '💀';
                    }, 150);
                }
                
                setTimeout(() => {
                    if (gameActive) newRound();
                }, 400);
            } else {
                // Ложная блокировка - штраф
                timeLeft = Math.max(0, timeLeft - 5);
                document.getElementById('timer').innerText = timeLeft;
                
                // Эффект ошибки
                card.style.background = 'rgba(255, 68, 68, 0.3)';
                card.style.border = '2px solid #ff4444';
                
                // Визуальный фидбек
                showFeedback('❌ Ложная блокировка! -5 секунд', '#ff4444');
                
                if (timeLeft <= 0) {
                    endGame('⏰ Время вышло из-за ложной блокировки!');
                } else {
                    setTimeout(() => {
                        if (gameActive) newRound();
                    }, 500);
                }
            }
        });
        
        card.appendChild(btn);
        ipPanel.appendChild(card);
    });
    
    // auto fail if no block in 4 seconds
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        if (gameActive) {
            timeLeft = Math.max(0, timeLeft - 10);
            document.getElementById('timer').innerText = timeLeft;
            
            showFeedback('⚠️ ХАКЕРУ УДАЛОСЬ АТАКОВАТЬ! -10 сек', '#ffaa44');
            
            if (timeLeft <= 0) {
                endGame('💀 Хакер прорвался! Сервер атакован! 💀');
            } else {
                newRound();
            }
        }
    }, 5000);
}

// Функция для отображения всплывающих сообщений
function showFeedback(message, color) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.textContent = message;
    feedbackDiv.style.position = 'fixed';
    feedbackDiv.style.top = '20%';
    feedbackDiv.style.left = '50%';
    feedbackDiv.style.transform = 'translateX(-50%)';
    feedbackDiv.style.backgroundColor = color;
    feedbackDiv.style.color = 'white';
    feedbackDiv.style.padding = '12px 24px';
    feedbackDiv.style.borderRadius = '30px';
    feedbackDiv.style.fontWeight = 'bold';
    feedbackDiv.style.zIndex = '1000';
    feedbackDiv.style.animation = 'slideDown 0.3s ease';
    feedbackDiv.style.fontSize = '18px';
    feedbackDiv.style.boxShadow = '0 5px 20px rgba(0,0,0,0.3)';
    
    document.body.appendChild(feedbackDiv);
    
    setTimeout(() => {
        feedbackDiv.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            feedbackDiv.remove();
        }, 300);
    }, 1500);
}

let timerInterval;

function startGame() {
    gameActive = true;
    score = 0;
    timeLeft = 60;
    
    document.getElementById('score').innerText = '0';
    document.getElementById('timer').innerText = '60';
    document.getElementById('gameOverMsg').innerHTML = '';
    
    const timerElement = document.getElementById('timer');
    timerElement.style.color = 'white';
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (gameActive && timeLeft > 0) {
            timeLeft--;
            document.getElementById('timer').innerText = timeLeft;
            
            if (timeLeft <= 10) {
                timerElement.style.color = '#ff4444';
                timerElement.style.fontWeight = 'bold';
                timerElement.style.animation = 'pulse 1s infinite';
            }
            
            if (timeLeft <= 0) {
                endGame('🎉 ПОБЕДА! 🎉 Вы обезвредили всех хакеров!');
            }
        } else if (timeLeft <= 0) {
            endGame('🎉 ПОБЕДА! 🎉 Вы обезвредили всех хакеров!');
        }
    }, 1000);
    
    newRound();
}

function endGame(msg) {
    if (!gameActive) return;
    
    gameActive = false;
    clearInterval(timerInterval);
    if (timeoutId) clearTimeout(timeoutId);
    
    const msgElement = document.getElementById('gameOverMsg');
    msgElement.innerHTML = `<span style="color:#DC7000; font-size: 28px; text-shadow: 0 0 10px rgba(220,112,0,0.5);">${msg}</span>`;
    
    if (score > 0) {
        localStorage.setItem('game2_score', score);
        submitScore(score);
    }
    
    const allBtns = document.querySelectorAll('.block-btn');
    allBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });
}

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
    }
    
    @keyframes shake {
        0%, 100% {
            transform: rotate(0deg);
        }
        25% {
            transform: rotate(10deg);
        }
        75% {
            transform: rotate(-10deg);
        }
    }
    
    @keyframes explode {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        100% {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    .ip-card {
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    .ip-card:hover {
        transform: translateY(-5px);
    }
    
    .block-btn {
        transition: all 0.2s ease;
        cursor: pointer;
    }
    
    .block-btn:active {
        transform: scale(0.95);
    }
    
    .ip-address {
        font-size: 1.2rem;
        font-weight: bold;
        font-family: monospace;
    }
`;
document.head.appendChild(style);

// Обработчик кнопки "Следующая игра"
const nextBtn = document.getElementById('nextGameBtn');
if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (gameActive) {
            if (confirm('Игра ещё не закончена! Перейти на следующий уровень?')) {
                window.location.href = 'stage3';
            }
        } else {
            window.location.href = 'stage3';
        }
    });
}

startGame();