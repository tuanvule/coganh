def main(player):
    for x, y in player.your_pos:
        for mx, my in valid_move(x, y, player.board):
            return {"selected_pos": (x,y), "new_pos": (mx,my)}