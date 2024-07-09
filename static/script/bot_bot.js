const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const playerList = $(".side_bar-player-list")
let players = $$(".player")
const newPoint = $(".info_elo-fluc--new")
const arrow = $(".info_elo-fluc--arrow")
const fightBtn = $(".fight_btn")
let fightBtnStatus = {
    onLoading: false,
}
let selectedPlayer
let newValue = 0

function resetSuggestion() {
    fetch("get_users")
    .then(res => res.json())
    .then(data => {
        Array.from(players).forEach((player) => {
            player.remove()
        })
        console.log(players)
        data.forEach(([name, elo]) => {
            playerList.innerHTML += `
                <li class="player" data-name=${name} data-elo=${elo}>
                    <div class="player-avatar"><p>${name[0].toUpperCase()}</p></div>
                    <div class="player-info">
                    <div class="player-info--name">${name}</div>
                    <div class="player-info--elo">${elo}</div>
                    </div>
                </li>
            `
        })
        players = $$(".player")
        resetEvent(false ,"players")
    })
}

const rankColor = [
    "#54DDFE",
    "#FD80FF",
    "yellow",
    "silver",
    "brown",
]

function createTopList() {
    let warrior = $$(".warrior")
    // warrior.forEach((e,i) => {if(i > 2) {e.querySelector(".crown").style.display = "none"}})

    Array.from(warrior).forEach((wr, i) => {
        const tC = wr.querySelector(".crown")
        tC.style.color = rankColor[i]
        wr.querySelector(".rank").innerHTML = i+1
    })
}

createTopList()

const userName = $(".user-name")
let warriors = $$(".warrior")
const enemy = $(".enemy")
const enemyAva = $(".enemy_ava")
const enemyName = $(".enemy-name")
let enemyElo = $(".enemy-elo")

function resetEvent(all = false, type) {
    if(type === "players" || all) {
        Array.from(players).forEach((player) => {
            player.onclick = () => {
                if(!selectedPlayer) {
                    fightBtn.style.backgroundColor = "#007BFF"
                    fightBtn.innerHTML = "thách đấu"
                }
                Array.from(players).forEach(p => p.style.backgroundColor = "")
                Array.from(warriors).forEach(p => p.style.backgroundColor = "")
                player.style.backgroundColor = "#232E3B"
                selectedPlayer = {
                    name: player.dataset.name,
                    elo: player.dataset.elo,
                }
                enemyAva.innerHTML = selectedPlayer.name[0].toUpperCase()
                enemyName.innerHTML = selectedPlayer.name
                enemyElo.innerHTML = selectedPlayer.elo
            }
        })
    } 
    if(type === "warriors" || all) {
        Array.from(warriors).forEach((warrior) => {
            warrior.onclick = () => {
                if(!selectedPlayer) {
                    fightBtn.style.backgroundColor = "#007BFF"
                    fightBtn.innerHTML = "thách đấu"
                }
                Array.from(warriors).forEach(p => p.style.backgroundColor = "")
                Array.from(players).forEach(p => p.style.backgroundColor = "")
                warrior.style.backgroundColor = "#007bffa4"
                console.log("wtd")
                selectedPlayer = {
                    name: warrior.dataset.name,
                    elo: warrior.dataset.elo,
                }
                enemyAva.innerHTML = selectedPlayer.name[0].toUpperCase()
                enemyName.innerHTML = selectedPlayer.name
                enemyElo.innerHTML = selectedPlayer.elo
            }
        })
    }
}

resetEvent(true)

const video = $(".fight_screen-video")
const loading = $(".fight_screen-loading")
const standBy = $(".fight_screen-standby")
const err_screen = $(".fight_screen-err")
const info = $(".info")
const info_status = $(".info_status")
const info_elo_fluc_new = $(".info_elo-fluc--new")

const user = $(".user")
const userElo = $(".user-elo")

let dem = parseInt(userElo.innerHTML)

function updateRankBoard(newValue) {
    $(".user-info--elo").innerHTML = newValue
    const uElo = parseInt(userElo.innerHTML)
    const eElo = parseInt(enemyElo.innerHTML)
    const rankBoard = $(".rank_board_list")

    fetch("/update_rank_board", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            player: {
                name: userName.innerHTML,
                elo: uElo
            },
            enemy: {
                name: enemyName.innerHTML,
                elo: eElo
            }
        }),
    })
    .then(res => res.json())
    .then(data => {
        Array.from(warriors).forEach(e=>e.remove())
        data.forEach(([name, elo]) => {
            rankBoard.innerHTML += `
            <li class="warrior" data-name=${name} data-elo=${elo}>
                <div class="warrior_rank">
                    <i class="fa-solid fa-crown crown"></i>
                    <div class="rank">1</div>
                </div>
                <div class="warrior-avatar"><p>${name[0].toUpperCase()}</p></div>
                <div class="warrior-info">
                    <div class="warrior-info--name">${name}</div>
                    <div class="warrior-info--elo">${elo}</div>
                </div>
            </li>
            `
        })
        warriors = $$(".warrior")
        createTopList()
        resetSuggestion()
        resetEvent(false ,"warriors")
    })
}

fightBtn.onclick = () => {
    if(!selectedPlayer || fightBtnStatus.onLoading) return;
    let stt = {}
    info.style.display = "none"
    video.style.display = "none";
    standBy.style.display = "none";
    err_screen.style.display = "none"
    loading.style.display = "block";
    $(".info_elo-fluc--pre").innerHTML = userElo.innerHTML
    newPoint.innerHTML = ""
    user.style.backgroundColor = "#121212"
    enemy.style.backgroundColor = "#121212"

    fightBtn.innerHTML = `<div class="loading_btn"></div>`
    fightBtn.style.backgroundColor = "#191B26"
    fightBtnStatus.onLoading = true
    fetch("/fighting", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedPlayer),
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        if(data.code === 400) {
            err_screen.style.display = "flex"
            loading.style.display = "none"
            fightBtn.innerHTML = "chọn đối thủ để đấu"
            fightBtnStatus.onLoading = false
            selectedPlayer = null
        } else if(data.code === 200) {

            stt = {
                status: data.status,
                max_move_win: data.max_move_win,
                new_url: data.new_url
            }
            info_status.innerHTML = "You " + stt.status
            if(stt.status === "win") {
                info_status.style.backgroundColor = "#007BFF"
                user.style.backgroundColor = "#007BFF"
                enemy.style.backgroundColor = "red"
                info_elo_fluc_new.style.color = "#007BFF"
                if(userElo.innerHTML < enemyElo.innerHTML) {
                    let pre = userElo.innerHTML
                    userElo.innerHTML = parseInt(enemyElo.innerHTML) + 10
                    enemyElo.innerHTML = pre
                } else {
                    userElo.innerHTML = parseInt(userElo.innerHTML) + 10
                }
            } else if(stt.status === "lost") {
                info_status.style.backgroundColor = "red"
                user.style.backgroundColor = "red"
                enemy.style.backgroundColor = "#007BFF"
                info_elo_fluc_new.style.color = "red"
                if(userElo.innerHTML > enemyElo.innerHTML) {
                    let pre = enemyElo.innerHTML
                    enemyElo.innerHTML = parseInt(userElo.innerHTML) + 10
                    userElo.innerHTML = pre
                } else {
                    userElo.innerHTML = parseInt(userElo.innerHTML) - 10 
                }
            } else {
                info_status.style.backgroundColor = "#333"
                user.style.backgroundColor = "#333"
                enemy.style.backgroundColor = "#333"
                info_elo_fluc_new.style.color = "#fff"
            }
            if(userElo.innerHTML <= 0) {
                userElo.innerHTML = 0
            } else if(enemyElo.innerHTML <= 0) {
                enemyElo.innerHTML = 0
            }
            newValue = parseInt(userElo.innerHTML)
            updateRankBoard(newValue)   
            const source = $("source")
            loading.style.display = "none"
            source.src = stt.new_url
            video.style.display = "block"
            video.load()
            fightBtn.innerHTML = "chọn đối thủ để đấu"
            fightBtnStatus.onLoading = false
            selectedPlayer = null
            setTimeout(() => info.style.display = "block", 1000)
        }
    })
    .catch(err => {
        err_screen.style.display = "flex"
        loading.style.display = "none"
        fightBtn.innerHTML = "chọn đối thủ để đấu"
        fightBtnStatus.onLoading = false
        selectedPlayer = null
    })
}

arrow.onanimationend = () => {
    let increasing = Math.abs(newValue - dem) / 100
    let a = setInterval(() => {
        newPoint.innerHTML = Math.round(dem);
        if(dem === newValue) clearInterval(a)
        if(dem < newValue) {
            dem += increasing
            if(dem >= newValue) {
                newPoint.innerHTML = newValue
                clearInterval(a)
            } 
        } else if(dem > newValue) {
            dem -= increasing
            if(dem <= newValue) {
                newPoint.innerHTML = newValue
                clearInterval(a)
            } 
        }
    }, 10)
}
