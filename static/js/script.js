document.getElementById('test_button').addEventListener('click', function() {
    alert('You will be hacked by the FBI in 3... 2... 1... 0... HACKED BY THE FBI!');
});

document.getElementById('approve_button').addEventListener('click', function() {
    const email = document.getElementById('test_email').value;
    const password = document.getElementById('test_password').value;

    if (!email || !password) {
        alert('Заполни все поля');
        return;
    }

    const data = {
        email: email,
        password: password
    };
    fetch('http://localhost:5000/approve', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        console.log('Статус:', response.status);  // добавить
        return response.json();
    })
    .then(data => console.log(data))
    .catch(error => console.error('Ошибка:', error));
});