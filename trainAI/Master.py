import os

def ganh_chet(move, opp_pos, your_board, opp_board):

    valid_remove = []

    for x0, y0 in opp_pos:
        dx, dy = x0-move[0], y0-move[1]
        if -1<=dx<=1 and -1<=dy<=1 and (0 in (dx,dy) or (move[0]+move[1])%2==0):
            ganhx, ganhy = move[0]-dx, move[1]-dy
            chetx, chety = x0+dx, y0+dy
            if ((0<=ganhx<=4 and 0<=ganhy<=4 and opp_board&(1<<5*(4-ganhy)+(4-ganhx)) != 0) or # ganh
                (0<=chetx<=4 and 0<=chety<=4 and your_board&(1<<5*(4-chety)+(4-chetx)) != 0)): # chet
                valid_remove.append((x0, y0))

    for x, y in valid_remove:
        opp_board ^= (1<<5*(4-y)+(4-x))
        opp_pos.remove((x, y))

    return opp_board, opp_pos
def vay(opp_pos, your_board, opp_board):
    
    for pos in opp_pos:
        if (pos[0]+pos[1])%2==0:
            move_list = ((1,0), (-1,0), (0,1), (0,-1), (1,1), (-1,-1), (-1,1), (1,-1))
        else:
            move_list = ((1,0), (-1,0), (0,1), (0,-1))
        for move in move_list:
            new_valid_x = pos[0] + move[0]
            new_valid_y = pos[1] + move[1]
            if 0<=new_valid_x<=4 and 0<=new_valid_y<=4 and (your_board|opp_board)&(1<<5*(4-new_valid_y)+(4-new_valid_x)) == 0:
                return opp_board, opp_pos

    return 0, []

def main(player):
    global move, board_pointF
    move = {"selected_pos": None, "new_pos": None}
    dirname = os.path.dirname(__file__)
    with open(os.path.join(dirname, "source_code/pos_point.txt")) as f:
        max_pointF = int(f.readline()[:-1])
        board_pointF = eval(f.read())
    for i in range(5):
        for j in range(5):
            board_pointF[i][j] = board_pointF[i][j]/max_pointF

    try:
        with open(os.path.join(dirname, "source_code/bit_board.txt")) as f:
            cache = {(int(i.split(" ")[0]), int(i.split(" ")[1]), bool(i.split(" ")[2])):[float(i.split(" ")[3]), int(i.split(" ")[4])] for i in f.read().split("\n")[:-1]}
    except: cache = {}

    your_board = int("0b"+"".join("1" if ele == -1 else "0" for row in player.board for ele in row),2)
    opp_board = int("0b"+"".join("1" if ele == 1 else "0" for row in player.board for ele in row),2)
    minimax(player.your_pos, player.opp_pos, your_board, opp_board, Stopdepth=12, cache=cache)

    # with open(os.path.join(dirname, f"source_code/bit_board.txt"), mode="w") as f:
    #     [f.write( f"{' '.join(map(str, i[0])).replace('False', '0').replace('True', '1')} {' '.join(map(str, i[1]))}\n" ) for i in sorted(cache.items(), key=lambda i: i[1][1], reverse=True)]

    return move

def minimax(your_pos, opp_pos, your_board, opp_board, depth=0, isMaximizingPlayer=True, Stopdepth=None, alpha=float("-inf"), beta=float("inf"), cache={}):

    if (state := (your_board, opp_board, isMaximizingPlayer)) in cache and depth:
        cache[state][1] += 1
        return cache[state][0]

    if your_board == 0 or opp_board == 0:
        return -1000 + depth if isMaximizingPlayer else 1000 - depth
    if depth == Stopdepth:
        if isMaximizingPlayer:
            return (len(your_pos) - len(opp_pos))*50 + sum(board_pointF[y][x] for x, y in your_pos) - sum(board_pointF[y][x] for x, y in opp_pos) - depth
        else:
            return (len(opp_pos) - len(your_pos))*50 + sum(board_pointF[y][x] for x, y in opp_pos) - sum(board_pointF[y][x] for x, y in your_pos) - depth

    bestVal = float("-inf") if isMaximizingPlayer else float("inf")

    for pos in your_pos:
        for movement in ((0,-1), (0,1), (1,0), (-1,0), (-1,1), (1,-1), (1,1), (-1,-1)):
            invalid_move = (pos[0] + movement[0], pos[1] + movement[1])
            if 0 <= invalid_move[0] <= 4 and 0 <= invalid_move[1] <= 4 and (your_board|opp_board)&(1<<5*(4-invalid_move[1])+(4-invalid_move[0])) == 0 and \
                (movement[0]*movement[1]==0 or (movement[0]*movement[1]!=0 and (pos[0]+pos[1])%2==0)) and alpha < beta:

                # Update move to board
                your_new_board = your_board^(1<<5*(4-pos[1])+(4-pos[0]))|(1<<5*(4-invalid_move[1])+(4-invalid_move[0]))
                # Update move to positions
                your_new_pos = your_pos.copy()
                your_new_pos[your_pos.index(pos)] = invalid_move

                opp_new_board, opp_new_pos = ganh_chet(invalid_move, opp_pos.copy(), your_new_board, opp_board)
                if len(your_new_pos) > len(opp_new_pos) or len(your_new_pos) == len(opp_new_pos) == 3:
                    opp_new_board, opp_new_pos = vay(opp_new_pos, your_new_board, opp_new_board)

                value = minimax(opp_new_pos, your_new_pos, opp_new_board, your_new_board, depth+1, not isMaximizingPlayer, Stopdepth, alpha, beta, cache)
                if depth == 0 and value > bestVal:
                    move["selected_pos"] = pos
                    move["new_pos"] = invalid_move

                if isMaximizingPlayer:
                    alpha = max(alpha, value)
                    bestVal = max(bestVal, value)
                else:
                    beta = min(beta, value)
                    bestVal = min(bestVal, value)

    cache[state] = [bestVal, 1]
    return bestVal