import random
# Remember that player.board[y][x] is the tile at (x, y) when printing
def main(player):
    while True:
        pos = random.choice(player.your_pos)
        x, y = pos[0], pos[1]
        move = random.choice(((1,0),(-1,0),(0,1),(0,-1)))
        mx, my = move[0],move[1]
        if 0 <= x+mx <=4 and 0 <= y+my <= 4 and player.board[y+my][x+mx] == 0: #check if new position is valid
            return {"selected_pos": (x,y), "new_pos": (x+mx, y+my)}
