const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score = 0;
let health = 100;
let timeLeft = 60;
let gameActive = true;
let packets = [];

const PACKET_WIDTH = 100;
const PACKET_HEIGHT = 30;

// Адаптация canvas под размер экрана
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    // Получаем доступную ширину
    const containerWidth = container.clientWidth - 40; // отступы
    
    // Ограничиваем максимальную ширину
    const maxWidth = Math.min(900, containerWidth);
    
    // Сохраняем пропорции (900x400)
    const scale = maxWidth / 900;
    const newHeight = 400 * scale;
    
    // Устанавливаем CSS размеры
    canvas.style.width = `${maxWidth}px`;
    canvas.style.height = `${newHeight}px`;
    
    // Внутреннее разрешение остается 900x400 для логики игры
    canvas.width = 900;
    canvas.height = 400;
}

// Получение координат мыши с учетом масштаба
function getCanvasMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;   // 900 / отображаемая ширина
    const scaleY = canvas.height / rect.height; // 400 / отображаемая высота
    
    let mouseX = (e.clientX - rect.left) * scaleX;
    let mouseY = (e.clientY - rect.top) * scaleY;
    
    // Ограничиваем координаты в пределах canvas
    mouseX = Math.max(0, Math.min(canvas.width, mouseX));
    mouseY = Math.max(0, Math.min(canvas.height, mouseY));
    
    return { x: mouseX, y: mouseY };
}

class Packet {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'attack' or 'legit'
        this.width = PACKET_WIDTH;
        this.height = PACKET_HEIGHT;
    }
    
    draw() {
        ctx.fillStyle = this.type === 'attack' ? '#e34d4d' : '#4caf50';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Добавляем свечение для атакующих пакетов
        if (this.type === 'attack') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0000';
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Poppins';
        ctx.shadowBlur = 0;
        ctx.fillText(this.type === 'attack' ? '⚠️ ATTACK' : '✓ LEGIT', this.x + 8, this.y + 20);
    }
    
    move() {
        this.x -= 3; // Увеличил скорость для динамичности
    }
}

function spawnPacket() {
    if (!gameActive) return;
    const y = Math.random() * (canvas.height - PACKET_HEIGHT);
    const type = Math.random() < 0.65 ? 'attack' : 'legit'; // больше атак
    packets.push(new Packet(canvas.width, y, type));
}

function updateGame() {
    if (!gameActive) return;

    // move packets and check collision with left edge
    for (let i = 0; i < packets.length; i++) {
        packets[i].move();
        if (packets[i].x + PACKET_WIDTH < 0) {
            // reached server
            if (packets[i].type === 'attack') {
                health = Math.max(0, health - 15);
                // Визуальная обратная связь
                showDamageEffect();
                if (health <= 0) endGame('💀 Поражение! Сервер уничтожен. 💀');
            }
            packets.splice(i,1);
            i--;
        }
    }

    // update UI
    document.getElementById('score').innerText = score;
    document.getElementById('health').innerText = health;
    
    // Меняем цвет здоровья в зависимости от значения
    const healthElement = document.getElementById('health');
    if (health <= 30) {
        healthElement.style.color = '#ff4444';
    } else if (health <= 60) {
        healthElement.style.color = '#ffaa44';
    } else {
        healthElement.style.color = '#4caf50';
    }
    
    if (health <= 0) endGame('💀 Поражение! Сервер уничтожен. 💀');
}

// Эффект при получении урона
function showDamageEffect() {
    canvas.style.transition = 'all 0.1s ease';
    canvas.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.8)';
    setTimeout(() => {
        canvas.style.boxShadow = '0 0 10px rgba(220, 112, 0, 0.5)';
    }, 100);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем сервер с анимацией
    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00ff00';
    ctx.fillStyle = '#2a5f8a';
    ctx.fillRect(15, canvas.height/2 - 50, 50, 100);
    ctx.fillStyle = '#3a7faa';
    ctx.fillRect(20, canvas.height/2 - 45, 40, 90);
    ctx.fillStyle = '#DC7000';
    ctx.font = 'bold 32px Poppins';
    ctx.shadowBlur = 0;
    ctx.fillText('🖥️', 18, canvas.height/2 + 10);
    ctx.restore();
    
    // Добавляем эффект сканирования
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(220, 112, 0, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height/2 + i * 30 - 30);
        ctx.lineTo(canvas.width, canvas.height/2 + i * 30 - 30);
        ctx.stroke();
    }
    
    for (let p of packets) p.draw();
}

function gameLoop() {
    if (!gameActive) return;
    updateGame();
    draw();
    requestAnimationFrame(gameLoop);
}

// Обработчик кликов с адаптацией координат
canvas.addEventListener('click', (e) => {
    if (!gameActive) return;
    const { x: mouseX, y: mouseY } = getCanvasMousePosition(e);

    for (let i = 0; i < packets.length; i++) {
        const p = packets[i];
        if (mouseX >= p.x && mouseX <= p.x + p.width && 
            mouseY >= p.y && mouseY <= p.y + p.height) {
            
            if (p.type === 'attack') {
                score++;
                // Визуальный эффект при уничтожении
                showHitEffect(p.x, p.y);
                packets.splice(i,1);
            } else {
                score = Math.max(0, score - 2);
                // Эффект ошибки
                showErrorEffect(p.x, p.y);
                packets.splice(i,1);
            }
            break;
        }
    }
});

// Эффект попадания
function showHitEffect(x, y) {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff00';
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 20px Poppins';
    ctx.fillText('+1', x + 10, y - 10);
    ctx.restore();
}

// Эффект ошибки
function showErrorEffect(x, y) {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 16px Poppins';
    ctx.fillText('-2', x + 10, y - 10);
    ctx.restore();
}

let intervalSpawn, intervalTimer;

function startGame() {
    gameActive = true;
    score = 0;
    health = 100;
    timeLeft = 60;
    packets = [];
    
    document.getElementById('score').innerText = '0';
    document.getElementById('health').innerText = '100';
    document.getElementById('timer').innerText = '60';
    document.getElementById('gameOverMsg').innerHTML = '';
    
    // Сброс цвета здоровья
    document.getElementById('health').style.color = '#4caf50';
    
    if (intervalSpawn) clearInterval(intervalSpawn);
    if (intervalTimer) clearInterval(intervalTimer);
    
    intervalSpawn = setInterval(() => { 
        if(gameActive) spawnPacket(); 
    }, 700);
    
    intervalTimer = setInterval(() => {
        if (gameActive && timeLeft > 0) {
            timeLeft--;
            document.getElementById('timer').innerText = timeLeft;
            
            // Визуальный эффект при таймере
            if (timeLeft <= 10) {
                document.getElementById('timer').style.color = '#ff4444';
                document.getElementById('timer').style.fontWeight = 'bold';
            }
            
            if (timeLeft <= 0) endGame('🎉 ПОБЕДА! 🎉 Вы выдержали DDoS-атаку!');
        } else if (timeLeft <= 0) {
            endGame('🎉 ПОБЕДА! 🎉 Вы выдержали DDoS-атаку!');
        }
    }, 1000);
    
    // Адаптируем canvas при старте
    resizeCanvas();
    gameLoop();
}

function endGame(msg) {
    if (!gameActive) return;
    gameActive = false;
    clearInterval(intervalSpawn);
    clearInterval(intervalTimer);
    
    const msgElement = document.getElementById('gameOverMsg');
    msgElement.innerHTML = `<span style="color:#DC7000; font-size: 24px; text-shadow: 0 0 10px rgba(220,112,0,0.5);">${msg}</span>`;
    
    // Сохраняем результат в localStorage
    if (score > 0) {
        localStorage.setItem('game1_score', score);
    }
}

// Обработчик кнопки "Следующая игра"
const nextBtn = document.querySelector('button[href="stage2"]');
if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (gameActive) {
            if (confirm('Игра ещё не закончена! Перейти на следующий уровень?')) {
                window.location.href = 'stage2';
            }
        } else {
            window.location.href = 'stage2';
        }
    });
}

// Адаптация при изменении размера окна
window.addEventListener('resize', () => {
    resizeCanvas();
});

// Запускаем игру
startGame();