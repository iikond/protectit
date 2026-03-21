from flask import Flask, request, jsonify, render_template
import json
import os
from datetime import datetime

app = Flask(__name__)
DATA_FILE = 'protectit/database/users.json'

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

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    lastname = data.get('lastname')
    phone = data.get('phone')
    
    if not name or not lastname or not phone:
        return jsonify({'status': 'error', 'message': 'Не все поля заполнены'}), 400
    
    players = load_players()
    
    # Проверяем, есть ли уже такой телефон
    for player in players:
        if player['phone'] == phone:
            return jsonify({'status': 'error', 'message': 'Этот номер уже зарегистрирован'}), 400

    
    # Новый игрок
    new_id = len(players) + 1
    new_player = {
        'id': new_id,
        'name': name,
        'lastname': lastname,
        'phone': phone,
        'score': 0,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    players.append(new_player)
    save_players(players)
    
    return jsonify({'status': 'ok', 'player_id': new_id})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)