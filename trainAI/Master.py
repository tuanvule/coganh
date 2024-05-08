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

    return opp_board
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
                return opp_board

    opp_board = 0
    opp_pos[:] = []

    return opp_board

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

    with open(os.path.join(dirname, "source_code/bit_board.txt")) as f:
        cache = {(int(i.split(" ")[0]), int(i.split(" ")[1]), bool(i.split(" ")[2])):float(i.split(" ")[3]) for i in f.read().split("\n")[:-1]}

    your_board = int("0b"+"".join("1" if ele == -1 else "0" for row in player.board for ele in row),2)
    opp_board = int("0b"+"".join("1" if ele == 1 else "0" for row in player.board for ele in row),2)
    minimax(player, your_board, opp_board, Stopdepth=6, cache=cache)
    with open(os.path.join(dirname, "source_code/bit_board.txt"), mode="w") as f:
        [f.write( f"{' '.join(map(str, i[0])).replace('False', '0').replace('True', '1')} {i[1]}\n" ) for i in cache.items()]

    return move

def minimax(player, your_board, opp_board, depth=0, isMaximizingPlayer=True, Stopdepth=None, alpha=float("-inf"), beta=float("inf"), cache={}):

    if (state := (your_board, opp_board, isMaximizingPlayer)) in cache and depth:
        return cache[state]

    if depth == Stopdepth or (not player.your_pos) or (not player.opp_pos):
        return (len(player.your_pos) - len(player.opp_pos))*50 + sum(board_pointF[y][x] for x, y in player.your_pos) - sum(board_pointF[y][x] for x, y in player.opp_pos) - depth

    if isMaximizingPlayer:
        bestVal = float("-inf")
        your_pos = player.your_pos
        opp_pos = player.opp_pos
    else:
        bestVal = float("inf")
        opp_pos = player.your_pos
        your_pos = player.opp_pos

    for pos in your_pos:
        for movement in ((0,-1), (0,1), (1,0), (-1,0), (-1,1), (1,-1), (1,1), (-1,-1)):
            invalid_move = (pos[0] + movement[0], pos[1] + movement[1])
            if 0 <= invalid_move[0] <= 4 and 0 <= invalid_move[1] <= 4 and (your_board|opp_board)&(1<<5*(4-invalid_move[1])+(4-invalid_move[0])) == 0 and \
                (movement[0]*movement[1]==0 or (movement[0]*movement[1]!=0 and (pos[0]+pos[1])%2==0)) and alpha < beta:

                pre_your_pos = your_pos.copy()
                pre_opp_pos = opp_pos.copy()

                # Update move to board
                your_new_board = your_board^(1<<5*(4-pos[1])+(4-pos[0]))|(1<<5*(4-invalid_move[1])+(4-invalid_move[0]))
                # Update move to positions
                index_move = your_pos.index(pos)
                your_pos[index_move] = invalid_move

                opp_new_board = ganh_chet(invalid_move, opp_pos, your_new_board, opp_board)
                if len(your_pos) > len(opp_pos) or len(your_pos) == len(opp_pos) == 3:
                    opp_new_board = vay(opp_pos, your_new_board, opp_new_board)

                value = minimax(player, opp_new_board, your_new_board, depth+1, not isMaximizingPlayer, Stopdepth, alpha, beta, cache)
                if depth == 0 and value > bestVal:
                    move["selected_pos"] = pos
                    move["new_pos"] = invalid_move

                if isMaximizingPlayer:
                    alpha = max(alpha, value)
                    bestVal = max(bestVal, value)
                else:
                    beta = min(beta, value)
                    bestVal = min(bestVal, value)

                # Undo move
                your_pos[:], opp_pos[:] = pre_your_pos, pre_opp_pos

    cache[state] = bestVal
    return bestVal
