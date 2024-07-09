from flask import Flask, flash, request, redirect, url_for, render_template, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from functools import wraps
from flask_wtf import FlaskForm 
from wtforms import SubmitField, PasswordField, StringField
from wtforms.validators import Length, ValidationError, EqualTo, DataRequired
from flask_bcrypt import Bcrypt
from game_manager import activation
from game_manager_debug import activation_debug
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
from tool import valid_move, distance
from io import StringIO
import traceback
import sys
import time
import threading
from timeout_decorator import timeout
import builtins
from copy import deepcopy

doc_ref_room = fdb.collection("room")
doc_ref_post = fdb.collection("post")
doc_ref_task = fdb.collection("task")
doc_ref_simulation = fdb.collection("simulation")
doc_ref_code = fdb.collection("code")

class Player:
    def __init__(self, dict: dict):
        for key, value in dict.items():
            setattr(self, key, value)

globals_exec = {"valid_move": valid_move,
                "distance": distance,
                '__builtins__': {k:v for k, v in builtins.__dict__.items() if k not in ['eval', 'exec', 'input', '__import__', 'open']}}

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

# @timeout(1)
def safe_exec(code, input):
    func_to_del = ['eval', 'exec', 'input', '__import__', 'open']
    allowed_builtins = {k:v for k, v in builtins.__dict__.items() if k not in func_to_del}
    locals = {}
    exec(code, {"valid_move": valid_move, "distance": distance, '__builtins__': allowed_builtins}, locals)
    return locals["main"](*input)

def checkSession():
    if 'secret_key' in session:
        user = User.query.where(User.username == session['username']).first()
        login_user(user)
    else:
        if current_user:
            logout_user()
        return redirect(url_for('login'))
    
def session_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        checkSession()
        return f(*args, **kwargs)
    return decorated_function

@app.template_filter('parse_json')
def parse_json(json_string):
    return json.loads(json_string)

@app.template_filter('eval_string')
def eval_string(string):
    return eval(string)

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
# NOTE: tool
# valid_move(x, y, board): trả về các nước đi hợp lệ của một quân cờ - ((x, y), ...)
# distance(x1, y1, x2, y2): trả về số nước đi ít nhất từ (x1, y1) đến (x2, y2) - n

# NOTE: player
# player.your_pos: vị trí tất cả quân cờ của bản thân - [(x, y), ...]
# player.opp_pos: vị trí tất cả quân cờ của đối thủ - [(x, y), ...]
# player.your_side: màu quân cờ của bản thân - 1:🔵
# player.board: bàn cờ - -1:🔴 / 1:🔵 / 0:∅

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
@session_required
def menu():
    return render_template('menu.html', current_user=current_user)
        

@app.route('/upload_code', methods=['POST'])
@login_required
def upload_code():
    name = current_user.username
    data = request.get_json()
    bot = data["bot"]
    user = User.query.filter_by(username=current_user.username).first()
    with open(f"static/botfiles/botfile_{name}.py", mode="w", encoding="utf-8") as f:
        f.write(data["code"])
    err, game_res, output = activation(bot, data["code"], name) # người thắng / số lượng lượt chơi
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
    err, game_res, output = activation_debug(bot, data["code"], name, res['debugNum']) # người thắng / số lượng lượt chơi
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
@session_required
def create_bot():
    return render_template('create_bot.html', user = current_user)
    
@app.route('/challenge_mode/<id>')
@login_required
@session_required
def challenge_mode(id):
    task = doc_ref_task.document(id).get().to_dict()

    return render_template('challenge_mode.html', user=current_user, task = task, id = id)
        
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
@session_required
def bot_bot():
    users = [(i.username, i.elo) for i in User.query.filter(User.username != current_user.username, User.fightable == True).order_by(User.elo.desc()).limit(10).all()]
    rank_board = [(i.username, i.elo) for i in User.query.filter(User.fightable == True).order_by(User.elo.desc()).limit(5).all()]
    return render_template('bot_bot.html', users = users, rank_board = rank_board)

@app.route('/human_bot')
@login_required
@session_required
def human_bot():
    return render_template('human_bot.html', user = current_user)


@app.route('/human_human')
@login_required
@session_required
def human_human():
    return render_template('human_human.html', user = current_user)

@app.route('/room_manager')
@login_required
@session_required
def room_manager():
    return render_template('room_manager.html', user = current_user)

@app.route('/text_editor')
@login_required
@session_required
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
# @login_required
def post(post_id):
    data = ""
    docs = doc_ref_post.where("post_id", "==", post_id).stream()
    for doc in docs:
        data = doc.to_dict()
    return render_template('post.html', user = current_user, data = data)

@app.route('/task_list')
@login_required
@session_required
def task_list():
    res = doc_ref_task.stream()
    
    tasks = []

    for doc in res:
        task = doc.to_dict()
        task["id"] = doc.id
        tasks.append(task)

    return render_template('task_list.html', user = current_user, tasks = tasks)
    
@app.route('/visualize_page')
@login_required
@session_required
def visualize_page():
    visualize = []
    docs = doc_ref_simulation.stream()
    for doc in docs:
        viz = doc.to_dict()
        viz["id"] = doc.id
        visualize.append(viz)

    return render_template('visualize_page.html', user = current_user, visualize = visualize)

@app.route('/visualize/<id>')
@login_required
@session_required
def visualize(id):
    visualize = doc_ref_simulation.document(id).get().to_dict()

    return render_template('visualize.html', user = current_user, simulation = visualize)

@app.route('/run_task', methods=["POST"])
# @login_required
def run_task():
    res = request.get_json()
    inp_oup = eval(res["inp_oup"])
    code = res["code"]
    org_stdout = sys.stdout
    err = ""

    user_output = []
    for i in inp_oup[:2]:
        f = StringIO()
        sys.stdout = f
        try:
            locals = {}
            exec(code, globals_exec, locals)
            Uoutput = locals["main"](*i["input"])
            # Uoutput = json.loads(json.dumps(Uoutput).replace("(","[").replace(")","]"))
            # if type(Uoutput) is list:
            #     comparision = sorted(i["output"]) == sorted(Uoutput)
            # else:
            comparision = i["output"] == Uoutput
            if comparision:
                user_output.append({
                    "log": f.getvalue(),
                    "output_status" : "AC",
                    "output" : str(Uoutput),
                })
            else:
                user_output.append({
                    "log": f.getvalue(),
                    "output_status" : "WA",
                    "output" : str(Uoutput)
                })
        except:
            err = traceback.format_exc()
            status = "SE"
            break
    sys.stdout = org_stdout
    
    if any(i["output_status"]=="WA" for i in user_output):
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
            "output": [str(i["output"]) for i in inp_oup],
            "user_output": user_output,
        }

    # print(return_data)

    return return_data

@app.route('/submit', methods=['POST'])
@login_required
def submit():
    res = request.get_json()
    task = doc_ref_task.document(res["id"])
    code = res["code"]
    inp_oup = eval(res["inp_oup"])
    org_stdout = sys.stdout
    soAc = 0
    err = ""
    compile_data = {
        "update_data": {

        },

        "return_data": {

        }
    }
    user_output = []
    start = time.time()
    for i in inp_oup:
        f = StringIO()
        sys.stdout = f
        try:
            locals = {}
            exec(code, globals_exec, locals)
            Uoutput = locals["main"](*i["input"])
            comparision = i["output"] == Uoutput
            print(comparision)

            if comparision:
                user_output.append({
                    "log": f.getvalue(),
                    "output_status" : "AC",
                    "output" : str(Uoutput),
                })
                soAc+=1
            else:
                user_output.append({
                    "log": f.getvalue(),
                    "output_status" : "WA",
                    "output" : str(Uoutput)
                })
        except:
            err = traceback.format_exc()
            status = "SE"
            break
    end = time.time()
    sys.stdout = org_stdout

    if not err:
        if any(i["output_status"]=="WA" for i in user_output):
            status = "WA"
        else:
            status = "AC"

    compile_data["update_data"] = {
        "code": code,
        "status": status,
        "test_finished": f"{soAc}/{len(user_output)}",
        "submit_time": res["time"],
        "run_time": (end-start) * 10**3,
    }

    if err:
        compile_data["return_data"] = {
            "status": "SE",
            "output": [str(i["output"]) for i in inp_oup],
            "err": err,
        }
    else:
        compile_data["return_data"] = {
            "status": status,
            "output": [str(i["output"]) for i in inp_oup],
            "user_output": user_output,
            "test_finished": f"{soAc}/{len(user_output)}",
            "run_time": (end-start) * 10**3,
        }

    update_data = compile_data["update_data"]
    return_data = compile_data["return_data"]

    if return_data["status"] == "AC":
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

    return return_data

@app.route('/post_page')
# @login_required
def post_page():
    posts = []
    docs = doc_ref_post.stream()
    for doc in docs:
        posts.append(doc.to_dict())
    return render_template('post_page.html', user = current_user, posts = posts)

@app.route('/upload_task', methods=['POST'])
# @login_required
def upload_task():
    task = request.get_json()
    try:
        inp_oup = task["inp_oup"]
        for i in range(len(inp_oup)):
            for j in range(len(inp_oup[i]["input"])):
                task["inp_oup"][i]["input"][j] = eval(inp_oup[i]["input"][j])
            task["inp_oup"][i]["output"] = eval(inp_oup[i]["output"])
        doc_ref_task.document().set(task)
        return 'success'
    except Exception as e:
        return 'err'
        
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
    try:
        name = current_user.username
        player = request.get_json()
        with open(f"static/botfiles/botfile_{player['name']}.py", encoding="utf-8") as f:
            bot_code1 = f.read()
        with open(f"static/botfiles/botfile_{name}.py", encoding="utf-8") as f:
            bot_code2 = f.read()
        err, game_res, output = activation(bot_code1, bot_code2, name)
        
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
    except Exception as err:
        if err:
            data = {
                "code": 400,
                "output": err
            }

    return json.dumps(data)

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

if __name__ == '__main__':
    open_browser = lambda: webbrowser.open_new("http://127.0.0.1:5000")
    Timer(1, open_browser).start()
    app.run(port=5000, debug=True, use_reloader=False)