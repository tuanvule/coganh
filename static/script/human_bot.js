const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const board = $(".board")
const boardValue = board.getBoundingClientRect()
const chessGrapX = boardValue.width / 4
const chessGrapY = boardValue.height / 4
let ready = true
const d1 = [[1,0],[0,1],[0,-1],[-1,0]]
const d2 = [[1,0],[0,1],[0,-1],[-1,0],[-1,-1],[-1,1],[1,1],[1,-1]]
let radius = 16
const canvas = $("canvas")
canvas.style.left = board.offsetLeft - radius - 5 + "px"
canvas.style.top = board.offsetTop - radius - 5 + "px"
canvas.width = boardValue.width + 2 * radius + 10
canvas.height = boardValue.height + 2 * radius + 10
const cv2 = canvas.getContext("2d")
// let chessPosition = [
//     [[0, 0],[1, 1],[2, 2],[3, 1],[4, 0],[0, 1],[4, 1],[4, 2]], 
//     [[0, 2],[1, 2],[2, 3],[4, 3],[0, 4],[1, 4],[3, 3],[4, 4]]
// ]
// let chessPosition = [
//     [[1,1],[2,2]], 
//     [[0,0],[1,2],[3,3],[0,3],[0,4],[2,4]]
// ]
// let chessPosition = [
//     [[1,0],[3,1],[4,1]], 
//     [[3,0],[2,1],[2,2],[4,2]]
// ]
let chessPosition = [
    [[0, 0],[1, 0],[2, 0],[3, 0],[4, 0],[0, 1],[4, 1],[4, 2]], 
    [[0, 2],[0, 3],[2, 4],[4, 3],[0, 4],[1, 4],[3, 4],[4, 4]]
]
let selectedChess
const gameResult = $(".game_result")
const gameStatus = $(".game_status")
const play_again_btn = $(".play_again_btn")
const moveSound = $(".move_sound")
const captureSound = $(".capture_sound")
const fireSound = $(".fire_sound")
fireSound.volume = 0.6

play_again_btn.onclick = () => location.reload()

const gridHTML = `
<div class="grid">
<div class="row1"></div>
<div class="row2"></div>            
<div class="row3"></div>
<div class="row4"></div>
</div>
<div class="grid">
<div class="row1"></div>
<div class="row2"></div>            
<div class="row3"></div>
<div class="row4"></div>
</div>
<div class="grid">
<div class="row1"></div>
<div class="row2"></div>            
<div class="row3"></div>
<div class="row4"></div>
</div>
<div class="grid">
<div class="row1"></div>
<div class="row2"></div>            
<div class="row3"></div>
<div class="row4"></div>
</div>
`
// let grid = [
//     [-1,0,0,0,-1],
//     [-1, -1, 0, -1,-1],
//     [1, 1, -1, 0, -1],
//     [0, 0, 1, 1, 1],
//     [1, 1, 0, 0, 1]
// ]
// let curBoard = [
//     [-1,0,0,0,-1],
//     [-1, -1, 0, -1,-1],
//     [1, 1, -1, 0, -1],
//     [0, 0, 1, 1, 1],
//     [1, 1, 0, 0, 1]
// ]

// let grid = [
//     [1,0,0,0,0],
//     [0, -1, 0, 0,0],
//     [0, 1, -1, 0, 0],
//     [1, 0, 0, 1, 0],
//     [1, 0, 1, 0, 0]
// ]

// let curBoard = [
//     [1,0,0,0,0],
//     [0, -1, 0, 0,0],
//     [0, 1, -1, 0, 0],
//     [1, 0, 0, 1, 0],
//     [1, 0, 1, 0, 0]
// ]

// let grid = [
//     [0, -1, 0, 1,0],
//     [0, 0, 1, -1, -1],
//     [0, 0, 1, 0, 1],
//     [0, 0, 0, 0, 0],
//     [0,0,0,0,0],
// ]

// let curBoard = [
//     [0, -1, 0, 1,0],
//     [0, 0, 1, -1, -1],
//     [0, 0, 1, 0, 1],
//     [0, 0, 0, 0, 0],
//     [0,0,0,0,0],
// ]

let grid = [
    [-1,-1,-1,-1,-1],
    [-1, 0, 0, 0,-1],
    [1, 0, 0, 0, -1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1]
]

let curBoard = [
    [-1,-1,-1,-1,-1],
    [-1, 0, 0, 0,-1],
    [1, 0, 0, 0, -1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1]
]
const type = [
    [1,0,1,0,1],
    [0,1,0,1,0],
    [1,0,1,0,1],
    [0,1,0,1,0],
    [1,0,1,0,1]
]

board.innerHTML = gridHTML
let dem = 0
for(let i = 0; i < grid.length; i++) {
    for(let j = 0; j < grid[i].length; j++) {
        board.innerHTML += `<div data-choosable="false" data-posx="${j}" data-posy="${i}" class="box" style="top:${chessGrapY*i - 40}px; left:${chessGrapX*j - 40}px;"></div>`
        if(grid[i][j] === -1) {
            board.innerHTML += `<div data-so="${dem}" data-posx="${j}" data-posy="${i}" style="background-color: red; top:${chessGrapY*i - 30}px; left:${chessGrapX*j - 30}px;" class="chess enemy"></div>`
        } else if(grid[i][j] === 1) {
            board.innerHTML += `<div data-so="${dem}" data-posx="${j}" data-posy="${i}" style="background-color: blue; top:${chessGrapY*i - 30}px; left:${chessGrapX*j - 30}px;" class="chess player"></div>`
        }
        dem++
    }
}

window.addEventListener('beforeunload', (event) => {
    event.returnValue = `Những thay đổi trên bàn cờ chưa được lưu. Bạn muốn đi khỏi đây?`;
});

const boxes = $$(".box")
// const chessEnemy = $$(".chess.enemy")

function getPos(e) {
    if(!ready) return

    const eX = Number(e.dataset.posx)
    const eY = Number(e.dataset.posy)
    selectedChess = e

    clearBox()

    if(type[eX][eY] === 0) {
        d1.forEach(pos => {
            let newPosX = eX + pos[0]
            let newPosY = eY + pos[1]
            if(newPosX >= 0 && newPosX < 5 && newPosY >= 0 && newPosY < 5 && grid[newPosY][newPosX] === 0) {
                let box = Array.from(boxes).filter(e => Number(e.dataset.posx) === newPosX && Number(e.dataset.posy) === newPosY)
                box.forEach(e => {
                    e.dataset.choosable = "true"
                })
            }
        })
    } else {
        d2.forEach(pos => {
            let newPosX = eX + pos[0]
            let newPosY = eY + pos[1]
            if(newPosX >= 0 && newPosX < 5 && newPosY >= 0 && newPosY < 5 && grid[newPosY][newPosX] === 0) {
                let box = Array.from(boxes).filter(e => Number(e.dataset.posx) === newPosX && Number(e.dataset.posy) === newPosY)
                box.forEach(e => {
                    e.dataset.choosable = "true"
                })
            }
        })
    }
}

function changeTurn(ob1, ob2) {
    $(ob1).classList.add("unavalable")
    $(ob2).classList.remove("unavalable")
}

function findI(e) {
    return e[0] === this[0]  && e[1] === this[1]
}

function changeBoard(newBoard, valid_remove, selected_pos, new_pos) {
    const chesses = $$(".chess")
    for(let i = 0; i < 5; i++) {
        for(let j = 0; j < 5; j++) {
            let isBlock = false
            if(curBoard[i][j] !== newBoard[i][j] && valid_remove.length !== 0) {
                if(curBoard[i][j] !== 0 && newBoard[i][j] === 0) {
                    const changedChess = Array.from(chesses).find(e => {
                        return Number(e.dataset.posx) === j && Number(e.dataset.posy) === i
                    })
                    if(changedChess) {
                        // if(selected_pos) {
                        //     console.log({j: selected_pos[0], i: selected_pos[1]})
                        //     console.log({j: new_pos[1], i: new_pos[0]})
                        //     if((j === selected_pos[0] && i === selected_pos[1]) || j === new_pos[1] && i === new_pos[0]) {
                        //         isBlock = true
                        //     }
                        // }
                        // if(!isBlock) {
                        console.log("changedChess: ",changedChess)
                        chessPosition.forEach((es,index) => es.forEach((e, indx)=> {
                            if(es.findIndex(findI, [j,i]) !== -1) {
                                chessPosition[index].splice(es.findIndex(findI, [j,i]),1)
                            }
                        }))
                        // captureSound.play()
                        fireSound.play()
                        // changedChess.classList.add("disappear")
                        const fire = document.createElement("img")
                        fire.setAttribute("src", "./static/img/fire.webp")
                        fire.setAttribute("style", `top:${chessGrapY*i - 30}px; left:${chessGrapX*j - 30}px;`)
                        fire.setAttribute("class", "fire")
                        let newFire = board.appendChild(fire)
                        console.log("removeChess: " + "(" + j + ",", + i + ")")
                        // const fire = $$(".fire")
                        newFire.onanimationend = (e) => {
                            changedChess.remove()
                            // board.removeChild(newFire)
                        }
                    }
                }
            }
            curBoard[i][j] = newBoard[i][j];
        }
    }
    if(chessPosition[0].length === 0) {
        gameStatus.innerHTML = "You Win"
        gameStatus.style.backgroundColor = "green"
        gameStatus.style.display = "block"
        gameStatus.style.opacity = "1";
    } else if(chessPosition[1].length === 0) {
        gameStatus.innerHTML = "You lost"
        gameStatus.style.backgroundColor = "red"
        gameStatus.style.opacity = "1";
    } else if(chessPosition[0].length === 1 && chessPosition[1].length === 1) {
        gameStatus.innerHTML = "draw"
        gameStatus.style.backgroundColor = "#ccc"
        gameStatus.style.display = "block"
        gameStatus.style.opacity = "1";
    }
}

function ganh_chet(move, opp_pos, side, opp_side) {
    let valid_remove = [];
    let at_8intction = (move[0] + move[1]) % 2 === 0;

    for (let [x0, y0] of opp_pos) {
        let dx = x0 - move[0];
        let dy = y0 - move[1];
        if (dx >= -1 && dx <= 1 && dy >= -1 && dy <= 1 && (dx === 0 || dy === 0 || at_8intction)) {
            if ((move[0] - dx >= 0 && move[0] - dx <= 4 && move[1] - dy >= 0 && move[1] - dy <= 4 && grid[move[1] - dy][move[0] - dx] === opp_side) ||
                (x0 + dx >= 0 && x0 + dx <= 4 && y0 + dy >= 0 && y0 + dy <= 4 && grid[y0 + dy][x0 + dx] === side)) {
                valid_remove.push([x0, y0]);
            }
        }
    }

    for (let [x, y] of valid_remove) {
        grid[y][x] = 0;
        // console.log(grid)
        opp_pos = opp_pos.filter(([px, py]) => px !== x || py !== y);
    }

    return valid_remove;
}

function vay(opp_pos) {
    for (let pos of opp_pos) {
        let move_list
        if ((pos[0] + pos[1]) % 2 === 0) {
            move_list = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [-1, 1], [1, -1]];
        } else {
            move_list = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        }
        for (let move of move_list) {
            let new_valid_x = pos[0] + move[0];
            let new_valid_y = pos[1] + move[1];
            if (new_valid_x >= 0 && new_valid_x <= 4 && new_valid_y >= 0 && new_valid_y <= 4 && grid[new_valid_y][new_valid_x] === 0) {
                return [];
            }
        }
    }

    let valid_remove = opp_pos.slice();
    // console.log(valid_remove)
    for (let [x, y] of opp_pos) {
        grid[y][x] = 0;
        // console.log(grid)
    }
    opp_pos = [];
    return valid_remove;
}

function isReady(bol) {
    const chesses = $$(".chess")
    if(bol) {
        chesses.forEach(chess => chess.classList.remove("not_ready"))
        changeTurn(".game_turn-bot", ".game_turn-player")
    } else {
        chesses.forEach(chess => chess.classList.add("not_ready"))
        changeTurn(".game_turn-player", ".game_turn-bot")
    }
    ready = bol
}

function changePos(x, y, newX, newY) {
    const chessX = Number(x)
    const chessY = Number(y)
    const boxX = Number(newX)
    const boxY = Number(newY)
    let path = grid[chessY][chessX]
    grid[chessY][chessX] = grid[boxY][boxX]
    grid[boxY][boxX] = path
}

function swap(chess, box, newPos, selected_pos) {
    let valid_remove
    cv2.clearRect(0, 0, canvas.width, canvas.height);
    moveSound.play()
    let r = [2,1.5,2,2.5,2]
    if(box) {
        cv2.beginPath();
        cv2.arc(chess.dataset.posx * (boardValue.width / 4) + radius + 2.5 * r[chess.dataset.posx], chess.dataset.posy * (boardValue.height / 4) + radius + 2.5 * r[chess.dataset.posx], radius, 0, 2 * Math.PI);
        cv2.lineWidth = 5;
        cv2.fillStyle = "#577DFF"
        cv2.fill()
        cv2.strokeStyle = "#577DFF";
        cv2.stroke();
        chess.style.left = box.offsetLeft + 10 + "px"
        chess.style.top = box.offsetTop + 10 + "px"
        chessPosition[1][chessPosition[1].findIndex(findI, [Number(chess.dataset.posx), Number(chess.dataset.posy)])] = [Number(box.dataset.posx), Number(box.dataset.posy)]
        changePos(chess.dataset.posx,chess.dataset.posy, box.dataset.posx, box.dataset.posy)
        let opp_pos = chessPosition[0]
        valid_remove = [...ganh_chet([Number(box.dataset.posx), Number(box.dataset.posy)], opp_pos, 1, -1), ...vay(opp_pos)]
        chess.dataset.posx = box.dataset.posx
        chess.dataset.posy = box.dataset.posy
    } else {
        cv2.beginPath();
        cv2.arc(chess.dataset.posx * (boardValue.width / 4) + radius + 2.5 * r[chess.dataset.posx], chess.dataset.posy * (boardValue.height / 4) + radius + 2.5 * r[chess.dataset.posx], radius, 0, 2 * Math.PI);
        cv2.lineWidth = 5;
        cv2.fillStyle = "#FC6666"
        cv2.fill()
        cv2.strokeStyle = "#FC6666";
        cv2.stroke();
        chessPosition[0][chessPosition[0].findIndex(findI, [selected_pos[1], selected_pos[0]])] = [newPos[1], newPos[0]]
        chess.style.left = newPos[1] * chessGrapX - 30 + "px"
        chess.style.top = newPos[0] * chessGrapX - 30 + "px"
        console.log(chessPosition)
        console.log(grid)
        console.log(curBoard)
        console.log("selected_pos: " + "(" + chess.dataset.posy + "," + chess.dataset.posx + ")")
        // prePos = [Number(chess.dataset.posx), Number(chess.dataset.posy)]
        console.log("new_pos: " + "(" + newPos[1] + "," + newPos[0] + ")")
        changePos(selected_pos[1], selected_pos[0], newPos[1], newPos[0])
        let opp_pos = chessPosition[1]
        valid_remove = [...ganh_chet([newPos[1], newPos[0]], opp_pos, -1, 1), ...vay(opp_pos)]
        console.log(valid_remove)
        // console.log("left: " + chess.style.left + " " + "top: " + chess.style.top)
        // console.log("left: " + chess.style.left + " " + "top: " + chess.style.top)
        chess.dataset.posx = `${newPos[1]}`
        chess.dataset.posy = `${newPos[0]}`
        console.log(chess)
        isReady(true)
    }
    if(newPos) {
        changeBoard(grid, valid_remove, selected_pos, newPos)
    } else {
        changeBoard(grid, valid_remove)
    }
}

function clearBox() {
    boxes.forEach(box => {
        box.dataset.choosable = "false"
    })
}

function getBotmove() {
    chessEnemy = $$(".chess.enemy")
    let data = {
        your_pos : [],
        your_side : -1,
        opp_pos : [],
        board : grid,
    }

    grid.forEach((row,i) => {
        row.forEach((__,j) => {
            if(grid[i][j] === 1) data.your_pos.push([j,i])
            if(grid[i][j] === -1) data.opp_pos.push([j,i])
        })
    })

    fetch("/get_pos_of_playing_chess", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
    .then(res => res.json(data))
    .then(resData => {
        const {selected_pos, new_pos} = resData
        console.log({selected_pos, new_pos})
        const selectedChess = Array.from(chessEnemy).find(e => {
            return Number(e.dataset.posx) === selected_pos[1] && Number(e.dataset.posy) === selected_pos[0]
        })
        console.log(selectedChess)
        swap(selectedChess, null, new_pos, selected_pos)
    })
}

boxes.forEach((e) => {
    e.onclick = () => {
        if(e.dataset.choosable === "true" && selectedChess) {
            isReady(false)
            swap(selectedChess, e)
            clearBox()
            getBotmove()
        }
    }
})

const chess = $$(".chess.player")

chess.forEach(e => {
    e.onclick = () => {getPos(e);cv2.clearRect(0, 0, canvas.width, canvas.height)}
});
