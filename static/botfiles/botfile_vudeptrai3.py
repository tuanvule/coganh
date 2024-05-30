
def main(player):
    for x,y, in player.your_pos:
        move2 = ((0,-1),(0,1),(1,0),(-1,0)) 
        move = [[-1,0],[0,-1],[0,1],[1,0]]
        for mx, my in move2:
            if 0 <= x+mx <=4 and 0 <= y+my <= 4 and player.board[y+my][x+mx] == 0: 
                return {"selected_pos": (x,y), "new_pos": (x+mx, y+my)}
