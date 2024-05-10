
            # Remember that board[y][x] is the tile at (x, y) when printing
            def main(player):
                for x,y, in player.your_pos:
                    move = ((0,-1),(0,1),(1,0),(-1,0)) 
                    for mx, my in move:
                        if 0 <= x+mx <=4 and 0 <= y+my <= 4 and player.board[y+my][x+mx] == 0: #check if new position is valid
                            return {"selected_pos": (x,y), "new_pos": (x+mx, y+my)}
        