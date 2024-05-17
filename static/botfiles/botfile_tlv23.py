from tool import enable_move
def main(player):
    d = [[-1,0],[0,-1],[0,1],[1,0]]
    print(123)
    for x,y in player.your_pos:
        valid_move = enable_move(x,y,player.board)
        print(valid_move[0])
        for mx,my in d:
            if 0 <= x+mx <= 4 and 0 <= y+my <= 4 and player.board[y+my][x+mx] == 0:
                print({"selected_pos": (x,y), "new_pos": (x+mx, y+my)})
                return {"selected_pos": (x,y), "new_pos": (x+mx, y+my)}
        