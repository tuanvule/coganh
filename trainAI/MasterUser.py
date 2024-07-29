import os
from trainAI.Master import ganh_chet, vay, check_pos_point

def main(move_listi, side):
    global cache, rate, move_set, pos_set, move_chosen

    your_board = int("0b"+"".join("1" if ele == side else "0" for row in move_listi["board"] for ele in row),2)
    opp_board = int("0b"+"".join("1" if ele == -side else "0" for row in move_listi["board"] for ele in row),2)

    dirname = os.path.dirname(__file__)
    with open(os.path.join(dirname, "source_code/bit_board.txt")) as f:
        cache = {i.split("  ")[0]:i.split("  ")[1] for i in f.read().split("\n")}

    rate = []
    move_set = ([(-1,1), (0,1), (1,1), (-1,0), (1,0), (-1,-1), (0,-1), (1,-1)],
                [(1,-1), (0,-1), (-1,-1), (1,0), (-1,0), (1,1), (0,1), (-1,1)])[::side]
    pos_set = (lambda i: i[0] + 10*(4-i[1]),
               lambda i: 4-i[0] + 10*i[1])[::side]
    move_chosen = ( *move_listi["move"]['selected_pos'], *move_listi["move"]['new_pos'] )

    v = minimax(move_listi['your_pos'], move_listi['opp_pos'], your_board, opp_board)

    cache[f"{your_board} {opp_board}"] = ' '.join(str(i) for i in v)
    with open(os.path.join(dirname, f"source_code/bit_board.txt"), mode="w") as f:
        f.write("\n".join("  ".join(i) for i in cache.items()))

    User_p = rate[0]
    p = sorted(rate, reverse=True).index(User_p)
    l = len(rate)

    if p*3 > l*2:
        return "Tệ"
    elif p*3 >= l:
        return "Bình thường"
    elif p == 0:
        return "Tốt nhất"
    else:
        return "Tốt"

def minimax(your_pos, opp_pos, your_board, opp_board, depth=0, alpha=(-9,), beta=(9,)):

    if depth%2==0:
        if (state := f"{your_board} {opp_board}") in cache and depth:
            temp = [int(i) for i in cache[state].split(' ')]
            return temp[0], temp[1] - depth if temp[1]<0 else temp[1] + depth if temp[1]>0 else 0, temp[2]

        if your_board == 0 or opp_board == 0:
            return (-8, depth, 0)
        if depth == 6:
            return (len(your_pos) - len(opp_pos)), 0, check_pos_point(your_pos, opp_pos)

        bestVal = (-9,)

        your_pos.sort(key=pos_set[1])
        if depth == 0:
            i = your_pos.index(move_chosen[:2])
            your_pos[0], your_pos[i] = your_pos[i], your_pos[0]
            i = move_set[1].index( (move_chosen[2]-move_chosen[0], move_chosen[3]-move_chosen[1]) )
            move_set[1][0], move_set[1][i] = move_set[1][i], move_set[1][0]

            for pos in your_pos:
                for movement in move_set[1]:
                    invalid_move = (pos[0] + movement[0], pos[1] + movement[1])
                    if 0 <= invalid_move[0] <= 4 and 0 <= invalid_move[1] <= 4 and (your_board|opp_board)&(1<<24-5*invalid_move[1]-invalid_move[0]) == 0 and \
                        ((True, sum(pos)%2==0)[movement[0]*movement[1]]):

                        # Update move to board
                        your_new_board = your_board^(1<<24-5*pos[1]-pos[0])|(1<<24-5*invalid_move[1]-invalid_move[0])
                        # Update move to positions
                        your_new_pos = your_pos.copy()
                        your_new_pos[your_pos.index(pos)] = invalid_move

                        opp_new_board, opp_new_pos = vay(opp_pos.copy(), your_new_board, opp_board)
                        opp_new_board, opp_new_pos = ganh_chet(invalid_move, opp_new_pos, your_new_board, opp_new_board)
                        opp_new_board, opp_new_pos = vay(opp_new_pos, your_new_board, opp_new_board)

                        value = minimax(opp_new_pos, your_new_pos, opp_new_board, your_new_board, depth+1, alpha, beta)
                        bestVal = max(bestVal, value)

                        if alpha == (-9,): alpha = value
                        rate.append(value)

        else:
            for pos in your_pos:
                for movement in move_set[1]:
                    invalid_move = (pos[0] + movement[0], pos[1] + movement[1])
                    if 0 <= invalid_move[0] <= 4 and 0 <= invalid_move[1] <= 4 and (your_board|opp_board)&(1<<24-5*invalid_move[1]-invalid_move[0]) == 0 and \
                        ((True, sum(pos)%2==0)[movement[0]*movement[1]]):

                        # Update move to board
                        your_new_board = your_board^(1<<24-5*pos[1]-pos[0])|(1<<24-5*invalid_move[1]-invalid_move[0])
                        # Update move to positions
                        your_new_pos = your_pos.copy()
                        your_new_pos[your_pos.index(pos)] = invalid_move

                        opp_new_board, opp_new_pos = vay(opp_pos.copy(), your_new_board, opp_board)
                        opp_new_board, opp_new_pos = ganh_chet(invalid_move, opp_new_pos, your_new_board, opp_new_board)
                        opp_new_board, opp_new_pos = vay(opp_new_pos, your_new_board, opp_new_board)

                        value = minimax(opp_new_pos, your_new_pos, opp_new_board, your_new_board, depth+1, alpha, beta)
                        bestVal = max(bestVal, value)

                        alpha = max(alpha, value)
                        if alpha >= beta:
                            return bestVal

        return bestVal

    else:
        if your_board == 0 or opp_board == 0:
            return (8, -depth, 0)

        bestVal = (9,)

        your_pos.sort(key=pos_set[0])
        for pos in your_pos:
            for movement in move_set[0]:
                invalid_move = (pos[0] + movement[0], pos[1] + movement[1])
                if 0 <= invalid_move[0] <= 4 and 0 <= invalid_move[1] <= 4 and (your_board|opp_board)&(1<<24-5*invalid_move[1]-invalid_move[0]) == 0 and \
                    ((True, sum(pos)%2==0)[movement[0]*movement[1]]):

                    # Update move to board
                    your_new_board = your_board^(1<<24-5*pos[1]-pos[0])|(1<<24-5*invalid_move[1]-invalid_move[0])
                    # Update move to positions
                    your_new_pos = your_pos.copy()
                    your_new_pos[your_pos.index(pos)] = invalid_move

                    opp_new_board, opp_new_pos = vay(opp_pos.copy(), your_new_board, opp_board)
                    opp_new_board, opp_new_pos = ganh_chet(invalid_move, opp_new_pos, your_new_board, opp_new_board)
                    opp_new_board, opp_new_pos = vay(opp_new_pos, your_new_board, opp_new_board)

                    value = minimax(opp_new_pos, your_new_pos, opp_new_board, your_new_board, depth+1, alpha, beta)
                    bestVal = min(bestVal, value)

                    beta = min(beta, value)
                    if alpha >= beta:
                        return bestVal

        return bestVal