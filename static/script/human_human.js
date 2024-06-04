const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const room_id = localStorage.getItem("room_id")
const username = localStorage.getItem("user")

const room_info = $(".overflow")
const room_info_title = $(".room_info-title")
const user_avatar = $(".room_title-you .avatar")
const opponent_avatar = $(".room_title-opp .avatar")
const opp_block = $(".room_title-opp")
const P2_loading = $(".room_title-loading")

let isPlaying = false

if(username === room_id) {
    user_avatar.innerHTML = username[0].toUpperCase()
} else {
    $(".img_item.default img").src = "../static/img/chessboard2.png"
    user_avatar.innerHTML = room_id[0].toUpperCase()
}

const socket = io('http://127.0.0.1:5000/', {
    allowRequest: (req, callback) => {
        const noOriginHeader = req.headers.origin === undefined;
        callback(null, noOriginHeader);
    },
    withCredentials: true,
    extraHeaders: {
        "origin": "http://127.0.0.1:5000/"
    },
    serveClient: true,
    transports : ['websocket'],
    rejectUnauthorized: true,
    closeOnBeforeunload: false
})

const accept_btn = $(".accept_btn")
const reject_btn = $(".reject_btn")
const menu_btn = $(".menu_btn")
const warning = $(".warning")
const sign = $(".sign")
const ok_btn = $(".ok_btn")

const rate_btn = $(".rate_btn")
const rate = $(".rate")
const ske_loading = $(".ske_loading")

let move_list = []

let img_data = {
    username: username,
    side: room_id === username ? 1 : -1,
    img: [],
}

let rateModel

let board = $(".board")
let boardValue = board.getBoundingClientRect()
let chessGrapX = boardValue.width / 4
let chessGrapY = boardValue.height / 4
let ready = true
let d1 = [[1,0],[0,1],[0,-1],[-1,0]]
let d2 = [[1,0],[0,1],[0,-1],[-1,0],[-1,-1],[-1,1],[1,1],[1,-1]]
let radius = 16
let canvas = $("canvas")
canvas.style.left = board.offsetLeft - radius - 5 + "px"
canvas.style.top = board.offsetTop - radius - 5 + "px"
canvas.width = boardValue.width + 2 * radius + 10
canvas.height = boardValue.height + 2 * radius + 10
let cv2 = canvas.getContext("2d")
let rs = 1
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
let dem

if(room_id !== username) {
    isReady(false)
}

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

function resetBoard() {
    board = $(".board")
    boardValue = board.getBoundingClientRect()
    chessGrapX = boardValue.width / 4
    chessGrapY = boardValue.height / 4
    canvas = $("canvas")
    canvas.style.left = board.offsetLeft - radius - 5 + "px"
    canvas.style.top = board.offsetTop - radius - 5 + "px"
    canvas.width = boardValue.width + 2 * radius + 10
    canvas.height = boardValue.height + 2 * radius + 10
    cv2 = canvas.getContext("2d")
    board.innerHTML = gridHTML
    dem = 0
    for(let i = 0; i < grid.length; i++) {
        for(let j = 0; j < grid[i].length; j++) {
            board.innerHTML += `<div data-choosable="false" data-posx="${j}" data-posy="${i}" class="box" style="top:${chessGrapY*i - 40 * rs}px; left:${chessGrapX*j - 40 * rs}px;"></div>`
            if(username === room_id) {
                if(grid[i][j] === -1) {
                    board.innerHTML += `<div data-so="${dem}" data-posx="${j}" data-posy="${i}" style="background-color: red; top:${chessGrapY*i - 30 * rs}px; left:${chessGrapX*j - 30 * rs}px;" class="chess enemy"></div>`
                } else if(grid[i][j] === 1) {
                    board.innerHTML += `<div data-so="${dem}" data-posx="${j}" data-posy="${i}" style="background-color: blue; top:${chessGrapY*i - 30 * rs}px; left:${chessGrapX*j - 30 * rs}px;" class="chess player"></div>`
                }
            } else {
                if(grid[i][j] === -1) {
                    board.innerHTML += `<div data-so="${dem}" data-posx="${j}" data-posy="${i}" style="background-color: blue; top:${chessGrapY*i - 30 * rs}px; left:${chessGrapX*j - 30 * rs}px;" class="chess enemy"></div>`
                } else if(grid[i][j] === 1) {
                    board.innerHTML += `<div data-so="${dem}" data-posx="${j}" data-posy="${i}" style="background-color: red; top:${chessGrapY*i - 30 * rs}px; left:${chessGrapX*j - 30 * rs}px;" class="chess player"></div>`
                }
            }
            dem++
        }
    }
}

resetBoard()

socket.on('connect', () => {
    
    if(username !== room_id) {
        $(".game_turn-bot").classList.add("game_turn-bot_reverse")
        $(".game_turn-player").classList.add("game_turn-player_reverse")
    }

    socket.emit("join_room", room_id, username === room_id ? "ready_P1": "ready_P2", 1, {
        username: username,
    })
    
    socket.on(`check_user_${username}`, (data) => {
        console.log('room: ', data);
    });

    socket.on(`join_room_${room_id}`, (data) => {
        const {type, user_info} = data
        console.log(type)
        if(type === "ready_P2") {
            P2_loading.style.display = "none"
            opp_block.style.display = "block"
            room_info_title.innerHTML = "Tìm thấy đối thủ"
            setTimeout(() => {
                room_info_title.innerHTML = "Bắt đầu ván đấu"
            }, 1500)
            setTimeout(() => {
                room_info.style.display = "none"
                isPlaying = true
            }, 1000)

            opponent_avatar.innerHTML = user_info.username[0].toUpperCase()
        }
    });
    
    socket.on(`get_move_${room_id}`, (data) => {
        console.log('room: ', data);
        const chessAll = $$(".chess")
        let {selected_pos, new_pos, turn} = data
        
        if(turn !== username) {
            console.log({selected_pos, new_pos})
            new_pos = [Math.abs(new_pos[0] - 4), Math.abs(new_pos[1] - 4)]
            selected_pos = [Math.abs(selected_pos[0] - 4), Math.abs(selected_pos[1] - 4)]
            const selectedChess = Array.from(chessAll).find(e => {
                return Number(e.dataset.posy) === selected_pos[1] && Number(e.dataset.posx) === selected_pos[0]
            })
            
            swap(selectedChess, null, new_pos, selected_pos)
        }
    });

    socket.on(`player_2_connected_${room_id}`, () => {
        // playable.style.display
    });

    socket.on(`out_room_${room_id}`, () => {
        sign.style.display = "flex"
        gameStatus.innerHTML = "You Win"
        gameStatus.style.backgroundColor = "green"
        gameStatus.style.display = "block"
        gameStatus.style.opacity = "1";
        rate_btn.style.display = "block"
    });
});

window.addEventListener('beforeunload', (e) => {
    e.returnValue = `Nếu thoát khỏi đây thì bạn sẽ bị xử thua. Bạn chắc chứ?`;
    e.preventDefault()
});

window.addEventListener('unload', function () {
    const data = JSON.stringify({ 
        room_id: room_id,
        type: username === room_id ? "ready_P1": "ready_P2",
        state: 0,
    });
    navigator.sendBeacon('/out_room', data);
});

// accept_btn.onclick = () => {
//     // socket.emit("out_room", room_id, username === room_id ? "ready_P1": "ready_P2", 0)
//     // window.location.href = "http://127.0.0.1:5000/room_manager"
// }

// reject_btn.onclick = () => {
//     warning.style.display = "none"
// }

ok_btn.onclick = () => {
    sign.style.display = "none"
}

menu_btn.onclick = () => {
    // warning.style.display = "flex"
}

rate_btn.onclick = () => {
    rate.classList.toggle("appear")
    rate_btn.classList.toggle("active")
    console.log({move_list: move_list,img_data: img_data})
    console.log(img_data)
    if(rateModel) return
    fetch("/get_rate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({move_list: move_list,img_data: img_data})
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        const img_list = JSON.parse(data.img_url)
        let rating = []
        img_list.forEach((url, i) => {
            rating.push({
                type: data.rate[i],
                move: {
                    sellected_pos: `(${move_list[i].move.selected_pos[0]}, ${move_list[i].move.selected_pos[1]})`,
                    new_pos: `(${move_list[i].move.new_pos[0]}, ${move_list[i].move.new_pos[1]})`,
                },
                img_url: url,
            })
        })
        rateModel = createRateModel(".rate", rating)
        rateModel.start(room_id === username ? 1 : -1)
    })
}

let boxes = $$(".box")

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

function changeBoard(newBoard, valid_remove, selected_pos, new_pos, side) {
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
                        console.log("changedChess: ",changedChess)
                        chessPosition.forEach((es,index) => es.forEach((e, indx)=> {
                            if(es.findIndex(findI, [j,i]) !== -1) {
                                chessPosition[index].splice(es.findIndex(findI, [j,i]),1)
                            }
                        }))
                        captureSound.play()
                        fireSound.play()
                        const fire = document.createElement("img")
                        fire.setAttribute("src", "./static/img/fire.webp")
                        fire.setAttribute("style", `top:${chessGrapY*i - 30 * rs}px; left:${chessGrapX*j - 30 * rs}px;`)
                        fire.setAttribute("class", "fire")
                        let newFire = board.appendChild(fire)
                        console.log("removeChess: " + "(" + j + ",", + i + ")")
                        newFire.onanimationend = (e) => {
                            changedChess.remove()
                        }
                    }
                }
            }
            curBoard[i][j] = newBoard[i][j];
        }
    }

    img_data.img.push([[[], [...chessPosition[1]], [...chessPosition[0]]], {selected_pos, new_pos: side === 1 ? new_pos : [new_pos[1], new_pos[0]]}, valid_remove])

    if(chessPosition[0].length === 0) {
        gameStatus.innerHTML = "You Win"
        gameStatus.style.backgroundColor = "green"
        gameStatus.style.display = "block"
        gameStatus.style.opacity = "1";
        rate_btn.style.display = "block"
    } else if(chessPosition[1].length === 0) {
        gameStatus.innerHTML = "You lost"
        gameStatus.style.backgroundColor = "red"
        gameStatus.style.opacity = "1";
        rate_btn.style.display = "block"
    } else if(chessPosition[0].length === 1 && chessPosition[1].length === 1) {
        gameStatus.innerHTML = "draw"
        gameStatus.style.backgroundColor = "#ccc"
        gameStatus.style.display = "block"
        gameStatus.style.opacity = "1";
        rate_btn.style.display = "block"
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
    for (let [x, y] of opp_pos) {
        grid[y][x] = 0;
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
    let side = 1
    cv2.clearRect(0, 0, canvas.width, canvas.height);
    moveSound.play()
    let r = [2,1.5,2,2.5,2]
    if(box) {
        cv2.beginPath();
        cv2.arc(chess.dataset.posx * (boardValue.width / 4) + radius + 2.5 * r[chess.dataset.posx], chess.dataset.posy * (boardValue.height / 4) + radius + 2.5 * r[chess.dataset.posx], radius, 0, 2 * Math.PI);
        cv2.lineWidth = 5;
        cv2.fillStyle = username === room_id ? "#577DFF" : "#FC6666"
        cv2.fill()
        cv2.strokeStyle = username === room_id ? "#577DFF" : "#FC6666"
        cv2.stroke();
        chess.style.left = box.offsetLeft + 10 * rs + "px"
        chess.style.top = box.offsetTop + 10 * rs + "px"
        
        newPos = [Number(box.dataset.posx), Number(box.dataset.posy)]
        selected_pos = [Number(chess.dataset.posx),Number(chess.dataset.posy)]

        let opp_pos = chessPosition[0]
        console.log(grid)
        valid_remove = [...ganh_chet([Number(box.dataset.posx), Number(box.dataset.posy)], opp_pos, 1, -1), ...vay(opp_pos)]
        move_list.push({
            your_pos: [...chessPosition[1]],
            opp_pos: [...chessPosition[0]],
            board: curBoard.map(row => row.map(item => item)),
            side: 1,
            remove: valid_remove,
            move: {
                selected_pos: selected_pos,
                new_pos: newPos,
            }
        })

        side = 1

        chessPosition[1][chessPosition[1].findIndex(findI, [Number(chess.dataset.posx), Number(chess.dataset.posy)])] = [Number(box.dataset.posx), Number(box.dataset.posy)]
        changePos(chess.dataset.posx,chess.dataset.posy, box.dataset.posx, box.dataset.posy)
        chess.dataset.posx = box.dataset.posx
        chess.dataset.posy = box.dataset.posy
    } else {
        cv2.beginPath();
        cv2.arc(chess.dataset.posx * (boardValue.width / 4) + radius + 2.5 * r[chess.dataset.posx], chess.dataset.posy * (boardValue.height / 4) + radius + 2.5 * r[chess.dataset.posx], radius, 0, 2 * Math.PI);
        cv2.lineWidth = 5;
        cv2.fillStyle = username === room_id ? "#FC6666" : "#577DFF"
        cv2.fill()
        cv2.strokeStyle = username === room_id ? "#FC6666" : "#577DFF"
        cv2.stroke();
        chess.style.left = newPos[1] * chessGrapX - 30 * rs + "px"
        chess.style.top = newPos[0] * chessGrapX - 30 * rs + "px"
        
        let opp_pos = chessPosition[1]
        valid_remove = [...ganh_chet([newPos[1], newPos[0]], opp_pos, -1, 1), ...vay(opp_pos)]
        move_list.push({
            your_pos: [...chessPosition[1]],
            opp_pos: [...chessPosition[0]],
            board: curBoard.map(row => row.map(item => item)),
            side: -1,
            remove: valid_remove,
            move: {
                selected_pos: selected_pos,
                new_pos: [newPos[1],newPos[0]],
            }
        })

        side = -1
        
        chessPosition[0][chessPosition[0].findIndex(findI, [selected_pos[0], selected_pos[1]])] = [newPos[1], newPos[0]]
        changePos(selected_pos[0], selected_pos[1], newPos[1], newPos[0])
        console.log(valid_remove)
        chess.dataset.posx = `${newPos[1]}`
        chess.dataset.posy = `${newPos[0]}`
        isReady(true)
    }
    changeBoard(grid, valid_remove, selected_pos, newPos, side)
    console.log(grid)
}

function clearBox() {
    boxes.forEach(box => {
        box.dataset.choosable = "false"
    })
}

function sendMove(selected_pos, new_pos) {
    if(chessPosition[0].length <= 0) return
    const selectX = Number(selected_pos.dataset.posx)
    const selectY = Number(selected_pos.dataset.posy)
    const newX = Number(new_pos.dataset.posx)
    const newY = Number(new_pos.dataset.posy)
    // move_list.push({
    //     selected_pos: [selectX,selectY], 
    //     new_pos: [newY,newX],
    //     turn: username,
    // })
    socket.emit(`get_move`, room_id, {
        selected_pos: [selectX,selectY], 
        new_pos: [newY,newX],
        turn: username,
    })
}

boxes.forEach((e) => {
    e.onclick = () => {
        if(e.dataset.choosable === "true" && selectedChess) {
            isReady(false)
            sendMove(selectedChess, e)
            swap(selectedChess, e)
            clearBox()
        }
    }
    e.ontouchend = () => {
        if(e.dataset.choosable === "true" && selectedChess) {
            isReady(false)
            sendMove(selectedChess, e)
            swap(selectedChess, e)
            clearBox()
        }
    }
})

const chess = $$(".chess.player")

chess.forEach(e => {
    e.onclick = () => {getPos(e);cv2.clearRect(0, 0, canvas.width, canvas.height)}
    e.ontouchend = () => {getPos(e);cv2.clearRect(0, 0, canvas.width, canvas.height);console.log("touch")}
});

window.addEventListener('resize', function(event) {
    // console.log(event)
    if(window.outerWidth <= 500) {
        rs = 0.5
        radius = radius / 2
    } else {
        rs = 1
        radius = radius * 2
    }
    resetBoard()
    boxes = $$(".box")
    console.log("resize")
    boxes.forEach((e) => {
        e.onclick = () => {
            if(e.dataset.choosable === "true" && selectedChess) {
                isReady(false)
                sendMove(selectedChess, e)
                swap(selectedChess, e)
                clearBox()
            }
        }
        e.ontouchend = () => {
            if(e.dataset.choosable === "true" && selectedChess) {
                isReady(false)
                sendMove(selectedChess, e)
                swap(selectedChess, e)
                clearBox()
            }
        }
    })
    
    const chess = $$(".chess.player")
    
    chess.forEach(e => {
        e.onclick = () => {getPos(e);cv2.clearRect(0, 0, canvas.width, canvas.height)}
        e.ontouchend = () => {getPos(e);cv2.clearRect(0, 0, canvas.width, canvas.height);console.log("touch")}
    });
}, true);

window.addEventListener("load", (event) => {
    if(isPlaying) {
        room_info.style.display = "none"
    }
    if(window.outerWidth <= 500) {
        rs = 0.5
        radius = 8
    } else {
        rs = 1
        radius = 16
    }
    resetBoard()
    boxes = $$(".box")
    console.log("reload")
    boxes.forEach((e) => {
        e.onclick = () => {
            if(e.dataset.choosable === "true" && selectedChess) {
                isReady(false)
                sendMove(selectedChess, e)
                swap(selectedChess, e)
                clearBox()
            }
        }
        e.ontouchend = () => {
            if(e.dataset.choosable === "true" && selectedChess) {
                isReady(false)
                sendMove(selectedChess, e)
                swap(selectedChess, e)
                clearBox()
            }
        }
    })
    
    const chess = $$(".chess.player")
    
    chess.forEach(e => {
        e.onclick = () => {getPos(e);cv2.clearRect(0, 0, canvas.width, canvas.height)}
        e.ontouchend = () => {getPos(e);cv2.clearRect(0, 0, canvas.width, canvas.height);console.log("touch")}
    });
  });