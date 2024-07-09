export function createBoardSimulation(root) {
    const $ = document.querySelector.bind(document)
    const $$ = document.querySelectorAll.bind(document)

    const board_img = $(".board_img")
    const fire_img = $(".fire_img")
    const fire_sound = $(".fire_sound")
    const canvas = $(root)
    const cv2 = canvas.getContext("2d")
    let code = $(".code").innerHTML
    let show_code = $("code")
    let board = [
        [-1,-1,-1,-1,-1],
        [-1, 0, 0, 0,-1],
        [ 1, 0, 0, 0,-1],
        [ 1, 0, 0, 0, 1],
        [ 1, 1, 1, 1, 1]
    ]
    
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
    let your_pos_items = $$(".your_pos_items")
    const play_pause_btn = $("#play_pause_btn")
    const duration_bar = $(".duration_bar")
    const show_data_change = $(".show_data_change")

    const your_chess_list = $(".your_chess_list")

    const simulation_name = $(".simulation_name").innerHTML

    // let this.chosed_chess = [0,2]
    let action = $(".action ").innerHTML

    return ({
        is_finished: true,
        board_width: canvas.width,
        board_height: canvas.height,
        gap: canvas.width / 4 - canvas.width / 4 / 2.53,
        chess_radius: 15,
        opp_pos: [],
        your_pos: [],
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
        is_single_chess: false,
        isFlaskBack: false,
        selected_pos: [0,2],
        new_pos: [],
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
        valid_move_for_single_chess: {
            your_pos: {},
            opp_pos: {}
        },
        invalid_move_for_single_chess: {
            your_pos: {},
            opp_pos: {}
        },
        config_run_task: () => {},

        clear_variable() {
            this.valid_move = []
            this.invalid_move = []
            this.all_move = {
                your_pos: [],
                opp_pos: []
            }
            this.valid_move_for_single_chess= {
                your_pos: {},
                opp_pos: {}
            }
            this.invalid_move_for_single_chess= {
                your_pos: {},
                opp_pos: {}
            }
            this.all_valid_move = {
                your_pos: [],
                opp_pos: []
            }
            this.all_invalid_move = {
                your_pos: [],
                opp_pos: []
            }
            // this.chosed_chess = []
            this.moves = []
            this.opp_pos = []
            this.your_pos = []
            board = []
        },

        async sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms / this.speed));
        },

        async pause() {
            while (this.isPaused && !this.isFlaskBack) {
                await this.sleep(100);
                // console.log(this.isPaused)
            }
        },

        async play_one_frame(frame) {
            this.speed = 4
            let [type, vr, time] = this.run_task[frame]
            // this.isPaused = false
            await this.render()
            let dem = this.animation_index + 1
            this.isFlaskBack = true
            while(dem-- && simulation_name !== "valid_move") {
                let [type, vr, time] = this.run_task[dem]
                if(this.run_task[dem][0] !== "hightlight" && this.run_task[dem][0] !== "RMH" && this.run_task[dem][0] !== "MC" && this.run_task[dem][0] !== "render") {
                    // console.log(hello)
                    await this.handle_animation(type, vr, 0)
                }
            }
            this.isFlaskBack = false
            duration_bar.value = (frame / (this.run_task.length - 1)) * 100
            await this.handle_animation(type, vr, time)
            // this.isPaused = true
            if(this.animation_index === this.run_task.length - 1) {
                this.is_finished = true
            }
            this.speed = 1
        },

        async play_animation() {
            // this.Play()
            this.isPaused = false

            if(!this.is_finished) return
            if(this.animation_index === 1) this.animation_index -= 1
            this.is_finished = false
            let cur_index
            while(this.animation_index < this.run_task.length) {
                let [type, vr, time] = this.run_task[this.animation_index]
                console.log([type, vr, time])
                cur_index = this.animation_index
                await this.pause()
                if(cur_index !== this.animation_index) continue
                duration_bar.value = (this.animation_index / (this.run_task.length - 1)) * 100
                if(this.valid_move.length === 0 && vr[1] === "valid_move") {
                    this.animation_index += 1
                    continue
                }
                let dem = this.animation_index
                this.isFlaskBack = true
                if(!this.is_single_chess && simulation_name !== "valid_move") {
                    await this.render()
                    while(dem--) {
                        let [type, vr, time] = this.run_task[dem]
                        // if(this.run_task[dem][0] !== "hightlight" && this.run_task[dem][0] !== "RMH") {
                        if(this.run_task[dem][0] !== "hightlight" && this.run_task[dem][0] !== "RMH" && this.run_task[dem][0] !== "MC" && this.run_task[dem][0] !== "render") {
                            await this.handle_animation(type, vr, 0)
                        }
                        // }
                    }
                }
                this.isFlaskBack = false
                // let dem2 = this.animation_index
                // while(dem2 < this.run_task.length) {
                //     let [type, vr, time] = this.run_task[dem2]
                //     // if(this.run_task[dem][0] !== "hightlight" && this.run_task[dem][0] !== "RMH") {
                //     await this.handle_animation(type, vr, 0)
                //     dem2++
                //     // }
                // }
                
                await this.handle_animation(type, vr, time)

                if(this.animation_index === this.run_task.length - 1) {
                    this.is_finished = true
                }
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
                    await this.chosing_chess(time, this[vr])
                    break
                case "CSC":
                    await this.chosing_single_chess(time, vr)
                    break
                case "CC_M":
                    await this.chosing_chess_render_move(time, vr)
                    break
                case "GM":
                    await this.generate_move(this.chosed_chess[0], time)
                    break
                case "AGM":
                    await this.generate_all_move(time)
                    break
                case "RM":
                    let [tp, v] = vr
                    await this.render_move(tp,this[v], time)
                    break
                case "MC":
                    let [selected_pos, new_pos] = vr
                    await this.move_chess(selected_pos, new_pos, time)
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
                    await this.render(vr === "" ? new_board : vr)
                    break
                case "return":
                    await this.handle_return(vr, time)
                    break
                case "SDC":
                    await this.show_data_change(vr, time)
                    break
                case "sleep":
                    await this.sleep(time)
                    break
                case "FT":
                    await this.fire_them(vr, time)
                    break
                default:
                    break
            }
        },

        ganh_chet(move, opp_pos, side, opp_side) {
            let valid_remove = [];
            let at_8intction = (move[0] + move[1]) % 2 === 0;
        
            for (let [x0, y0] of opp_pos) {
                let dx = x0 - move[0];
                let dy = y0 - move[1];
                if (dx >= -1 && dx <= 1 && dy >= -1 && dy <= 1 && (dx === 0 || dy === 0 || at_8intction)) {
                    if ((move[0] - dx >= 0 && move[0] - dx <= 4 && move[1] - dy >= 0 && move[1] - dy <= 4 && board[move[1] - dy][move[0] - dx] === opp_side) ||
                        (x0 + dx >= 0 && x0 + dx <= 4 && y0 + dy >= 0 && y0 + dy <= 4 && board[y0 + dy][x0 + dx] === side)) {
                        valid_remove.push([x0, y0]);
                    }
                }
            }

            return valid_remove;
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
                    row = JSON.parse(`[${JSON.stringify(row).replaceAll("[","").replaceAll("]","")}]`)
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

        async handle_move(selected_pos, new_pos) {
            new_board = new_board.map(row => row.map(ele => ( ele === 2 || ele === -2) ? 0 : ele))
            let path = new_board[selected_pos[1]][selected_pos[0]]
            new_board[selected_pos[1]][selected_pos[0]] = new_board[selected_pos[1]][selected_pos[0]] === 1 ? 2 : -2
            new_board[new_pos[1]][new_pos[0]] = path
            await this.render(board)
        },

        async move_chess(selected_pos, new_pos, time) {
            await this.sleep(time)
            await this.handle_move(selected_pos, new_pos)
            await this.show_pre_move([selected_pos], "your_side", 0)
            await this.chosing_chess(0, [new_pos])
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

        async chosing_single_chess(time, pos) {
            let [x,y] = pos
            await this.sleep(time)
            cv2.beginPath();
            cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius, 0, 2 * Math.PI)
            cv2.lineWidth = 5;
            cv2.strokeStyle = "blue";
            cv2.stroke();
            // pos.forEach((([x,y]) => {
            // }))
        },


        async show_pre_move(pos, side, time) {
            for(let [x,y] of pos) {
                await this.sleep(time)
                switch(side) {
                    case "your_side":
                        cv2.beginPath();
                        cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                        cv2.fillStyle = "#6BA1F1"
                        cv2.fill()
                        break
                    case "opp_side":
                        cv2.beginPath();
                        cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                        cv2.fillStyle = "#FC6666"
                        cv2.fill()
                        break
                    default:
                        break
                }
            }
        },
        
        async fire_them(pos, time) {
            fire_sound.play()
            for(let [x,y] of pos) {
                await this.sleep(time)
                await (async () => {
                    cv2.drawImage(fire_img, x*this.gap - this.chess_radius + fix_pos - 14, y*this.gap - this.chess_radius + fix_pos - 15, this.chess_radius * 2, this.chess_radius * 2)
                })()
            }
        },

        async chosing_chess_render_move(time, [type, vr, side, pos]) {
            let moves = this[vr]
            let [x,y] = JSON.parse(pos)
            await this.sleep(time)
            await this.chosing_chess(0, [[x,y]])
            await this.pause()
            duration_bar.value = (this.animation_index / (this.run_task.length - 1)) * 100
            const p = `[${[x,y]}]`
            switch(type) {
                case "valid":
                    moves[side][pos].forEach(([x,y]) => {
                        cv2.beginPath();
                        cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                        cv2.fillStyle = "green"
                        cv2.fill()
                    })
                    break
                case "invalid":
                    moves[side][pos].forEach(([x,y]) => {
                        cv2.beginPath();
                        cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                        cv2.fillStyle = "rgba(255, 0, 0, 0.4)"
                        cv2.fill()
                    })
                    break
                default:
                    moves.your_pos[pos].forEach(([x,y]) => {
                        cv2.beginPath();
                        cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                        cv2.fillStyle = "#666"
                        cv2.fill()
                    })
                    break
            }
        },

        async generate_move([x,y], time) {
            return new Promise(resolve => {
                setTimeout(() => {
                    this.chosed_chess = [[x,y]]
                    // this.run_task = JSON.parse(this.action.replaceAll("9999", (this.chosed_chess[0][0] + this.chosed_chess[0][1]) % 2 === 0 ? "4" : "6"))
                    this.clear_hightlight(0)
                    this.chosing_chess(0, this.chosed_chess)
                    this.moves = []
                    let d = (x+y)%2==0 ? d1 : d2
                    // this.opp_pos = JSON.stringify(this.opp_pos)
                    // this.your_pos = JSON.stringify(this.your_pos)
                    d.forEach(([mx,my]) => {
                        let newX = x + mx
                        let newY = y + my
                        if(newX >= 0 && newX <= 4 && newY >= 0 && newY <= 4 && board[newY][newX] === 0) {
                            this.valid_move.push([newX,newY])
                        } else {
                            this.invalid_move.push([newX,newY])
                        }
                    })
                    // this.opp_pos = JSON.parse(this.opp_pos)
                    // this.your_pos = JSON.parse(this.your_pos)
                    this.moves = [...this.valid_move, ...this.invalid_move]
                    this.config_run_task(this)
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
                    this.opp_pos = JSON.stringify(this.opp_pos)
                    this.your_pos = JSON.stringify(this.your_pos)
                    let opp_pos = JSON.parse(this.opp_pos)
                    let your_pos = JSON.parse(this.your_pos)
                    your_pos.forEach(([x,y]) => {
                        let d = (x+y)%2==0 ? d1 : d2
                        let v_move = []
                        let iv_move = []
                        d.forEach(([mx,my]) => {
                            let newX = x + mx
                            let newY = y + my
                            if(newX >= 0 && newX <= 4 && newY >= 0 && newY <= 4 && board[newY][newX] === 0) {
                                this.all_valid_move.your_pos.push([newX,newY])
                                v_move.push([newX,newY])
                            } else {
                                this.all_invalid_move.your_pos.push([newX,newY])
                                iv_move.push([newX,newY])
                            }
                        })
                        this.all_move[`[${[x,y]}]`] = [...v_move,...iv_move]
                        this.valid_move_for_single_chess.your_pos[`[${[x,y]}]`] = v_move
                        this.invalid_move_for_single_chess.your_pos[`[${[x,y]}]`] = iv_move
                    })

                    opp_pos.forEach(([x,y]) => {
                        let d = (x+y)%2==0 ? d1 : d2
                        let v_move = []
                        let iv_move = []
                        d.forEach(([mx,my]) => {
                            let newX = x + mx
                            let newY = y + my
                            if(newX >= 0 && newX <= 4 && newY >= 0 && newY <= 4 && board[newY][newX] === 0) {
                                this.all_valid_move.opp_pos.push([newX,newY])
                                v_move.push([newX,newY])
                            } else {
                                this.all_invalid_move.opp_pos.push([newX,newY])
                                iv_move.push([newX,newY])
                            }
                        })
                        this.all_move[`[${[x,y]}]`] = [...v_move,...iv_move]
                        this.valid_move_for_single_chess.opp_pos[`[${[x,y]}]`] = v_move
                        this.invalid_move_for_single_chess.opp_pos[`[${[x,y]}]`] = iv_move
                    })
                    this.all_invalid_move = {
                        your_pos: [...new Set(this.all_invalid_move.your_pos)],
                        opp_pos: [...new Set(this.all_invalid_move.opp_pos)]
                    }
                    this.all_valid_move = {
                        your_pos: [...new Set(this.all_valid_move.your_pos)],
                        opp_pos: [...new Set(this.all_valid_move.opp_pos)]
                    }
                    this.opp_pos = opp_pos
                    this.your_pos = your_pos
                    this.config_run_task(this)
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

        async render(n_board = new_board) {
            board = n_board
            console.log(n_board)
            cv2.clearRect(0,0,this.board_width,this.board_height)
            cv2.drawImage(board_img, 0, 0, this.board_width, this.board_height)
            this.your_pos = []
            this.opp_pos = []
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    if(n_board[i][j] === 1) {
                        this.your_pos.push([j,i])
                    } else if(n_board[i][j] === -1) {
                        this.opp_pos.push([j,i])
                    } else if(n_board[i][j] === 2) {
                        cv2.beginPath();
                        cv2.arc(j*this.gap - this.chess_radius + fix_pos, i*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                        cv2.fillStyle = "#6BA1F1"
                        cv2.fill()
                    } else if(n_board[i][j] === -2) {
                        cv2.beginPath();
                        cv2.arc(j*this.gap - this.chess_radius + fix_pos, i*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                        cv2.fillStyle = "#FC6666"
                        cv2.fill()
                    }
                }
            }

            this.opp_pos.forEach(([x,y]) => {
                cv2.beginPath();
                cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius, 0, 2 * Math.PI)
                cv2.fillStyle = "red"
                cv2.fill()
            })
            this.your_pos.forEach(([x,y]) => {
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
                            show_data_change.innerHTML = "Các nước đi hợp lệ: " + JSON.stringify(this.valid_move)
                            console.log(this.valid_move)
                            break
                        case "vay":
                            show_data_change.innerHTML = type ? "Quân bạn chọn đã bị vây" : "Quân bạn chọn không bị vây"
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

        async show_data_change([type, log], time) {
            this.sleep(time)
            switch(type) {
                case "valid_move":
                    show_data_change.innerHTML = "Các nước đi hợp lệ: " + JSON.stringify(this.valid_move)
                    console.log(this.valid_move)
                    break
                case "vay":
                    show_data_change.innerHTML = log ? "Quân bạn chọn đã bị vây" : "Quân bạn chọn không bị vây"
                    console.log(this.valid_move)
                    break
                case "ganh_chet":
                    let [is_ganh_chet,data] = log
                    show_data_change.innerHTML = is_ganh_chet ? "Quân bị ăn: " + JSON.stringify(data) : "không có quân nào bị ăn"
                    console.log(this.valid_move)
                    break
                default:
                    console.log(this.valid_move)
                    break
            }
        },

        async reset_event() {
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

            if(simulation_name === "ganh_chet") {
                const your_chess_item = $$(".your_chess_item")
                let pre_selected_pos = JSON.stringify(this.selected_pos)
                your_chess_item.forEach(item => {
                    item.onclick = () => {
                        this.new_pos = []
                        your_chess_item.forEach(i => i.classList.remove("selected"))
                        item.classList.add("selected")
                        this.selected_pos = [Number(item.dataset.x),Number(item.dataset.y)]
                        this.Pause()
                        this.start(new_board)
                        this.choose_chess([this.selected_pos])
                        const your_move_list = $(".your_move_list")
    
                        let valid_move = []
                        let [x,y] = this.selected_pos
                        let d = (x+y)%2==0 ? d1 : d2
                        d.forEach(([mx,my]) => {
                            let newX = x + mx
                            let newY = y + my
                            if(newX >= 0 && newX <= 4 && newY >= 0 && newY <= 4 && board[newY][newX] === 0) {
                                valid_move.push([newX,newY])
                            }
                        })
    
                        your_move_list.innerHTML = valid_move.map(item => {
                            return `<div class="your_move_item" data-x="${item[0]}" data-y="${item[1]}">(${[item[0], item[1]]})</div>`
                        }).join("")
    
                        const your_move_item = $$(".your_move_item")
                        console.log(pre_selected_pos, JSON.stringify(this.selected_pos))
                        if(your_move_item.length !== 0) {
                            const first_move = your_move_item[0]
                            first_move.classList.add("selected")
                            this.new_pos = [Number(first_move.dataset.x),Number(first_move.dataset.y)]
                            this.start(board)
                            this.choose_chess([this.selected_pos])
                            this.show_pre_move([this.new_pos], "your_side", 0)
                            pre_selected_pos = JSON.stringify(this.selected_pos)
                        }
                        
                        your_move_item.forEach(item => {
                            item.onclick = () => {
                                your_move_item.forEach(i => i.classList.remove("selected"))
                                item.classList.add("selected")
                                this.new_pos = [Number(item.dataset.x),Number(item.dataset.y)]
                                this.Pause()
                                this.start(board)
                                this.choose_chess([this.selected_pos])
                                this.show_pre_move([this.new_pos], "your_side", 0)
                            }
                        })
                    }
                })
    
                const your_move_item = $$(".your_move_item")
                if(this.new_pos.length === 0 && your_move_item.length !== 0 && JSON.stringify(this.selected_pos) === JSON.stringify(this.your_pos[0])) {
                    const first_move = your_move_item[0]
                    first_move.classList.add("selected")
                    this.new_pos = [Number(first_move.dataset.x),Number(first_move.dataset.y)]
                    console.log(this.new_pos)
                    this.show_pre_move([this.new_pos], "your_side", 0)
                }
                
                your_move_item.forEach(item => {
                    item.onclick = () => {
                        your_move_item.forEach(i => i.classList.remove("selected"))
                        item.classList.add("selected")
                        this.new_pos = [Number(item.dataset.x),Number(item.dataset.y)]
                        this.Pause()
                        this.start(board)
                        this.choose_chess([this.selected_pos])
                        this.show_pre_move([this.new_pos], "your_side", 0)
                    }
                })
            }

        },

        random_board() {
            const d = [-1,0,1]
            const c = [0,0,0]
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
                        this.your_pos.push([j,i])
                    } else if(d[ran] === -1) {
                        this.opp_pos.push([j,i])
                    }
                }
            }
            // this.start(new_board)
            return new_board
        },

        choose_chess(pos) {
            show_code.innerHTML = `${code.replace("quan_co_ban_chon", `(${pos[0]})`)}`
            this.render()
            this.chosing_chess(0,pos)
        },
        
        async handle_event() {
            random_your_pos_btn.onclick = () => {
                console.log("hello")
                let ran = Math.round(Math.random() * (this.your_pos.length-1))
                your_pos_items = $$(".your_pos_item")
                your_pos_items.forEach(i => i.classList.remove("selected"))
                this.chosed_chess = [[Number(your_pos_items[ran].dataset.x),Number(your_pos_items[ran].dataset.y)]]
                your_pos_items[ran].classList.add("selected")
                this.action.replace("quan_co_ban_chon", `${this.chosed_chess[0]}`.replace("[", "(").replace("]", ")"))
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
                    your_chess_list.innerHTML = ""
                    your_pos_list.innerHTML = ""
                    for(let i = 0; i <= 4; i++) {
                        for(let j = 0; j <= 4; j++) {
                            if(new_board[i][j] === 1) {
                                your_pos_list.innerHTML += `
                                    <div data-x="${j}" data-y="${i}" class="your_pos_item">(${[j,i]})</div>
                                `
                                your_chess_list.innerHTML += `
                                    <div data-x="${j}" data-y="${i}" class="your_chess_item">(${[j,i]})</div>
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
            }

            this.setting_board.oninput = () => {
                try {
                    new_board = JSON.parse(`[${this.setting_board.innerHTML.replaceAll("\n",",")}]`.replaceAll("],]","]]"))
                    this.setting_board.style.border = "1px solid #007BFF"
                    your_pos_list.innerHTML = ""
                    your_chess_list.innerHTML = ""
                    for(let i = 0; i <= 4; i++) {
                        for(let j = 0; j <= 4; j++) {
                            if(new_board[i][j] === 1) {
                                your_pos_list.innerHTML += `
                                    <div data-x="${j}" data-y="${i}" class="your_pos_item">(${[j,i]})</div>
                                `
                                your_chess_list.innerHTML += `
                                    <div data-x="${j}" data-y="${i}" class="your_chess_item">(${[j,i]})</div>
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
            await this.reset_event()
        },

        Play() {
            this.isPaused = false
            play_pause_btn.checked = true
        },

        Pause() {
            this.isPaused = true
            play_pause_btn.checked = false
        },

        async start(boardMatrix = new_board) {
            this.clear_variable()
            
            duration_bar.value = 0
            this.animation_index = 0
            board = boardMatrix

            this.clear_hightlight(0)

            if(this.is_single_chess) {
                this.generate_move(this.chosed_chess[0])
            }
            else {
                this.generate_all_move(0)
            }

            await this.render(boardMatrix)
            this.handle_event()

        }
    })
}