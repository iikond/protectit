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
        game1_score INTEGER DEFAULT 0,
        game2_score INTEGER DEFAULT 0,
        game3_score INTEGER DEFAULT 0
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

@app.route('/update_score', methods=['POST'])
def update_score():
    try:
        data = request.json
        player_id = data.get('player_id')
        game_number = data.get('game_number')  # 1, 2 или 3
        score = data.get('score')
        
        if not player_id or not game_number or score is None:
            return jsonify({'status': 'error', 'message': 'Missing data'}), 400
        
        conn = sqlite3.connect('players.db')
        cursor = conn.cursor()
        
        # Обновляем счет в зависимости от игры
        if game_number == 1:
            cursor.execute('UPDATE players SET game1_score = ? WHERE id = ?', (score, player_id))
        elif game_number == 2:
            cursor.execute('UPDATE players SET game2_score = ? WHERE id = ?', (score, player_id))
        elif game_number == 3:
            cursor.execute('UPDATE players SET game3_score = ? WHERE id = ?', (score, player_id))
        
        conn.commit()
        
        # Получаем общий счет
        cursor.execute('SELECT game1_score, game2_score, game3_score FROM players WHERE id = ?', (player_id,))
        result = cursor.fetchone()
        total_score = sum(filter(None, [result[0], result[1], result[2]])) if result else 0
        
        conn.close()
        
        return jsonify({
            'status': 'ok',
            'total_score': total_score,
            'message': f'Score for game {game_number} updated!'
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)