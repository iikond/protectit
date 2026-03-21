const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score = 0;
let health = 100;
let timeLeft = 60;
let gameActive = true;
let packets = [];

const PACKET_WIDTH = 50;
const PACKET_HEIGHT = 30;

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
        ctx.fillStyle = 'white';
        ctx.font = '12px Poppins';
        ctx.fillText(this.type === 'attack' ? 'ATTACK' : 'LEGIT', this.x+5, this.y+20);
    }
    move() {
        this.x -= 3; // move left
    }
}

function spawnPacket() {
    if (!gameActive) return;
    const y = Math.random() * (canvas.height - PACKET_HEIGHT);
    const type = Math.random() < 0.6 ? 'attack' : 'legit'; // more attacks
    packets.push(new Packet(canvas.width - 50, y, type));
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
                if (health <= 0) endGame('Поражение! Сервер уничтожен.');
            }
            packets.splice(i,1);
            i--;
        }
    }

    // update UI
    document.getElementById('score').innerText = score;
    document.getElementById('health').innerText = health;
    if (health <= 0) endGame('Поражение! Сервер уничтожен.');
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw server icon
    ctx.fillStyle = '#aaa';
    ctx.fillRect(20, canvas.height/2-40, 40, 80);
    ctx.fillStyle = '#DC7000';
    ctx.font = 'bold 20px Poppins';
    ctx.fillText('🖥️', 25, canvas.height/2);
    for (let p of packets) p.draw();
}

function gameLoop() {
    if (!gameActive) return;
    updateGame();
    draw();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', (e) => {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    for (let i = 0; i < packets.length; i++) {
        const p = packets[i];
        if (mouseX >= p.x && mouseX <= p.x+p.width && mouseY >= p.y && mouseY <= p.y+p.height) {
            if (p.type === 'attack') {
                score++;
                packets.splice(i,1);
            } else {
                score = Math.max(0, score - 2);
                packets.splice(i,1);
            }
            break;
        }
    }
});

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
    if (intervalSpawn) clearInterval(intervalSpawn);
    if (intervalTimer) clearInterval(intervalTimer);
    intervalSpawn = setInterval(() => { if(gameActive) spawnPacket(); }, 800);
    intervalTimer = setInterval(() => {
        if (gameActive && timeLeft > 0) {
            timeLeft--;
            document.getElementById('timer').innerText = timeLeft;
            if (timeLeft <= 0) endGame('Победа! Вы выдержали DDoS-атаку!');
        } else if (timeLeft <= 0) {
            endGame('Победа! Вы выдержали DDoS-атаку!');
        }
    }, 1000);
    gameLoop();
}

function endGame(msg) {
    if (!gameActive) return;
    gameActive = false;
    clearInterval(intervalSpawn);
    clearInterval(intervalTimer);
    document.getElementById('gameOverMsg').innerHTML = `<span style="color:#DC7000">${msg}</span>`;
}

document.getElementById('restartBtn').addEventListener('click', () => {
    endGame('');
    startGame();
});

startGame();