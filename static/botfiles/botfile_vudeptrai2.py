from tool import valid_move
import random

def main(player):
    d = [[-1,0],[0,-1],[0,1],[1,0]]
    c = random.choice(player.your_pos)
    d = random.choice(valid_move(c[0], c[1], player.board))
    return {"selected_pos": (c[0],c[1]), "new_pos": (d[0], d[1])}
    # for x,y in player.your_pos:
    #     for mx,my in d:
    #         if 0 <= x+mx <= 4 and 0 <= y+my <= 4 and player.board[y+my][x+mx] == 0:
    #             print({"selected_pos": (x,y), "new_pos": (x+mx, y+my)})
        