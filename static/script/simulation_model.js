export function createSimulation(root, boardMatrix) {
    const board_img = document.querySelector(".board_img")
    const canvas = document.querySelector(root)
    const cv2 = canvas.getContext("2d")
    let board = boardMatrix
    let opp_pos = []
    let your_pos = []
    let fix_pos = canvas.width / 4.9
    let d1 = [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]]
    let d2 = [[0,-1], [-1,0], [0,1], [1,0]]

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if(boardMatrix[i][j] === 1) {
                your_pos.push([j,i])
            } else if(boardMatrix[i][j] === -1) {
                opp_pos.push([j,i])
            }
        }
    }

    return ({
        board_width: canvas.width,
        board_height: canvas.height,
        gap: canvas.width / 4 - canvas.width / 4 / 3,
        chess_radius: 15,

        action() {
            return ({
                render_move() {
                    
                },
            })
        },

        generate_move([x,y]) {
            cv2.beginPath();
            cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius, 0, 2 * Math.PI)
            cv2.lineWidth = 5;
            cv2.strokeStyle = "blue";
            cv2.stroke();            
            this.moves = []
            let d = (x+y)%2==0 ? d1 : d2
            console.log(your_pos)
            console.log(your_pos.includes([2,4]))
            d.forEach(([mx,my]) => {
                let newX = x + mx
                let newY = y + my
                opp_pos = JSON.stringify(opp_pos)
                your_pos = JSON.stringify(your_pos)
                if(newX >= 0 && newX <= 4 && newY >= 0 && newY <= 4 && !opp_pos.includes(`${[newX, newY]}`) && !your_pos.includes(`${[newX,newY]}`)) {
                    this.moves.push([newX,newY])
                }
            })
            opp_pos = JSON.parse(opp_pos)
            your_pos = JSON.parse(your_pos)
        },

        render_move(moves) {
            moves.forEach(([x,y]) => {
                cv2.beginPath();
                cv2.arc(x*this.gap - this.chess_radius + fix_pos, y*this.gap - this.chess_radius + fix_pos, this.chess_radius - 5, 0, 2 * Math.PI)
                cv2.fillStyle = "green"
                cv2.fill()
            })
        },

        render() {
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
            this.generate_move([2,4])
            this.render_move(this.moves)
        },

        start() {
            this.render()
        }
    })
}