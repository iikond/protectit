from flask import Flask, request, jsonify, render_template
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'protectit-secret-key-2024'

# ==================== РАБОТА С БАЗОЙ ДАННЫХ ====================

def get_db():
    """Получение подключения к БД"""
    conn = sqlite3.connect('players.db')
    conn.row_factory = sqlite3.Row  # Чтобы можно было обращаться по именам колонок
    return conn

def init_db():
    """Инициализация базы данных"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Создаем таблицу players
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            lastname TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            game1_score INTEGER DEFAULT 0,
            game2_score INTEGER DEFAULT 0,
            game3_score INTEGER DEFAULT 0,
            total_score INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Проверяем и добавляем недостающие колонки (для обновления существующей БД)
    cursor.execute("PRAGMA table_info(players)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'game1_score' not in columns:
        cursor.execute("ALTER TABLE players ADD COLUMN game1_score INTEGER DEFAULT 0")
    if 'game2_score' not in columns:
        cursor.execute("ALTER TABLE players ADD COLUMN game2_score INTEGER DEFAULT 0")
    if 'game3_score' not in columns:
        cursor.execute("ALTER TABLE players ADD COLUMN game3_score INTEGER DEFAULT 0")
    if 'total_score' not in columns:
        cursor.execute("ALTER TABLE players ADD COLUMN total_score INTEGER DEFAULT 0")
    if 'last_played' not in columns:
        cursor.execute("ALTER TABLE players ADD COLUMN last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    
    conn.commit()
    conn.close()
    print("✅ База данных инициализирована")

# Вызываем инициализацию при старте
init_db()

# ==================== МАРШРУТЫ (ROUTES) ====================

@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')

@app.route('/stage1')
def stage1():
    """Первая игра"""
    return render_template('games/game1/game1.html')

@app.route('/stage2')
def stage2():
    """Вторая игра"""
    return render_template('games/game2/game2.html')

@app.route('/stage3')
def stage3():
    """Третья игра"""
    return render_template('games/game3/game3.html')

@app.route('/leaderboard')
def leaderboard():
    """Страница лидерборда"""
    return render_template('end.html')

# ==================== API ЭНДПОИНТЫ ====================

@app.route('/api/register', methods=['POST'])
def register():
    """Регистрация нового игрока"""
    try:
        data = request.json
        name = data.get('name', '').strip()
        lastname = data.get('lastname', '').strip()
        phone = data.get('phone', '').strip()
        
        # Валидация
        if not all([name, lastname, phone]):
            return jsonify({
                'status': 'error', 
                'message': 'Все поля обязательны для заполнения'
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Проверяем, существует ли пользователь с таким телефоном
        cursor.execute('SELECT id, name, lastname FROM players WHERE phone = ?', (phone,))
        existing = cursor.fetchone()
        
        if existing:
            conn.close()
            return jsonify({
                'status': 'ok',
                'id': existing['id'],
                'message': f'С возвращением, {existing["name"]}!'
            })
        
        # Создаем нового пользователя
        cursor.execute('''
            INSERT INTO players (name, lastname, phone) 
            VALUES (?, ?, ?)
        ''', (name, lastname, phone))
        
        conn.commit()
        player_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'status': 'ok',
            'id': player_id,
            'message': f'Добро пожаловать, {name}!'
        })
        
    except Exception as e:
        print(f"❌ Ошибка регистрации: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/check_player/<int:player_id>', methods=['GET'])
def check_player(player_id):
    """Проверка существования игрока"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM players WHERE id = ?', (player_id,))
        exists = cursor.fetchone() is not None
        conn.close()
        
        return jsonify({'exists': exists})
    except Exception as e:
        return jsonify({'exists': False})

@app.route('/api/update_score', methods=['POST'])
def update_score():
    """Обновление очков игрока"""
    try:
        data = request.json
        player_id = data.get('player_id')
        game = data.get('game')  # 'game1', 'game2', 'game3'
        score = data.get('score', 0)
        
        print(f"📝 Обновление счета: player_id={player_id}, game={game}, score={score}")
        
        if not player_id or not game:
            return jsonify({'status': 'error', 'message': 'Missing data'}), 400
        
        if game not in ['game1', 'game2', 'game3']:
            return jsonify({'status': 'error', 'message': 'Invalid game name'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Проверяем существование игрока
        cursor.execute('SELECT id FROM players WHERE id = ?', (player_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'status': 'error', 'message': 'Player not found'}), 404
        
        # Обновляем счет (берем максимальное значение)
        cursor.execute(f'''
            UPDATE players 
            SET {game}_score = MAX({game}_score, ?),
                total_score = COALESCE(game1_score, 0) + COALESCE(game2_score, 0) + COALESCE(game3_score, 0),
                last_played = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (score, player_id))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Счет обновлен: player {player_id}, {game} = {score}")
        
        return jsonify({
            'status': 'ok',
            'message': 'Score updated successfully'
        })
        
    except Exception as e:
        print(f"❌ Ошибка обновления: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/get_leaderboard', methods=['GET'])
def get_leaderboard():
    """Получение таблицы лидеров"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Обновляем total_score
        cursor.execute('''
            UPDATE players 
            SET total_score = COALESCE(game1_score, 0) + COALESCE(game2_score, 0) + COALESCE(game3_score, 0)
        ''')
        conn.commit()
        
        # Получаем топ-10
        cursor.execute('''
            SELECT id, name, lastname, 
                   COALESCE(game1_score, 0) as game1_score,
                   COALESCE(game2_score, 0) as game2_score,
                   COALESCE(game3_score, 0) as game3_score,
                   COALESCE(total_score, 0) as total_score
            FROM players 
            WHERE COALESCE(game1_score, 0) > 0 
               OR COALESCE(game2_score, 0) > 0 
               OR COALESCE(game3_score, 0) > 0
            ORDER BY total_score DESC, game1_score DESC
            LIMIT 10
        ''')
        
        players = cursor.fetchall()
        conn.close()
        
        result = []
        for i, player in enumerate(players, 1):
            result.append({
                'rank': i,
                'id': player['id'],
                'name': f"{player['name']} {player['lastname']}",
                'game1': player['game1_score'],
                'game2': player['game2_score'],
                'game3': player['game3_score'],
                'total': player['total_score']
            })
        
        return jsonify({'status': 'ok', 'leaderboard': result})
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/get_player_stats/<int:player_id>', methods=['GET'])
def get_player_stats(player_id):
    """Получение статистики конкретного игрока"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT name, lastname, 
                   COALESCE(game1_score, 0) as game1_score,
                   COALESCE(game2_score, 0) as game2_score,
                   COALESCE(game3_score, 0) as game3_score,
                   COALESCE(total_score, 0) as total_score
            FROM players 
            WHERE id = ?
        ''', (player_id,))
        
        player = cursor.fetchone()
        conn.close()
        
        if player:
            return jsonify({
                'status': 'ok',
                'player': {
                    'name': f"{player['name']} {player['lastname']}",
                    'game1': player['game1_score'],
                    'game2': player['game2_score'],
                    'game3': player['game3_score'],
                    'total': player['total_score']
                }
            })
        
        return jsonify({'status': 'error', 'message': 'Player not found'}), 404
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/get_all_players', methods=['GET'])
def get_all_players():
    """Получение всех игроков (для админки)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, lastname, phone, 
                   COALESCE(game1_score, 0) as game1,
                   COALESCE(game2_score, 0) as game2,
                   COALESCE(game3_score, 0) as game3,
                   COALESCE(total_score, 0) as total,
                   created_at, last_played
            FROM players 
            ORDER BY total_score DESC
        ''')
        
        players = cursor.fetchall()
        conn.close()
        
        result = []
        for player in players:
            result.append(dict(player))
        
        return jsonify({'status': 'ok', 'players': result})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ==================== ЗАПУСК ====================

if __name__ == '__main__':
    print("🚀 Запуск Protect!T сервера...")
    print("📊 База данных: players.db")
    print("🌐 Сервер доступен по адресу: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)