const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const runBtn = $(".coding_module-nav--runBtn.btn")
const saveBtn = $(".coding_module-nav--saveBtn.btn")
// const rule = $(".utility_block-element.rule")
const loader = $(".coding_module-nav--runBtn.loader")

const uniNavItem = $$(".utility_nav-block--item")
// const ruleBtn = $(".utility_nav-block--item.rule")
const taskBtn = $(".bot_display_nav-block--item.task")
const resulttBtn = $(".bot_display_nav-block--item.result")
const submissionsBtn = $(".bot_display_nav-block--item.submissions")
const animation = $(".utility_nav-block .animation")
const animationChild = $(".utility_nav-block .animation .children")
const bDAnimation = $(".bot_display_nav-block .animation")
const bDAnimationChild = $(".bot_display_nav-block .animation .children")
const botDisplayBlock = $$(".bot_display-video-item")

let resultImageItems
let imageNum = 0
let currentDisplayMode = "video"
let currentUtiMode = "rule"

let gameResult;
let img_url = []

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
    const code = editor.getValue()
}

function uploadCode(code) {
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
    })
}

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
        session.setValue(data)
})
.catch(err => console.error(err))

function toggleMode(mode) {
    switch (mode) {
        default:
            break;
    }

}

function changeAnimation(e, right, width, mode, animationChild) {
    $$(".bot_display_nav-block--item").forEach(ele => ele.style.color = "#ccc")
    e.style.color = "#fff"
    animationChild.style.right = right;
    animationChild.style.width = width;
    toggleMode(mode)
}

taskBtn.onclick = (e) => {
    // console.log("Asdadss")
    changeAnimation(taskBtn, `${100 - (e.target.clientWidth / bDAnimation.clientWidth * 100)}%`, e.target.clientWidth + "px", "task", bDAnimationChild)
}

resulttBtn.onclick = (e) => {
    changeAnimation(resulttBtn, taskBtn.clientWidth + 5 + "%", e.target.clientWidth + "px", "result", bDAnimationChild)
}

submissionsBtn.onclick = (e) => {
    changeAnimation(submissionsBtn, "0", e.target.clientWidth + "px", "submissions", bDAnimationChild)
}
