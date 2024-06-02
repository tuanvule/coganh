from PIL import Image, ImageDraw
import numpy as np
import os
# import cv2
absolute_path = os.getcwd()

# print("___", absolute_path, "____")

def declare():
    global positions, point, frame, video, img_url

    positions = [None,
                [(0,2), (0,3), (4,3), (0,4), (1,4), (2,4), (3,4), (4,4)],
                [(0,0), (1,0), (2,0), (3,0), (4,0), (0,1), (4,1), (4,2)]]

    point = []

    frame = Image.open(absolute_path + "/chessboard.png")
    frame_cop = frame.copy()
    draw = ImageDraw.Draw(frame_cop)

    for x, y in positions[1]:
        draw.ellipse((x*100+80, y*100+80, x*100+120, y*100+120), fill="blue", outline="blue")
    for x, y in positions[-1]:
        draw.ellipse((x*100+80, y*100+80, x*100+120, y*100+120), fill="red", outline="red")

    frame_cop = np.array(frame_cop)

declare()
frame_cop = frame.copy()
im = Image.new('RGBA', (600, 600), (0, 255, 0, 0))
draw = ImageDraw.Draw(im)

for x, y in positions[1]:
    draw.ellipse((x*100+80, y*100+80, x*100+120, y*100+120), fill="blue", outline="blue")
for x, y in positions[-1]:
    draw.ellipse((x*100+80, y*100+80, x*100+120, y*100+120), fill="red", outline="red")
# new_x = move["new_pos"][0]
# new_y = move["new_pos"][1]
# old_x = move["selected_pos"][0]
# old_y = move["selected_pos"][1]
# draw.ellipse((new_x*100+80, new_y*100+80, new_x*100+120, new_y*100+120), fill=None, outline="green", width=5)
# draw.ellipse((old_x*100+80, old_y*100+80, old_x*100+120, old_y*100+120), fill=None, outline="green", width=5)

# if rate == "excellent":
#     draw.ellipse((new_x*100+102, new_y*100+70, new_x*100+122, new_y*100+90), fill="#2DC4A6")
#     draw.line((new_x*100+102+13, new_y*100+73, new_x*100+102+13, new_y*100+82), fill="white", width=3)
#     draw.ellipse((new_x*100+102+11, new_y*100+85, new_x*100+102+14, new_y*100+88), fill="white")
#     draw.line((new_x*100+102+7, new_y*100+73, new_x*100+102+7, new_y*100+82), fill="white", width=3)
#     draw.ellipse((new_x*100+102+6, new_y*100+85, new_x*100+102+9, new_y*100+88.5), fill="white")

# elif rate == "good":
# draw.ellipse((new_x*100+102, new_y*100+70, new_x*100+122, new_y*100+90), fill="#00B400")
# draw.line((new_x*100+102+5, new_y*100+70+11, new_x*100+112, new_y*100+86), fill="white", width=3)
# draw.line((new_x*100+112, new_y*100+86, new_x*100+112+7, new_y*100+77), fill="white", width=3)
# {
# draw.ellipse((new_x*100+102+9, new_y*100+85, new_x*100+102+11.5, new_y*100+88.5), fill="white")
# draw.line((new_x*100+102+10, new_y*100+73, new_x*100+102+10, new_y*100+82), fill="white", width=3)
# }

# elif rate == "bad":
#     draw.ellipse((new_x*100+102, new_y*100+70, new_x*100+122, new_y*100+90), fill="red", width=5)
#     draw.line((new_x*100+107, new_y*100+75, new_x*100+117, new_y*100+85), fill="white", width=3)
#     draw.line((new_x*100+117, new_y*100+75, new_x*100+107, new_y*100+85), fill="white", width=3)


im.show()