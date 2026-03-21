// Получаем элементы
const modal = document.getElementById('registerModal');
const reg_btn = document.getElementById('showRegBtn');
const span = document.getElementsByClassName('close')[0];
const form = document.getElementById('registerForm');

// Открыть попап
reg_btn.onclick = function() {
    modal.style.display = 'block';
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
form.onsubmit = function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const lastname = document.getElementById('lastname').value;
    const phone = document.getElementById('phone').value;
    
    if (!name || !lastname || !phone) {
        alert('Заполни все поля!');
        return;
    }
    
    // Отправляем данные на бэкенд
    fetch('/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, lastname, phone})
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            modal.style.display = 'none';
            // Запускаем игру
            startGame();
        } else {
            alert('Ошибка регистрации');
        }
    });
}