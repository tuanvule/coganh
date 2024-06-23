export function createSimulation(root) {
    const board_img = document.querySelector(".board_img")
    const canvas = document.querySelector(root)
    const cv2 = canvas.getContext("2d")
    let board
    let opp_pos = []
    let your_pos = []
    let fix_pos = canvas.width / 4.25
    let d1 = [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]]
    let d2 = [[0,-1], [-1,0], [0,1], [1,0]]
    const code_rows = document.querySelectorAll(".code_row")
    const return_value_ouput = document.querySelector(".return_value_ouput")

    return ({
        is_finished: true,
        board_width: canvas.width,
        board_height: canvas.height,
        gap: canvas.width / 4 - canvas.width / 4 / 2.53,
        chess_radius: 15,
        valid_move: [],
        invalid_move: [],
        chosed_chess: [],
        moves: [],

        clear_variable() {
            this.valid_move = []
            this.invalid_move = []
            this.moves = []
            opp_pos = []
            your_pos = []
            board = []
        },

        action() {
            this.is_finished = false
            let _this = this
            return ({
                async check_valid_move(run_task) {
                    for (const [type, vr, time] of run_task) {
                        switch (type) {
                            case "CC":
                                await _this.chosing_chess(time, _this.chosed_chess)
                                break
                            case "GM":
                                await _this.generate_move(_this.chosed_chess, time)
                                console.log("gm")
                                break
                            case "RM":
                                let [tp, v] = vr
                                console.log(_this[v])
                                await _this.render_move(tp,_this[v], time)
                                break
                            case "clear":
                                await _this.clear(time)
                                break
                            case "hightlight":
                                let {row,type} = vr
                                await _this.hightlight(row,type,time)
                                break
                            case "RMH":
                                await _this.clear_hightlight(time)
                                break
                            case "render":
                                await _this.render()
                                break
                            case "return":
                                await _this.handle_return(vr, time)
                                break
                            default:
                                break
                        }
                    }
                },
            })
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
                        row[0].classList.add("round_top", "round_bottom")
                    } else {
                        row[0].classList.add("round_top")
                        row[row.length-1].classList.add("round_bottom")
                    }
                    row.forEach(item => {
                        item.classList.add(type)
                    })
                    resolve()
                }, time)
            })
        },

        async clear(time) {
            return new Promise(resolve => {
                setTimeout(() => {
                    cv2.clearRect(0,0,this.board_width,this.board_height)
                    resolve()
                }, time)
            })
        },

        async chosing_chess(time, [x,y]) {
            return new Promise(resolve => {
                setTimeout(() => {
                    cv2.beginPath();
                    cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius, 0, 2 * Math.PI)
                    cv2.lineWidth = 5;
                    cv2.strokeStyle = "blue";
                    cv2.stroke();    
                    resolve()
                }, time)
            })
        },

        async generate_move([x,y], time) {
            return new Promise(resolve => {
                setTimeout(() => {
                    this.chosed_chess = [x,y]
                    this.chosing_chess(0, this.chosed_chess)
                    this.moves = []
                    let d = (x+y)%2==0 ? d1 : d2
                    console.log(your_pos)
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
                    console.log(opp_pos)
                    this.moves = [...this.valid_move, ...this.invalid_move]
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
                // moves.forEach(([x,y]) => {
                //     cv2.beginPath();
                //     cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                //     cv2.fillStyle = "green"
                //     cv2.fill()
                // })
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
                            return_value_ouput.innerHTML = JSON.stringify(this.valid_move)
                            return_value_ouput.style.display = "block"
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

        async start(boardMatrix) {
            this.clear_variable()
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
            cv2.clearRect(0,0,this.board_width,this.board_height)
            await this.render()
        }
    })
}