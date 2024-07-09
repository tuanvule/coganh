import os
from trainAI.Master import ganh_chet, vay, check_pos_point

def minimax(your_pos, opp_pos, your_board, opp_board, depth=0, alpha=(float("-inf"),), beta=(float("inf"),)):

    if depth%2==0:
        if (state := f"{your_board} {opp_board}") in cache and depth:
            temp = cache[state].split(' ')
            return float(temp[1]), float(temp[2]) + (depth if float(temp[2])>0 else -depth), float(temp[3])

        if your_board == 0 or opp_board == 0:
            return (-8, depth, 0)

        bestVal = (float("-inf"),)

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

                    value = minimax(opp_new_pos, your_new_pos, opp_new_board, your_new_board, depth+1, alpha, beta)

                    alpha = max(alpha, value)
                    bestVal = max(bestVal, value)

                    if alpha >= beta:
                        return bestVal

        return bestVal

    else:
        if (state := f"{your_board} {opp_board}") in cacheUser:
            temp = cacheUser[state].split(' ')
            return float(temp[0]), float(temp[1]) + (depth if float(temp[1])>0 else -depth), float(temp[2])

        if your_board == 0 or opp_board == 0:
            return (8, -depth, 0)
        if depth == Stopdepth:
            return (len(opp_pos) - len(your_pos)), float("-inf"), check_pos_point(your_pos, opp_pos)

        bestVal = (float("inf"),)

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

                    value = minimax(opp_new_pos, your_new_pos, opp_new_board, your_new_board, depth+1, alpha, beta)

                    beta = min(beta, value)
                    bestVal = min(bestVal, value)

                    if alpha >= beta:
                        return bestVal

        return bestVal

def main(move_listi):
    global cache, cacheUser, Stopdepth

    your_board = int("0b"+"".join("1" if ele == 1 else "0" for row in move_listi["board"] for ele in row),2)
    opp_board = int("0b"+"".join("1" if ele == -1 else "0" for row in move_listi["board"] for ele in row),2)

    dirname = os.path.dirname(__file__)
    with open(os.path.join(dirname, "source_code/bit_boardUser.txt")) as f:
        cacheUser = {i.split("  ")[0]:i.split("  ")[1] for i in f.read().split("\n")}

    if (state := f"{your_board} {opp_board}") in cacheUser:
        rate = eval(cacheUser[state].replace('inf','float("inf")').split(' ')[3])

    else:
        rate = {}

        with open(os.path.join(dirname, "source_code/bit_board.txt")) as f:
            cache = {i.split("  ")[0]:i.split("  ")[1] for i in f.read().split("\n")}
        Stopdepth = 5

        for pos in move_listi['your_pos']:
            for movement in ((0,-1), (0,1), (1,0), (-1,0), (-1,1), (1,-1), (1,1), (-1,-1)):
                invalid_move = (pos[0] + movement[0], pos[1] + movement[1])
                if 0 <= invalid_move[0] <= 4 and 0 <= invalid_move[1] <= 4 and (your_board|opp_board)&(1<<24-5*invalid_move[1]-invalid_move[0]) == 0 and ((True, sum(pos)%2==0)[movement[0]*movement[1]]):

                    # Update move to board
                    your_new_board = your_board^(1<<24-5*pos[1]-pos[0])|(1<<24-5*invalid_move[1]-invalid_move[0])
                    # Update move to positions
                    your_new_pos = move_listi['your_pos'].copy()
                    your_new_pos[move_listi['your_pos'].index(pos)] = invalid_move

                    opp_new_board, opp_new_pos = ganh_chet(invalid_move, move_listi['opp_pos'].copy(), your_new_board, opp_board)
                    if len(your_new_pos) > len(opp_new_pos) or len(your_new_pos) == len(opp_new_pos) == 3:
                        opp_new_board, opp_new_pos = vay(opp_new_pos, your_new_board, opp_new_board)

                    rate.update({
                        f"{pos[0]}{pos[1]}{invalid_move[0]}{invalid_move[1]}" : tuple(map(float , cache[state].split(' ')[1:4]))
                                                                                if (state := f"{opp_new_board} {your_new_board}") in cache else
                                                                                minimax(opp_new_pos, your_new_pos, opp_new_board, your_new_board)
                    })

        with open(os.path.join(dirname, f"source_code/bit_boardUser.txt"), mode="a") as f:
            f.write( f'''\n{your_board} {opp_board}  {' '.join(map(str, min(rate.values())))} {str(rate).replace(' ', '')}''' )

    move = move_listi["move"]
    p = sorted(list(rate.values())).index(rate[f"{move['selected_pos'][0]}{move['selected_pos'][1]}{move['new_pos'][0]}{move['new_pos'][1]}"])
    l = len(rate.values())

    if p*3 > l*2:
        return "Tệ"
    elif p*3 >= l:
        return "Bình thường"
    elif p == 0:
        return "Tốt nhất"
    else:
        return "Tốt"