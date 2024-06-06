from tool import valid_move
import random

def main(player):
    c = random.choice(player.your_pos)
    d = []
    while d == []:
        d = random.choice(valid_move(c[0], c[1], player.board))
    return {"selected_pos": (c[0],c[1]), "new_pos": (d[0], d[1])}