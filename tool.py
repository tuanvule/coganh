def enable_move(x, y, board):
    if not (0 <= x <= 4 and 0 <= y <= 4):
        raise Exception("(x, y) out of board")
    
    valid_move = ()
    if (x+y)%2==0:
        move = ((0,1), (0,-1), (1,0), (-1,0), (-1,-1), (1,-1), (-1,1), (1,1))
    else:
        move = ((0,1), (0,-1), (1,0), (-1,0))
    for i in move:
        x_ = x + i[0]
        y_ = y + i[1]
        if 0 <= x_ <= 4 and 0 <= y_ <= 4 and not board[y_][x_]:
            valid_move += ((x_, y_),)
    return valid_move

def distance(x1, y1, x2, y2):
    if not (0 <= x1 <= 4 and 0 <= y1 <= 4):
        raise Exception("(x1, y1) out of board")
    if not (0 <= x2 <= 4 and 0 <= y2 <= 4):
        raise Exception("(x2, y2) out of board")

    return max((dx := abs(x1 - x2)), (dy := abs(y1 - y2))) + ((x1+y1)%2 and (x2+y2)%2 and dx == dy)
