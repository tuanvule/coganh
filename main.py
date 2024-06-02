from flask import Flask, flash, request, redirect, url_for, render_template, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_wtf import FlaskForm 
from wtforms import SubmitField, PasswordField, StringField
from wtforms.validators import Length, ValidationError, EqualTo, DataRequired
from flask_bcrypt import Bcrypt
from game_manager import activation
import trainAI.Master
import webbrowser
from threading import Timer
import json
import secrets
from fdb.firestore_config import fdb
import socketio
import trainAI.MasterUser
import requests

doc_ref_room = fdb.collection("room")

# doc = doc_ref.get()

# if doc.exists:
#     print(f"Document data: {doc.to_dict()}")

class Player:
    def __init__(self, dict: dict):
        for key, value in dict.items():
            setattr(self, key, value)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['WTF_CSRF_ENABLED'] = False
app.app_context().push()

#Flask Alchemy initialization
bcrypt = Bcrypt(app)
db = SQLAlchemy(app)

app.config['MAX_CONTENT_LENGTH'] = 16_000_00  #Max file size
app.config['UPLOAD_FOLDER'] = "static/botfiles"

sio = socketio.Server(cors_allowed_origins='*')
app.wsgi_app = socketio.WSGIApp(sio, app.wsgi_app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view='login'
login_manager.login_message_category = "info"
login_manager.login_message = "Xin hãy đăng nhập để truy cập"

def generate_secret_key(user_name):
    # Tạo secret key dựa trên ID của người dùng và secret key mặc định
    secret_key = f"{app.config['SECRET_KEY']}_{user_name}"
    return secret_key

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(db.Model, UserMixin): 
    username:str
    elo:str
    fightable:bool

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)
    elo = db.Column(db.Integer)
    fightable = db.Column(db.Boolean)


class LoginForm(FlaskForm):
    username = StringField("Tên đăng nhập", validators=[DataRequired(), Length(min=4, max=20)])
    password =  PasswordField("Mật khẩu", validators=[DataRequired(), Length(min=4, max=20)])
    submit = SubmitField("Đăng Nhập")


class RegisterForm(FlaskForm):
    username = StringField('Tên đăng nhập', validators=[DataRequired(), Length(min=4, max=20)])
    password =  PasswordField('Mật khẩu',  validators=[DataRequired(), Length(min=4, max=20)])
    conf_pass =  PasswordField('Xác nhận mật khẩu:', validators=[DataRequired(), EqualTo("password", message='Mật khẩu xác nhận không trùng khớp')])
    submit = SubmitField(label='Tạo tài khoản')

    def validate_username(self, username_to_check):
        if User.query.filter_by(username=username_to_check.data).first(): #_existing_user_username
            raise ValidationError('Tên đăng nhập đã được sử dụng')


@app.route('/')
def home_page():
    if 'secret_key' in session:
        user = User.query.where(User.username == session['username']).first()
        login_user(user)
    else:
        if current_user:
            logout_user()
    return render_template('home.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user:
            if bcrypt.check_password_hash(user.password, form.password.data):
                secret_key = generate_secret_key(form.username.data)
                session['secret_key'] = secret_key
                session['username'] = form.username.data
                # print(session['secret_key'])
                login_user(user)
                flash("Đăng nhập thành công", category='success')
                return redirect(url_for('menu'))
            else: flash("Mật khẩu không hợp lệ! Vui lòng thử lại", category='danger')
        else: flash("Tên đăng nhập không hợp lệ! Vui lòng thử lại", category='danger')
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data)
        new_user = User(username=form.username.data, password=hashed_password, elo=0, fightable=False)
        db.session.add(new_user)
        db.session.commit()
        code = '''
from tool import valid_move, distance
# valid_move(x, y, board)
# distance(x1, y1, x2, y2)

# Remember that player.board[y][x] is the tile at (x, y) when printing
def main(player):
    for x,y, in player.your_pos:
        move = ((0,-1),(0,1),(1,0),(-1,0)) 
        for mx, my in move:
            if 0 <= x+mx <=4 and 0 <= y+my <= 4 and player.board[y+my][x+mx] == 0: #check if new position is valid
                return {"selected_pos": (x,y), "new_pos": (x+mx, y+my)}
'''
        with open(f"static/botfiles/botfile_{form.username.data}.py", mode="w", encoding="utf-8") as f:
            f.write(code)
        return redirect(url_for('login'))
    for err_msg in form.errors.values(): #If there are errors from the validations
        flash(err_msg[0], category="danger")

    return render_template('register.html', form=form)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    session.clear()
    flash("Bạn đã đăng xuất!!!", category='info')
    return redirect(url_for('home_page'))


@app.route('/menu')
@login_required
def menu():
    if 'secret_key' in session:
        # print(session['secret_key'])
        user = User.query.where(User.username == session['username']).first()
        login_user(user)
        return render_template('menu.html', current_user=current_user)
    else:
        if current_user:
            logout_user()
        return redirect(url_for('login'))
        

@app.route('/upload_code', methods=['POST'])
@login_required
def upload_code():
    name = current_user.username
    code = request.get_json()
    user = User.query.filter_by(username=current_user.username).first()
    with open(f"static/botfiles/botfile_{name}.py", mode="w", encoding="utf-8") as f:
        f.write(code)
    try: 
        winner, max_move_win, new_url = activation("trainAI.Master", name, 0) # người thắng / số lượng lượt chơi
        # with open(f"static/output/stdout_{name}.txt", encoding="utf-8") as f:
        #     txt = f.read()
        user.fightable = True
        db.session.commit()
        data = {
            "code": 200,
            "status": winner,
            "max_move_win": max_move_win,
            "new_url": new_url,
        }
        return json.dumps(data)
    except Exception as err:
        err = str(err).replace(r"c:\Users\Hello\OneDrive\Code Tutorial\Python", "...")
        print(err)
        with open(f"static/output/stdout_{name}.txt", encoding="utf-8") as f:
            txt = f.read()
        user.fightable = False
        db.session.commit()
        data = {
            "code": 400,
            "err": txt
        }
        return json.dumps(data) # Giá trị Trackback Error
    
@app.route('/debug_code', methods=['POST'])
@login_required
def debug_code():
    name = current_user.username
    data = request.get_json()
    user = User.query.filter_by(username=name).first()
    with open(f"static/botfiles/botfile_{name}.py", mode="w", encoding="utf-8") as f:
        f.write(data["code"])
    try: 
        img_url, inp_oup = activation("trainAI.Master", name, data["debugNum"]) # người thắng / số lượng lượt chơi

        with open(f"static/output/stdout_{name}.txt", encoding="utf-8") as f:
            txt = f.read()
        data = {
            "code": 200,
            "img_url": img_url,
            "output": txt,
            "inp_oup": inp_oup
        }
        return json.dumps(data)
    except Exception:
        with open(f"static/output/stdout_{name}.txt", encoding="utf-8") as f:
            txt = f.read()
        user.fightable = False
        db.session.commit()
        data = {
            "code": 400,
            "output": txt,
        }
        return json.dumps(data) # Giá trị Trackback Error
    
@app.route('/save_code', methods=['POST'])
@login_required
def save_code():
    name = current_user.username
    code = request.get_json()
    with open(f"static/botfiles/botfile_{name}.py", mode="w", encoding="utf-8") as f:
        f.write(code)
    return json.dumps("succeed")

@app.route('/create_bot')
@login_required
def create_bot():
    if 'secret_key' in session:
        user = User.query.where(User.username == session['username']).first()
        login_user(user)
        return render_template('create_bot.html')
    else:
        if current_user:
            logout_user()
        return redirect(url_for('login'))
    
@app.route('/challenge_mode')
@login_required
def challenge_mode():
    if 'secret_key' in session:
        user = User.query.where(User.username == session['username']).first()
        login_user(user)
        return render_template('challenge_mode.html')
    else:
        if current_user:
            logout_user()
        return redirect(url_for('login'))
        
@app.route('/get_code')
@login_required
def get_code():
    name = current_user.username
    with open(f"static/botfiles/botfile_{name}.py", mode="r", encoding="utf-8") as f:
        return json.dumps(f.read())
    
@app.route('/get_users')
@login_required
def get_users():
    users = [(i.username, i.elo) for i in User.query.filter(User.username != current_user.username, User.fightable == True).order_by(User.elo.desc()).limit(10).all()]
    return users

@app.route('/bot_bot')
@login_required
def bot_bot():
    if 'secret_key' in session:
        user = User.query.where(User.username == session['username']).first()
        login_user(user)
        users = [(i.username, i.elo) for i in User.query.filter(User.username != current_user.username, User.fightable == True).order_by(User.elo.desc()).limit(10).all()]
        rank_board = [(i.username, i.elo) for i in User.query.filter(User.fightable == True).order_by(User.elo.desc()).limit(5).all()]
        return render_template('bot_bot.html', users = users, rank_board = rank_board)
    else:
        if current_user:
            logout_user()
        return redirect(url_for('login'))

@app.route('/human_bot')
@login_required
def human_bot():
    return render_template('human_bot.html', user = current_user)

@app.route('/human_human')
@login_required
def human_human():
    return render_template('human_human.html', user = current_user)

@app.route('/room_manager')
@login_required
def room_manager():
    return render_template('room_manager.html', user = current_user)

@app.route('/get_pos_of_playing_chess', methods=['POST'])
@login_required
def get_pos_of_playing_chess():
    player = Player(request.get_json())
    player.your_pos = [tuple(i) for i in player.your_pos]
    player.opp_pos = [tuple(i) for i in player.opp_pos]
    player.your_pos, player.opp_pos = player.opp_pos, player.your_pos
    move = trainAI.Master.main(player)
    move['selected_pos'] = tuple(reversed(list(move['selected_pos'])))
    move['new_pos'] = tuple(reversed(list(move['new_pos'])))
    return move

@app.route('/get_rate', methods=['POST'])
@login_required
def get_rate():
    data = request.get_json()
    move_list = data["move_list"]
    img_data = data["img_data"]
    for i in move_list:
        if i['side'] == -1:
            i['your_pos'], i['opp_pos'] = [tuple(i) for i in i['opp_pos']], [tuple(i) for i in i['your_pos']]
            i['board'] = eval(str(i['board']).replace('-1', '`').replace('1', '-1').replace('`', '1'))
    rate = [trainAI.MasterUser.main(i) for i in move_list]

    for i in range(len(img_data["img"])):
        img_data["img"][i].append(rate[i])

    print(img_data)

    img_url = requests.post("http://tlv23.pythonanywhere.com//generate_debug_image", json=img_data).text

    return json.dumps({"rate": rate, "img_url": img_url})

@app.route('/fighting', methods=['POST'])
@login_required
def fighting():
    name = current_user.username
    player = request.get_json()
    winner, max_move_win, new_url = activation("static.botfiles.botfile_"+player['name'], name, 0)
    
    data = {
        "status": winner,
        "max_move_win": max_move_win,
        "new_url": new_url
    }

    return data

@app.route('/update_rank_board', methods=['POST'])
@login_required
def update_rank_board():
    data = request.get_json()
    enemy = User.query.filter_by(username=data['enemy']['name']).first()
    player = User.query.filter_by(username=data['player']['name']).first()
    enemy.elo = data['enemy']['elo']
    player.elo = data['player']['elo']
    db.session.commit()
    users = [(i.username, i.elo) for i in User.query.filter(User.fightable == True).order_by(User.elo.desc()).limit(5).all()]

    return users

@app.route('/get_room', methods=['GET'])
@login_required
def get_room():
    # name = current_user.username
    doc_ref = doc_ref_room.where("player_2", "==", "").where("player_1", "!=", current_user.username).where("ready_P1", "==", 1).stream()
    rooms = []
    for doc in doc_ref:
        rooms.append(doc.to_dict())
    return jsonify(rooms)

@app.route('/create_room', methods=['POST'])
@login_required
def create_room():
    data = request.get_json()
    name = current_user.username

    doc_ref_room.document(name).set(data)
    return json.dumps("success")

@app.route('/join_room', methods=['POST'])
@login_required
def join_room():
    data = request.get_json()

    doc_ref = doc_ref_room.document(data["player_1"])
    doc_ref.update(data)
    return json.dumps("success")

@app.route('/out_room', methods=['POST'])
@login_required
def out_room():
    try:
        data = request.get_data(as_text=True)
        json_data = json.loads(data)
        room_id = json_data["room_id"]
        print(f"Received notification: {json_data}")
        sio.emit(f'out_room_{room_id}')
        return '', 204
    except Exception as e:
        print(f"Error processing request: {e}")
        return 'Error', 400


@sio.event
def connect(sid, eviron):
    print(f"Client connected: {sid}")

@sio.event
def join_room(sid, room_id, type, state, user_info):
    doc_ref = doc_ref_room.document(room_id)
    doc_ref.set({type: state}, merge=True)
    sio.emit(f"join_room_{room_id}", {
        "type": type,
        "user_info": user_info,
    })
    print(f"Client connected: {sid}")

# @sio.event
# def out_room(sid, room_id, type, state):
#     doc_ref = doc_ref_room.document(room_id)
#     doc_ref.set({type: state}, merge=True)
#     sio.emit(f"out_room_{room_id}")
#     print(f"Client disconnected: {sid}")

# Xử lý ngắt kết nối từ client
@sio.event
def disconnect(sid):
    print(f"Client disconnected: {sid}")

# Xử lý sự kiện 'message' từ client
@sio.event
def message(sid, data):
    print(f"Message from {sid}: {data}")
    sio.send("Hello from server!")

@sio.event
def check_user(data, environ):
    # sio.emit('check_user', environ)
    sio.emit(f'check_user_{environ}', environ)

@sio.event
def get_move(data, room, environ):
    sio.emit(f'get_move_{room}', environ)

if __name__ == '__main__':
    open_browser = lambda: webbrowser.open_new("http://127.0.0.1:5000")
    Timer(1, open_browser).start()
    app.run(port=5000, debug=True, use_reloader=False)