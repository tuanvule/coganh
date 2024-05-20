def main(player):
    from tool import enable_move
    for x, y in player.your_pos:
        for mx, my in enable_move(x, y, player.board):
            # print({"selected_pos": (x,y), "new_pos": (mx,my)})
            return {"selected_pos": (x,y), "new_pos": (mx,my)}