import { createSimulation } from "./simulation_model.js";

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const random_board_btn = $(".random_board_btn")
const random_your_pos_btn = $(".random_your_pos_btn")
const board = $(".board")
const your_pos_list = $(".your_pos_list")
const run_btn = $(".run_btn")
const return_value_ouput = document.querySelector(".return_value_ouput")
let your_pos_items = $$(".your_pos_item")

const code_row = $$(".code_row")
let new_board = [
    [-1,-1,-1,-1,-1],
    [-1, 0, 0, 0,-1],
    [ 1, 0, 0, 0,-1],
    [ 1, 0, 0, 0, 1],
    [ 1, 1, 1, 1, 1]
]
let opp_pos = []
let your_pos = [[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[4,4],[4,3]]
let isErr = false
let selected_chess = [0,2]

random_your_pos_btn.onclick = () => {
    let ran = Math.round(Math.random() * (your_pos.length-1))
    console.log(ran)
    your_pos_items = $$(".your_pos_item")
    your_pos_items.forEach(i => i.classList.remove("selected"))
    selected_chess = [Number(your_pos_items[ran].dataset.x),Number(your_pos_items[ran].dataset.y)]
    your_pos_items[ran].classList.add("selected")
    choose_chess(selected_chess)
}

random_board_btn.onclick = () => {
    board.innerHTML = ""
    random_board().forEach(row => {
        let str = `[${row}]\n`.replaceAll("1", " 1").replaceAll("0", " 0").replaceAll("- 1", "-1")
        board.innerHTML += str
    })
    try {
        new_board = JSON.parse(`[${board.innerHTML.replaceAll("\n",",")}]`.replaceAll("],]","]]"))
        board.style.border = "1px solid #007BFF"
        your_pos_list.innerHTML = ""
        for(let i = 0; i <= 4; i++) {
            for(let j = 0; j <= 4; j++) {
                if(new_board[i][j] === 1) {
                    your_pos_list.innerHTML += `
                        <div data-x="${j}" data-y="${i}" class="your_pos_item">(${[j,i]})</div>
                    `
                }
            }
        }
        isErr = false
        const fist = $(".your_pos_item")
        fist.classList.add("selected")
        selected_chess = [Number(fist.dataset.x),Number(fist.dataset.y)]
        console.log(selected_chess = [Number(fist.dataset.x),Number(fist.dataset.y)])
        reset_event()
    } catch (error) {
        console.log(error)
        isErr = true
        board.style.border = "1px solid red"
    }
}

board.oninput = () => {
    try {
        new_board = JSON.parse(`[${board.innerHTML.replaceAll("\n",",")}]`)
        board.style.border = "1px solid #007BFF"
        your_pos_list.innerHTML = ""
        for(let i = 0; i <= 4; i++) {
            for(let j = 0; j <= 4; j++) {
                if(new_board[i][j] === 1) {
                    your_pos_list.innerHTML += `
                        <div data-x="${j}" data-y="${i}" class="your_pos_item">(${[j,i]})</div>
                    `
                }
            }
        }
        isErr = false
        const fist = $(".your_pos_item")
        fist.classList.add("selected")
        selected_chess = [Number(fist.dataset.x),Number(fist.dataset.y)]
        console.log(selected_chess = [Number(fist.dataset.x),Number(fist.dataset.y)])
        reset_event()
        simulation.start(new_board)
    } catch (error) {
        console.log(error)

        board.style.border = "1px solid red"
        isErr = true
    }
}

function random_board() {
    const d = [-1,0,1]
    const c = [0,0,0]
    your_pos = []
    for(let i = 0; i <= 4; i++) {
        for(let j = 0; j <= 4; j++) {
            let ran = Math.round(Math.random() * 2)
            if(c[ran] >= 8) {
                new_board[i][j] = 0
                continue
            }
            new_board[i][j] = d[ran]
            c[ran]++
            if(d[ran] === 1) {
                your_pos.push([j,i])
            } else if(d[ran] === -1) {
                opp_pos.push([j,i])
            }
        }
    }
    simulation.start(new_board)
    return new_board
}

function reset_event() {
    const your_pos_item = $$(".your_pos_item")
    your_pos_item.forEach(item => {
        item.onclick = () => {
            your_pos_item.forEach(i => i.classList.remove("selected"))
            selected_chess = [Number(item.dataset.x),Number(item.dataset.y)]
            item.classList.add("selected")
            console.log(selected_chess)
            choose_chess(selected_chess)
        }
    })
}

reset_event()


function choose_chess([x,y]) {
    simulation.render()
    simulation.chosing_chess(0,[x,y])
}

const simulation = createSimulation("canvas")
simulation.start(new_board)
choose_chess(selected_chess)

// let [x,y] = your_pos[Math.round(Math.random() * (your_pos.length - 1))]

run_btn.onclick = () => {
    if(isErr) {
        board.style.animation = "none"
        setTimeout(() => {
            board.style.animation = "horizontal-shaking .1s linear"
        }, 10);
        return
    }
    if(simulation.is_finished) {
        return_value_ouput.style.display = "none"
        let [x,y] = selected_chess
        simulation.start(new_board)
        simulation.chosed_chess = selected_chess
        simulation.action().check_valid_move([
            ["GM", "", 1000],
            ["hightlight", {
                row: [code_row[2]],
                type: "run"
            }, 0],
            ["RMH", "", 1000],
            ["RM", ["", "moves"], 1000],
            ["hightlight", {
                row: [code_row[3],code_row[4],code_row[5],code_row[6]],
                type: "run"
            }, 0],
            ["hightlight", {
                row: [(x+y)%2==0 ? code_row[4] : code_row[6]],
                type: "true"
            }, 0],
            ["RMH", "", 1000],
            ["hightlight", {
                row: [code_row[8],code_row[9],code_row[10],code_row[11],code_row[12]],
                type: "run"
            }, 1000],
            ["hightlight", {
                row: [code_row[8],code_row[9],code_row[10],code_row[11],code_row[12]],
                type: "false"
            }, 1000],
            ["RM", ["invalid", "invalid_move"], 0],
            ["RMH", "", 1000],
            ["render", "", 0],
            ["CC", "", 0],
            ["RM", ["", "valid_move"], 0],
            ["hightlight", {
                row: [code_row[8],code_row[9],code_row[10],code_row[11],code_row[12]],
                type: "run"
            }, 1000],
            ["hightlight", {
                row: [code_row[8],code_row[9],code_row[10],code_row[11],code_row[12]],
                type: "true"
            }, 1000],
            ["RM", ["valid", "valid_move"], 0],
            ["RMH", "", 1000],
            ["hightlight", {
                row: [code_row[13]],
                type: "true"
            }, 0],
            ["RMH", "", 1000],
            ["hightlight", {
                row: [code_row[14]],
                type: "true"
            }, 0],
            ["return", "valid_move", 1000],
        ])
    }
}

