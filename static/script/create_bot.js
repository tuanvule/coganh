const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const username = $(".username").innerHTML

const runBtn = $(".coding_module-nav--runBtn.btn")
const saveBtn = $(".coding_module-nav--saveBtn")
const terminal = $(".utility_block-element.terminal")
const rule = $(".utility_block-element.rule")
const result = $(".utility_block-element.result")
const uniBlock = $$(".utility_block-element")
const loader = $(".coding_module-nav--runBtn.loader")
const video = $(".bot_display-video--result")
const debug = $(".bot_display-video--debug")

const uniNavItem = $$(".utility_nav-block--item")
const ruleBtn = $(".utility_nav-block--item.rule")
const terminalBtn = $(".utility_nav-block--item.terminal")
const resultBtn = $(".utility_nav-block--item.result")
const videoBtn = $(".bot_display_nav-block--item.video")
const debugtBtn = $(".bot_display_nav-block--item.debug")
const animation = $(".utility_nav-block .animation")
const animationChild = $(".utility_nav-block .animation .children")
const bDAnimation = $(".bot_display_nav-block .animation")
const bDAnimationChild = $(".bot_display_nav-block .animation .children")
const botDisplayBlock = $$(".bot_display-video-item")

const debugArrowRight = $(".bot_display-video--debug .arrow_right")
const debugArrowLeft = $(".bot_display-video--debug .arrow_left")
const debugImageList = $(".debug_img_list")
const counter = $(".counter")
const selectDebugNum = $(".selector")
const loadingVideo = $(".loading_video")
const loadingImage = $(".loading_image")
const loadingNavImage = $(".loading_nav_image")
const loadingNavVideo = $(".loading_nav_video")
const loadingNavImageLD = $(".loading_nav_image .loader")
const loadingNavVideoLD = $(".loading_nav_video .loader")
const loadingNavImageCI = $(".loading_nav_image .check_icon")
const loadingNavVideoCI = $(".loading_nav_video .check_icon")
const loadingNavImageFI = $(".loading_nav_image .fail_icon")
const loadingNavVideoFI = $(".loading_nav_video .fail_icon")
const isEnableDebug = $("input#debug")
const isEnableVideo = $("input#video")

const rate_selected_pos = $(".debug_info-selected_pos")
const rate_new_pos = $(".debug_info-new_pos")
const rate_level = $(".debug_info-move_level")

const fight_result_item = $$(".fight_result_item")
let bot_html
const win_loose_block = $(".win_loose_block")
let win_loose_items = [
    `
    <div class="winer">
    <div class="winer_avatar">T</div>
    <div class="winer_info">
        <div class="winer_title">VICTORY</div>
        <div class="winer_info_name">{winer_name}</div>
    </div>
    <!-- <div class="side blue"></div> -->
    `,
    `
    </div>
    <div class="loser">
        <div class="loser_avatar"><img src="../static/img/bot4.png" alt=""></div>
        <div class="loser_info">
            <div class="loser_title">DEFEATED</div>
            <div class="loser_info_name">{loser_name}</div>
        </div>
        <!-- <div class="side red"></div> -->
    </div>
    `
]

// const bot_item = $$(".bot_item")
let choosen_bot
var request_data = {
    code: "",
    bot: "",
}

const bot_items = $$(".bot_item")

bot_items.forEach(item => {
    item.onclick = (e) => {
        if(item.classList.contains("selected")) {
            choosen_bot = ""
            request_data.bot = ""
            bot_html = ""
            item.classList.remove("selected")
            runBtn.classList.remove("active")
            return
        }
        bot_items.forEach(e => e.classList.remove("selected"))
        choosen_bot = item.dataset.level
        item.classList.add("selected")
        request_data.bot = choosen_bot
        bot_html = item
        runBtn.classList.add("active")
    }
})

let debugImageItems
let imageNum = 0
let currentDisplayMode = "video"
let currentUtiMode = "rule"

let gameResult;
let img_url = []
let rate = []

var audio = $(".bot_display-video--result");
audio.volume = 0.1;

var editor = ace.edit("coding_module-coding_block");

editor.setOptions({
    mode: "ace/mode/python",
    selectionStyle: "text",
    theme: "ace/theme/dracula",
    autoScrollEditorIntoView: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
});

saveBtn.onclick = () => {
    const code = editor.getValue()
    saveBtn.dataset.saved = "true"
    fetch("/save_code", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(code.replaceAll('\r', '')),
    })
    .then(res => res.json())
    .then(data => {
        saveBtn.style.backgroundColor = "#fff"
        saveBtn.style.color = "#000"
        const a = data
        terminal.innerHTML = `
            [debug output] <br>
        `
        terminal.innerHTML += `${a}`
    })
}

runBtn.onclick = () => {
    if(!choosen_bot) return
    rate = []
    run()
}

function run() {
    if(!isEnableDebug.checked && !isEnableVideo.checked) {
        return
    }
    request_data.code = editor.getValue()
    loader.style.display = "block"
    runBtn.style.display = "none"

    toggleMode("terminal")
    terminal.style.backgroundColor = "#252525"
    terminalBtn.style.color = "#fff"
    ruleBtn.style.color = "#ccc"
    resultBtn.style.color = "#ccc"
    changeAnimation(terminalBtn, `${((terminalBtn.clientWidth - 10) / animation.clientWidth * 100)}%`, terminalBtn.clientWidth + "px", "terminal", animationChild)
    terminal.innerHTML = `loading...`
    gameResult = null
    
    if(isEnableVideo.checked && !isEnableDebug.checked) {
        uploadCode(request_data)
        return
    }

    debugImageList.style.display = "none"
    loadingImage.style.display = "block"
    loadingNavImageLD.style.display = "block"
    loadingNavImageCI.style.display = "none"
    loadingNavImageFI.style.display = "none"
    if(isEnableVideo.checked) {
        loadingVideo.style.display = "block"
        video.style.display = "none"
        loadingNavVideoLD.style.display = "block"
        loadingNavVideoCI.style.display = "none"
        loadingNavVideoFI.style.display = "none"
    }

    fetch("/debug_code", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            request_data: request_data,
            debugNum: Number(selectDebugNum.value)
        }),
    })
    .then(res => res.json())
    .then(data => {
        loadingImage.style.display = "none"
        terminal.style.backgroundColor = "#000"
        if(!isEnableVideo.checked && isEnableDebug.checked) {
            loader.style.display = "none"
            runBtn.style.display = "block"
        }
        if(data.code === 200) {
            console.log(data.img_url)
            img_url = JSON.parse(data.img_url)
            debugImageList.innerHTML = ""
            img_url.forEach((url, index) => {
                debugImageList.innerHTML += `
                    <li data-num="${index}" class="debug_img_item"><img src="${url}" alt=""></li>
                `
            })
            data.rate.forEach((item, i) => {
                rate.push({
                    type: item,
                    move: data.inp_oup[i],
                })
            })
            debugImageItems = $$(".debug_img_item")
            debugImageList.style.display = "block"
            debugImageItems[0].classList.add("display_image")
            imageNum = 0
            counter.innerHTML = imageNum
            loadingNavImageLD.style.display = "none"
            loadingNavImageCI.style.display = "block"
            loadingNavImageFI.style.display = "none"
            debugArrowRight.style.opacity = "1"
            const a = data.output.replaceAll('\n', '<br>').replaceAll('    ', '&emsp;')
                terminal.innerHTML = `
                <br>
                [debug output] <br>
                <br>
            `
            terminal.innerHTML += `${a}`
            if(isEnableVideo.checked) uploadCode(request_data)
        } else {
            loader.style.display = "none"
            runBtn.style.display = "block"
            loadingNavImageFI.style.display = "block"
            loadingNavVideoFI.style.display = "block"
            loadingNavVideoLD.style.display = "none"
            loadingVideo.style.display = "none"
            loadingNavVideoFI.style.display = "block"
            debugImageList.style.display = "block"
            if(currentDisplayMode === "video") video.style.display = ""
            console.log(data.output)
            const a = data.output.replaceAll('\n', '<br>').replaceAll('    ', '&emsp;')
            console.log(a)
            terminal.innerHTML = `${a}`
        }
    })
}

function uploadCode(request) {
    toggle_bot_result(bot_html, ".fight_result_loader")
    loadingVideo.style.display = "block"
    video.style.display = "none"
    loadingNavVideoLD.style.display = "block"
    loadingNavVideoCI.style.display = "none"
    fetch("/upload_code", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    })
    .then(res => res.json())
    .then(data => {
        if(isEnableVideo.checked && !isEnableDebug.checked) terminal.innerHTML = ""
        const a = data.output.replaceAll('\n', '<br>').replaceAll('    ', '&emsp;')
        if(data.code === 200) {
            gameResult = data
            terminal.innerHTML += `
                <br>
                [video output] <br>
                <br>
            `
            terminal.innerHTML += `${a}`
        } else {
            console.log(a)
            terminal.innerHTML += `${a}`
        }
    })
    .catch(err => {
        terminal.innerHTML = `${err}`
        loadingNavVideoFI.style.display = "block"
    })
    .finally(() => {
        const source = $("source")
        loader.style.display = "none"
        runBtn.style.display = "block"
        terminal.style.backgroundColor = "#000"
        loadingNavVideoLD.style.display = "none"
        loadingVideo.style.display = "none"
        if(gameResult?.code === 200) {
            loadingNavVideoCI.style.display = "block"
            loadingNavVideoFI.style.display = "none"
            source.src = gameResult.new_url
            video.load()
            if(currentDisplayMode === "video") video.style.display = ""
            changeAnimation(resultBtn, "0", resultBtn.clientWidth + "px", "result", animationChild)
            toggleMode("result")
        } else {
            toggle_bot_result(bot_html, ".fight_result_lost")
            loadingNavVideoFI.style.display = "block"
        }
    })
}

function change_rate(i) {
    if(i < 0) {
        rate_selected_pos.innerHTML = "(x1,y2)"
        rate_new_pos.innerHTML = "(x2,y2)"
        rate_level.innerHTML = "đánh giá"
        rate_level.classList.remove("excellent", "bad", "good")
        rate_level.classList.add("normal")
        console.log("I: ", i)
        return
    }

    rate_selected_pos.innerHTML = `(${rate[i].move.selected_pos})`
    rate_new_pos.innerHTML = `(${rate[i].move.new_pos})`
    
    rate_level.innerHTML = rate[i].type
    if(rate[i].type === "Tốt nhất") {
        rate_level.classList.remove("good", "bad", "normal")
        rate_level.classList.add("excellent")
    } else if(rate[i].type === "Tốt") {
        rate_level.classList.remove("excellent", "bad", "normal")
        rate_level.classList.add("good")
    } else if(rate[i].type === "Tệ") {
        rate_level.classList.remove("excellent", "good", "normal")
        rate_level.classList.add("bad")
    } else if(rate[i].type === "Bình thường") {
        rate_level.classList.remove("excellent", "good", "bad")
        rate_level.classList.add("normal")
    }

}

function toggle_bot_result(bot, type) {
    bot.querySelectorAll(".fight_result_item").forEach(item => {
        item.style.display = "none"
    })
    bot.querySelector(type).style.display = "flex"
    // fight_result_item.forEach(item => {
    //     item.style.display = "none"
    // })
}

const defaultValue = `
import random

def is_valid_move(move, current_side, board):
    current_x = move["selected_pos"][0]
    current_y = move["selected_pos"][1]
    new_x = move["new_pos"][0]
    new_y = move["new_pos"][1]

    if (current_x%1==0 and current_y%1==0 and new_x%1==0 and new_y%1==0 and # Checking if pos is integer
        0 <= current_x <= 4 and 0 <= current_y <= 4 and # Checking if move is out of bounds
        0 <= new_x     <= 4 and 0 <= new_y     <= 4 and
        board[new_y][new_x] == 0 and board[current_y][current_x] == current_side): # Checking if selected position and new position is legal
        dx = abs(new_x-current_x)
        dy = abs(new_y-current_y)
        if (dx + dy == 1): return True # Checking if the piece has moved one position away
        return (current_x+current_y)%2==0 and (dx * dy == 1)
    return False

def main(player):

    while True:
        selected_pos = random.choice(player.your_pos)
        board = player.board
        new_pos_select = random_move(selected_pos)
        new_pos = (new_pos_select[0], new_pos_select[1])
        move = {"selected_pos": selected_pos, "new_pos": new_pos}
        if is_valid_move(move, player.your_side, board):
            return move

def random_move(position):
    movement = [(0, -1), (0, 1), (1, 0), (-1, 0), (-1, 1), (1, -1), (1, 1), (-1, -1)]  #possible moves
    movement_select = random.choice(movement)  #Randomize movement
    new_pos_x = position[0] + movement_select[1]
    new_pos_y = position[1] + movement_select[0]
    new_pos = (new_pos_x, new_pos_y)
    return new_pos
`
const session = editor.getSession();
session.setMode('ace/mode/python');

editor.getSession().on('change', function() {
    if(saveBtn.dataset.saved = "true") {
        saveBtn.style.backgroundColor = "#1E1E1E"
        saveBtn.style.color = "#fff"
    }
    fight_result_item.forEach(item => {
        item.style.display = "none"
    })
});

fetch("/get_code")
.then(res => res.json())
.then(data => {
        if(data) {
            session.setValue(data)
        } else {
            session.setValue(defaultValue);
        }
    })
    .catch(err => console.error(err))

const guides = [
    {
        display: "none",
        content: "chỗ để viết code tạo bot",
        pos: `
            top: 48%;
            left: 35%;
        `,
        style: `border: 2px blue;`,
        arrow_pos: `
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            border-top: 10px solid transparent;
            border-bottom: 10px solid transparent;            
            border-left: 10px solid #fff; 
        `,
    },
    {
        display: "none",
        content: "video minh họa bot từ code bạn viết ra",
        pos: `
            top: 52%;
            left: 14%;
        `,
        style: `border-color: blue;`,
        arrow_pos: `
            position: absolute;
            left: 50%;
            bottom: 100%;
            transform: translateX(-50%);
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            
            border-bottom: 10px solid #fff;
        `,
    },
    {
        display: "none",
        content: "lấy những hàm của thư viện random ra.",
        pos: `
            top: 4%;
            left: 48%;
        `,
        arrow_pos: `
            position: absolute;
            left: 45%;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;            
            border-top: 10px solid #fff;
        `,
    },
    {
        display: "none",
        content: "lấy vị trí trước và sau khi di chuyển của quân cơ",
        pos: `
            top: 18%;
            left: 28%;
        `,
        arrow_pos: `
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            border-top: 10px solid transparent;
            border-bottom: 10px solid transparent;            
            border-left: 10px solid #fff; 
        `,
    },
    {
        display: "none",
        content: "kiểm tra xem nước đi có hợp lệ hay không (quân cờ phải di chuyển trong bàn cờ kích thước 5x5)",
        pos: `
            top: 32%;
            left: 28%;
        `,
        arrow_pos: `
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            border-top: 10px solid transparent;
            border-bottom: 10px solid transparent;            
            border-left: 10px solid #fff; 
        `,
    },
    {
        display: "none",
        content: "từ các nước đi ngẫu nhiên có được từ hàm random_move. Nếu có nước đi hợp lệ thì lấy",
        pos: `
            top: 60%;
            left: 28%;
        `,
        arrow_pos: `
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            border-top: 10px solid transparent;
            border-bottom: 10px solid transparent;            
            border-left: 10px solid #fff; 
        `,
    },
    {
        display: "none",
        content: "tạo ra các nước đi ngẫu nhiên",
        pos: `
            top: 80%;
            left: 28%;
        `,
        arrow_pos: `
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            border-top: 10px solid transparent;
            border-bottom: 10px solid transparent;            
            border-left: 10px solid #fff; 
        `,
    }
]

const utility_nav_block = $(".utility_nav-block")

function toggleMode(mode) {
    // currentMode = mode
    switch (mode) {
        case "terminal":  
            currentUtiMode = mode        
            uniBlock.forEach(ele => ele.style.display = "none")
            terminal.style.display = "block"
            break;
        case "rule":
            currentUtiMode = mode
            uniBlock.forEach(ele => ele.style.display = "none")
            rule.style.display = "flex"
            break;
        case "result": 
            currentUtiMode = mode
            if(gameResult) {
                uniBlock.forEach(ele => ele.style.display = "none")
                console.log(gameResult)
                const {max_move_win, status} = gameResult
                if(status === "win") {
                    toggle_bot_result(bot_html, ".fight_result_win")
                    win_loose_block.innerHTML = `
                    ${win_loose_items[0].replace("{winer_name}", username)}
                    ${win_loose_items[1].replace("{loser_name}", choosen_bot)}
                    `
                } else if(status === "lost") {
                    toggle_bot_result(bot_html, ".fight_result_lost")
                    win_loose_block.innerHTML = `
                    ${win_loose_items[1].replace("{loser_name}", choosen_bot).replace("DEFEATED", "VICTORY")}
                    ${win_loose_items[0].replace("{winer_name}", username).replace("VICTORY", "DEFEATED")}
                    `
                } else if(status === "draw") {
                    toggle_bot_result(bot_html, ".fight_result_draw")
                    win_loose_block.innerHTML = `
                    ${win_loose_items[0].replace("{winer_name}", username).replace("VICTORY", "DRAW")}
                    ${win_loose_items[1].replace("{loser_name}", choosen_bot).replace("DEFEATED", "DRAW")}
                    `
                }
                $(".loser_avatar img").src = `../static/img/${choosen_bot}.png`
                const moveCount = $(".info_move-count")
                moveCount.innerHTML = `moves: ${max_move_win}`
                result.style.display = "flex"
            }
            break;
        case "video":
            currentDisplayMode = mode
            botDisplayBlock.forEach(ele => ele.style.display = "none")
            if(loadingVideo.style.display === "none" || loadingVideo.style.display === "") video.style.display = ""
            debug.style.display = "none"
            break;
        case "debug":
            currentDisplayMode = mode
            botDisplayBlock.forEach(ele => ele.style.display = "none")
            video.style.display = "none"
            debug.style.display = "flex"
            break;
        default:
            break;
    }

}

function changeAnimation(e, right, width, mode, animationChild) {
    if(mode === "terminal" || mode === "rule" || mode === "result") {
        uniNavItem.forEach(ele => ele.style.color = "#ccc")
    } else {
        $$(".bot_display_nav-block--item").forEach(ele => ele.style.color = "#ccc")
    }
    e.style.color = "#fff"
    animationChild.style.right = right;
    animationChild.style.width = width;
    toggleMode(mode)
}

ruleBtn.onclick = (e) => {
    changeAnimation(ruleBtn, `${100 - (e.target.clientWidth / animation.clientWidth * 100)}%`, e.target.clientWidth + "px", "rule", animationChild)
}

terminalBtn.onclick = (e) => {
    changeAnimation(terminalBtn, `${((e.target.clientWidth - 10) / animation.clientWidth * 100)}%`, e.target.clientWidth + "px", "terminal", animationChild)
}

resultBtn.onclick = (e) => {
    if(gameResult) changeAnimation(result, "0", e.target.clientWidth + "px", "result", animationChild)
}

videoBtn.onclick = (e) => {
    // console.log("Asdadss")
    changeAnimation(videoBtn, `${100 - (e.target.clientWidth / bDAnimation.clientWidth * 100)}%`, e.target.clientWidth + "px", "video", bDAnimationChild)
}

debugtBtn.onclick = (e) => {
    console.log("Asda")
    // if(gameResult) 
    changeAnimation(debugtBtn, "0", e.target.clientWidth + "px", "debug", bDAnimationChild)
}

debugArrowRight.onclick = (e) => {  
    if(imageNum + 2 <= debugImageItems.length) {
        debugImageItems[imageNum].classList.remove("display_image")
        imageNum++
        console.log(imageNum-1)
        change_rate(imageNum-1)
        // if(imageNum + 1 === debugImageItems.length) {
        //     debugArrowRight.style.opacity = "0"
        // }
        // if(imageNum > 0 && debugArrowLeft.style.opacity === "0") {
        //     debugArrowLeft.style.opacity = "1"
        // }
        counter.innerHTML = imageNum
        debugImageItems[imageNum].classList.add("display_image")
    } else {
        debugImageItems[imageNum].classList.remove("display_image")
        imageNum = 0
        change_rate(-1)
        counter.innerHTML = imageNum
        debugImageItems[imageNum].classList.add("display_image")
    }
}

debugArrowLeft.onclick = (e) => {
    if(imageNum - 1 >= 0) {
        debugImageItems[imageNum].classList.remove("display_image")
        imageNum--
        change_rate(imageNum-1)
        // if(imageNum === 0) {
        //     debugArrowLeft.style.opacity = "0"
        // }
        // if(imageNum + 1 < debugImageItems.length && debugArrowRight.style.opacity === "0") {
        //     debugArrowRight.style.opacity = "1"
        // }
        counter.innerHTML = imageNum
        debugImageItems[imageNum].classList.add("display_image")
    } else {
        debugImageItems[imageNum].classList.remove("display_image")
        imageNum = debugImageItems.length - 1
        change_rate(debugImageItems.length - 2)
        counter.innerHTML = imageNum
        debugImageItems[imageNum].classList.add("display_image")
    }
}

const box = $(".guide")

const cover = $(".cover")
const guideBox_nav = $(".guide_box--nav")
const guideBox_navLeft = $(".guide_box--nav .left")
const guideBox_navRight = $(".guide_box--nav .right")
const acceptBtn = $(".accept-btn")
const rejectBtn = $(".reject-btn")
const instruction = $(".instruction")

let i = -1;
let pre_i = i;

function showGuideBox(i) {
    const guideBoxes = $$(".guide_box")
    guideBoxes[i].style.display = "block"
    if(pre_i != -1 && pre_i != i) guideBoxes[pre_i].style.display = "none"
    if(pre_i === i && i > 0) {
        cover.style.display = "none"
        guideBoxes[i].style.display = "none"
        guideBox_nav.style.display = "none"
    }
    pre_i = i
}

function isShowInstruction() {
    cover.style.display = "block"
    guideBox_nav.style.display = "flex"
    instruction.style.display = "none"
}

// acceptBtn.onclick = isShowInstruction
// rejectBtn.onclick = () => instruction.style.display = "none";

guides.forEach((guide, index) => {
    box.innerHTML += `
        <div class="guide_box" style="${guide.pos + (guide?.style ? guide.style : "")} display: ${guide.display}">
            <div class="guide_box--content">${guide.content}</div>
                <div class="guide_box--arrow" style="${guide.arrow_pos}"></div>
        </div>
    `
})

guideBox_navLeft.onclick = () => showGuideBox(i > 0 ? --i : i)
guideBox_navRight.onclick = () => showGuideBox(i + 1 < $$(".guide_box").length ? ++i : i)