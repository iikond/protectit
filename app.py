from flask import Flask, request, jsonify, render_template
import json
import os
from datetime import datetime
import sqlite3

app = Flask(__name__)
DATA_FILE = 'protectit/database/users.json'

conn = sqlite3.connect('players.db', check_same_thread=False)
cursor = conn.cursor()

# Создание таблицы
cursor.execute('''
    CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        lastname TEXT,
        phone TEXT UNIQUE,
        score INTEGER DEFAULT 0
    )
''')
conn.commit()

# Загружаем игроков из файла
def load_players():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

# Сохраняем игроков
def save_players(players):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)  # создаст папку, если нет
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(players, f, indent=2, ensure_ascii=False)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stage1')
def stage1():
    return render_template('games/game1/game1.html')

@app.route('/stage2')
def stage2():
    return render_template('games/game2/game2.html')

@app.route('/stage3')
def stage3():
    return render_template('games/game3/game3.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data['name']
    lastname = data['lastname']
    phone = data['phone']
    
    try:
        cursor.execute('INSERT INTO players (name, lastname, phone) VALUES (?, ?, ?)',
                       (name, lastname, phone))
        conn.commit()
        conn.close()
        return jsonify({'status': 'ok', 'id': cursor.lastrowid})
    except sqlite3.IntegrityError:
        return jsonify({'status': 'error', 'message': 'Телефон уже зарегистрирован'}), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)