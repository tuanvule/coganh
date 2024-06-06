from trainAI.Master import ganh_chet, vay
def check_pos_point(your_pos):

    board_pointF = ((0,0, 1,0,0),
                    (0,7, 2,5,0),
                    (4,2,10,2,4),
                    (0,5, 2,7,0),
                    (0,0, 1,0,0))
    return sum(board_pointF[y][x] for x, y in your_pos)

def main(player):

    your_board = int("0b"+"".join("1" if ele == -1 else "0" for row in player.board for ele in row),2)
    opp_board = int("0b"+"".join("1" if ele == 1 else "0" for row in player.board for ele in row),2)
    return minimax(player.your_pos, your_board, opp_board)

def minimax(your_pos, your_board, opp_board):

    bestVal = float("-inf")
    move = {}

    for pos in your_pos:
        for movement in ((0,-1), (0,1), (1,0), (-1,0), (-1,1), (1,-1), (1,1), (-1,-1)):
            invalid_move = (pos[0] + movement[0], pos[1] + movement[1])
            if 0 <= invalid_move[0] <= 4 and 0 <= invalid_move[1] <= 4 and (your_board|opp_board)&(1<<24-5*invalid_move[1]-invalid_move[0]) == 0 and ((True, sum(pos)%2==0)[movement[0]*movement[1]]):

                # Update move to positions
                your_new_pos = your_pos.copy()
                your_new_pos[your_pos.index(pos)] = invalid_move

                value = check_pos_point(your_new_pos)

                if value > bestVal:
                    move["selected_pos"] = pos
                    move["new_pos"] = invalid_move
                    bestVal = value

    return move