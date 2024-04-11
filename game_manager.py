from random import choice
import os
from PIL import Image, ImageDraw
from copy import deepcopy
import cv2
import moviepy.editor as mpe
from importlib import reload
import traceback

# import firebase_admin
# from firebase_admin import credentials
# from firebase_admin import firestore

# cred = credentials.Certificate("firebase-adminsdk-354yy@coganh-6ab73.iam.gserviceaccount.com")
# firebase_admin.initialize_app(cred, {
#     'databaseUTL': 'https://coganh-6ab73-default-rtdb.asia-southeast1.firebasedatabase.app/'
# })

# fdb = firestore.client()


# ROW = y
# COLUMN = x
# ==> board[y][x] == board[ROW][COLUMN]
absolute_path = os.path.dirname(__file__)

class Player:
    def __init__(self, your_pos=None, opp_pos=None, your_side=None, board=None):
        self.your_pos = your_pos
        self.opp_pos = opp_pos
        self.your_side = your_side
        self.board = board
def declare():
    global game_state, positions, static_image, point, player1, player2

    player1 = Player()
    player2 = Player()
    player1.your_side = 1
    player2.your_side = -1

    game_state = {"current_turn": choice((-1, 1)),
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

    # Initialization board
    static_image = Image.new("RGB", (600, 600), "WHITE")
    draw = ImageDraw.Draw(static_image)

    draw.line((100, 100, 500, 100), fill="black", width=3)
    draw.line((100, 200, 500, 200), fill="black", width=3)
    draw.line((100, 300, 500, 300), fill="black", width=3)
    draw.line((100, 400, 500, 400), fill="black", width=3)
    draw.line((100, 500, 500, 500), fill="black", width=3)
    draw.line((100, 100, 100, 500), fill="black", width=3)

    draw.line((200, 100, 200, 500), fill="black", width=3)
    draw.line((300, 100, 300, 500), fill="black", width=3)
    draw.line((400, 100, 400, 500), fill="black", width=3)
    draw.line((500, 100, 500, 500), fill="black", width=3)
    draw.line((100, 100, 500, 500), fill="black", width=3)
    draw.line((100, 500, 500, 100), fill="black", width=3)

    draw.line((100, 300, 300, 100), fill="black", width=3)
    draw.line((300, 100, 500, 300), fill="black", width=3)
    draw.line((500, 300, 300, 500), fill="black", width=3)
    draw.line((300, 500, 100, 300), fill="black", width=3)

    point = []

# Board manipulation
def Raise_exception(move, current_side, board):
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
def activation(option, session_name):
    # relative_path = "static.botfiles.botfile_"+session_name
    UserBot = __import__("static.botfiles.botfile_"+session_name, fromlist=[None])
    reload(UserBot)
    Bot2 = __import__(option, fromlist=[None])
    reload(Bot2)
    try: return run_game(UserBot, Bot2)
    except Exception: raise Exception(traceback.format_exc())
def run_game(UserBot, Bot2): # Main

    declare()
    winner = False
    move_counter = 1

    init_img(positions)

    while not winner:

        filled = round(move_counter/10)
        print(f"\rLoading |{'█'*filled}{'-'*(50-filled)}|{move_counter//5}% Complete", end='')

        current_turn = game_state["current_turn"]
        try:
            if player1.your_side == current_turn:
                move = UserBot.main(deepcopy(player1))
            else:
                move = Bot2.main(deepcopy(player2))

            move_new_pos = move["new_pos"]
            move_selected_pos = move["selected_pos"]
        except: raise Exception(r"The return value must be in the form: {'selected_pos': (x, y), 'new_pos': (x, y)} " + f"(not {move})")

        Raise_exception(move, current_turn, game_state["board"])

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

        generate_image(positions, move_counter, move, remove, current_turn)

        if not positions[1]:
            if player1.your_side == 1:
                winner = "lost"
            else:
                winner = "win"
        elif not positions[-1]:
            if player1.your_side == 1:
                winner = "win"
            else:
                winner = "lost"
        elif (len(positions[1]) + len(positions[-1]) <= 2) or move_counter == 500:
            if player1.your_side == 1:
                winner = "draw"
            else:
                winner = "draw"

        game_state["current_turn"] *= -1
        move_counter += 1

    renderVD()
    relative_path_upload_img = "static/upload_img/"
    for file in os.listdir(os.path.join(absolute_path,relative_path_upload_img)):
        relative_path_chessboard = relative_path_upload_img + file
        if file != "a": os.remove(os.path.join(absolute_path,relative_path_chessboard))

    return winner, move_counter-1

def init_img(positions):
    image = static_image.copy()
    draw = ImageDraw.Draw(image)

    for x, y in positions[1]:
        draw.ellipse((x*100+80, y*100+80, x*100+120, y*100+120), fill="blue", outline="blue")
    for x, y in positions[-1]:
        draw.ellipse((x*100+80, y*100+80, x*100+120, y*100+120), fill="red", outline="red")
        
    image.save(os.getcwd()+"/static/upload_img/chessboard0.png", "PNG")
def generate_image(positions, move_counter, move, remove, current_turn):
    image = static_image.copy()
    draw = ImageDraw.Draw(image)

    for x, y in remove:
        draw.ellipse((x*100+80, y*100+80, x*100+120, y*100+120), fill=None, outline="#FFC900", width=4)
    for x, y in positions[1]:
        draw.ellipse((x*100+80, y*100+80, x*100+120, y*100+120), fill="blue", outline="blue")
    for x, y in positions[-1]:
        draw.ellipse((x*100+80, y*100+80, x*100+120, y*100+120), fill="red", outline="red")
    new_x = move["new_pos"][0]
    new_y = move["new_pos"][1]
    old_x = move["selected_pos"][0]
    old_y = move["selected_pos"][1]
    draw.ellipse((new_x*100+80, new_y*100+80, new_x*100+120, new_y*100+120), fill=(None, "blue", "red")[current_turn], outline="green", width=5)
    draw.ellipse((old_x*100+80, old_y*100+80, old_x*100+120, old_y*100+120), fill=None, outline="green", width=5)

    image.save(os.getcwd()+f"/static/upload_img/chessboard{move_counter}.png", "PNG")
def renderVD():
    # biến đổi tập ảnh thành video
    relative_path_chessboard_0 = "static/upload_img/chessboard0.png"
    relative_path_video = "static/upload_video/video.mp4"
    relative_path_audio = "static/audio.mp3"
    relative_path_result = "static/upload_video/result.mp4"
    relative_path_upload_img = "static/upload_img/"
    frame = cv2.imread(os.path.join(absolute_path, relative_path_chessboard_0))

    print(os.listdir(os.path.join(absolute_path, "static/upload_video")))

    video = cv2.VideoWriter(os.path.join(absolute_path, relative_path_video), cv2.VideoWriter_fourcc('m', 'p', '4', 'v'), 1, frame.shape[:2])
    for i in range(len(os.listdir(os.path.join(absolute_path, relative_path_upload_img)))):
        relative_path_chessboard = f"static/upload_img/chessboard{i}.png"
        video.write(cv2.imread(os.path.join(absolute_path, relative_path_chessboard)))
    video.release()
    # print(os.listdir(os.path.join(absolute_path, ".venv")))

    print(os.listdir(os.path.join(absolute_path, "static/upload_video")))
    print(os.listdir(os.path.join(absolute_path, "static")))
    print(absolute_path)

    # chèn nhạc vô video
    # my_clip = mpe.VideoFileClip(os.path.join(absolute_path, relative_path_video))
    # audio_background = mpe.AudioFileClip(os.path.join(absolute_path, relative_path_audio)).set_duration(my_clip.duration)
    # my_clip = my_clip.set_audio(audio_background)
    # my_clip.write_videofile(os.path.join(absolute_path, relative_path_result))
    # my_clip.close()

if __name__ == '__main__':
    import trainAI.Master as Master, CGEngine
    winner, win_move_counter = run_game(CGEngine, Master)
