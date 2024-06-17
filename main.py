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
from firebase_admin import firestore
from fdb.firestore_config import fdb
import socketio
import trainAI.MasterUser
import requests
from importlib import reload
from io import StringIO
import traceback
import datetime
import sys
import time

doc_ref_room = fdb.collection("room")
doc_ref_post = fdb.collection("post")
doc_ref_task = fdb.collection("task")

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


@app.template_filter('parse_json')
def parse_json(json_string):
    return json.loads(json_string)

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
    move = [[-1,0],[0,-1],[0,1],[1,0]]
    for x,y in player.your_pos:
        for mx,my in move:
            if 0 <= x+mx <= 4 and 0 <= y+my <= 4 and player.board[y+my][x+mx] == 0:
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
    data = request.get_json()
    bot = data["bot"]
    user = User.query.filter_by(username=current_user.username).first()
    with open(f"static/botfiles/botfile_{name}.py", mode="w", encoding="utf-8") as f:
        f.write(data["code"])
    err, game_res, output = activation(f"trainAI.{bot}", name, 0) # người thắng / số lượng lượt chơi
    user.fightable = not err
    db.session.commit()
    if err:
        data = {
            "code": 400,
            "output": output
        }
    else:
        data = {
            "code": 200,
            "status": game_res[0],
            "max_move_win": game_res[1],
            "new_url": game_res[2],
            "output": output
        }

    return json.dumps(data) # Giá trị Trackback Error
    
@app.route('/debug_code', methods=['POST'])
@login_required
def debug_code():
    name = current_user.username
    res = request.get_json()
    data = res["request_data"]
    bot = data["bot"]
    user = User.query.filter_by(username=name).first()
    with open(f"static/botfiles/botfile_{name}.py", mode="w", encoding="utf-8") as f:
        f.write(data["code"])
    err, game_res, output = activation(f"trainAI.{bot}", name, res['debugNum']) # người thắng / số lượng lượt chơi
    user.fightable = not err
    db.session.commit()
    if err:
        data = {
            "code": 400,
            "output": output
        }
    else:
        data = {
            "code": 200,
            "img_url": game_res[0],
            "inp_oup": game_res[1],
            "rate": game_res[2],
            "output": output
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
        return render_template('create_bot.html', user = current_user)
    else:
        if current_user:
            logout_user()
        return redirect(url_for('login'))
    
@app.route('/challenge_mode/<id>')
@login_required
def challenge_mode(id):
    if 'secret_key' in session:
        user = User.query.where(User.username == session['username']).first()
        login_user(user)
        
        task = doc_ref_task.document(id).get().to_dict()

        return render_template('challenge_mode.html', user=current_user, task = task, id = id)
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

@app.route('/text_editor')
@login_required
def text_editor():
    if 'secret_key' in session:
        user = User.query.where(User.username == session['username']).first()
        login_user(user)
        return render_template('text_editor.html', user = current_user)
    else:
        if current_user:
            logout_user()
        return redirect(url_for('login'))

@app.route('/post/<post_id>')
@login_required
def post(post_id):
    print(post_id)
    data = ""
    docs = doc_ref_post.where("post_id", "==", post_id).stream()
    for doc in docs:
        data = doc.to_dict()
        print(data)
    return render_template('post.html', user = current_user, data = data)

@app.route('/task_list')
@login_required
def task_list():
    if 'secret_key' in session:
        user = User.query.where(User.username == session['username']).first()
        login_user(user)
        res = doc_ref_task.stream()
        
        tasks = []

        for doc in res:
            task = doc.to_dict()
            task["id"] = doc.id
            tasks.append(task)

        return render_template('task_list.html', user = current_user, tasks = tasks)
    else:
        if current_user:
            logout_user()
        return redirect(url_for('login'))

@app.route('/run_task', methods=["POST"])
@login_required
def run_task():
    res = request.get_json()
    code = res["code"]
    inp_oup = res["inp_oup"]
    org_stdout = sys.stdout
    err = ""

    user_output = []
    for i in inp_oup:
        f = StringIO()
        sys.stdout = f
        try:
            ldict = {}
            start = time.time()
            exec(code, {}, ldict)
            end = time.time()
            Uoutput = ldict["main"](*i["input"])

            if i["output"] == Uoutput:
                user_output.append({
                    "log": f.getvalue(),
                    "output_status" : "AC",
                    "output" : Uoutput,
                    "runtime" : (end-start) * 10**3
                })
            else:
                user_output.append({
                    "log": f.getvalue(),
                    "output_status" : "WA",
                    "output" : Uoutput
                })
        except:
            err = traceback.format_exc()
            user_output.append({
                "log": f.getvalue(),
                "output_status" : "SE",
            })
    sys.stdout = org_stdout

    if any(i["output_status"]=="SE" for i in user_output):
        status = "SE"
    elif any(i["output_status"]=="WA" for i in user_output):
        status = "WA"
    else:
        status = "AC"

    if err:
        return_data = {
            "status": "SE",
            "output": [i["output"] for i in inp_oup],
            "err": err,
        }
    else:
        return_data = {
            "status": status,
            "output": [i["output"] for i in inp_oup],
            "user_output": user_output,
        }

    return return_data

@app.route('/submit', methods=['POST'])
@login_required
def submit():
    res = request.get_json()
    code = res["code"]
    inp_oup = res["inp_oup"]
    print(inp_oup)
    task = doc_ref_task.document(res["id"])
    org_stdout = sys.stdout
    soAc = 0
    err = ""

    user_output = []
    start = time.time()
    for i in inp_oup:
        f = StringIO()
        sys.stdout = f
        try:
            ldict = {}
            exec(code, {}, ldict)
            Uoutput = ldict["main"](*i["input"])

            if i["output"] == Uoutput:
                user_output.append({
                    "log": f.getvalue(),
                    "output_status" : "AC",
                    "output" : Uoutput,
                }) 
                soAc+=1
            else:
                user_output.append({
                    "log": f.getvalue(),
                    "output_status" : "WA",
                    "output" : Uoutput
                })
        except:
            err = traceback.format_exc()
            user_output.append({
                "log": f.getvalue(),
                "output_status" : "SE",
            })
    end = time.time()
    sys.stdout = org_stdout

    if any(i["output_status"]=="SE" for i in user_output):
        status = "SE"
    elif any(i["output_status"]=="WA" for i in user_output):
        status = "WA"
    else:
        status = "AC"

    now = datetime.datetime.now()

    # Cách 2: Định dạng thành chuỗi
    date_string = now.strftime("%d/%m/%Y")

    update_data = {
        "code": code,
        "status": status,
        "test_finished": f"{soAc}/{len(user_output)}",
        "submit_time": date_string,
        "run_time": (end-start) * 10**3,
    }

    if status == "AC":
        task.update({
            f"challenger.{current_user.username}.submissions": firestore.ArrayUnion([update_data]),
            f"challenger.{current_user.username}.current_submit": update_data,
            "submission_count": firestore.Increment(1),
            "accepted_count": firestore.Increment(1),
        })
    else:
        task.update({
            f"challenger.{current_user.username}.submissions": firestore.ArrayUnion([update_data]),
            f"challenger.{current_user.username}.current_submit": update_data,
            "submission_count": firestore.Increment(1),
        })

    if err:
        return_data = {
            "status": "SE",
            "output": [i["output"] for i in inp_oup],
            "err": err,
        }
    else:
        return_data = {
            "status": status,
            "output": [i["output"] for i in inp_oup],
            "user_output": user_output,
            "test_finished": f"{soAc}/{len(user_output)}",
            "run_time": (end-start) * 10**3,
        }

    return return_data

# @app.route('/get_task')
# @login_required
# def get_task():


@app.route('/post_page')
@login_required
def post_page():
    posts = []
    docs = doc_ref_post.stream()
    for doc in docs:
        posts.append(doc.to_dict())
    return render_template('post_page.html', user = current_user, posts = posts)

@app.route('/get_pos_of_playing_chess', methods=['POST'])
@login_required
def get_pos_of_playing_chess():
    res = request.get_json()
    player = Player(res["data"])
    choosen_bot = res["choosen_bot"]
    player.your_pos = [tuple(i) for i in player.your_pos]
    player.opp_pos = [tuple(i) for i in player.opp_pos]
    player.your_pos, player.opp_pos = player.opp_pos, player.your_pos
    move = __import__(f"trainAI.{choosen_bot}", fromlist=[None]).main(player)
    # move = trainAI.Master.main(player)
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
        else:
            i['your_pos'], i['opp_pos'] = [tuple(i) for i in i['your_pos']], [tuple(i) for i in i['opp_pos']]
            
    rate = [trainAI.MasterUser.main(i) for i in move_list]

    for i in range(len(img_data["img"])):
        img_data["img"][i].append(rate[i])

    img_url = requests.post("http://tlv23.pythonanywhere.com//generate_debug_image", json=img_data).text

    return json.dumps({"rate": rate, "img_url": img_url})

@app.route('/fighting', methods=['POST'])
@login_required
def fighting():
    name = current_user.username
    player = request.get_json()
    winner, max_move_win, new_url = activation("static.botfiles.botfile_"+player['name'], name, 0)[1]
    
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


# @sio.event
# def connect(sid, eviron):
#     print(f"Client connected: {sid}")

# @sio.event
# def join_room(sid, room_id, type, state, user_info):
#     doc_ref = doc_ref_room.document(room_id)
#     doc_ref.set({type: state}, merge=True)
#     sio.emit(f"join_room_{room_id}", {
#         "type": type,
#         "user_info": user_info,
#     })
#     print(f"Client connected: {sid}")

# @sio.event
# def out_room(sid, room_id, type, state):
#     doc_ref = doc_ref_room.document(room_id)
#     doc_ref.set({type: state}, merge=True)
#     sio.emit(f"out_room_{room_id}")
#     print(f"Client disconnected: {sid}")

# # Xử lý ngắt kết nối từ client
# @sio.event
# def disconnect(sid):
#     print(f"Client disconnected: {sid}")

# # Xử lý sự kiện 'message' từ client
# @sio.event
# def message(sid, data):
#     print(f"Message from {sid}: {data}")
#     sio.send("Hello from server!")

# @sio.event
# def check_user(data, environ):
#     # sio.emit('check_user', environ)
#     sio.emit(f'check_user_{environ}', environ)

# @sio.event
# def get_move(data, room, environ):
#     sio.emit(f'get_move_{room}', environ)

# if __name__ == '__main__':
#     open_browser = lambda: webbrowser.open_new("http://127.0.0.1:5000")
#     Timer(1, open_browser).start()
#     app.run(port=5000, debug=True, use_reloader=False)