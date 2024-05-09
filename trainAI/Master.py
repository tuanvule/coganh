import os

def ganh_chet(move, opp_pos, your_side, opp_side, board):

    valid_remove = []

    for x0, y0 in opp_pos:
        dx, dy = x0-move[0], y0-move[1]
        if -1<=dx<=1 and -1<=dy<=1 and (0 in (dx,dy) or (move[0]+move[1])%2==0):
            if ((0<=move[0]-dx<=4 and 0<=move[1]-dy<=4 and board[move[1]-dy][move[0]-dx] == opp_side) or #ganh
                (0<=x0+dx<=4 and 0<=y0+dy<=4 and board[y0+dy][x0+dx] == your_side)): # chet
                valid_remove.append((x0, y0))

    for x, y in valid_remove:
        board[y][x] = 0
        opp_pos.remove((x, y))

def vay(opp_pos, board):
    
    for pos in opp_pos:
        if (pos[0]+pos[1])%2==0:
            move_list = ((1,0), (-1,0), (0,1), (0,-1), (1,1), (-1,-1), (-1,1), (1,-1))
        else:
            move_list = ((1,0), (-1,0), (0,1), (0,-1))
        for move in move_list:
            new_valid_x = pos[0] + move[0]
            new_valid_y = pos[1] + move[1]
            if 0<=new_valid_x<=4 and 0<=new_valid_y<=4 and board[new_valid_y][new_valid_x]==0:
                return None

    for x, y in opp_pos: board[y][x] = 0
    opp_pos[:] = []

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

    minimax(player, Stopdepth=6)

    return move

def minimax(player, depth=0, isMaximizingPlayer=True, Stopdepth=None, alpha=float("-inf"), beta=float("inf")):

    if depth == Stopdepth or (not player.your_pos) or (not player.opp_pos):
        return (len(player.your_pos) - len(player.opp_pos))*50 + sum(board_pointF[y][x] for x, y in player.your_pos) - sum(board_pointF[y][x] for x, y in player.opp_pos) - depth

    board = player.board
    if isMaximizingPlayer:
        bestVal = float("-inf")
        your_pos = player.your_pos
        opp_pos = player.opp_pos
        your_side = player.your_side
        opp_side = -your_side
    else:
        bestVal = float("inf")
        opp_pos = player.your_pos
        your_pos = player.opp_pos
        opp_side = player.your_side
        your_side = -opp_side

    for pos in your_pos:
        for movement in ((0,-1), (0,1), (1,0), (-1,0), (-1,1), (1,-1), (1,1), (-1,-1)):
            invalid_move = (pos[0] + movement[0], pos[1] + movement[1])
            if 0 <= invalid_move[0] <= 4 and 0 <= invalid_move[1] <= 4 and board[invalid_move[1]][invalid_move[0]] == 0 and \
                (movement[0]*movement[1]==0 or (movement[0]*movement[1]!=0 and (pos[0]+pos[1])%2==0)) and alpha < beta:

                pre_board = [i.copy() for i in board]
                pre_your_pos = your_pos.copy()
                pre_opp_pos = opp_pos.copy()

                # Update move to board
                board[invalid_move[1]][invalid_move[0]] = your_side
                board[pos[1]][pos[0]] = 0
                # Update move to positions
                index_move = your_pos.index(pos)
                your_pos[index_move] = invalid_move

                ganh_chet(invalid_move, opp_pos, your_side, opp_side, board)
                if len(your_pos) > len(opp_pos) or len(your_pos) == len(opp_pos) == 3:
                    vay(opp_pos, board)

                value = minimax(player, depth+1, not isMaximizingPlayer, Stopdepth, alpha, beta)
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
                board[:], your_pos[:], opp_pos[:] = pre_board, pre_your_pos, pre_opp_pos

    return bestVal
