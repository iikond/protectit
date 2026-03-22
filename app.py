from flask import Flask, request, jsonify, render_template
import sqlite3
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-it'

def get_db():
    conn = sqlite3.connect('players.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='players'")
    table_exists = cursor.fetchone()
    
    if not table_exists:
        cursor.execute('''
            CREATE TABLE players (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                lastname TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                game1_score INTEGER DEFAULT 0,
                game2_score INTEGER DEFAULT 0,
                game3_score INTEGER DEFAULT 0,
                total_score INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✅ Таблица players создана")
    else:
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
    
    conn.commit()
    conn.close()

init_db()

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

@app.route('/leaderboard')
def leaderboard():
    return render_template('leaderboard.html')

@app.route('/check_player/<int:player_id>', methods=['GET'])
def check_player(player_id):
    """Проверяет, существует ли игрок в БД"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM players WHERE id = ?', (player_id,))
        exists = cursor.fetchone() is not None
        conn.close()
        
        return jsonify({'exists': exists})
    except Exception as e:
        print(f"❌ Ошибка проверки игрока: {e}")
        return jsonify({'exists': False})

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        name = data.get('name')
        lastname = data.get('lastname')
        phone = data.get('phone')
        
        if not all([name, lastname, phone]):
            return jsonify({'status': 'error', 'message': 'Все поля обязательны'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM players WHERE phone = ?', (phone,))
        existing = cursor.fetchone()
        
        if existing:
            conn.close()
            return jsonify({
                'status': 'ok',
                'id': existing['id'],
                'message': 'Добро пожаловать назад!'
            })
        
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
            'message': 'Регистрация успешна'
        })
        
    except Exception as e:
        print(f"❌ Ошибка регистрации: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/update_score', methods=['POST'])
def update_score():
    try:
        data = request.json
        player_id = data.get('player_id')
        game = data.get('game')
        score = data.get('score', 0)
        
        print(f"📝 Получен запрос: player_id={player_id}, game={game}, score={score}")
        
        if not player_id or not game:
            return jsonify({'status': 'error', 'message': 'Missing data'}), 400
        
        if game not in ['game1', 'game2', 'game3']:
            return jsonify({'status': 'error', 'message': 'Invalid game'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Сначала проверяем, существует ли игрок
        cursor.execute('SELECT id FROM players WHERE id = ?', (player_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'status': 'error', 'message': 'Player not found'}), 404
        
        # Обновляем счет
        query = f'''
            UPDATE players 
            SET {game}_score = MAX({game}_score, ?),
                total_score = COALESCE(game1_score, 0) + COALESCE(game2_score, 0) + COALESCE(game3_score, 0)
            WHERE id = ?
        '''
        
        cursor.execute(query, (score, player_id))
        conn.commit()
        conn.close()
        
        print(f"✅ Счет обновлен: player {player_id}, {game} = {score}")
        
        return jsonify({'status': 'ok', 'message': 'Score updated'})
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/get_leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE players 
            SET total_score = COALESCE(game1_score, 0) + COALESCE(game2_score, 0) + COALESCE(game3_score, 0)
        ''')
        conn.commit()
        
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

@app.route('/get_player_stats/<int:player_id>', methods=['GET'])
def get_player_stats(player_id):
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)