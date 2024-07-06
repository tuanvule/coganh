export function createBoardSimulation(root) {
    const $ = document.querySelector.bind(document)
    const $$ = document.querySelectorAll.bind(document)

    const board_img = $(".board_img")
    const canvas = $(root)
    const cv2 = canvas.getContext("2d")
    let code = $(".code").innerHTML
    let show_code = $("code")
    let board
    let opp_pos = []
    let your_pos = []
    let new_board = [
        [-1,-1,-1,-1,-1],
        [-1, 0, 0, 0,-1],
        [ 1, 0, 0, 0,-1],
        [ 1, 0, 0, 0, 1],
        [ 1, 1, 1, 1, 1]
    ]
    let fix_pos = canvas.width / 4.25
    let d1 = [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]]
    let d2 = [[0,-1], [-1,0], [0,1], [1,0]]
    let your_pos_list = $(".your_pos_list")
    // let your_pos_list = [[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[4,4],[4,3]]
    const code_rows = $$(".code_row")
    const return_value_ouput = $(".return_value_ouput")
    const random_your_pos_btn = $(".random_your_pos_btn")
    const random_board_btn = $(".random_board_btn")
    const run_btn = $(".run_btn")
    const your_pos_items = $(".your_pos_items")
    const play_pause_btn = $("#play_pause_btn")
    const duration_bar = $(".duration_bar")
    const show_data_change = $(".show_data_change")

    // let this.chosed_chess = [0,2]
    let action = $(".action ").innerHTML

    return ({
        is_finished: true,
        board_width: canvas.width,
        board_height: canvas.height,
        gap: canvas.width / 4 - canvas.width / 4 / 2.53,
        chess_radius: 15,
        valid_move: [],
        invalid_move: [],
        chosed_chess: [[0,2]],
        moves: [],
        setting_board: $(".board"),
        return_value_ouput: $(".return_value_ouput"),
        isErr: false,
        animation_index: 0,
        isPaused: false,
        run_task: [],
        action: action,
        speed: 1,
        all_move: {
            your_pos: [],
            opp_pos: []
        },
        all_valid_move: {
            your_pos: [],
            opp_pos: []
        },
        all_invalid_move: {
            your_pos: [],
            opp_pos: []
        },

        clear_variable() {
            this.valid_move = []
            this.invalid_move = []
            this.all_move = {
                your_pos: [],
                opp_pos: []
            }
            this.moves = []
            opp_pos = []
            your_pos = []
            board = []
        },

        async sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms / this.speed));
        },

        async pause() {
            while (this.isPaused) {
                await this.sleep(100);
            }
        },

        async play_one_frame(frame) {
            this.speed = 4
            let [type, vr, time] = this.run_task[frame]
            console.log([type, vr, time])
            // this.isPaused = false
            duration_bar.value = (frame / (this.run_task.length - 1)) * 100
            await this.handle_animation(type, vr, time)
            this.isPaused = true
            this.speed = 1
        },

        async play_animation() {
            this.Play()
            if(this.animation_index === 1) this.animation_index -= 1
            // console.log(this.animation_index)
            // console.log(this.moves)
            if(!this.is_finished) return
            this.is_finished = false
            // this.run_task = JSON.parse(this.action.replaceAll("9999", (this.chosed_chess[0] + this.chosed_chess[1]) % 2 === 0 ? "4" : "6"))
            while(this.animation_index < this.run_task.length) {
                let [type, vr, time] = this.run_task[this.animation_index]
                console.log([type, vr, time])
                await this.pause()
                duration_bar.value = (this.animation_index / (this.run_task.length - 1)) * 100
                if(this.valid_move.length === 0 && vr[1] === "valid_move") {
                    this.animation_index += 1
                    continue
                }
                let dem = this.animation_index
                while(dem--) {
                    if(this.run_task[dem][0] !== "hightlight" && this.run_task[dem][0] !== "RMH") {
                        await this.handle_animation(type, vr, time)
                        break
                    }
                }
                await this.handle_animation(type, vr, time)
                this.animation_index += 1
            }
            
            // for (const [type, vr, time] of run_task) {
            //     switch (type) {
            //     }
            // }
        },

        async handle_animation(type, vr, time) {
            time = time / this.speed
            switch (type) {
                case "CC":
                    await this.chosing_chess(time, this.chosed_chess)
                    break
                case "GM":
                    await this.generate_move(this.chosed_chess, time)
                    break
                case "AGM":
                    await this.generate_all_move(time)
                    break
                case "RM":
                    let [tp, v] = vr
                    await this.render_move(tp,this[v], time)
                    break
                case "ARM":
                    let [atp, av, s] = vr
                    await this.render_all_move(atp,this[av], s, time)
                    break
                case "clear":
                    await this.clear(time)
                    break
                case "hightlight":
                    let {row,type} = vr
                    await this.hightlight(row,type,time)
                    break
                case "RMH":
                    await this.clear_hightlight(time)
                    break
                case "render":
                    await this.render()
                    break
                case "return":
                    await this.handle_return(vr, time)
                    break
                default:
                    break
            }
        },

        async clear_hightlight(time) {
            return new Promise(resolve => {
                setTimeout(() => {
                    code_rows.forEach(item => {
                        item.classList.remove("run", "true", "false", "round_top", "round_bottom")
                    })
                    resolve()
                }, time)
            })
        },

        async hightlight(row,type,time) {
            return new Promise(resolve => {
                setTimeout(() => {
                    if(row.length === 1) {
                        code_rows[row[0]].classList.add("round_top", "round_bottom")
                    } else {
                        code_rows[row[0]].classList.add("round_top")
                        code_rows[row[row.length-1]].classList.add("round_bottom")
                    }
                    row.forEach(item => {
                        code_rows[item].classList.add(type)
                    })
                    resolve()
                }, time)
            })
        },

        async clear(time) {
            return new Promise(resolve => {
                setTimeout(() => {
                    cv2.clearRect(0,0,this.board_width,this.board_height)
                    this.render()
                    resolve()
                }, time)
            })
        },

        async chosing_chess(time, pos) {
            for(let [x,y] of pos) {
                await this.sleep(time)
                cv2.beginPath();
                cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius, 0, 2 * Math.PI)
                cv2.lineWidth = 5;
                cv2.strokeStyle = "blue";
                cv2.stroke();
            }
            // pos.forEach((([x,y]) => {
            // }))
        },

        async generate_move([x,y], time) {
            return new Promise(resolve => {
                setTimeout(() => {
                    this.clear_hightlight(0)
                    this.chosed_chess = [[x,y]]
                    this.chosing_chess(0, this.chosed_chess)
                    this.moves = []
                    let d = (x+y)%2==0 ? d1 : d2
                    opp_pos = JSON.stringify(opp_pos)
                    your_pos = JSON.stringify(your_pos)
                    d.forEach(([mx,my]) => {
                        let newX = x + mx
                        let newY = y + my
                        if(newX >= 0 && newX <= 4 && newY >= 0 && newY <= 4 && !opp_pos.includes(`${[newX, newY]}`) && !your_pos.includes(`${[newX,newY]}`)) {
                            this.valid_move.push([newX,newY])
                        } else {
                            this.invalid_move.push([newX,newY])
                        }
                    })
                    opp_pos = JSON.parse(opp_pos)
                    your_pos = JSON.parse(your_pos)
                    this.moves = [...this.valid_move, ...this.invalid_move]
                    console.log("GM")
                    resolve()
                }, time)
            })
        },

        async render_all_move(type, moves, side, time) {
            await this.sleep(time)
            await (async () => {
                switch(type) {
                    case "valid":
                        moves[side].forEach(([x,y]) => {
                            cv2.beginPath();
                            cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                            cv2.fillStyle = "green"
                            cv2.fill()
                        })
                        break
                    case "invalid":
                        moves[side].forEach(([x,y]) => {
                            cv2.beginPath();
                            cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                            cv2.fillStyle = "rgba(255, 0, 0, 0.4)"
                            cv2.fill()
                        })
                        break
                    default:
                        moves.forEach(([x,y]) => {
                            cv2.beginPath();
                            cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                            cv2.fillStyle = "#666"
                            cv2.fill()
                        })
                        break
                }
            })()
        },

        async generate_all_move(time) {
            return new Promise(resolve => {
                setTimeout(() => {
                    this.clear_hightlight(0)
                    this.all_move = {
                        your_pos: [],
                        opp_pos: []
                    }
                    your_pos.forEach(([x,y]) => {
                        let d = (x+y)%2==0 ? d1 : d2
                        let v_move = []
                        let iv_move = []
                        d.forEach(([mx,my]) => {
                            let newX = x + mx
                            let newY = y + my
                            if(newX >= 0 && newX <= 4 && newY >= 0 && newY <= 4 && !opp_pos.includes(`${[newX, newY]}`) && !your_pos.includes(`${[newX,newY]}`) && new_board[newX][newY] === 0) {
                                this.all_valid_move.your_pos.push([newX,newY])
                                v_move.push([newX,newY])
                            } else {
                                this.all_invalid_move.your_pos.push([newX,newY])
                                iv_move.push([newX,newY])
                            }
                        })
                        this.all_move[`[${[x,y]}]`] = [...v_move,...iv_move]
                    })

                    opp_pos.forEach(([x,y]) => {
                        let d = (x+y)%2==0 ? d1 : d2
                        let v_move = []
                        let iv_move = []
                        d.forEach(([mx,my]) => {
                            let newX = x + mx
                            let newY = y + my
                            if(newX >= 0 && newX <= 4 && newY >= 0 && newY <= 4 && !opp_pos.includes(`${[newX, newY]}`) && !your_pos.includes(`${[newX,newY]}`) && new_board[newX][newY] === 0) {
                                this.all_valid_move.opp_pos.push([newX,newY])
                                v_move.push([newX,newY])
                            } else {
                                this.all_invalid_move.opp_pos.push([newX,newY])
                                iv_move.push([newX,newY])
                            }
                        })
                        this.all_move[`[${[x,y]}]`] = [...v_move,...iv_move]
                    })
                    this.all_invalid_move = {
                        your_pos: [...new Set(this.all_invalid_move.your_pos)],
                        opp_pos: [...new Set(this.all_invalid_move.opp_pos)]
                    }
                    this.all_valid_move = {
                        your_pos: [...new Set(this.all_valid_move.your_pos)],
                        opp_pos: [...new Set(this.all_valid_move.opp_pos)]
                    }
                    // this.all_valid_move = [...new Set([...new Set(this.all_valid_move.your_pos),...new Set(this.all_valid_move.opp_pos)])]
                    resolve()
                }, time)
            })
        },

        async render_move(type, moves, time) {
            return new Promise(resolve => {
                setTimeout(() => {
                    switch(type) {
                        case "valid":
                            moves.forEach(([x,y]) => {
                                cv2.beginPath();
                                cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                                cv2.fillStyle = "green"
                                cv2.fill()
                            })
                            break
                        case "invalid":
                            moves.forEach(([x,y]) => {
                                cv2.beginPath();
                                cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                                cv2.fillStyle = "rgba(255, 0, 0, 0.4)"
                                cv2.fill()
                            })
                            break
                        default:
                            moves.forEach(([x,y]) => {
                                cv2.beginPath();
                                cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                                cv2.fillStyle = "#666"
                                cv2.fill()
                            })
                            break
                    }
                    resolve()
                }, time)
            })
        },

        async render() {
            cv2.drawImage(board_img, 0, 0, this.board_width, this.board_height)
            opp_pos.forEach(([x,y]) => {
                cv2.beginPath();
                cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius, 0, 2 * Math.PI)
                cv2.fillStyle = "red"
                cv2.fill()
            })
            your_pos.forEach(([x,y]) => {
                cv2.beginPath();
                cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius, 0, 2 * Math.PI)
                cv2.fillStyle = "#007BFF"
                cv2.fill()
            })
            // this.render_move()
        },
        
        async handle_return(type, time) {
            return new Promise(resolve => {
                setTimeout(() => {
                    switch(type) {
                        case "valid_move":
                            // this.return_value_ouput.innerHTML = JSON.stringify(this.valid_move)
                            // this.return_value_ouput.style.display = "block"
                            show_data_change.innerHTML = "Các nước đi hợp lệ: " + JSON.stringify(this.valid_move)
                            console.log(this.valid_move)
                        break
                        default:
                            console.log(this.valid_move)
                            break
                    }
                    this.is_finished = true
                }, time)
            })
        },

        reset_event() {
            const your_pos_item = $$(".your_pos_item")
            your_pos_item.forEach(item => {
                item.onclick = () => {
                    your_pos_item.forEach(i => i.classList.remove("selected"))
                    item.classList.add("selected")
                    this.chosed_chess = [[Number(item.dataset.x),Number(item.dataset.y)]]
                    this.Pause()
                    this.start(new_board)
                    this.choose_chess(this.chosed_chess)
                }
            })
        },

        random_board() {
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
            this.start(new_board)
            return new_board
        },

        choose_chess(pos) {
            show_code.innerHTML = `${code.replace("quan_co_ban_chon", `(${pos[0][0], pos[0][1]})`)}`
            this.render()
            this.chosing_chess(0,pos)
        },
        
        handle_event() {
            random_your_pos_btn.onclick = () => {
                let ran = Math.round(Math.random() * (your_pos.length-1))
                your_pos_items = $$(".your_pos_item")
                your_pos_items.forEach(i => i.classList.remove("selected"))
                this.chosed_chess = [[Number(your_pos_items[ran].dataset.x),Number(your_pos_items[ran].dataset.y)]]
                your_pos_items[ran].classList.add("selected")
                // this.action.replace("quan_co_ban_chon", `${this.chosed_chess}`.replace("[", "(").replace("]", ")"))
                this.choose_chess(this.chosed_chess)
                new_board = JSON.parse(`[${this.setting_board.innerHTML.replaceAll("\n",",")}]`.replaceAll("],]","]]"))
                this.start(new_board)
            }

            random_board_btn.onclick = () => {
                this.setting_board.innerHTML = ""
                this.random_board().forEach(row => {
                    let str = `[${row}]\n`.replaceAll("1", " 1").replaceAll("0", " 0").replaceAll("- 1", "-1")
                    this.setting_board.innerHTML += str
                })
                try {
                    new_board = JSON.parse(`[${this.setting_board.innerHTML.replaceAll("\n",",")}]`.replaceAll("],]","]]"))
                    this.setting_board.style.border = "1px solid #007BFF"
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
                    this.isErr = false
                    const fist = $(".your_pos_item")
                    fist.classList.add("selected")
                    this.chosed_chess = [[Number(fist.dataset.x),Number(fist.dataset.y)]]
                    this.reset_event()
                    this.start(new_board)
                } catch (error) {
                    console.log(error)
                    this.isErr = true
                    this.setting_board.style.border = "1px solid red"
                }
                // console.log(this.setting_board.innerHTML.replaceAll("\n",","))
            }

            this.setting_board.oninput = () => {
                try {
                    new_board = JSON.parse(`[${this.setting_board.innerHTML.replaceAll("\n",",")}]`.replaceAll("],]","]]"))
                    this.setting_board.style.border = "1px solid #007BFF"
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
                    this.isErr = false
                    const fist = $(".your_pos_item")
                    fist.classList.add("selected")
                    this.chosed_chess = [[Number(fist.dataset.x),Number(fist.dataset.y)]]
                    this.start(new_board)
                } catch (error) {
                    console.log(error)
                    this.setting_board.style.border = "1px solid red"
                    this.isErr = true
                }
            }
            this.reset_event()
        },

        Play() {
            this.isPaused = false
            play_pause_btn.checked = false
        },

        Pause() {
            this.isPaused = true
            play_pause_btn.checked = true
        },

        async start(boardMatrix = new_board) {
            this.clear_variable()
            this.generate_move(this.chosed_chess[0])
            duration_bar.value = 0
            this.animation_index = 0
            board = boardMatrix
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    if(boardMatrix[i][j] === 1) {
                        your_pos.push([j,i])
                    } else if(boardMatrix[i][j] === -1) {
                        opp_pos.push([j,i])
                    }
                }
            }
            this.clear_hightlight(0)
            this.handle_event()
            cv2.clearRect(0,0,this.board_width,this.board_height)
            await this.render()
        }
    })
}