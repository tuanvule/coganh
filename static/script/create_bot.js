const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const runBtn = $(".coding_module-nav--runBtn.btn")
const saveBtn = $(".coding_module-nav--saveBtn.btn")
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
const isEnableDebug = $("input#debug")
const isEnableVideo = $("input#video")

let debugImageItems
let imageNum = 0
let currentDisplayMode = "video"
let currentUtiMode = "rule"

let gameResult;
let img_url = []
// const terminalLoader = $(".")

var audio = $(".bot_display-video--result");
audio.volume = 0.1;

var editor = ace.edit("coding_module-coding_block");

editor.setOptions({
    mode: "ace/mode/python",
    selectionStyle: "text",
    theme: "ace/theme/dracula",
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
        const a = data.replaceAll('\n', '<br>').replaceAll('    ', '&emsp;')
        terminal.innerHTML = `>>> ${a}`
    })
}

runBtn.onclick = () => {
    if(!isEnableDebug.checked && !isEnableVideo.checked) {
        return
    }
    const source = $("source")
    const code = editor.getValue()
    loader.style.display = "block"
    runBtn.style.display = "none"

    toggleMode("terminal")
    terminal.style.backgroundColor = "#252525"
    terminalBtn.style.color = "#fff"
    ruleBtn.style.color = "#ccc"
    resultBtn.style.color = "#ccc"
    changeAnimation(terminalBtn, `${((terminalBtn.clientWidth - 10) / animation.clientWidth * 100)}%`, terminalBtn.clientWidth + "px", "terminal", animationChild)
    terminal.innerHTML = `>>> loading...`
    gameResult = null
    
    if(isEnableVideo.checked && !isEnableDebug.checked) {
        uploadCode(code)
        return
    }
    debugImageList.style.display = "none"
    loadingImage.style.display = "block"
    loadingNavImageLD.style.display = "block"
    loadingNavImageCI.style.display = "none"
    if(isEnableVideo.checked) {
        loadingVideo.style.display = "block"
        video.style.display = "none"
        loadingNavVideoLD.style.display = "block"
        loadingNavVideoCI.style.display = "none"
    }
    

    fetch("/debug_code", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code,
            debugNum: Number(selectDebugNum.value)
        }),
    })
    .then(res => res.json())
    .then(data => {
        if(data.code === 200) {
            loader.style.display = "none"
            runBtn.style.display = "block"
            img_url = JSON.parse(data.img_url)
            console.log(img_url)
            debugImageList.innerHTML = ""
            img_url.forEach((url, index) => {
                debugImageList.innerHTML += `
                    <li data-num="${index}" class="debug_img_item"><img src="${url}" alt=""></li>
                `
            })
            loadingImage.style.display = "none"
            debugImageList.style.display = "block"
            debugImageItems = $$(".debug_img_item")
            debugImageItems[0].classList.add("display_image")
            imageNum = 0
            counter.innerHTML = imageNum + 1
            loadingNavImageLD.style.display = "none"
            loadingNavImageCI.style.display = "block"
            debugArrowRight.style.opacity = "1"
            if(isEnableVideo.checked) uploadCode(code)
        } else {
            const a = data.err.replaceAll('\n', '<br>').replaceAll('    ', '&emsp;')
            terminal.innerHTML = `>>> ${a}`
        }
    })
}

function uploadCode(code) {
    loadingVideo.style.display = "block"
    video.style.display = "none"
    loadingNavVideoLD.style.display = "block"
    loadingNavVideoCI.style.display = "none"
    fetch("/upload_code", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(code),
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        if(data.code === 200) {
            gameResult = data
        } else {
            const a = data.err.replaceAll('\n', '<br>').replaceAll('    ', '&emsp;')
            terminal.innerHTML = `>>> ${a}`
        }
    })
    .catch(err => terminal.innerHTML = `>>> ${err}`)
    .finally(() => {
        const source = $("source")
        loader.style.display = "none"
        runBtn.style.display = "block"
        terminal.style.backgroundColor = "#000"
        if(gameResult?.code === 200) {
            loadingNavVideoLD.style.display = "none"
            loadingNavVideoCI.style.display = "block"
            source.src = gameResult.new_url
            loadingVideo.style.display = "none"
            video.load()
            if(currentDisplayMode === "video") video.style.display = ""
            changeAnimation(resultBtn, "0", resultBtn.clientWidth + "px", "result", animationChild)
            toggleMode("result")
        }
    })
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
    currentMode = mode
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
                const moveCount = $(".info_move-count")
                const statusNoti = $(".status")
                let win_lost = status === "win" ? "blue" : "red"
                statusNoti.style.backgroundColor = status === "win" || status === "lost" ? win_lost : "#ccc"
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
    if(imageNum + 1 < debugImageItems.length) {
        debugImageItems[imageNum].classList.remove("display_image")
        imageNum++
        if(imageNum + 1 === debugImageItems.length) {
            debugArrowRight.style.opacity = "0"
        }
        if(imageNum > 0 && debugArrowLeft.style.opacity === "0") {
            debugArrowLeft.style.opacity = "1"
        }
        counter.innerHTML = imageNum + 1
        debugImageItems[imageNum].classList.add("display_image")
    }
}

debugArrowLeft.onclick = (e) => {
    if(imageNum - 1 >= 0) {
        debugImageItems[imageNum].classList.remove("display_image")
        imageNum--
        if(imageNum === 0) {
            debugArrowLeft.style.opacity = "0"
        }
        if(imageNum + 1 < debugImageItems.length && debugArrowRight.style.opacity === "0") {
            debugArrowRight.style.opacity = "1"
        }
        counter.innerHTML = imageNum + 1
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