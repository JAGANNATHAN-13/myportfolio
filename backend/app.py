import os
import sqlite3
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
app = Flask(__name__, template_folder='../frontend/templates', static_folder='../frontend/static')
CORS(app, origins=["https://myportfolio-neon-kappa.vercel.app"])
app.secret_key = 'super_secret_agency_key_change_in_production'
DATABASE = 'portfolio.db'

# Admin credentials
ADMIN_USERNAME = 'jagannathan m'
ADMIN_PASSWORD = 'jagan@1376'  # Change in production

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with app.app_context():
        db = get_db()
        db.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                tech_stack TEXT NOT NULL,
                image_url TEXT,
                demo_link TEXT
            )
        ''')
        db.commit()

init_db()

from flask import jsonify

@app.route('/')
def home():
    return jsonify({"message": "Backend running successfully"})

@app.route('/api/projects')
def get_projects():
    db = get_db()
    projects = db.execute('SELECT * FROM projects ORDER BY id DESC').fetchall()
    
    return jsonify([dict(p) for p in projects])
@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            return render_template('admin.html', error='Invalid credentials', view='login')
    
    if session.get('admin_logged_in'):
        return redirect(url_for('admin_dashboard'))
    return render_template('admin.html', view='login')

@app.route('/admin/dashboard')
def admin_dashboard():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin'))
    db = get_db()
    projects = db.execute('SELECT * FROM projects ORDER BY id DESC').fetchall()
    return render_template('admin.html', view='dashboard', projects=[dict(p) for p in projects])

@app.route('/admin/logout')
def logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin'))

# API Routes
@app.route('/api/projects', methods=['POST'])
def add_project():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    db = get_db()
    db.execute('''
        INSERT INTO projects (title, description, tech_stack, image_url, demo_link)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['title'], data['description'], data['tech_stack'], data.get('image_url', ''), data.get('demo_link', '')))
    db.commit()
    return jsonify({'success': True}), 201

@app.route('/api/projects/<int:id>', methods=['PUT'])
def edit_project(id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    db = get_db()
    db.execute('''
        UPDATE projects
        SET title = ?, description = ?, tech_stack = ?, image_url = ?, demo_link = ?
        WHERE id = ?
    ''', (data['title'], data['description'], data['tech_stack'], data.get('image_url', ''), data.get('demo_link', ''), id))
    db.commit()
    return jsonify({'success': True}), 200

@app.route('/api/projects/<int:id>', methods=['DELETE'])
def delete_project(id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    db = get_db()
    db.execute('DELETE FROM projects WHERE id = ?', (id,))
    db.commit()
    return jsonify({'success': True}), 200

@app.route('/api/contact', methods=['POST'])
def contact():
    # In a real app, send an email here.
    # We will just print to console to simulate.
    data = request.json
    print(f"New contact message from {data.get('name')} ({data.get('email')}): {data.get('message')}")
    return jsonify({'success': True, 'message': 'Message received.'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
