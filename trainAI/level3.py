from trainAI.Master import ganh_chet, vay
def check_pos_point(your_pos, opp_pos):

    board_pointF = ((9,9,9,9,9),
                    (4,4,4,4,4),
                    (2,2,2,2,2),
                    (0,0,0,0,0),
                    (0,0,0,0,0))
    sum = 0
    for x, y in your_pos: sum += board_pointF[y][x]
    for x, y in opp_pos: sum -= board_pointF[y][x]
    return sum

def main(player):
    global move
    move = {"selected_pos": None, "new_pos": None}

    your_board = int("0b"+"".join("1" if ele == -1 else "0" for row in player.board for ele in row),2)
    opp_board = int("0b"+"".join("1" if ele == 1 else "0" for row in player.board for ele in row),2)
    minimax(player.your_pos, player.opp_pos, your_board, opp_board)
    return move

def minimax(your_pos, opp_pos, your_board, opp_board, depth=0, isMaximizingPlayer=True):

    if your_board == 0 or opp_board == 0:
        return -100 if isMaximizingPlayer else 100
    if depth == 2:
        return check_pos_point(your_pos, opp_pos) + len(your_pos) - 4*len(opp_pos)

    bestVal = float("-inf") if isMaximizingPlayer else float("inf")

    for pos in your_pos:
        for movement in ((0,-1), (0,1), (1,0), (-1,0), (-1,1), (1,-1), (1,1), (-1,-1)):
            invalid_move = (pos[0] + movement[0], pos[1] + movement[1])
            if 0 <= invalid_move[0] <= 4 and 0 <= invalid_move[1] <= 4 and (your_board|opp_board)&(1<<24-5*invalid_move[1]-invalid_move[0]) == 0 and ((True, sum(pos)%2==0)[movement[0]*movement[1]]):

                # Update move to board
                your_new_board = your_board^(1<<24-5*pos[1]-pos[0])|(1<<24-5*invalid_move[1]-invalid_move[0])
                # Update move to positions
                your_new_pos = your_pos.copy()
                your_new_pos[your_pos.index(pos)] = invalid_move

                opp_new_board, opp_new_pos = ganh_chet(invalid_move, opp_pos.copy(), your_new_board, opp_board)
                if len(your_new_pos) > len(opp_new_pos) or len(your_new_pos) == len(opp_new_pos) == 3:
                    opp_new_board, opp_new_pos = vay(opp_new_pos, your_new_board, opp_new_board)

                value = minimax(opp_new_pos, your_new_pos, opp_new_board, your_new_board, depth+1, not isMaximizingPlayer)

                if isMaximizingPlayer:
                    if value > bestVal:
                        move["selected_pos"] = pos
                        move["new_pos"] = invalid_move
                    bestVal = max(bestVal, value)
                else:
                    bestVal = min(bestVal, value)

    return bestVal