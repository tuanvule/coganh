from flask import Flask, flash, request, redirect, url_for, render_template, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_cors import CORS
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
from google.cloud.firestore_v1.base_query import FieldFilter
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
import builtins
from copy import deepcopy
import os
import uuid 
import random
import math

doc_ref_room = fdb.collection("room")
doc_ref_post = fdb.collection("post")
doc_ref_task = fdb.collection("task")
doc_ref_simulation = fdb.collection("simulation")
doc_ref_code = fdb.collection("code")
doc_ref_user = fdb.collection("user")
doc_ref_bot = fdb.collection("bot")

class Player:
    def __init__(self, dict: dict):
        for key, value in dict.items():
            setattr(self, key, value)

globals_exec = {"valid_move": valid_move,
                "distance": distance,
                "random": random,
                "math": math,
                '__builtins__': {k:v for k, v in builtins.__dict__.items() if k not in ['eval', 'exec', 'input', '__import__', 'open']}}

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['WTF_CSRF_ENABLED'] = False
app.config['CORS_HEADERS'] = 'Content-Type'
app.app_context().push()

bcrypt = Bcrypt(app)
db = SQLAlchemy(app)

app.config['MAX_CONTENT_LENGTH'] = 16_000_00  #Max file size
app.config['UPLOAD_FOLDER'] = "static/botfiles"

allowed_origins = [
    "http://localhost:3000",
    "https://coganh-419711.de.r.appspot.com",
    "https://coganh-cloud-tixakavkna-as.a.run.app"
]

CORS(app, resources={r"/*": {"origins": allowed_origins}})
# CORS(app, resources={r"/*": {"origins": "https://coganh-419711.de.r.appspot.com"}})

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view='login'
login_manager.login_message_category = "info"
login_manager.login_message = "Xin hãy đăng nhập để truy cập"

def generate_secret_key(user_name):
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

    def to_dict(self):
        return {
            "username": self.username,
            "password": self.password,
            "elo": self.elo,
            "fightable": self.fightable
        }

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
        # user = (doc_ref_user.where("username", "==", form.username.data).get()[0]).to_dict()
        user = User.query.filter_by(username=form.username.data).first()
        if user:
            if bcrypt.check_password_hash(user.password, form.password.data):
                secret_key = generate_secret_key(form.username.data)
                session['secret_key'] = secret_key
                session['username'] = form.username.data
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
        # update_time, user_ref = doc_ref_user.add(new_user.to_dict())
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
        # doc_ref_bot.add({
        #     "owner": form.username.data,
        #     "code": code
        # })
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

# @app.route('/create_bot')
# @login_required
# @session_required
# def create_bot():
#     return render_template('create_bot.html', user = current_user)
    
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
    docs = doc_ref_post.where(filter=FieldFilter("post_id", "==", post_id)).stream()
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
# @login_required
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
        task["inp_oup"] = str(task["inp_oup"])
        doc_ref_task.document().set(task)
        return json.dumps({
            "code": 200,
            "tast": task
        })
    except Exception as e:
        return json.dumps({
            "code": 400,
            "err": str(e)
        })

        
@app.route('/get_pos_of_playing_chess', methods=['POST'])
def get_pos_of_playing_chess():
    res = request.get_json()
    player = Player(res["data"])
    choosen_bot = res["choosen_bot"]
    player.your_pos, player.opp_pos = [tuple(i) for i in player.opp_pos], [tuple(i) for i in player.your_pos]

    move = __import__(f"trainAI.{choosen_bot}", fromlist=[None]).main(player)
    return move

@app.route('/get_rate', methods=['POST'])
def get_rate():
    data = request.get_json()
    move_list = data["move_list"]
    img_data = data["img_data"]
    rate = []
    for i in range(len(move_list)):
        move_list[i]['your_pos'], move_list[i]['opp_pos'] = ([tuple(j) for j in move_list[i]['your_pos']], [tuple(j) for j in move_list[i]['opp_pos']])[::move_list[i]['side']]
        rate.append(trainAI.MasterUser.main(move_list[i], move_list[i]['side']))
        img_data["img"][i].append(rate[i])
    pprint(img_data)

    img_url = requests.post("http://quan064.pythonanywhere.com//generate_debug_image", json=img_data).text
    pprint(json.loads(img_url))

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

# player: {
    # owner_name: selectedPlayer.you,
    # elo: uElo,
    # bot_name: selectedPlayer.your_bot,
    # id: selectedPlayer.your_bot_id
# },
# enemy: {
    # owner_name: selectedPlayer.enemy,
    # elo: eElo,
    # bot_name: selectedPlayer.enemy_bot,
    # id: selectedPlayer.enemy_bot_id
# }

@app.route('/update_rank_board', methods=['POST'])
def update_rank_board():
    data = request.get_json()
    # player = data["player"]
    # enemy = data["enemy"]
    # doc_ref_bot.document(player["id"]).update({"elo": player["elo"]})
    # doc_ref_bot.document(enemy["id"]).update({"elo": enemy["elo"]})

    docs = doc_ref_bot.where(filter=FieldFilter("fightable", "==", True)).order_by('elo', direction=firestore.Query.DESCENDING).limit(5).stream()
    results = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        d["code"] = ""
        results.append(d)

    return results

@app.route('/get_room', methods=['GET'])
@login_required
def get_room():
    # name = current_user.username
    doc_ref = doc_ref_room.where(filter=FieldFilter("player_2", "==", "")).where(filter=FieldFilter("player_1", "!=", current_user.username)).where(filter=FieldFilter("ready_P1", "==", 1)).stream()
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
        # sio.emit(f'out_room_{room_id}')
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

@app.route('/handle_login', methods=['POST'])
def handle_login():
    data = request.get_json()
    username, password = data["username"], data["password"]
    user_doc = doc_ref_user.where(filter=FieldFilter("username", "==", username)).where(filter=FieldFilter("password", "==", password)).stream()
    user = {}

    for doc in user_doc:
        id = doc.id
        user = doc.to_dict()
        user["id"] = id

    if user["id"]:
        return json.dumps({
            "status": 200,
            "userData": user
        })
    else:
        return json.dumps({
            "status": 404,
        })
    
@app.route('/get_all_user', methods=['GET'])
def get_all_user():
    users = doc_ref_user.stream()
    res = []
    for doc in users:
        user = doc.to_dict()
        res.append(user["username"])

    return res

@app.route('/get_all_task')
def get_all_task():
    res = doc_ref_task.stream()
    
    tasks = []

    for doc in res:
        task = doc.to_dict()
        task["id"] = doc.id
        tasks.append(task)

    return tasks

@app.route('/get_user_bots', methods=['POST'])
def get_user_bots():
    username = request.get_json()
    docs = doc_ref_bot.where(filter=FieldFilter("fightable", "==", True)).where(filter=FieldFilter("owner", "!=", username)).limit(10).stream()
    docs2 = doc_ref_bot.where(filter=FieldFilter("fightable", "==", True)).where(filter=FieldFilter("owner", "==", username)).stream()
    results = []
    for doc in docs:
        id = doc.id
        d = doc.to_dict()
        d["id"] = id
        d["code"] = ""
        results.append(d)
    results2 = []
    for doc in docs2:
        id = doc.id
        d = doc.to_dict()
        d["id"] = id
        d["code"] = ""
        results2.append(d)
    data = {
        "enemy_bots": results,
        "user_bots": results2
    }
    return data

@app.route('/get_rank_board')
def get_rank_board():
    docs = doc_ref_bot.where(filter=FieldFilter("fightable", "==", True)).order_by('elo', direction=firestore.Query.DESCENDING).limit(5).stream()
    results = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        d["code"] = ""
        results.append(d)
    return results

def handle_change_elo(status, player_1, player_2):
    pre_player_1E = player_1["elo"]
    pre_player_2E = player_2["elo"]
    if (status == "win"):
        if (player_1["elo"] < player_2["elo"]):
            pre = player_1["elo"]
            player_1["elo"] = player_2["elo"] + 10
            player_2["elo"] = pre
        else:
            player_1["elo"] = player_1["elo"] + 10
    elif (status == "lost"):
        if (player_1["elo"] > player_2["elo"]):
            pre = player_2["elo"]
            player_2["elo"] = player_2["elo"] + 10
            player_1["elo"] = pre
        else:
            player_1["elo"] = player_1["elo"] + 10
    else:
        if (player_1["elo"] <= 0):
            player_1["elo"] = 0
        elif (player_2["elo"] <= 0):
            player_2["elo"] = 0
    doc_ref_bot.document(player_1["id"]).update({"elo": player_2["elo"]})
    doc_ref_bot.document(player_2["id"]).update({"elo": player_2["elo"]})
    pre_player_1E = pre_player_1E - player_1["elo"]
    pre_player_2E = pre_player_2E - player_2["elo"]
    return pre_player_1E, pre_player_2E
    


@app.route('/fight_bot', methods=['POST'])
def fight_bot():
    try:
        data = request.get_json()
        user_bot_doc = doc_ref_bot.document(data["your_bot_id"])
        enemy_bot_doc = doc_ref_bot.document(data["enemy_bot_id"])
        user_bot = user_bot_doc.get().to_dict()
        user_bot["id"] = data["your_bot_id"]
        enemy_bot = enemy_bot_doc.get().to_dict()
        enemy_bot["id"] = data["enemy_bot_id"]
        err, game_res, output = activation(enemy_bot["code"], user_bot["code"], data["you"])
        if err:
            res = {
                "code": 400,
                "output": output
            }
        else:
            res = {
                "code": 200,
                "status": game_res[0],
                "max_move_win": game_res[1],
                "new_url": game_res[2],
                "output": output
            }
            C_user_elo, C_enemy_elo = handle_change_elo(game_res[0], user_bot, enemy_bot)
            enemy_bot["code"] = ""
            enemy_bot["fight_history"] = []
            user_bot["code"] = ""
            user_bot["fight_history"] = []
            user_bot_doc.update({
                "fight_history": firestore.ArrayUnion([{
                    "enemy": enemy_bot,
                    "status": game_res[0],
                    "move": game_res[1],
                    "time": data["time"],
                    "elo_change": C_user_elo,
                }])
            })
            enemy_status = "win" if game_res[0] == "lost" else "lost"
            enemy_bot_doc.update({
                "fight_history": firestore.ArrayUnion([{
                    "enemy": user_bot,
                    "status": enemy_status if game_res[0] != "draw" else "draw",
                    "move": game_res[1],
                    "time": data["time"],
                    "elo_change": C_enemy_elo,
                }])
            })
    except Exception as err:
        print(err)
        res = {
            "code": 400,
            "output": str(err)
        }

    return json.dumps(res)


@app.route('/get_posts')
def get_posts():

    posts = []
    docs = doc_ref_post.stream()
    for doc in docs:
        posts.append(doc.to_dict())
    return posts

@app.route('/get_post_by_id/<post_id>')
def get_post_by_id(post_id):
    data = ""
    docs = doc_ref_post.where(filter=FieldFilter("post_id", "==", post_id)).stream()
    for doc in docs:
        data = doc.to_dict()
    return data

@app.route('/get_visualize/<id>')
def get_visualize(id):
    visualize = doc_ref_simulation.document(id).get().to_dict()

    return visualize

@app.route('/submit_code', methods=['POST'])
def submit_code():
    res = request.get_json()
    task = doc_ref_task.document(res["id"])
    code = res["code"]
    username = res["username"]
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
            f"challenger.{username}.submissions": firestore.ArrayUnion([update_data]),
            f"challenger.{username}.current_submit": update_data,
            "submission_count": firestore.Increment(1),
            "accepted_count": firestore.Increment(1),
        })
    else:
        task.update({
            f"challenger.{username}.submissions": firestore.ArrayUnion([update_data]),
            f"challenger.{username}.current_submit": update_data,
            "submission_count": firestore.Increment(1),
        })

    return return_data

@app.route('/get_task/<id>')
def get_task(id):
    res = doc_ref_task.document(id).get().to_dict()
    res["id"] = id

    return res

@app.route('/get_user_bot/<name>')
def get_user_code(name):
    user_bot = doc_ref_bot.where(filter=FieldFilter("owner", "==", name)).stream()
    data = []
    for doc in user_bot:
        data.append(doc.to_dict())
    return data

@app.route('/create_bot')
def create_bot():
    owner = request.args.get("owner")
    bot_name = request.args.get("bot_name")
    data = {
        "code": """
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
""",
        "owner": owner,
        "fightable": False,
        "fight_history": [],
        "bot_name": bot_name,
        "elo": 0,
        "bot_id": str(uuid.uuid1().int),
        "is_public": False,
    }

    doc_ref_bot.add(data)

    return data

@app.route('/remove_bot')
def remove_bot():
    owner = request.args.get("owner")
    bot_name = request.args.get("bot_name")
    user_bot = doc_ref_bot.where(filter=FieldFilter("owner", "==", owner)).where(filter=FieldFilter("bot_name", "==", bot_name)).stream()
    for doc in user_bot:
        doc.reference.delete()
    return {"message": "success"}
    
@app.route('/run_bot', methods=['POST'])
def run_bot():
    data = request.get_json()
    name = data["username"]
    your_bot_name = data["your_bot_name"]
    bot = data["bot"]
    code = data["code"]
    err, game_res, output = activation(bot, code, name)
    user_bot = doc_ref_bot.where(filter=FieldFilter("owner", "==", name)).where(filter=FieldFilter("bot_name", "==", your_bot_name)).stream()

    level = {
        "level1": 1,
        "level2": 2,
        "level3": 3,
        "level4": 4,
        "Master": 5,
    }


    for doc in user_bot:
        if doc.exists:
            pre_bot = doc.to_dict()
            new_level = pre_bot["level"]
            if game_res[0] == "win" and level[bot] > pre_bot["level"]:
                new_level = level[bot]
            new_data = {
                "fightable": not err,
                "code": code,
                "level": new_level
            }
            doc_ref_bot.document(doc.id).set(new_data, merge=True)
        else:
            doc_ref_bot.document().set({
                "code": code,
                "owner": name,
                "fightable": not err,
                "fight_history": [],
                "bot_name": name,
                "elo": 0,
                "bot_id": uuid.uuid1().int,
                "is_public": False,
                "level": level[bot] if game_res[0] == "win" else 0
            })
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

@app.route('/debug_bot', methods=['POST'])
def debug_bot():
    res = request.get_json()
    data = res["request_data"]
    name = data["username"]
    bot = data["bot"]
    err, game_res, output = activation_debug(bot, data["code"], name, res['debugNum']) # người thắng / số lượng lượt chơi
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

@app.route('/save_bot', methods=['POST'])
def save_bot():
    data = request.get_json()
    code = data["code"]
    name = data["username"]
    bot_name = data["bot_name"]

    user_bot = doc_ref_bot.where(filter=FieldFilter("owner", "==", name)).where(filter=FieldFilter("bot_name", "==", bot_name)).stream()

    for doc in user_bot:
        if doc.exists:
            new_data = {
                "code": code
            }
            doc_ref_bot.document(doc.id).set(new_data, merge=True)
        else:
            doc_ref_bot.document().set({
                "code": code,
                "owner": name,
                "fightable": False,
                "fight_history": [],
                "bot_name": name,
                "elo": 0,
                "bot_id": uuid.uuid1().int,
                "is_public": False,
            })
    return json.dumps(code)

@app.route('/get_all_user_data/<id>')
def get_all_user_data(id):
    bot_doc = doc_ref_bot.order_by('elo', direction=firestore.Query.DESCENDING).stream()
    tasks_doc = doc_ref_task.stream()
    post_doc = doc_ref_post.stream()
    name = doc_ref_user.document(id).get().to_dict()["username"]
    data = {
        "bots": [],
        "your_tasks": [],
        "tasks": [],
        "posts": [],
        "username": name,
    }
    for index,doc in enumerate(bot_doc):
        id = doc.id
        doc = doc.to_dict()
        if doc["owner"] == name:
            doc["rank"] = index
            doc["id"] = id
            data["bots"].append(doc)
        
    for doc in tasks_doc:
        doc_id = doc.id
        doc = doc.to_dict()
        if doc["author"] == name:
            doc["id"] = doc_id
            data["your_tasks"].append(doc)
        if name in doc["challenger"]:
            submit_history = doc["challenger"][name]["submissions"]
            for i in range(len(submit_history)):
                submit_history[i]["task_name"] = doc["task_name"]
                submit_history[i]["id"] = doc_id
            
            data["tasks"].extend(submit_history)
    
    for doc in post_doc:
        doc = doc.to_dict()
        if doc["author"] == name:
            data["posts"].append(doc)

    return data

@app.route('/get_code_to_show', methods=['POST'])
def get_code_to_show():
    bot_ids = request.get_json()
    flattened_list = sum(bot_ids, [])
    bot_doc = [doc.to_dict() for doc in doc_ref_bot.where(filter=FieldFilter('bot_id', 'in', flattened_list)).stream()]
    data = bot_ids
    for i in range(len(data)):
        for j in range(len(data[i])):
            is_has_code = False
            for doc in bot_doc:
                if doc["is_public"]:
                    if data[i][j] == doc["bot_id"]:
                        data[i][j] = doc["code"]
                        is_has_code = True
                        break
            if not is_has_code:
                data[i][j] = ""
    return data

@app.route('/get_user_info/<id>')
def get_user_info(id):
    user = doc_ref_user.document(id).get().to_dict()
    user["password"] = ""

    return user

@app.route('/change_is_public')
def change_is_public():
    id = request.args.get("bot_id")
    type = bool(int(request.args.get("type")))
    doc_ref_bot.document(id).update({
        "is_public": type
    })
    return {"message": "success"}
    

if __name__ == '__main__':
    port = 5000
    app.run(host='0.0.0.0', port=port)

# if __name__ == '__main__':
#     open_browser = lambda: webbrowser.open_new("http://192.168.1.249:5000")
#     Timer(1, open_browser).start()
#     app.run(port=5000, debug=True, use_reloader=False)

