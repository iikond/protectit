// Получаем элементы
const modal = document.getElementById('registerModal');
const reg_btn = document.getElementById('showRegBtn');
const span = document.getElementsByClassName('close')[0];
const form = document.getElementById('registerForm');

// Проверяем, зарегистрирован ли пользователь (с проверкой на сервере)
async function isRegistered() {
    const playerId = localStorage.getItem('player_id');
    if (!playerId) return false;
    
    try {
        const response = await fetch(`/api/check_player/${playerId}`);
        const data = await response.json();
        return data.exists === true;
    } catch (error) {
        console.error('Error checking player:', error);
        return false;
    }
}

// Обработчик кнопки "Играть"
reg_btn.onclick = async function() {
    const registered = await isRegistered();
    
    if (registered) {
        window.location.href = '/stage1';
    } else {
        localStorage.removeItem('player_id');
        modal.style.display = 'block';
    }
}

// Закрыть по крестику
span.onclick = function() {
    modal.style.display = 'none';
}

// Закрыть по клику вне попапа
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Обработка формы
form.onsubmit = async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const lastname = document.getElementById('lastname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    if (!name || !lastname || !phone) {
        alert('Заполни все поля!');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, lastname, phone})
        });
        
        const data = await response.json();
        
        if (data.status === 'ok') {
            localStorage.setItem('player_id', data.id);
            modal.style.display = 'none';
            window.location.href = '/stage1';
        } else {
            alert(data.message || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка соединения с сервером');
    }
}

// При загрузке страницы проверяем валидность регистрации
window.addEventListener('load', async function() {
    const registered = await isRegistered();
    if (!registered) {
        localStorage.removeItem('player_id');
    }
});