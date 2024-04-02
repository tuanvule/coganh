def is_valid_move(current_pos, new_pos, board):

    if 0 <= new_pos[0] <= 4 and 0 <= new_pos[1] <= 4 and board[new_pos[1]][new_pos[0]] == 0:
        dx = abs(new_pos[0]-current_pos[0])
        dy = abs(new_pos[1]-current_pos[1])
        if (dx + dy == 1): return True
        return (current_pos[0]+current_pos[1])%2==0 and (dx * dy == 1)
    return False
def ganh_chet(move, opp_pos, your_side, opp_side, board):

    valid_remove = []
    at_8intction = (move[0]+move[1])%2==0

    for x0, y0 in opp_pos:
        dx, dy = x0-move[0], y0-move[1]
        if -1<=dx<=1 and -1<=dy<=1 and (0 in (dx,dy) or at_8intction):
            if ((0<=move[0]-dx<=4 and 0<=move[1]-dy<=4 and board[move[1]-dy][move[0]-dx] == opp_side) or #ganh
                (0<=x0+dx<=4 and 0<=y0+dy<=4 and board[y0+dy][x0+dx] == your_side)): # chet
                valid_remove.append((x0, y0))

    for x, y in valid_remove:
        board[y][x] = 0
        opp_pos.remove((x, y))

    return valid_remove
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
                return []

    valid_remove = opp_pos.copy()
    for x, y in opp_pos: board[y][x] = 0
    opp_pos[:] = []
    return valid_remove

def main(player):
    global move, board_pointF
    move = {"selected_pos": None, "new_pos": None}
    with open("trainAI\source_code\pos_point.txt") as f:
        max_pointF = int(f.readline()[:-1])
        board_pointF = eval(f.read())
    for i in range(5):
        for j in range(5):
            board_pointF[i][j] = board_pointF[i][j]/max_pointF

    minimax(player, Stopdepth=6)

    return move

def CheckGamepoint(your_pos, opp_pos, depth):
    point = (len(your_pos) - len(opp_pos))*50
    for x, y in your_pos: point += board_pointF[y][x]
    for x, y in opp_pos: point -= board_pointF[y][x]
    return point - depth
def minimax(player, depth=0, isMaximizingPlayer=True, Stopdepth=None, alpha=float("-inf"), beta=float("inf")):

    bestVal = float("-inf")
    your_pos = player.your_pos
    opp_pos = player.opp_pos
    board = player.board
    your_side = player.your_side
    opp_side = -your_side
    min_or_max = max
    
    if depth == Stopdepth or (not your_pos) or (not opp_pos):
        return CheckGamepoint(your_pos, opp_pos, depth)

    if not isMaximizingPlayer:
        bestVal = float("inf")
        opp_pos = player.your_pos
        your_pos = player.opp_pos
        opp_side = player.your_side
        your_side = -opp_side
        min_or_max = min

    movements = ((0,-1), (0,1), (1,0), (-1,0), (-1,1), (1,-1), (1,1), (-1,-1))
    for pos in your_pos:
        for movement in movements:
            invalid_move = (pos[0] + movement[0], pos[1] + movement[1])
            if is_valid_move(pos, invalid_move, board) and alpha < beta:

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
                vay(opp_pos, board)

                value = minimax(player, depth+1, not isMaximizingPlayer, Stopdepth, alpha, beta)
                if depth == 0 and value > bestVal:
                    move["selected_pos"] = pos
                    move["new_pos"] = invalid_move
                bestVal = min_or_max(bestVal, value)

                if isMaximizingPlayer: alpha = max(alpha, value)
                else: beta = min(beta, value)

                # Undo move
                board[:], your_pos[:], opp_pos[:] = pre_board, pre_your_pos, pre_opp_pos

    return bestVal