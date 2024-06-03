import requests
from copy import deepcopy
from importlib import reload
import traceback
from fdb.firestore_config import fdb
import sys
# from fdb.uti.upload import upload_video_to_storage

class Player:
    def __init__(self, your_pos=None, opp_pos=None, your_side=None, board=None):
        self.your_pos = your_pos
        self.opp_pos = opp_pos
        self.your_side = your_side
        self.board = board
def declare():
    global game_state, positions, point, player1, player2

    player1 = Player()
    player2 = Player()
    player1.your_side = 1
    player2.your_side = -1

    game_state = {"current_turn": 1,
                  "board": [[-1, -1, -1, -1, -1],
                            [-1,  0,  0,  0, -1],
                            [ 1,  0,  0,  0, -1],
                            [ 1,  0,  0,  0,  1],
                            [ 1,  1,  1,  1,  1]]}
    player1.board = player2.board = game_state["board"]
    positions = [None,
                [(0,2), (0,3), (4,3), (0,4), (1,4), (2,4), (3,4), (4,4)],
                [(0,0), (1,0), (2,0), (3,0), (4,0), (0,1), (4,1), (4,2)]]
    player1.your_pos = player2.opp_pos = positions[player1.your_side]
    player2.your_pos = player1.opp_pos = positions[player2.your_side]

    point = []

# Board manipulation
def Raise_exception(move, current_side, board):
    if not (move.__class__ == dict and tuple(move.keys()) == ('selected_pos', 'new_pos') and move['selected_pos'].__class__ == tuple and move['new_pos'].__class__ == tuple):
        raise Exception(r"The return value must be in the form: {'selected_pos': (x, y), 'new_pos': (x, y)} " + f"(not {move})")

    current_x, current_y = move["selected_pos"]
    new_x, new_y = move["new_pos"]

    if current_x%1!=0 or current_y%1!=0 or new_x%1!=0 or new_y%1!=0:
        raise Exception(f"Position must be an integer (not {[i for i in (current_x, current_y, new_x, new_y) if i%1!=0]})")
    elif not (0 <= current_x <= 4 and 0 <= current_y <= 4 and 0 <= new_x <= 4 and 0 <= new_y <= 4):
        raise Exception(f"x / y must be within the range 0 to 4 (not {[i for i in (current_x, current_y, new_x, new_y) if not 0 <= i <= 4]})")
    elif board[new_y][new_x] != 0:
        raise Exception("new_pos must be empty")
    elif board[current_y][current_x] != current_side:
        raise Exception("selected_pos should be your position")
    elif {(dx := abs(new_x-current_x)), (dy := abs(new_y-current_y))} - {1, 0} != set() or dx==dy==0:
        raise Exception("Can only move into adjacent cells")

def ganh_chet(move, opp_pos, side, opp_side):
    
    valid_remove = []
    board = game_state["board"]
    at_8intction = (move[0]+move[1])%2==0

    for x0, y0 in opp_pos:
        dx, dy = x0-move[0], y0-move[1]
        if -1<=dx<=1 and -1<=dy<=1 and (0 in (dx,dy) or at_8intction):
            if ((0<=move[0]-dx<=4 and 0<=move[1]-dy<=4 and board[move[1]-dy][move[0]-dx] == opp_side) or #ganh
                (0<=x0+dx<=4 and 0<=y0+dy<=4 and board[y0+dy][x0+dx] == side)): # chet
                valid_remove.append((x0, y0))

    for x, y in valid_remove:
        board[y][x] = 0
        opp_pos.remove((x, y))

    return valid_remove
def vay(opp_pos):

    board = game_state["board"]
    for pos in opp_pos:
        if (pos[0]+pos[1])%2==0:
            move_list = ((1,0), (-1,0), (0,1), (0,-1), (1,1), (-1,-1), (-1,1), (1,-1))
        else:
            move_list = ((1,0), (-1,0), (0,1), (0,-1))
        for move in move_list:
            new_valid_x = pos[0] + move[0]
            new_valid_y = pos[1] + move[1]
            if 0<=new_valid_x<=4 and 0<=new_valid_y<=4 and board[new_valid_y][new_valid_x]==0:
                return []

    valid_remove = opp_pos.copy()
    for x, y in opp_pos: board[y][x] = 0
    opp_pos[:] = []
    return valid_remove

# System
def activation(option, session_name, debugNum):
    global org_stdout
    if debugNum > 0:
        open(f"static/output/stdout_{session_name}.txt", mode="w", encoding="utf-8")
        org_stdout = sys.stdout
        f = open(f"static/output/stdout_{session_name}.txt", mode="a", encoding="utf-8")
        sys.stdout = f

    try:
        UserBot = __import__("static.botfiles.botfile_"+session_name, fromlist=[None])
        reload(UserBot)
        Bot2 = __import__(option, fromlist=[None])
        reload(Bot2)
        temp = run_game(UserBot, Bot2, session_name, debugNum)
        if debugNum > 0:
            sys.stdout = org_stdout
            f.close()
        return temp
    except Exception:
        if debugNum > 0:
            f.write(traceback.format_exc())
            sys.stdout = org_stdout
            f.close()
        raise Exception()
def run_game(UserBot, Bot2, session_name, debugNum): # Main

    declare()
    winner = False
    move_counter = 1
    body = {
        "username": session_name,
        "img": [[deepcopy(positions), {"selected_pos": (-1000,-1000), "new_pos": (-1000,-1000)}, []]]
    }
    if debugNum: inp_oup = []

    while not winner:

        current_turn = game_state["current_turn"]
        if player1.your_side == current_turn:
            move = UserBot.main(deepcopy(player1))
            Raise_exception(move, current_turn, game_state["board"])
            if debugNum:
                inp_oup.append(deepcopy(move))
        else:
            move = Bot2.main(deepcopy(player2))
            Raise_exception(move, current_turn, game_state["board"])

        move_new_pos = move["new_pos"]
        move_selected_pos = move["selected_pos"]

        # Update move to board
        game_state["board"][move_new_pos[1]][move_new_pos[0]] = current_turn
        game_state["board"][move_selected_pos[1]][move_selected_pos[0]] = 0
        # Update move to positions
        index_move = positions[current_turn].index(move_selected_pos)
        positions[current_turn][index_move] = move_new_pos

        opp_pos = positions[-current_turn]
        remove = ganh_chet(move_new_pos, opp_pos, current_turn, -current_turn)
        remove += vay(opp_pos)
        if remove: point[:] += [move_selected_pos]*len(remove)

        body["img"].append([deepcopy(positions), move, remove])

        if debugNum > 0 and move_counter == debugNum:
            for i in range(len(body["img"])):
                body["img"][i].append("")
            img_url = requests.post("http://tlv23.pythonanywhere.com//generate_debug_image", json=body).text
            return img_url, inp_oup
        elif not positions[1]:
            winner = "lost"
        elif not positions[-1]:
            winner = "win"
        elif (len(positions[1]) + len(positions[-1]) <= 2) or move_counter == 200:
            winner = "draw"

        game_state["current_turn"] *= -1
        move_counter += 1

    # res = requests.post("http://127.0.0.1:4000//generate_video", json=body)
    new_url = requests.post("http://tlv23.pythonanywhere.com//generate_video", json=body).text

    print("-----------------------------------------------------------------------------------")

    print(winner, move_counter, new_url)
    return winner, move_counter-1, new_url